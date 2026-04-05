import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..', '..', '..');
const schemaDir = path.join(repoRoot, 'schemas');
const outputPath = path.join(repoRoot, 'reference', 'oaps-monorepo', 'packages', 'core', 'src', 'generated-schema-constants.ts');

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

function renderConst(name, value) {
  return `export const ${name} = ${JSON.stringify(value, null, 2)} as const;`;
}

async function main() {
  const common = await readJson(path.join(schemaDir, 'common.json'));
  const foundationCommon = await readJson(path.join(schemaDir, 'foundation', 'common.json'));
  const actorCard = await readJson(path.join(schemaDir, 'actor-card.json'));
  const capabilityCard = await readJson(path.join(schemaDir, 'capability-card.json'));
  const envelope = await readJson(path.join(schemaDir, 'envelope.json'));
  const executionResult = await readJson(path.join(schemaDir, 'execution-result.json'));

  const generated = `// This file is generated from ../../../../schemas/*.json by scripts/generate-core-schema-constants.mjs.\n// Do not edit by hand.\n\n${[
    renderConst('RISK_CLASS_ORDER', common.$defs.riskClass.enum),
    renderConst('CAPABILITY_KINDS', capabilityCard.properties.kind.enum),
    renderConst('ENDPOINT_KINDS', common.$defs.endpoint.properties.kind.enum),
    renderConst('AUTH_SCHEMES', actorCard.properties.auth_schemes.items.enum),
    renderConst('CHANNELS', envelope.properties.channel.enum),
    renderConst('ACTOR_TYPES', actorCard.properties.actor_type.enum),
    renderConst('IDENTITY_PROFILES', actorCard.properties.identity_profile.enum),
    renderConst('EXECUTION_STATUSES', executionResult.properties.status.enum),
    renderConst('MESSAGE_TYPES', envelope.properties.message_type.enum),
    renderConst('INTERACTION_STATES', common.$defs.state.enum),
    renderConst('TASK_STATES', foundationCommon.$defs.taskState.enum),
    renderConst('SCHEMA_VERSION_PATTERN', envelope.properties.spec_version.pattern),
    renderConst('MONEY_VALUE_PATTERN', common.$defs.money.properties.value.pattern),
    renderConst('ISO_CURRENCY_PATTERN', common.$defs.money.properties.currency.pattern),
  ].join('\n\n')}\n`;

  if (process.argv.includes('--check')) {
    const existing = await readFile(outputPath, 'utf8');
    if (existing !== generated) {
      console.error(`${path.relative(repoRoot, outputPath)} is out of date. Run node reference/oaps-monorepo/scripts/generate-core-schema-constants.mjs`);
      process.exitCode = 1;
    }
    return;
  }

  await writeFile(outputPath, generated);
}

await main();
