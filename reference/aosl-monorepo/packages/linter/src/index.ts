import type { TaskIR } from "@aosl/ir";

export type LintIssue = {
  level: "error" | "warning";
  code: string;
  message: string;
};

export function lintIR(ir: TaskIR): LintIssue[] {
  const issues: LintIssue[] = [];

  const hasPayment = ir.steps.some((step) => step.op === "payment.coordinate");
  const hasMandate = ir.steps.some((step) => step.op === "mandate.issue");

  if (hasPayment && !hasMandate) {
    issues.push({
      level: "error",
      code: "PAY001",
      message: "payment.coordinate requires a valid mandate",
    });
  }

  const hasProcessRun = ir.steps.some((step) => step.op === "process.run");
  const declaredProcess = ir.requires.some((effect) => effect.kind === "process.run");

  if (hasProcessRun && !declaredProcess) {
    issues.push({
      level: "error",
      code: "EFF001",
      message: "process.run used without declared effect",
    });
  }

  return issues;
}
