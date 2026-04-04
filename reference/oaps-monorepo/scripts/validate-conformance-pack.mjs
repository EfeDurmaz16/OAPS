import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..', '..', '..');
const conformanceDir = path.join(repoRoot, 'conformance');

async function readJson(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  const raw = await readFile(fullPath, 'utf8');
  return JSON.parse(raw);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizePackPath(relativePath) {
  return relativePath.startsWith('conformance/') ? relativePath : path.posix.join('conformance', relativePath);
}

async function verifyFile(relativePath) {
  await readFile(path.join(repoRoot, relativePath), 'utf8');
}

async function main() {
  const manifestPath = 'conformance/manifest/oaps-tck.manifest.v1.json';
  const manifest = await readJson(manifestPath);

  assert(manifest.manifest_version === '1.0', 'Conformance manifest must declare manifest_version 1.0');
  assert(Array.isArray(manifest.entrypoints) && manifest.entrypoints.length > 0, 'Conformance manifest must list at least one entrypoint');
  assert(typeof manifest.taxonomy === 'string', 'Conformance manifest must include taxonomy path');
  assert(typeof manifest.fixture_index === 'string', 'Conformance manifest must include fixture_index path');

  await verifyFile(manifest.taxonomy);
  await verifyFile(manifest.fixture_index);
  for (const source of manifest.normative_sources ?? []) {
    await verifyFile(source);
  }
  for (const source of manifest.reference_implementations ?? []) {
    await verifyFile(source);
  }

  const taxonomy = await readJson(manifest.taxonomy);
  assert(Array.isArray(taxonomy.families) && taxonomy.families.length > 0, 'Scenario taxonomy must define families');
  const knownScopes = new Set(taxonomy.families.map((family) => family.id));
  const knownCoverageLevels = new Set(taxonomy.coverage_levels ?? []);

  const topLevelIndex = await readJson(manifest.fixture_index);
  assert(Array.isArray(topLevelIndex.packs) && topLevelIndex.packs.length > 0, 'Conformance fixture index must list packs');

  const declaredPacks = new Map(topLevelIndex.packs.map((pack) => [pack.scope, normalizePackPath(pack.path)]));
  const scenarioIds = new Set();
  let fixtureCount = 0;

  for (const entrypoint of manifest.entrypoints) {
    assert(knownScopes.has(entrypoint.scope), `Unknown entrypoint scope: ${entrypoint.scope}`);
    assert(declaredPacks.has(entrypoint.scope), `Entry point scope missing from top-level index: ${entrypoint.scope}`);
    assert(
      normalizePackPath(entrypoint.pack) === declaredPacks.get(entrypoint.scope),
      `Entrypoint pack mismatch for scope ${entrypoint.scope}`
    );
  }

  for (const { scope, path: packPath } of topLevelIndex.packs) {
    assert(knownScopes.has(scope), `Unknown fixture pack scope: ${scope}`);
    const normalizedPackPath = normalizePackPath(packPath);
    await verifyFile(normalizedPackPath);
    const pack = await readJson(normalizedPackPath);

    assert(pack.scope === scope, `Fixture pack scope mismatch in ${normalizedPackPath}`);
    assert(Array.isArray(pack.fixtures) && pack.fixtures.length > 0, `Fixture pack ${normalizedPackPath} must define fixtures`);

    const family = taxonomy.families.find((candidate) => candidate.id === scope);
    const allowedDimensions = new Set(family.dimensions);

    for (const source of pack.normative_sources ?? []) {
      await verifyFile(source);
    }

    for (const fixture of pack.fixtures) {
      fixtureCount += 1;
      assert(typeof fixture.scenario_id === 'string' && fixture.scenario_id.length > 0, `Fixture in ${normalizedPackPath} is missing scenario_id`);
      assert(!scenarioIds.has(fixture.scenario_id), `Duplicate scenario_id detected: ${fixture.scenario_id}`);
      scenarioIds.add(fixture.scenario_id);

      assert(allowedDimensions.has(fixture.dimension), `Unknown dimension ${fixture.dimension} for ${fixture.scenario_id}`);
      assert(Array.isArray(fixture.coverage) && fixture.coverage.length > 0, `Fixture ${fixture.scenario_id} must declare coverage`);

      for (const coverageLevel of fixture.coverage) {
        assert(knownCoverageLevels.has(coverageLevel), `Unknown coverage level ${coverageLevel} for ${fixture.scenario_id}`);
      }

      if (fixture.schema) await verifyFile(fixture.schema);
      if (fixture.example) await verifyFile(fixture.example);
      if (fixture.reference_test) await verifyFile(fixture.reference_test);
    }
  }

  console.log(`Validated conformance pack with ${topLevelIndex.packs.length} packs and ${fixtureCount} scenarios.`);
}

await main();
