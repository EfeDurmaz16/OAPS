import test from 'node:test';
import assert from 'node:assert/strict';

import { appendEvidenceEvent, createEvidenceChain, hashEvidenceValue, verifyEvidenceChain } from './index.js';

test('appendEvidenceEvent creates a verifiable chain', () => {
  const chain = createEvidenceChain();
  appendEvidenceEvent(chain, {
    interaction_id: 'ix_1',
    event_type: 'interaction.received',
    actor: 'urn:oaps:actor:agent:builder',
  });
  appendEvidenceEvent(chain, {
    interaction_id: 'ix_1',
    event_type: 'interaction.completed',
    actor: 'urn:oaps:actor:agent:builder',
  });

  assert.equal(chain.events.length, 2);
  assert.deepEqual(verifyEvidenceChain(chain), { ok: true });
});

test('verifyEvidenceChain detects tampering', () => {
  const chain = createEvidenceChain();
  appendEvidenceEvent(chain, {
    interaction_id: 'ix_1',
    event_type: 'interaction.received',
    actor: 'urn:oaps:actor:agent:builder',
  });
  chain.events[0]!.event_type = 'interaction.tampered';

  const verification = verifyEvidenceChain(chain);
  assert.equal(verification.ok, false);
});

test('verifyEvidenceChain detects prev hash mismatch in later events', () => {
  const chain = createEvidenceChain();
  appendEvidenceEvent(chain, {
    interaction_id: 'ix_1',
    event_type: 'interaction.received',
    actor: 'urn:oaps:actor:agent:builder',
  });
  appendEvidenceEvent(chain, {
    interaction_id: 'ix_1',
    event_type: 'interaction.completed',
    actor: 'urn:oaps:actor:agent:builder',
  });

  chain.events[1]!.prev_event_hash = 'sha256:deadbeef';

  const verification = verifyEvidenceChain(chain);
  assert.equal(verification.ok, false);
  assert.equal(verification.reason, 'prev_event_hash mismatch');
});

test('hashEvidenceValue stays stable for semantically equivalent objects', () => {
  const left = {
    interaction_id: 'ix_1',
    payload: { z: 3, y: 2 },
    metadata: { nested: { b: 2, a: 1 } },
  };
  const right = {
    metadata: { nested: { a: 1, b: 2 } },
    payload: { y: 2, z: 3 },
    interaction_id: 'ix_1',
  };

  assert.equal(hashEvidenceValue(left), hashEvidenceValue(right));
});
