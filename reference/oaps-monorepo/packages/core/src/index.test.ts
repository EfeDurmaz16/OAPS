import test from 'node:test';
import assert from 'node:assert/strict';

import {
  OapsError,
  assertAuthenticatedActor,
  assertInvokeIntent,
  canonicalJson,
  negotiateVersion,
  sha256Prefixed,
  riskClassRequiresApproval,
} from './index.js';

test('canonicalJson sorts object keys deterministically', () => {
  assert.equal(
    canonicalJson({ b: 1, a: { d: 2, c: 1 } }),
    '{"a":{"c":1,"d":2},"b":1}',
  );
});

test('sha256Prefixed is stable across object key ordering', () => {
  const left = canonicalJson({ b: 1, a: { z: 3, y: 2 } });
  const right = canonicalJson({ a: { y: 2, z: 3 }, b: 1 });

  assert.equal(left, right);
  assert.equal(
    sha256Prefixed({ b: 1, a: { z: 3, y: 2 } }),
    sha256Prefixed({ a: { y: 2, z: 3 }, b: 1 }),
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

test('assertAuthenticatedActor fails closed on expired delegations', () => {
  assert.throws(() => assertAuthenticatedActor(
    'urn:oaps:actor:merchant:owner',
    { actor_id: 'urn:oaps:actor:agent:builder' },
    {
      delegation_id: 'del_1',
      delegator: { actor_id: 'urn:oaps:actor:merchant:owner' },
      delegatee: { actor_id: 'urn:oaps:actor:agent:builder' },
      scope: ['tool:read_repo'],
      expires_at: new Date(Date.now() - 1000).toISOString(),
    },
  ), (error: unknown) => error instanceof OapsError && error.error.code === 'DELEGATION_EXPIRED');
});
