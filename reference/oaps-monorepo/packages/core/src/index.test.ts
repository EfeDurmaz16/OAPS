import test from 'node:test';
import assert from 'node:assert/strict';

import {
  OapsError,
  assertAuthenticatedActor,
  assertInvokeIntent,
  canonicalJson,
  negotiateVersion,
  riskClassRequiresApproval,
} from './index.js';

test('canonicalJson sorts object keys deterministically', () => {
  assert.equal(
    canonicalJson({ b: 1, a: { d: 2, c: 1 } }),
    '{"a":{"c":1,"d":2},"b":1}',
  );
});

test('assertInvokeIntent rejects invoke intents without arguments', () => {
  assert.throws(
    () => assertInvokeIntent({ intent_id: 'int_1', verb: 'invoke', object: 'tool:read_repo' }),
    (error: unknown) => error instanceof OapsError && error.error.code === 'VALIDATION_FAILED',
  );
});

test('version negotiation accepts overlapping version ranges', () => {
  const result = negotiateVersion({
    spec_version: '0.4-draft',
    min_supported_version: '0.4',
    max_supported_version: '0.4',
  });

  assert.equal(result.ok, true);
  assert.equal(result.selected, '0.4-draft');
});

test('version negotiation rejects incompatible version ranges', () => {
  const result = negotiateVersion({
    spec_version: '1.0',
    min_supported_version: '1.0',
    max_supported_version: '1.0',
  });

  assert.equal(result.ok, false);
  assert.equal(result.error?.code, 'VERSION_NEGOTIATION_FAILED');
});

test('riskClassRequiresApproval uses R4 threshold by default', () => {
  assert.equal(riskClassRequiresApproval('R3'), false);
  assert.equal(riskClassRequiresApproval('R4'), true);
  assert.equal(riskClassRequiresApproval('R5'), true);
});

test('assertAuthenticatedActor allows delegated sender', () => {
  assert.doesNotThrow(() => assertAuthenticatedActor(
    'urn:oaps:actor:merchant:owner',
    { actor_id: 'urn:oaps:actor:agent:builder' },
    {
      delegation_id: 'del_1',
      delegator: { actor_id: 'urn:oaps:actor:merchant:owner' },
      delegatee: { actor_id: 'urn:oaps:actor:agent:builder' },
      scope: ['tool:read_repo'],
      expires_at: new Date(Date.now() + 1000).toISOString(),
    },
  ));
});
