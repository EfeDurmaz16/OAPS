import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..', '..', '..');
const schemaDir = path.join(repoRoot, 'schemas');
const exampleDir = path.join(repoRoot, 'examples');

const exampleSchemaMap = new Map([
  ['actor-card-mcp.json', 'actor-card.json'],
  ['approval-decision-modify.json', 'approval-decision.json'],
  ['approval-decision.json', 'approval-decision.json'],
  ['approval-request.json', 'approval-request.json'],
  ['capability-card-tool.json', 'capability-card.json'],
  ['delegation-token.json', 'delegation-token.json'],
  ['envelope-intent-request.json', 'envelope.json'],
  ['error.json', 'error.json'],
  ['evidence-event.json', 'evidence-event.json'],
  ['execution-request.json', 'execution-request.json'],
  ['execution-result.json', 'execution-result.json'],
  ['intent-invoke.json', 'intent.json'],
  ['interaction-created.json', 'interaction-created.json'],
  ['interaction-updated.json', 'interaction-updated.json'],
]);

const wellKnownRequiredKeys = [
  'oaps_version',
  'actor_card_url',
  'capabilities_url',
  'interactions_url',
  'auth_schemes',
  'supported_profiles',
];

function pointerDecode(token) {
  return token.replace(/~1/g, '/').replace(/~0/g, '~');
}

function typeOfJson(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function mergePath(basePath, suffix) {
  return basePath === '$' ? `${basePath}${suffix}` : `${basePath}${suffix}`;
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateUri(value) {
  try {
    const parsed = new URL(value);
    return Boolean(parsed.protocol && parsed.host);
  } catch {
    return false;
  }
}

function validateDateTime(value) {
  return !Number.isNaN(Date.parse(value));
}

class SchemaValidator {
  constructor(schemaMap) {
    this.schemaMap = schemaMap;
  }

  resolveSchema(baseSchemaName, ref) {
    const [refFile, fragment = ''] = ref.split('#');
    const schemaName = refFile || baseSchemaName;
    const rootSchema = this.schemaMap.get(schemaName);
    if (!rootSchema) {
      throw new Error(`Unknown schema reference: ${ref}`);
    }
    if (!fragment) return { schema: rootSchema, schemaName };

    const parts = fragment.replace(/^\//, '').split('/').filter(Boolean).map(pointerDecode);
    let current = rootSchema;
    for (const part of parts) {
      current = current?.[part];
      if (current === undefined) {
        throw new Error(`Unresolvable schema fragment: ${ref}`);
      }
    }
    return { schema: current, schemaName };
  }

  validateAgainstSchema(schemaName, value) {
    const schema = this.schemaMap.get(schemaName);
    if (!schema) {
      throw new Error(`Schema not found: ${schemaName}`);
    }
    return this.validate(value, schema, '$', schemaName);
  }

  validate(value, schema, valuePath, schemaName) {
    const errors = [];
    if (!schema) return errors;

    if (schema.$ref) {
      const resolved = this.resolveSchema(schemaName, schema.$ref);
      return this.validate(value, resolved.schema, valuePath, resolved.schemaName);
    }

    if (schema.allOf) {
      for (const nested of schema.allOf) {
        errors.push(...this.validate(value, nested, valuePath, schemaName));
      }
    }

    if (schema.oneOf) {
      const validMatches = schema.oneOf.filter((candidate) => this.validate(value, candidate, valuePath, schemaName).length === 0);
      if (validMatches.length !== 1) {
        errors.push(`${valuePath}: expected exactly one oneOf branch to match, got ${validMatches.length}`);
      }
    }

    if (schema.if) {
      const ifMatches = this.validate(value, schema.if, valuePath, schemaName).length === 0;
      if (ifMatches && schema.then) {
        errors.push(...this.validate(value, schema.then, valuePath, schemaName));
      }
      if (!ifMatches && schema.else) {
        errors.push(...this.validate(value, schema.else, valuePath, schemaName));
      }
    }

    if (schema.const !== undefined && value !== schema.const) {
      errors.push(`${valuePath}: expected constant ${JSON.stringify(schema.const)}`);
    }

    if (schema.enum && !schema.enum.includes(value)) {
      errors.push(`${valuePath}: expected one of ${schema.enum.map((entry) => JSON.stringify(entry)).join(', ')}`);
    }

    if (schema.type) {
      const actualType = typeOfJson(value);
      if (schema.type === 'integer') {
        if (!(typeof value === 'number' && Number.isInteger(value))) {
          errors.push(`${valuePath}: expected integer, got ${actualType}`);
          return errors;
        }
      } else if (actualType !== schema.type) {
        errors.push(`${valuePath}: expected ${schema.type}, got ${actualType}`);
        return errors;
      }
    }

    if (schema.minLength !== undefined && typeof value === 'string' && value.length < schema.minLength) {
      errors.push(`${valuePath}: expected minLength ${schema.minLength}, got ${value.length}`);
    }

    if (schema.pattern && typeof value === 'string' && !(new RegExp(schema.pattern).test(value))) {
      errors.push(`${valuePath}: expected pattern ${schema.pattern}`);
    }

    if (schema.format && typeof value === 'string') {
      if (schema.format === 'date-time' && !validateDateTime(value)) {
        errors.push(`${valuePath}: expected valid date-time`);
      }
      if (schema.format === 'uri' && !validateUri(value)) {
        errors.push(`${valuePath}: expected valid uri`);
      }
    }

    if (schema.type === 'array' && Array.isArray(value)) {
      if (schema.minItems !== undefined && value.length < schema.minItems) {
        errors.push(`${valuePath}: expected at least ${schema.minItems} items, got ${value.length}`);
      }
      if (schema.items) {
        value.forEach((item, index) => {
          errors.push(...this.validate(item, schema.items, mergePath(valuePath, `[${index}]`), schemaName));
        });
      }
    }

    const shouldValidateObject = schema.type === 'object' || schema.properties || schema.required || schema.additionalProperties !== undefined;
    if (shouldValidateObject) {
      if (!isObject(value)) {
        errors.push(`${valuePath}: expected object, got ${typeOfJson(value)}`);
        return errors;
      }

      const properties = schema.properties ?? {};
      const required = schema.required ?? [];
      for (const key of required) {
        if (!(key in value)) {
          errors.push(`${valuePath}: missing required property ${key}`);
        }
      }

      for (const [key, nestedSchema] of Object.entries(properties)) {
        if (key in value) {
          errors.push(...this.validate(value[key], nestedSchema, mergePath(valuePath, `.${key}`), schemaName));
        }
      }

      if (schema.additionalProperties === false) {
        for (const key of Object.keys(value)) {
          if (!(key in properties)) {
            errors.push(`${valuePath}: unexpected property ${key}`);
          }
        }
      } else if (schema.additionalProperties && schema.additionalProperties !== true) {
        for (const key of Object.keys(value)) {
          if (!(key in properties)) {
            errors.push(...this.validate(value[key], schema.additionalProperties, mergePath(valuePath, `.${key}`), schemaName));
          }
        }
      }
    }

    return errors;
  }
}

async function loadJsonDirectory(directoryPath) {
  const fileNames = (await readdir(directoryPath)).filter((name) => name.endsWith('.json')).sort();
  const entries = await Promise.all(
    fileNames.map(async (fileName) => {
      const raw = await readFile(path.join(directoryPath, fileName), 'utf8');
      return [fileName, JSON.parse(raw)];
    }),
  );
  return new Map(entries);
}

function validateWellKnownExample(example) {
  const errors = [];
  if (!isObject(example)) {
    return ['well-known-oaps.json: expected object'];
  }
  for (const key of wellKnownRequiredKeys) {
    if (!(key in example)) {
      errors.push(`well-known-oaps.json: missing required field ${key}`);
    }
  }
  if ('oaps_version' in example && typeof example.oaps_version !== 'string') {
    errors.push('well-known-oaps.json: oaps_version must be a string');
  }
  if ('auth_schemes' in example && !Array.isArray(example.auth_schemes)) {
    errors.push('well-known-oaps.json: auth_schemes must be an array');
  }
  if ('supported_profiles' in example && !Array.isArray(example.supported_profiles)) {
    errors.push('well-known-oaps.json: supported_profiles must be an array');
  }
  for (const urlKey of ['actor_card_url', 'capabilities_url', 'interactions_url']) {
    if (typeof example[urlKey] === 'string' && !validateUri(example[urlKey])) {
      errors.push(`well-known-oaps.json: ${urlKey} must be a valid uri`);
    }
  }
  return errors;
}

async function main() {
  const schemas = await loadJsonDirectory(schemaDir);
  const examples = await loadJsonDirectory(exampleDir);
  const validator = new SchemaValidator(schemas);

  const errors = [];
  const warnings = [];

  for (const [exampleName, schemaName] of exampleSchemaMap.entries()) {
    const example = examples.get(exampleName);
    if (!example) {
      errors.push(`${exampleName}: example file is missing`);
      continue;
    }
    errors.push(...validator.validateAgainstSchema(schemaName, example).map((message) => `${exampleName}: ${message}`));
  }

  const wellKnownExample = examples.get('well-known-oaps.json');
  if (!wellKnownExample) {
    errors.push('well-known-oaps.json: example file is missing');
  } else {
    errors.push(...validateWellKnownExample(wellKnownExample));
  }

  for (const schemaName of schemas.keys()) {
    if (schemaName === 'common.json') continue;
    if (![...exampleSchemaMap.values()].includes(schemaName)) {
      warnings.push(`${schemaName}: no example file currently mapped`);
    }
  }

  if (warnings.length > 0) {
    console.warn('Spec pack warnings:');
    for (const warning of warnings) {
      console.warn(`- ${warning}`);
    }
  }

  if (errors.length > 0) {
    console.error('Spec pack validation failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Validated ${exampleSchemaMap.size + 1} examples against the OAPS spec pack.`);
}

await main();
