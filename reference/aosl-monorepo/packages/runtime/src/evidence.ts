import crypto from "node:crypto";
import type { EvidenceEvent } from "@aosl/core";

export function hashPayload(payload: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export function createEvidenceEvent(input: {
  interactionId: string;
  eventType: string;
  payload: unknown;
  prevHash?: string;
  actorRef?: EvidenceEvent["actorRef"];
}): EvidenceEvent {
  const payloadHash = hashPayload(input.payload);
  const hash = hashPayload({
    prevHash: input.prevHash ?? null,
    payloadHash,
    eventType: input.eventType,
  });

  return {
    id: `ev_${crypto.randomUUID()}`,
    interactionId: input.interactionId,
    eventType: input.eventType,
    hash,
    prevHash: input.prevHash,
    payloadHash,
    actorRef: input.actorRef,
    createdAt: new Date().toISOString(),
  };
}
