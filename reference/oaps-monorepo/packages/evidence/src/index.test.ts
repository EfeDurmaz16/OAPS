import test from 'node:test';
import assert from 'node:assert/strict';

import { appendEvidenceEvent, createEvidenceChain, verifyEvidenceChain } from './index.js';

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
