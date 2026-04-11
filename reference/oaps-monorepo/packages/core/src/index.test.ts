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
  isMandateExpired,
  mandateCoversAction,
  assertMandateAuthorizes,
  assertApprovalDecisionTargets,
  Mandate,
  Action,
  ApprovalRequest,
  ApprovalDecision,
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

test('assertAuthenticatedActor includes mismatch details when subject binding fails', () => {
  assert.throws(
    () => assertAuthenticatedActor(
      'urn:oaps:actor:merchant:owner',
      { actor_id: 'urn:oaps:actor:agent:builder' },
    ),
    (error: unknown) =>
      error instanceof OapsError
      && error.error.code === 'AUTHENTICATED_SUBJECT_MISMATCH'
      && error.error.details?.authenticated_actor_id === 'urn:oaps:actor:merchant:owner'
      && error.error.details?.envelope_actor_id === 'urn:oaps:actor:agent:builder',
  );
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

const exampleMandate: Mandate = {
  mandate_id: 'mdt_test_1',
  principal: { actor_id: 'urn:oaps:actor:principal:cfo' },
  delegatee: { actor_id: 'urn:oaps:actor:agent:buyer' },
  action: {
    verb: 'purchase',
    target: 'service:cloud-compute',
    arguments: { max_amount: '250.00', currency: 'USD' },
  },
  expires_at: '2026-12-31T23:59:59Z',
};

const matchingAction: Action = {
  verb: 'purchase',
  target: 'service:cloud-compute',
  arguments: { amount: '100.00', currency: 'USD' },
};

const mismatchedAction: Action = {
  verb: 'purchase',
  target: 'service:external-payment',
  arguments: { amount: '100.00', currency: 'USD' },
};

test('isMandateExpired returns false for a future expiry', () => {
  assert.equal(isMandateExpired(exampleMandate, new Date('2026-06-01T00:00:00Z')), false);
});

test('isMandateExpired returns true at or after the expiry instant', () => {
  assert.equal(isMandateExpired(exampleMandate, new Date('2027-01-01T00:00:00Z')), true);
  assert.equal(isMandateExpired(exampleMandate, new Date('2026-12-31T23:59:59Z')), true);
});

test('isMandateExpired throws VALIDATION_FAILED on unparseable expiry', () => {
  const bad: Mandate = { ...exampleMandate, expires_at: 'not-a-date' };
  assert.throws(
    () => isMandateExpired(bad),
    (err: unknown) => err instanceof OapsError && err.error.code === 'VALIDATION_FAILED',
  );
});

test('mandateCoversAction matches on verb and target', () => {
  assert.equal(mandateCoversAction(exampleMandate, matchingAction), true);
  assert.equal(mandateCoversAction(exampleMandate, mismatchedAction), false);
});

test('assertMandateAuthorizes passes a valid mandate against a matching action', () => {
  assert.doesNotThrow(() =>
    assertMandateAuthorizes(exampleMandate, matchingAction, new Date('2026-06-01T00:00:00Z')),
  );
});

test('assertMandateAuthorizes emits MANDATE_EXPIRED on expired mandates', () => {
  assert.throws(
    () => assertMandateAuthorizes(exampleMandate, matchingAction, new Date('2027-01-01T00:00:00Z')),
    (err: unknown) => err instanceof OapsError && err.error.code === 'MANDATE_EXPIRED' && err.error.category === 'authorization',
  );
});

test('assertMandateAuthorizes emits MANDATE_SCOPE_MISMATCH on scope mismatch', () => {
  assert.throws(
    () => assertMandateAuthorizes(exampleMandate, mismatchedAction, new Date('2026-06-01T00:00:00Z')),
    (err: unknown) => err instanceof OapsError && err.error.code === 'MANDATE_SCOPE_MISMATCH' && err.error.category === 'authorization',
  );
});

const baseApprovalRequest: ApprovalRequest = {
  approval_request_id: 'apr_test_1',
  interaction_id: 'int_test_1',
  requested_by: { actor_id: 'urn:oaps:actor:agent:planner' },
  requested_from: { actor_id: 'urn:oaps:actor:human:ops-lead' },
  reason: 'R4 risk class threshold',
  risk_class: 'R4',
  proposed_action: {
    verb: 'purchase',
    target: 'service:cloud-compute',
    arguments: { amount: '250.00' },
  },
  expires_at: '2026-12-31T23:59:59Z',
};

test('assertApprovalDecisionTargets accepts approve and reject decisions', () => {
  const approve: ApprovalDecision = {
    approval_request_id: 'apr_test_1',
    interaction_id: 'int_test_1',
    decided_by: { actor_id: 'urn:oaps:actor:human:ops-lead' },
    decision: 'approve',
    timestamp: '2026-04-11T10:00:00Z',
  };
  const reject: ApprovalDecision = { ...approve, decision: 'reject', reason: 'Policy violation' };
  assert.doesNotThrow(() => assertApprovalDecisionTargets(baseApprovalRequest, approve));
  assert.doesNotThrow(() => assertApprovalDecisionTargets(baseApprovalRequest, reject));
});

test('assertApprovalDecisionTargets accepts modify decisions that preserve the target', () => {
  const modify: ApprovalDecision = {
    approval_request_id: 'apr_test_1',
    interaction_id: 'int_test_1',
    decided_by: { actor_id: 'urn:oaps:actor:human:ops-lead' },
    decision: 'modify',
    modified_action: {
      verb: 'purchase',
      target: 'service:cloud-compute',
      arguments: { amount: '200.00' },
    },
    timestamp: '2026-04-11T10:00:00Z',
  };
  assert.doesNotThrow(() => assertApprovalDecisionTargets(baseApprovalRequest, modify));
});

test('assertApprovalDecisionTargets emits APPROVAL_MODIFICATION_TARGET_MISMATCH when modify retargets', () => {
  const badModify: ApprovalDecision = {
    approval_request_id: 'apr_test_1',
    interaction_id: 'int_test_1',
    decided_by: { actor_id: 'urn:oaps:actor:human:ops-lead' },
    decision: 'modify',
    modified_action: {
      verb: 'purchase',
      target: 'service:DIFFERENT-TARGET',
      arguments: { amount: '250.00' },
    },
    timestamp: '2026-04-11T10:00:00Z',
  };
  assert.throws(
    () => assertApprovalDecisionTargets(baseApprovalRequest, badModify),
    (err: unknown) =>
      err instanceof OapsError && err.error.code === 'APPROVAL_MODIFICATION_TARGET_MISMATCH',
  );
});

test('assertApprovalDecisionTargets rejects mismatched request/decision pairing', () => {
  const wrongPair: ApprovalDecision = {
    approval_request_id: 'apr_DIFFERENT',
    interaction_id: 'int_test_1',
    decided_by: { actor_id: 'urn:oaps:actor:human:ops-lead' },
    decision: 'approve',
    timestamp: '2026-04-11T10:00:00Z',
  };
  assert.throws(
    () => assertApprovalDecisionTargets(baseApprovalRequest, wrongPair),
    (err: unknown) => err instanceof OapsError && err.error.code === 'VALIDATION_FAILED',
  );
});

test('assertApprovalDecisionTargets rejects modify decisions without modified_action', () => {
  const badModify: ApprovalDecision = {
    approval_request_id: 'apr_test_1',
    interaction_id: 'int_test_1',
    decided_by: { actor_id: 'urn:oaps:actor:human:ops-lead' },
    decision: 'modify',
    timestamp: '2026-04-11T10:00:00Z',
  };
  assert.throws(
    () => assertApprovalDecisionTargets(baseApprovalRequest, badModify),
    (err: unknown) => err instanceof OapsError && err.error.code === 'VALIDATION_FAILED',
  );
});
