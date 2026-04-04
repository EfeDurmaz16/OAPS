import { EvidenceEvent, generateId, sha256Prefixed } from '@oaps/core';

export interface EvidenceChain {
  events: EvidenceEvent[];
}

export function createEvidenceChain(): EvidenceChain {
  return { events: [] };
}

export function createGenesisHash(): string {
  return 'sha256:0';
}

export function hashEvidenceEvent(event: Omit<EvidenceEvent, 'event_hash'>): string {
  return sha256Prefixed(event);
}

export function hashEvidenceValue(value: unknown): string {
  return sha256Prefixed(value);
}

export function appendEvidenceEvent(
  chain: EvidenceChain,
  event: Omit<EvidenceEvent, 'event_id' | 'timestamp' | 'prev_event_hash' | 'event_hash'> & Partial<Pick<EvidenceEvent, 'event_id' | 'timestamp'>>,
): EvidenceEvent {
  const previousEvent = chain.events.at(-1);
  const unsignedEvent: Omit<EvidenceEvent, 'event_hash'> = {
    ...event,
    event_id: event.event_id ?? generateId('evt'),
    timestamp: event.timestamp ?? new Date().toISOString(),
    prev_event_hash: previousEvent?.event_hash ?? createGenesisHash(),
  };

  const signedEvent: EvidenceEvent = {
    ...unsignedEvent,
    event_hash: hashEvidenceEvent(unsignedEvent),
  };

  chain.events.push(signedEvent);
  return signedEvent;
}

export function verifyEvidenceChain(chain: EvidenceChain): { ok: true } | { ok: false; index: number; reason: string } {
  let expectedPrevHash = createGenesisHash();

  for (let index = 0; index < chain.events.length; index += 1) {
    const event = chain.events[index]!;
    if (event.prev_event_hash !== expectedPrevHash) {
      return { ok: false, index, reason: 'prev_event_hash mismatch' };
    }

    const { event_hash, ...unsignedEvent } = event;
    const recalculatedHash = hashEvidenceEvent(unsignedEvent);
    if (event_hash !== recalculatedHash) {
      return { ok: false, index, reason: 'event_hash mismatch' };
    }

    expectedPrevHash = event_hash!;
  }

  return { ok: true };
}
