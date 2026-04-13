import type { EffectDescriptor } from "@aosl/core";

export type IRValue =
  | string
  | number
  | boolean
  | null
  | { ref: string }
  | Record<string, unknown>
  | unknown[];

export type IRStep =
  | { op: "git.status"; out: string; args: { repo: string } }
  | { op: "process.run"; out: string; args: { cmd: string; argv: string[]; cwd?: string; timeoutMs?: number } }
  | { op: "artifact.emit"; out: string; args: { kind: string; contentRef?: string; content?: string } }
  | { op: "intent.create"; out: string; args: Record<string, unknown> }
  | { op: "delegation.issue"; out: string; args: Record<string, unknown> }
  | { op: "approval.request"; out: string; args: Record<string, unknown> }
  | { op: "mandate.issue"; out: string; args: Record<string, unknown> }
  | { op: "payment.coordinate"; out: string; args: Record<string, unknown> }
  | { op: "if"; test: IRValue; then: IRStep[]; else?: IRStep[] }
  | { op: "fail"; error: { code: string; message: string } }
  | { op: "return"; value: IRValue };

export type TaskIR = {
  version: "0.1";
  task: string;
  requires: EffectDescriptor[];
  steps: IRStep[];
  meta?: {
    source?: "sdk-ts" | "dsl";
  };
};
