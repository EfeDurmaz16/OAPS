import type { EffectDescriptor } from "@aosl/core";
import type { TaskIR } from "@aosl/ir";

export type RuntimeFacade = {
  git: {
    status(repo: string): Promise<{ modified: string[] }>;
  };
  process: {
    run(
      cmd: string,
      argv: string[],
      opts?: { cwd?: string; timeoutMs?: number },
    ): Promise<{
      exitCode: number;
      stdout: string;
      stderr: string;
    }>;
  };
  artifact: {
    emit(input: { kind: string; content: string }): Promise<{ id: string }>;
  };
};

export type TaskDefinition<TOutput = unknown> = {
  name: string;
  requires: EffectDescriptor[];
  run(ctx: RuntimeFacade): Promise<TOutput>;
  toIR?(): TaskIR;
};

export function task<TOutput>(def: TaskDefinition<TOutput>): TaskDefinition<TOutput> {
  return def;
}
