import { sha256Prefixed } from '@oaps/core';

export type Primitive = string | number | boolean | null;
export type PolicyValue = Primitive | Primitive[];

export type PolicyExpression =
  | { var: string }
  | { eq: [PolicyExpression | Primitive, PolicyExpression | Primitive] }
  | { neq: [PolicyExpression | Primitive, PolicyExpression | Primitive] }
  | { lt: [PolicyExpression | Primitive, PolicyExpression | Primitive] }
  | { lte: [PolicyExpression | Primitive, PolicyExpression | Primitive] }
  | { gt: [PolicyExpression | Primitive, PolicyExpression | Primitive] }
  | { gte: [PolicyExpression | Primitive, PolicyExpression | Primitive] }
  | { in: [PolicyExpression | Primitive, Primitive[]] }
  | { all: Array<PolicyExpression | Primitive> }
  | { any: Array<PolicyExpression | Primitive> };

export interface PolicyRule {
  rule_id: string;
  effect: 'allow' | 'deny';
  when: PolicyExpression;
}

export interface PolicyBundle {
  policy_id: string;
  policy_language: 'oaps-policy-v1';
  rules: PolicyRule[];
  metadata?: Record<string, unknown>;
}

export interface PolicyContext {
  intent: Record<string, unknown>;
  actor: Record<string, unknown>;
  capability: Record<string, unknown>;
  delegation: Record<string, unknown>;
  approval: Record<string, unknown>;
  environment: Record<string, unknown>;
  economic?: Record<string, unknown>;
  merchant?: Record<string, unknown>;
  risk?: Record<string, unknown>;
  evidence?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface PolicyResult {
  allowed: boolean;
  effect: 'allow' | 'deny';
  matched_rule_id?: string;
  policy_id?: string;
  evaluated_context_hash?: string;
  error?: string;
}

class PolicyEvaluationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PolicyEvaluationError';
  }
}

function getByPath(ctx: PolicyContext, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    throw new PolicyEvaluationError(`Undefined policy variable: ${path}`);
  }, ctx);
}

function isPrimitive(value: unknown): value is Primitive {
  return value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function asPrimitive(value: unknown, operator: string): Primitive {
  if (!isPrimitive(value)) {
    throw new PolicyEvaluationError(`${operator} expects primitive values`);
  }
  return value;
}

function asBoolean(value: unknown, operator: string): boolean {
  if (typeof value !== 'boolean') {
    throw new PolicyEvaluationError(`${operator} expects boolean operands`);
  }
  return value;
}

function asNumber(value: unknown, operator: string): number {
  if (typeof value !== 'number') {
    throw new PolicyEvaluationError(`${operator} expects numeric operands`);
  }
  return value;
}

function ensureComparablePair(left: Primitive, right: Primitive, operator: string): [Primitive, Primitive] {
  if (typeof left !== typeof right) {
    throw new PolicyEvaluationError(`${operator} received mismatched operand types`);
  }
  return [left, right];
}

function evaluate(expr: PolicyExpression | Primitive, ctx: PolicyContext): PolicyValue {
  if (isPrimitive(expr)) return expr;

  if ('var' in expr) return getByPath(ctx, expr.var) as PolicyValue;

  if ('eq' in expr) {
    const left = asPrimitive(evaluate(expr.eq[0], ctx), 'eq');
    const right = asPrimitive(evaluate(expr.eq[1], ctx), 'eq');
    ensureComparablePair(left, right, 'eq');
    return left === right;
  }

  if ('neq' in expr) {
    const left = asPrimitive(evaluate(expr.neq[0], ctx), 'neq');
    const right = asPrimitive(evaluate(expr.neq[1], ctx), 'neq');
    ensureComparablePair(left, right, 'neq');
    return left !== right;
  }

  if ('lt' in expr) {
    return asNumber(evaluate(expr.lt[0], ctx), 'lt') < asNumber(evaluate(expr.lt[1], ctx), 'lt');
  }

  if ('lte' in expr) {
    return asNumber(evaluate(expr.lte[0], ctx), 'lte') <= asNumber(evaluate(expr.lte[1], ctx), 'lte');
  }

  if ('gt' in expr) {
    return asNumber(evaluate(expr.gt[0], ctx), 'gt') > asNumber(evaluate(expr.gt[1], ctx), 'gt');
  }

  if ('gte' in expr) {
    return asNumber(evaluate(expr.gte[0], ctx), 'gte') >= asNumber(evaluate(expr.gte[1], ctx), 'gte');
  }

  if ('in' in expr) {
    const candidate = asPrimitive(evaluate(expr.in[0], ctx), 'in');
    return expr.in[1].includes(candidate);
  }

  if ('all' in expr) {
    return expr.all.every((item) => asBoolean(evaluate(item, ctx), 'all'));
  }

  if ('any' in expr) {
    return expr.any.some((item) => asBoolean(evaluate(item, ctx), 'any'));
  }

  throw new PolicyEvaluationError('Unsupported policy expression');
}

function normalizePolicy(policy: PolicyBundle | PolicyRule[]): { policy_id?: string; rules: PolicyRule[] } {
  if (Array.isArray(policy)) return { rules: policy };
  return policy;
}

export function hashPolicyContext(ctx: PolicyContext): string {
  return sha256Prefixed(ctx);
}

export function evaluatePolicy(policy: PolicyBundle | PolicyRule[], ctx: PolicyContext): PolicyResult {
  const normalized = normalizePolicy(policy);

  for (const rule of normalized.rules) {
    try {
      const matched = asBoolean(evaluate(rule.when, ctx), 'rule');
      if (!matched) continue;

      return {
        allowed: rule.effect === 'allow',
        effect: rule.effect,
        matched_rule_id: rule.rule_id,
        policy_id: normalized.policy_id,
      };
    } catch (error) {
      return {
        allowed: false,
        effect: 'deny',
        matched_rule_id: rule.rule_id,
        policy_id: normalized.policy_id,
        error: error instanceof Error ? error.message : 'Policy evaluation failed',
      };
    }
  }

  return {
    allowed: false,
    effect: 'deny',
    policy_id: normalized.policy_id,
  };
}
