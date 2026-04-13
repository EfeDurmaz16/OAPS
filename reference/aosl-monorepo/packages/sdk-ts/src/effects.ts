import type { EffectDescriptor } from "@aosl/core";

export const fs = {
  read: (...paths: string[]): EffectDescriptor => ({ kind: "fs.read", paths }),
  write: (...paths: string[]): EffectDescriptor => ({ kind: "fs.write", paths }),
};

export const search = {
  text: (...sources: string[]): EffectDescriptor => ({ kind: "search.text", sources }),
};

export const processFx = {
  run: (commands?: string[], timeoutMs?: number): EffectDescriptor => ({
    kind: "process.run",
    commands,
    timeoutMs,
  }),
};

export const git = {
  read: (...repos: string[]): EffectDescriptor => ({ kind: "git.read", repos }),
  mutate: (repos: string[], allowPush = false): EffectDescriptor => ({
    kind: "git.mutate",
    repos,
    allowPush,
  }),
};

export const artifact = {
  emit: (...kinds: string[]): EffectDescriptor => ({ kind: "artifact.emit", kinds }),
};

export const approval = {
  request: (): EffectDescriptor => ({ kind: "approval.request", allow: true }),
};

export const payment = {
  authorize: (currencies?: string[], maxAmount?: number): EffectDescriptor => ({
    kind: "payment.authorize",
    currencies,
    maxAmount,
  }),
};
