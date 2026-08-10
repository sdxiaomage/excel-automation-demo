#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

export function parseCsv(text) {
  const matrix = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"' && field.length === 0) {
      quoted = true;
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(field);
      field = '';
      if (row.some((value) => value !== '')) matrix.push(row);
      row = [];
    } else {
      field += character;
    }
  }

  invariant(!quoted, 'CSV contains an unterminated quoted field');
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((value) => value !== '')) matrix.push(row);
  }
  invariant(matrix.length > 0, 'CSV has no header row');

  const headers = matrix[0].map((value, index) =>
    index === 0 ? value.replace(/^\uFEFF/, '').trim() : value.trim(),
  );
  invariant(headers.every(Boolean), 'CSV headers must not be empty');
  invariant(new Set(headers).size === headers.length, 'CSV headers must be unique');

  const records = matrix.slice(1).map((cells, rowIndex) => {
    invariant(
      cells.length <= headers.length,
      `CSV row ${rowIndex + 2} has more fields than the header`,
    );
    return Object.fromEntries(headers.map((header, column) => [header, cells[column] ?? '']));
  });
  return { headers, records };
}

function quoteCsv(value) {
  let text = value === null || value === undefined ? '' : String(value);
  const candidate = text.trimStart();
  const numericNegative = /^-\d+(?:\.\d+)?$/.test(candidate);
  if (/^[=+@]/.test(candidate) || (candidate.startsWith('-') && !numericNegative)) {
    text = `'${text}`;
  }
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function serializeCsv(headers, records) {
  const lines = [headers.map(quoteCsv).join(',')];
  for (const record of records) {
    lines.push(headers.map((header) => quoteCsv(record[header])).join(','));
  }
  return `${lines.join('\r\n')}\r\n`;
}

function normalizeDate(value) {
  const match = /^(\d{4})[-/](\d{2})[-/](\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function resolveFrom(baseDirectory, file) {
  invariant(typeof file === 'string' && file.length > 0, 'Every file path must be a string');
  return path.resolve(baseDirectory, file);
}

function failure(row, field, type, reason, rawValue = '') {
  return {
    source_file: row.__sourceFile,
    source_row: row.__sourceRow,
    record_key: row.__recordKey,
    error_field: field,
    error_type: type,
    reason,
    raw_value: rawValue,
  };
}

async function prepareLookups(config, baseDirectory) {
  const prepared = [];
  for (const lookup of config.lookups ?? []) {
    invariant(lookup && typeof lookup === 'object', 'Each lookup must be an object');
    invariant(lookup.localField && lookup.foreignField, 'Lookup fields are required');
    invariant(Array.isArray(lookup.select), 'Lookup select must be an array');
    const filePath = resolveFrom(baseDirectory, lookup.file);
    const parsed = parseCsv(await fs.readFile(filePath, 'utf8'));
    invariant(parsed.headers.includes(lookup.foreignField), `Missing lookup key ${lookup.foreignField}`);
    for (const field of lookup.select) {
      invariant(parsed.headers.includes(field), `Missing lookup select field ${field}`);
    }
    const rows = new Map();
    for (const record of parsed.records) {
      const key = record[lookup.foreignField];
      invariant(key !== '', `Lookup ${lookup.file} contains an empty key`);
      invariant(!rows.has(key), `Lookup ${lookup.file} contains duplicate key ${key}`);
      rows.set(key, record);
    }
    prepared.push({ ...lookup, rows });
  }
  return prepared;
}

function validateConfig(config) {
  invariant(config && typeof config === 'object', 'Config must be a JSON object');
  invariant(Array.isArray(config.inputs) && config.inputs.length > 0, 'Config inputs are required');
  invariant(config.dedupe?.field, 'Config dedupe.field is required');
  for (const name of ['required', 'trim', 'dates', 'numbers', 'enums', 'lookups']) {
    if (config[name] !== undefined) invariant(Array.isArray(config[name]), `${name} must be an array`);
  }
}

export async function runCleanroom({ configPath, outputDirectory }) {
  const absoluteConfig = path.resolve(configPath);
  const baseDirectory = path.dirname(absoluteConfig);
  const config = JSON.parse(await fs.readFile(absoluteConfig, 'utf8'));
  validateConfig(config);
  const lookups = await prepareLookups(config, baseDirectory);

  const allRows = [];
  let inputHeaders;
  for (const input of config.inputs) {
    const filePath = resolveFrom(baseDirectory, input);
    const parsed = parseCsv(await fs.readFile(filePath, 'utf8'));
    if (!inputHeaders) inputHeaders = parsed.headers;
    else invariant(
      JSON.stringify(parsed.headers) === JSON.stringify(inputHeaders),
      `Input ${input} does not use the same ordered headers as the first input`,
    );
    parsed.records.forEach((record, index) => {
      allRows.push({ ...record, __sourceFile: path.basename(input), __sourceRow: index + 2 });
    });
  }

  const knownFields = new Set(inputHeaders);
  for (const field of [
    config.dedupe.field,
    ...(config.required ?? []),
    ...(config.trim ?? []),
    ...(config.dates ?? []).map((rule) => rule.field),
    ...(config.numbers ?? []).map((rule) => rule.field),
    ...(config.enums ?? []).map((rule) => rule.field),
    ...lookups.map((lookup) => lookup.localField),
  ]) {
    invariant(knownFields.has(field), `Configured input field does not exist: ${field}`);
  }

  const selectedLookupFields = [];
  for (const lookup of lookups) {
    for (const field of lookup.select) {
      if (!knownFields.has(field) && !selectedLookupFields.includes(field)) {
        selectedLookupFields.push(field);
      }
    }
  }

  const cleaned = [];
  const exceptions = [];
  const seen = new Set();
  for (const original of allRows) {
    const row = { ...original };
    for (const field of config.trim ?? []) row[field] = row[field].trim();
    const dedupeValue = row[config.dedupe.field];
    row.__recordKey = dedupeValue;

    let error;
    if (seen.has(dedupeValue)) {
      error = failure(row, config.dedupe.field, 'Duplicate', 'Key already appeared in an earlier input row', dedupeValue);
    }
    seen.add(dedupeValue);

    if (!error) {
      for (const field of config.required ?? []) {
        if (row[field].trim() === '') {
          error = failure(row, field, 'Required', 'Required value is empty');
          break;
        }
      }
    }

    if (!error) {
      for (const lookup of lookups) {
        const value = row[lookup.localField];
        const match = lookup.rows.get(value);
        if (!match && lookup.required) {
          error = failure(row, lookup.localField, 'Lookup', `Value is missing from ${lookup.file}`, value);
          break;
        }
        if (match) {
          for (const field of lookup.select) row[field] = match[field];
        }
      }
    }

    if (!error) {
      for (const rule of config.dates ?? []) {
        if (row[rule.field] === '') continue;
        const normalized = normalizeDate(row[rule.field]);
        if (!normalized) {
          error = failure(row, rule.field, 'Date', 'Expected YYYY-MM-DD or YYYY/MM/DD', row[rule.field]);
          break;
        }
        row[rule.field] = normalized;
      }
    }

    if (!error) {
      for (const rule of config.numbers ?? []) {
        if (row[rule.field] === '') continue;
        const numeric = Number(row[rule.field]);
        const outside =
          !Number.isFinite(numeric) ||
          (rule.min !== undefined && numeric < rule.min) ||
          (rule.minExclusive !== undefined && numeric <= rule.minExclusive) ||
          (rule.max !== undefined && numeric > rule.max) ||
          (rule.maxExclusive !== undefined && numeric >= rule.maxExclusive);
        if (outside) {
          error = failure(row, rule.field, 'Range', 'Numeric value is outside the configured range', row[rule.field]);
          break;
        }
        row[rule.field] = String(numeric);
      }
    }

    if (!error) {
      for (const rule of config.enums ?? []) {
        if (row[rule.field] === '') continue;
        invariant(rule.values && typeof rule.values === 'object', `Enum ${rule.field} requires values`);
        const mapping = new Map(
          Object.entries(rule.values).map(([key, value]) => [key.toLowerCase(), String(value)]),
        );
        const normalized = mapping.get(row[rule.field].trim().toLowerCase());
        if (normalized === undefined) {
          error = failure(row, rule.field, 'Enum', 'Value is not in the configured enum', row[rule.field]);
          break;
        }
        row[rule.field] = normalized;
      }
    }

    if (error) exceptions.push(error);
    else {
      row.source_file = row.__sourceFile;
      row.source_row = row.__sourceRow;
      delete row.__sourceFile;
      delete row.__sourceRow;
      delete row.__recordKey;
      cleaned.push(row);
    }
  }

  const outputHeaders = [...inputHeaders, ...selectedLookupFields, 'source_file', 'source_row'];
  const exceptionHeaders = [
    'source_file',
    'source_row',
    'record_key',
    'error_field',
    'error_type',
    'reason',
    'raw_value',
  ];
  const summary = {
    inputRows: allRows.length,
    cleanedRows: cleaned.length,
    exceptionRows: exceptions.length,
    duplicateRows: exceptions.filter((record) => record.error_type === 'Duplicate').length,
    reconciliationDifference: allRows.length - cleaned.length - exceptions.length,
  };

  const target = path.resolve(outputDirectory);
  const outputFiles = ['cleaned.csv', 'exceptions.csv', 'summary.json'].map((file) =>
    path.join(target, file),
  );
  const normalized = (file) => {
    const absolute = path.resolve(file);
    return process.platform === 'win32' ? absolute.toLowerCase() : absolute;
  };
  const protectedFiles = new Set([
    absoluteConfig,
    ...config.inputs.map((file) => resolveFrom(baseDirectory, file)),
    ...(config.lookups ?? []).map((lookup) => resolveFrom(baseDirectory, lookup.file)),
  ].map(normalized));
  for (const file of outputFiles) {
    invariant(!protectedFiles.has(normalized(file)), `Refusing to overwrite input/config file: ${file}`);
  }
  await fs.mkdir(target, { recursive: true });
  await Promise.all([
    fs.writeFile(outputFiles[0], serializeCsv(outputHeaders, cleaned)),
    fs.writeFile(outputFiles[1], serializeCsv(exceptionHeaders, exceptions)),
    fs.writeFile(outputFiles[2], `${JSON.stringify(summary, null, 2)}\n`),
  ]);
  return { cleaned, exceptions, summary, outputDirectory: target };
}

function parseArguments(arguments_) {
  const result = {};
  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === '--help' || argument === '-h') result.help = true;
    else if (argument === '--config') result.configPath = arguments_[index += 1];
    else if (argument === '--output') result.outputDirectory = arguments_[index += 1];
    else throw new Error(`Unknown argument: ${argument}`);
  }
  return result;
}

function printHelp() {
  console.log('Usage: csv-cleanroom --config <rules.json> --output <directory>');
  console.log('Writes cleaned.csv, exceptions.csv, and summary.json without changing input files.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) printHelp();
    else {
      invariant(options.configPath, '--config is required');
      invariant(options.outputDirectory, '--output is required');
      const result = await runCleanroom(options);
      console.log(JSON.stringify(result.summary));
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
