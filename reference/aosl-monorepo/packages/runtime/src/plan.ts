import type { EffectDescriptor } from "@aosl/core";

export type PlanSummary = {
  effects: string[];
  riskLevel: "low" | "medium" | "high";
  approvalRequired: boolean;
  paymentRequired: boolean;
};

export function summarizePlan(requires: EffectDescriptor[]): PlanSummary {
  const effects = requires.map((effect) => effect.kind);
  const approvalRequired = effects.includes("approval.request");
  const paymentRequired = effects.includes("payment.authorize") || effects.includes("payment.capture");

  const riskLevel =
    paymentRequired || effects.includes("git.mutate")
      ? "high"
      : effects.includes("process.run") || approvalRequired
        ? "medium"
        : "low";

  return {
    effects,
    riskLevel,
    approvalRequired,
    paymentRequired,
  };
}
