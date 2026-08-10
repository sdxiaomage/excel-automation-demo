import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { parseCsv, runCleanroom, serializeCsv } from '../src/csv-cleanroom.mjs';

const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('CSV parser and serializer preserve commas, quotes, and embedded newlines', () => {
  const source = 'id,note\r\n1,"comma, quote ""and"" newline\nkept"\r\n';
  const parsed = parseCsv(source);
  assert.deepEqual(parsed.headers, ['id', 'note']);
  assert.equal(parsed.records[0].note, 'comma, quote "and" newline\nkept');
  assert.deepEqual(parseCsv(serializeCsv(parsed.headers, parsed.records)), parsed);
});

test('CSV output neutralizes formula-like text without changing negative numbers', () => {
  const output = parseCsv(serializeCsv(['value'], [
    { value: '=HYPERLINK("https://example.invalid")' },
    { value: '  @command' },
    { value: '-not-a-number' },
    { value: '-12.5' },
  ])).records;
  assert.deepEqual(output.map((row) => row.value), [
    "'=HYPERLINK(\"https://example.invalid\")",
    "'  @command",
    "'-not-a-number",
    '-12.5',
  ]);
});

test('sample inputs close into four cleaned and six exception rows', async () => {
  const outputDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'csv-cleanroom-sample-'));
  const result = await runCleanroom({
    configPath: path.join(projectDirectory, 'sample_config.json'),
    outputDirectory,
  });
  assert.deepEqual(result.summary, {
    inputRows: 10,
    cleanedRows: 4,
    exceptionRows: 6,
    duplicateRows: 1,
    reconciliationDifference: 0,
  });
  assert.equal(result.cleaned[0].customer_name, '华东零售');
  assert.equal(result.cleaned[1].order_date, '2026-01-04');
  assert.deepEqual(
    [...new Set(result.exceptions.map((record) => record.error_type))].sort(),
    ['Date', 'Duplicate', 'Lookup', 'Range', 'Required'],
  );
  const summary = JSON.parse(await fs.readFile(path.join(outputDirectory, 'summary.json'), 'utf8'));
  assert.deepEqual(summary, result.summary);
});

test('the documented 50,000-row boundary reconciles without exceptions', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'csv-cleanroom-50k-'));
  const inputPath = path.join(directory, 'input.csv');
  const configPath = path.join(directory, 'config.json');
  const lines = ['id,event_date,amount,status'];
  for (let index = 1; index <= 50_000; index += 1) {
    lines.push(`R-${index},2026-08-10,${index},paid`);
  }
  await fs.writeFile(inputPath, `${lines.join('\n')}\n`);
  await fs.writeFile(
    configPath,
    JSON.stringify({
      inputs: ['input.csv'],
      dedupe: { field: 'id' },
      required: ['id'],
      dates: [{ field: 'event_date' }],
      numbers: [{ field: 'amount', min: 0 }],
      enums: [{ field: 'status', values: { paid: 'Paid' } }],
    }),
  );
  const result = await runCleanroom({
    configPath,
    outputDirectory: path.join(directory, 'output'),
  });
  assert.equal(result.summary.inputRows, 50_000);
  assert.equal(result.summary.cleanedRows, 50_000);
  assert.equal(result.summary.exceptionRows, 0);
  assert.equal(result.summary.reconciliationDifference, 0);
});

test('output files cannot overwrite an input file', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'csv-cleanroom-collision-'));
  await fs.writeFile(path.join(directory, 'cleaned.csv'), 'id\n1\n');
  await fs.writeFile(
    path.join(directory, 'config.json'),
    JSON.stringify({ inputs: ['cleaned.csv'], dedupe: { field: 'id' } }),
  );
  await assert.rejects(
    runCleanroom({
      configPath: path.join(directory, 'config.json'),
      outputDirectory: directory,
    }),
    /Refusing to overwrite input\/config file/,
  );
});
