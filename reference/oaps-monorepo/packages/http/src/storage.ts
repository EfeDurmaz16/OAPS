import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  ActorRef,
  ApprovalDecision,
  ApprovalRequest,
  Envelope,
  ErrorObject,
  ExecutionResult,
  InteractionState,
} from '@oaps/core';
import { EvidenceChain } from '@oaps/evidence';

export interface StoredInteraction {
  interaction_id: string;
  state: InteractionState;
  created_at: string;
  updated_at: string;
  request: Envelope;
  actor: ActorRef;
  evidence: EvidenceChain;
  approval_request?: ApprovalRequest;
  approval_decision?: ApprovalDecision;
  execution?: ExecutionResult;
  error?: ErrorObject;
}

export interface IdempotencyRecord {
  request_hash: string;
  status: number;
  body: unknown;
}

export interface ReferenceStateStore {
  getInteraction(interactionId: string): Promise<StoredInteraction | null>;
  putInteraction(record: StoredInteraction): Promise<void>;
  getIdempotency(key: string): Promise<IdempotencyRecord | null>;
  putIdempotency(key: string, record: IdempotencyRecord): Promise<void>;
}

interface PersistedState {
  interactions: Record<string, StoredInteraction>;
  idempotency: Record<string, IdempotencyRecord>;
}

function createEmptyState(): PersistedState {
  return {
    interactions: {},
    idempotency: {},
  };
}

export class MemoryReferenceStateStore implements ReferenceStateStore {
  private readonly interactions = new Map<string, StoredInteraction>();
  private readonly idempotency = new Map<string, IdempotencyRecord>();

  async getInteraction(interactionId: string): Promise<StoredInteraction | null> {
    return this.interactions.get(interactionId) ?? null;
  }

  async putInteraction(record: StoredInteraction): Promise<void> {
    this.interactions.set(record.interaction_id, record);
  }

  async getIdempotency(key: string): Promise<IdempotencyRecord | null> {
    return this.idempotency.get(key) ?? null;
  }

  async putIdempotency(key: string, record: IdempotencyRecord): Promise<void> {
    this.idempotency.set(key, record);
  }
}

export class FileReferenceStateStore implements ReferenceStateStore {
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly filePath: string) {}

  async getInteraction(interactionId: string): Promise<StoredInteraction | null> {
    return this.runExclusive(async (state) => state.interactions[interactionId] ?? null);
  }

  async putInteraction(record: StoredInteraction): Promise<void> {
    await this.runExclusive(async (state) => {
      state.interactions[record.interaction_id] = record;
      return undefined;
    }, true);
  }

  async getIdempotency(key: string): Promise<IdempotencyRecord | null> {
    return this.runExclusive(async (state) => state.idempotency[key] ?? null);
  }

  async putIdempotency(key: string, record: IdempotencyRecord): Promise<void> {
    await this.runExclusive(async (state) => {
      state.idempotency[key] = record;
      return undefined;
    }, true);
  }

  private async runExclusive<T>(operation: (state: PersistedState) => Promise<T> | T, persist = false): Promise<T> {
    const run = async () => {
      const state = await this.readState();
      const result = await operation(state);
      if (persist) {
        await this.writeState(state);
      }
      return result;
    };

    const next = this.queue.then(run, run);
    this.queue = next.then(() => undefined, () => undefined);
    return next;
  }

  private async readState(): Promise<PersistedState> {
    try {
      const raw = await readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      return {
        interactions: parsed.interactions ?? {},
        idempotency: parsed.idempotency ?? {},
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return createEmptyState();
      }
      throw error;
    }
  }

  private async writeState(state: PersistedState): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const tempPath = `${this.filePath}.tmp`;
    await writeFile(tempPath, JSON.stringify(state, null, 2));
    await rename(tempPath, this.filePath);
  }
}
