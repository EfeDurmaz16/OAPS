import test from 'node:test';
import assert from 'node:assert/strict';

import {
  OapsError,
  assertInteractionTransition,
  assertTaskTransition,
  assertAuthenticatedActor,
  assertInvokeIntent,
  canonicalJson,
  canTransitionInteractionState,
  canTransitionTaskState,
  negotiateVersion,
  promoteIntentToTask,
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

test('promoteIntentToTask materializes a task that preserves the originating intent reference', () => {
  const task = promoteIntentToTask(
    {
      intent_id: 'int_promote',
      verb: 'invoke',
      object: 'tool:read_repo',
      constraints: {
        arguments: {
          path: 'README.md',
        },
      },
    },
    {
      task_id: 'task_promote',
      requester: { actor_id: 'urn:oaps:actor:agent:planner' },
      assignee: { actor_id: 'urn:oaps:actor:agent:worker' },
      state: 'queued',
      created_at: '2026-04-05T12:00:00Z',
      metadata: {
        source_interaction_id: 'ix_promote',
      },
    },
  );

  assert.equal(task.task_id, 'task_promote');
  assert.equal(task.intent_ref, 'int_promote');
  assert.equal(task.state, 'queued');
  assert.equal(task.requester?.actor_id, 'urn:oaps:actor:agent:planner');
  assert.equal(task.assignee?.actor_id, 'urn:oaps:actor:agent:worker');
  assert.equal(task.metadata?.source_interaction_id, 'ix_promote');
});

test('interaction lifecycle distinguishes approval rejection from revocation', () => {
  assert.equal(canTransitionInteractionState('pending_approval', 'failed'), true);
  assert.equal(canTransitionInteractionState('pending_approval', 'revoked'), true);
  assert.equal(canTransitionInteractionState('revoked', 'failed'), false);
  assert.doesNotThrow(() => assertInteractionTransition('pending_approval', 'failed'));
  assert.doesNotThrow(() => assertInteractionTransition('pending_approval', 'revoked'));
  assert.throws(
    () => assertInteractionTransition('revoked', 'failed'),
    (error: unknown) => error instanceof OapsError && error.error.code === 'ILLEGAL_STATE_TRANSITION',
  );
});

test('task lifecycle rejects illegal terminal-state regressions', () => {
  assert.equal(canTransitionTaskState('completed', 'running'), false);
  assert.throws(
    () => assertTaskTransition('completed', 'running'),
    (error: unknown) => error instanceof OapsError && error.error.code === 'ILLEGAL_STATE_TRANSITION',
  );
});
