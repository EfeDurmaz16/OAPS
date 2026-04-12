import { OapsError, type ActorType } from '@oaps/core';

const ACTOR_TYPES: readonly string[] = [
  'agent', 'service', 'human', 'approver',
  'provider', 'merchant', 'facilitator', 'system',
];

const SUPPORTED_BINDINGS: readonly string[] = ['http', 'websocket', 'jsonrpc'];

export interface ActorCardDiscovery {
  actor_id: string;
  actor_type: ActorType;
  aicp_version: string;
  interaction_endpoint: string;
  capabilities: string[];
  display_name?: string;
  supported_bindings?: ('http' | 'websocket' | 'jsonrpc')[];
  supported_profiles?: string[];
  delegation_endpoint?: string;
  evidence_endpoint?: string;
  public_key?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateActorCard(card: unknown): asserts card is ActorCardDiscovery {
  if (!isObject(card)) {
    throw new OapsError({
      code: 'VALIDATION_FAILED',
      category: 'discovery',
      message: 'Actor card must be a non-null object',
      retryable: false,
    });
  }

  const required = ['actor_id', 'actor_type', 'aicp_version', 'interaction_endpoint', 'capabilities'] as const;
  for (const field of required) {
    if (!(field in card)) {
      throw new OapsError({
        code: 'VALIDATION_FAILED',
        category: 'discovery',
        message: `Actor card missing required field: ${field}`,
        retryable: false,
      });
    }
  }

  if (typeof card.actor_id !== 'string' || card.actor_id === '') {
    throw new OapsError({
      code: 'VALIDATION_FAILED',
      category: 'discovery',
      message: 'actor_id must be a non-empty string',
      retryable: false,
    });
  }

  if (!ACTOR_TYPES.includes(card.actor_type as string)) {
    throw new OapsError({
      code: 'VALIDATION_FAILED',
      category: 'discovery',
      message: `actor_type must be one of ${ACTOR_TYPES.join(', ')}`,
      retryable: false,
    });
  }

  if (typeof card.aicp_version !== 'string' || card.aicp_version === '') {
    throw new OapsError({
      code: 'VALIDATION_FAILED',
      category: 'discovery',
      message: 'aicp_version must be a non-empty string',
      retryable: false,
    });
  }

  if (typeof card.interaction_endpoint !== 'string' || !isValidUrl(card.interaction_endpoint)) {
    throw new OapsError({
      code: 'VALIDATION_FAILED',
      category: 'discovery',
      message: 'interaction_endpoint must be a valid URI',
      retryable: false,
    });
  }

  if (!Array.isArray(card.capabilities) || card.capabilities.length === 0) {
    throw new OapsError({
      code: 'VALIDATION_FAILED',
      category: 'discovery',
      message: 'capabilities must be a non-empty array of URIs',
      retryable: false,
    });
  }

  for (const cap of card.capabilities) {
    if (typeof cap !== 'string' || !isValidUrl(cap)) {
      throw new OapsError({
        code: 'VALIDATION_FAILED',
        category: 'discovery',
        message: `Each capability must be a valid URI, got: ${cap}`,
        retryable: false,
      });
    }
  }

  if (card.supported_bindings !== undefined) {
    if (!Array.isArray(card.supported_bindings)) {
      throw new OapsError({
        code: 'VALIDATION_FAILED',
        category: 'discovery',
        message: 'supported_bindings must be an array',
        retryable: false,
      });
    }
    for (const binding of card.supported_bindings) {
      if (!SUPPORTED_BINDINGS.includes(binding as string)) {
        throw new OapsError({
          code: 'VALIDATION_FAILED',
          category: 'discovery',
          message: `supported_bindings entry must be one of ${SUPPORTED_BINDINGS.join(', ')}`,
          retryable: false,
        });
      }
    }
  }

  for (const optionalUri of ['delegation_endpoint', 'evidence_endpoint'] as const) {
    if (card[optionalUri] !== undefined && (typeof card[optionalUri] !== 'string' || !isValidUrl(card[optionalUri] as string))) {
      throw new OapsError({
        code: 'VALIDATION_FAILED',
        category: 'discovery',
        message: `${optionalUri} must be a valid URI`,
        retryable: false,
      });
    }
  }

  if (card.public_key !== undefined && !isObject(card.public_key)) {
    throw new OapsError({
      code: 'VALIDATION_FAILED',
      category: 'discovery',
      message: 'public_key must be an object',
      retryable: false,
    });
  }
}

export function matchCapabilities(card: ActorCardDiscovery, required: string[]): boolean {
  const offered = new Set(card.capabilities);
  return required.every((cap) => offered.has(cap));
}

export type FetchFn = (url: string) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;
export type DnsLookupFn = (hostname: string) => Promise<string | null>;

export async function fetchActorCard(
  url: string,
  fetchFn: FetchFn = globalThis.fetch as unknown as FetchFn,
): Promise<ActorCardDiscovery> {
  if (!isHttpsUrl(url)) {
    throw new OapsError({
      code: 'DISCOVERY_FAILED',
      category: 'discovery',
      message: 'Actor card URL must use HTTPS',
      retryable: false,
    });
  }

  let response;
  try {
    response = await fetchFn(url);
  } catch (err) {
    throw new OapsError({
      code: 'DISCOVERY_FAILED',
      category: 'transport',
      message: `Failed to fetch actor card from ${url}: ${err instanceof Error ? err.message : String(err)}`,
      retryable: true,
    });
  }

  if (!response.ok) {
    throw new OapsError({
      code: 'DISCOVERY_FAILED',
      category: 'transport',
      message: `Actor card fetch returned HTTP ${response.status}`,
      retryable: response.status >= 500,
    });
  }

  const body = await response.json();
  validateActorCard(body);
  return body;
}

export async function resolveActorCard(
  domain: string,
  fetchFn: FetchFn = globalThis.fetch as unknown as FetchFn,
  dnsLookupFn?: DnsLookupFn,
): Promise<ActorCardDiscovery> {
  const wellKnownUrl = `https://${domain}/.well-known/aicp.json`;

  try {
    return await fetchActorCard(wellKnownUrl, fetchFn);
  } catch {
    // Well-known failed, try DNS TXT fallback if available
  }

  if (dnsLookupFn) {
    const txtUrl = await dnsLookupFn(`_aicp.${domain}`);
    if (txtUrl && isHttpsUrl(txtUrl)) {
      return fetchActorCard(txtUrl, fetchFn);
    }
  }

  throw new OapsError({
    code: 'DISCOVERY_FAILED',
    category: 'discovery',
    message: `Could not resolve actor card for domain: ${domain}`,
    retryable: false,
  });
}
