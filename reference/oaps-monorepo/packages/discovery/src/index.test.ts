import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateActorCard,
  matchCapabilities,
  fetchActorCard,
  resolveActorCard,
  type ActorCardDiscovery,
  type FetchFn,
  type DnsLookupFn,
} from './index.js';

const VALID_CARD: ActorCardDiscovery = {
  actor_id: 'https://agents.example.com/actors/test',
  actor_type: 'agent',
  aicp_version: '0.4-draft',
  interaction_endpoint: 'https://agents.example.com/oaps',
  capabilities: ['https://agents.example.com/capabilities/search'],
  display_name: 'Test Agent',
  supported_bindings: ['http'],
  supported_profiles: ['mcp'],
};

function mockFetch(card: unknown, status = 200): FetchFn {
  return async () => ({ ok: status >= 200 && status < 300, status, json: async () => card });
}

function failFetch(): FetchFn {
  return async () => { throw new Error('network error'); };
}

describe('validateActorCard', () => {
  it('accepts a valid actor card', () => {
    assert.doesNotThrow(() => validateActorCard(VALID_CARD));
  });

  it('rejects null', () => {
    assert.throws(() => validateActorCard(null), { name: 'OapsError' });
  });

  it('rejects missing actor_id', () => {
    const { actor_id, ...rest } = VALID_CARD;
    assert.throws(() => validateActorCard(rest), { name: 'OapsError' });
  });

  it('rejects missing actor_type', () => {
    const { actor_type, ...rest } = VALID_CARD;
    assert.throws(() => validateActorCard(rest), { name: 'OapsError' });
  });

  it('rejects missing aicp_version', () => {
    const { aicp_version, ...rest } = VALID_CARD;
    assert.throws(() => validateActorCard(rest), { name: 'OapsError' });
  });

  it('rejects missing interaction_endpoint', () => {
    const { interaction_endpoint, ...rest } = VALID_CARD;
    assert.throws(() => validateActorCard(rest), { name: 'OapsError' });
  });

  it('rejects missing capabilities', () => {
    const { capabilities, ...rest } = VALID_CARD;
    assert.throws(() => validateActorCard(rest), { name: 'OapsError' });
  });

  it('rejects empty capabilities array', () => {
    assert.throws(() => validateActorCard({ ...VALID_CARD, capabilities: [] }), { name: 'OapsError' });
  });

  it('rejects invalid actor_type', () => {
    assert.throws(() => validateActorCard({ ...VALID_CARD, actor_type: 'alien' }), { name: 'OapsError' });
  });

  it('rejects invalid capability URI', () => {
    assert.throws(
      () => validateActorCard({ ...VALID_CARD, capabilities: ['not-a-uri'] }),
      { name: 'OapsError' },
    );
  });

  it('rejects invalid interaction_endpoint', () => {
    assert.throws(
      () => validateActorCard({ ...VALID_CARD, interaction_endpoint: 'not-a-url' }),
      { name: 'OapsError' },
    );
  });

  it('rejects invalid supported_bindings value', () => {
    assert.throws(
      () => validateActorCard({ ...VALID_CARD, supported_bindings: ['grpc'] }),
      { name: 'OapsError' },
    );
  });
});

describe('matchCapabilities', () => {
  it('returns true when all required capabilities are present', () => {
    const card: ActorCardDiscovery = {
      ...VALID_CARD,
      capabilities: [
        'https://example.com/cap/a',
        'https://example.com/cap/b',
        'https://example.com/cap/c',
      ],
    };
    assert.equal(matchCapabilities(card, ['https://example.com/cap/a', 'https://example.com/cap/c']), true);
  });

  it('returns false when a required capability is missing', () => {
    assert.equal(
      matchCapabilities(VALID_CARD, ['https://example.com/missing']),
      false,
    );
  });

  it('returns true for empty required list', () => {
    assert.equal(matchCapabilities(VALID_CARD, []), true);
  });
});

describe('fetchActorCard', () => {
  it('fetches and validates a valid actor card', async () => {
    const card = await fetchActorCard('https://example.com/.well-known/aicp.json', mockFetch(VALID_CARD));
    assert.equal(card.actor_id, VALID_CARD.actor_id);
  });

  it('rejects non-HTTPS URLs', async () => {
    await assert.rejects(
      () => fetchActorCard('http://example.com/card', mockFetch(VALID_CARD)),
      { name: 'OapsError' },
    );
  });

  it('throws on network failure', async () => {
    await assert.rejects(
      () => fetchActorCard('https://example.com/card', failFetch()),
      { name: 'OapsError' },
    );
  });

  it('throws on non-2xx response', async () => {
    await assert.rejects(
      () => fetchActorCard('https://example.com/card', mockFetch(VALID_CARD, 404)),
      { name: 'OapsError' },
    );
  });

  it('throws when response body is invalid', async () => {
    await assert.rejects(
      () => fetchActorCard('https://example.com/card', mockFetch({ bad: 'data' })),
      { name: 'OapsError' },
    );
  });
});

describe('resolveActorCard', () => {
  it('resolves via well-known URI', async () => {
    const card = await resolveActorCard('example.com', mockFetch(VALID_CARD));
    assert.equal(card.actor_id, VALID_CARD.actor_id);
  });

  it('falls back to DNS TXT when well-known fails', async () => {
    let callCount = 0;
    const fetch: FetchFn = async (url) => {
      callCount++;
      if (url.includes('.well-known')) {
        return { ok: false, status: 404, json: async () => ({}) };
      }
      return { ok: true, status: 200, json: async () => VALID_CARD };
    };
    const dnsLookup: DnsLookupFn = async () => 'https://cdn.example.com/aicp.json';

    const card = await resolveActorCard('example.com', fetch, dnsLookup);
    assert.equal(card.actor_id, VALID_CARD.actor_id);
    assert.equal(callCount, 2);
  });

  it('fails when both well-known and DNS fail', async () => {
    const fetch: FetchFn = async () => ({ ok: false, status: 404, json: async () => ({}) });
    const dnsLookup: DnsLookupFn = async () => null;

    await assert.rejects(
      () => resolveActorCard('example.com', fetch, dnsLookup),
      { name: 'OapsError' },
    );
  });

  it('fails when no DNS lookup provided and well-known fails', async () => {
    const fetch: FetchFn = async () => ({ ok: false, status: 500, json: async () => ({}) });

    await assert.rejects(
      () => resolveActorCard('example.com', fetch),
      { name: 'OapsError' },
    );
  });
});
