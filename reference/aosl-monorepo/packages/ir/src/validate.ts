import type { TaskIR } from "./types.js";

export function validateIR(ir: TaskIR): string[] {
  const issues: string[] = [];

  if (!ir.task) issues.push("missing task name");
  if (!Array.isArray(ir.requires)) issues.push("requires must be an array");
  if (!Array.isArray(ir.steps)) issues.push("steps must be an array");

  return issues;
}
