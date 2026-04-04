import test from 'node:test';
import assert from 'node:assert/strict';

import { evaluatePolicy, hashPolicyContext } from './index.js';

const baseContext = {
  intent: { verb: 'invoke' },
  actor: { actor_id: 'urn:oaps:actor:agent:builder' },
  capability: { risk_class: 'R1' },
  delegation: {},
  approval: {},
  environment: { region: 'eu' },
};

test('evaluatePolicy allows first matching allow rule', () => {
  const result = evaluatePolicy([
    {
      rule_id: 'allow-invoke',
      effect: 'allow',
      when: { eq: [{ var: 'intent.verb' }, 'invoke'] },
    },
  ], baseContext);

  assert.equal(result.allowed, true);
  assert.equal(result.matched_rule_id, 'allow-invoke');
});

test('evaluatePolicy fails closed on type mismatch', () => {
  const result = evaluatePolicy([
    {
      rule_id: 'bad-compare',
      effect: 'allow',
      when: { gt: [{ var: 'intent.verb' }, 3] },
    },
  ], baseContext);

  assert.equal(result.allowed, false);
  assert.equal(result.effect, 'deny');
  assert.match(result.error ?? '', /numeric operands/);
});

test('hashPolicyContext returns sha256-prefixed hash', () => {
  assert.match(hashPolicyContext(baseContext), /^sha256:/);
});
