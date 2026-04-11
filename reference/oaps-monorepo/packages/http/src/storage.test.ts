import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { FileReferenceStateStore, StoredInteraction } from './storage.js';

async function withTempDir<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(path.join(tmpdir(), 'aicp-storage-test-'));
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function buildInteraction(id: string): StoredInteraction {
  const envelope = {
    spec_version: '0.4-draft',
    min_supported_version: '0.4',
    max_supported_version: '0.4',
    message_id: `msg_${id}`,
    interaction_id: id,
    from: { actor_id: 'urn:oaps:actor:agent:storage-test' },
    to: { actor_id: 'urn:oaps:actor:server:reference' },
    channel: 'mcp',
    message_type: 'intent.request',
    timestamp: '2026-04-11T09:00:00Z',
    payload: {
      intent_id: `int_${id}`,
      verb: 'invoke',
      object: 'tool:read_repo',
      constraints: { arguments: { path: 'README.md' } },
    },
  } as unknown as StoredInteraction['request'];

  return {
    interaction_id: id,
    state: 'intent_received',
    created_at: '2026-04-11T09:00:00Z',
    updated_at: '2026-04-11T09:00:00Z',
    request: envelope,
    actor: { actor_id: 'urn:oaps:actor:agent:storage-test' },
    evidence: { events: [] } as unknown as StoredInteraction['evidence'],
  };
}

test('FileReferenceStateStore returns null for missing interaction file (fresh install)', async () => {
  await withTempDir(async (dir) => {
    const store = new FileReferenceStateStore(path.join(dir, 'does-not-exist.json'));
    const result = await store.getInteraction('int_missing');
    assert.equal(result, null);
  });
});

test('FileReferenceStateStore persists and recovers interactions across instances', async () => {
  await withTempDir(async (dir) => {
    const filePath = path.join(dir, 'state.json');
    const first = new FileReferenceStateStore(filePath);
    await first.putInteraction(buildInteraction('int_persist_1'));

    // Simulate a process restart by constructing a fresh store over the same file.
    const second = new FileReferenceStateStore(filePath);
    const recovered = await second.getInteraction('int_persist_1');
    assert.ok(recovered, 'interaction should be recovered after restart');
    assert.equal(recovered?.interaction_id, 'int_persist_1');
    assert.equal(recovered?.state, 'intent_received');
  });
});

test('FileReferenceStateStore writes atomically via rename (temp file then rename)', async () => {
  await withTempDir(async (dir) => {
    const filePath = path.join(dir, 'state.json');
    const store = new FileReferenceStateStore(filePath);
    await store.putInteraction(buildInteraction('int_atomic_1'));

    // After the put, the target file must exist and contain the interaction.
    // The temp file must NOT still exist after a successful rename.
    const raw = await readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw) as { interactions: Record<string, unknown> };
    assert.ok(parsed.interactions['int_atomic_1'], 'interaction must be in persisted state');

    // tmp file should not remain after successful rename
    let tmpExists = false;
    try {
      await readFile(`${filePath}.tmp`, 'utf8');
      tmpExists = true;
    } catch {
      tmpExists = false;
    }
    assert.equal(tmpExists, false, 'temp file should not persist after atomic rename');
  });
});

test('FileReferenceStateStore recovers gracefully from truncated/corrupt JSON', async () => {
  await withTempDir(async (dir) => {
    const filePath = path.join(dir, 'state.json');
    // Pre-seed with invalid JSON (simulates a crash mid-write where rename completed but content is bad)
    await writeFile(filePath, '{"interactions": {"int_1": {truncated');

    const store = new FileReferenceStateStore(filePath);
    // Fail-closed behavior: the store should throw a deterministic JSON error,
    // not silently return an empty state. This matches FOUNDATION-DRAFT CC7.
    await assert.rejects(
      async () => store.getInteraction('int_1'),
      (err: Error) => err instanceof SyntaxError || /JSON/.test(err.message),
      'expected JSON parse error on corrupt state file',
    );
  });
});

test('FileReferenceStateStore recovers idempotency records across restart', async () => {
  await withTempDir(async (dir) => {
    const filePath = path.join(dir, 'state.json');
    const first = new FileReferenceStateStore(filePath);
    await first.putIdempotency('idem-key-1', {
      request_hash: 'sha256:abc123',
      status: 200,
      body: { ok: true },
    });

    const second = new FileReferenceStateStore(filePath);
    const recovered = await second.getIdempotency('idem-key-1');
    assert.ok(recovered, 'idempotency record should survive restart');
    assert.equal(recovered?.request_hash, 'sha256:abc123');
    assert.equal(recovered?.status, 200);
  });
});

test('FileReferenceStateStore serializes concurrent writes via queue', async () => {
  await withTempDir(async (dir) => {
    const filePath = path.join(dir, 'state.json');
    const store = new FileReferenceStateStore(filePath);

    // Fire many concurrent writes. Each must read-modify-write atomically
    // without losing any interactions due to write races.
    const concurrency = 20;
    await Promise.all(
      Array.from({ length: concurrency }, (_, i) =>
        store.putInteraction(buildInteraction(`int_concurrent_${i}`)),
      ),
    );

    // Verify every interaction is present after all writes settle.
    const raw = await readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw) as { interactions: Record<string, unknown> };
    for (let i = 0; i < concurrency; i += 1) {
      assert.ok(
        parsed.interactions[`int_concurrent_${i}`],
        `interaction int_concurrent_${i} lost in concurrent write race`,
      );
    }
  });
});

test('FileReferenceStateStore handles missing parent directory by creating it', async () => {
  await withTempDir(async (dir) => {
    const filePath = path.join(dir, 'nested', 'deep', 'state.json');
    const store = new FileReferenceStateStore(filePath);
    await store.putInteraction(buildInteraction('int_nested_1'));

    const raw = await readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw) as { interactions: Record<string, unknown> };
    assert.ok(parsed.interactions['int_nested_1']);
  });
});
