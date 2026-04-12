import { createHmac, timingSafeEqual } from 'node:crypto';
import { generateId, type ActorRef, type EvidenceEvent } from '@oaps/core';

export const WEBHOOK_EVENT_TYPES = [
  'task.transition',
  'message.appended',
  'approval.requested',
  'approval.decided',
  'challenge.raised',
  'evidence.emitted',
  'interaction.completed',
  'interaction.failed',
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number];

export interface WebhookEnvelope {
  webhook_id: string;
  interaction_id: string;
  event_type: WebhookEventType;
  actor_ref: ActorRef;
  payload: unknown;
  timestamp: string;
  evidence_hash: string;
  signature: string;
}

export interface RetryPolicy {
  max_attempts: number;
  backoff_seconds: number[];
}

export interface WebhookRegistration {
  registration_id: string;
  interaction_id: string;
  callback_url: string;
  events: WebhookEventType[];
  secret: string;
  retry_policy: RetryPolicy;
  expiry?: string;
}

export interface WebhookRegistrationInput {
  interaction_id: string;
  callback_url: string;
  events: WebhookEventType[];
  secret: string;
  retry_policy?: Partial<RetryPolicy>;
  expiry?: string;
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  max_attempts: 3,
  backoff_seconds: [1, 5, 30],
};

export function signWebhook(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('hex');
}

export function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const expected = signWebhook(body, secret);
  if (expected.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
}

function isExpired(expiry: string | undefined): boolean {
  if (!expiry) return false;
  return new Date(expiry).getTime() <= Date.now();
}

export class WebhookRegistry {
  private registrations = new Map<string, Map<string, WebhookRegistration>>();

  register(input: WebhookRegistrationInput): WebhookRegistration {
    if (!input.callback_url.startsWith('https://')) {
      throw new Error('Callback URL must use HTTPS');
    }

    const reg: WebhookRegistration = {
      registration_id: generateId('whreg'),
      interaction_id: input.interaction_id,
      callback_url: input.callback_url,
      events: input.events,
      secret: input.secret,
      retry_policy: {
        max_attempts: input.retry_policy?.max_attempts ?? DEFAULT_RETRY_POLICY.max_attempts,
        backoff_seconds: input.retry_policy?.backoff_seconds ?? DEFAULT_RETRY_POLICY.backoff_seconds,
      },
      expiry: input.expiry,
    };

    let interactionRegs = this.registrations.get(input.interaction_id);
    if (!interactionRegs) {
      interactionRegs = new Map();
      this.registrations.set(input.interaction_id, interactionRegs);
    }
    interactionRegs.set(reg.registration_id, reg);

    return reg;
  }

  unregister(interactionId: string, registrationId: string): boolean {
    const interactionRegs = this.registrations.get(interactionId);
    if (!interactionRegs) return false;
    const deleted = interactionRegs.delete(registrationId);
    if (interactionRegs.size === 0) {
      this.registrations.delete(interactionId);
    }
    return deleted;
  }

  getRegistrations(interactionId: string): WebhookRegistration[] {
    const interactionRegs = this.registrations.get(interactionId);
    if (!interactionRegs) return [];
    const active: WebhookRegistration[] = [];
    for (const reg of interactionRegs.values()) {
      if (!isExpired(reg.expiry)) {
        active.push(reg);
      }
    }
    return active;
  }
}

export interface DeliverResult {
  ok: boolean;
  status?: number;
  attempts: number;
}

export type FetchFn = (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{ ok: boolean; status: number }>;

export class WebhookSender {
  private fetchFn: FetchFn;

  constructor(fetchFn?: FetchFn) {
    this.fetchFn = fetchFn ?? (globalThis.fetch as unknown as FetchFn);
  }

  buildEnvelope(
    registration: WebhookRegistration,
    eventType: WebhookEventType,
    actorRef: ActorRef,
    payload: unknown,
    evidenceHash: string,
  ): WebhookEnvelope {
    const envelope: Omit<WebhookEnvelope, 'signature'> = {
      webhook_id: generateId('whd'),
      interaction_id: registration.interaction_id,
      event_type: eventType,
      actor_ref: actorRef,
      payload,
      timestamp: new Date().toISOString(),
      evidence_hash: evidenceHash,
    };

    const body = JSON.stringify(envelope);
    const signature = signWebhook(body, registration.secret);

    return { ...envelope, signature };
  }

  async deliver(registration: WebhookRegistration, envelope: WebhookEnvelope): Promise<DeliverResult> {
    if (isExpired(registration.expiry)) {
      return { ok: false, attempts: 0 };
    }

    const body = JSON.stringify({ ...envelope, signature: undefined });
    const signature = signWebhook(body, registration.secret);
    const signedBody = JSON.stringify({ ...envelope, signature });

    const response = await this.fetchFn(registration.callback_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AICP-Signature': signature,
        'X-AICP-Delivery-Attempt': '1',
      },
      body: signedBody,
    });

    return { ok: response.ok, status: response.status, attempts: 1 };
  }

  async deliverWithRetry(
    registration: WebhookRegistration,
    envelope: WebhookEnvelope,
    sleepFn: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
  ): Promise<DeliverResult> {
    if (isExpired(registration.expiry)) {
      return { ok: false, attempts: 0 };
    }

    const policy = registration.retry_policy;
    const body = JSON.stringify({ ...envelope, signature: undefined });
    const signature = signWebhook(body, registration.secret);
    const signedBody = JSON.stringify({ ...envelope, signature });

    for (let attempt = 1; attempt <= policy.max_attempts; attempt++) {
      try {
        const response = await this.fetchFn(registration.callback_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-AICP-Signature': signature,
            'X-AICP-Delivery-Attempt': String(attempt),
          },
          body: signedBody,
        });

        if (response.ok) {
          return { ok: true, status: response.status, attempts: attempt };
        }

        if (attempt < policy.max_attempts) {
          const backoffIndex = Math.min(attempt - 1, policy.backoff_seconds.length - 1);
          await sleepFn(policy.backoff_seconds[backoffIndex]! * 1000);
        }
      } catch {
        if (attempt < policy.max_attempts) {
          const backoffIndex = Math.min(attempt - 1, policy.backoff_seconds.length - 1);
          await sleepFn(policy.backoff_seconds[backoffIndex]! * 1000);
        }
      }
    }

    return { ok: false, attempts: policy.max_attempts };
  }
}

export class WebhookReceiver {
  private seen = new Set<string>();

  verify(signature: string, body: string, secret: string): boolean {
    return verifyWebhookSignature(body, signature, secret);
  }

  deduplicate(webhookId: string): boolean {
    if (this.seen.has(webhookId)) return true;
    this.seen.add(webhookId);
    return false;
  }

  parseEnvelope(body: string): WebhookEnvelope {
    const parsed = JSON.parse(body) as Record<string, unknown>;

    if (typeof parsed.webhook_id !== 'string') throw new Error('Missing webhook_id');
    if (typeof parsed.interaction_id !== 'string') throw new Error('Missing interaction_id');
    if (typeof parsed.event_type !== 'string') throw new Error('Missing event_type');
    if (!WEBHOOK_EVENT_TYPES.includes(parsed.event_type as WebhookEventType)) {
      throw new Error(`Unknown event_type: ${parsed.event_type}`);
    }
    if (typeof parsed.timestamp !== 'string') throw new Error('Missing timestamp');
    if (typeof parsed.evidence_hash !== 'string') throw new Error('Missing evidence_hash');
    if (typeof parsed.signature !== 'string') throw new Error('Missing signature');

    const actorRef = parsed.actor_ref as Record<string, unknown> | undefined;
    if (!actorRef || typeof actorRef.actor_id !== 'string') {
      throw new Error('Missing or invalid actor_ref');
    }

    return parsed as unknown as WebhookEnvelope;
  }
}
