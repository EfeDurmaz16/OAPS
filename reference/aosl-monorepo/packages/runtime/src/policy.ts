import type { EffectDescriptor } from "@aosl/core";

export type PolicyCheckResult = {
  ok: boolean;
  issues: string[];
};

export function validateEffects(requires: EffectDescriptor[]): PolicyCheckResult {
  const issues: string[] = [];

  for (const effect of requires) {
    if (effect.kind === "fs.write" && effect.paths.includes("**")) {
      issues.push("unbounded fs.write is not allowed");
    }

    if (effect.kind === "http.fetch" && effect.hosts.length === 0) {
      issues.push("http.fetch must declare at least one host");
    }
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}
