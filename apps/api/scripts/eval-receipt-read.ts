/**
 * Reads receipt photos with the same prompt and code as `POST /v1/receipts/read`, against the live
 * model, and prints what came back with its latency and cost. Not a test: it spends money and
 * needs `ANTHROPIC_API_KEY` in the environment.
 *
 *   pnpm --filter @6pm/api exec tsx scripts/eval-receipt-read.ts [--model claude-haiku-5-5] \
 *     [--hint SGD] [--language vi] a.jpeg b.jpeg
 *
 * Photos go as given, so shrink them first as the phone does (long side 1600 px):
 * `sips -Z 1600 in.jpeg --out out.jpeg`.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';

import { receiptReadRequestSchema } from '@6pm/domain';

import { anthropicModel, visionModels, type VisionModel } from '../src/ai/anthropic';
import { readReceipt } from '../src/ai/read-receipt';

/** US dollars per million tokens, input and output, for the models that may answer. */
const pricePerMillion: Record<string, readonly [number, number]> = {
  'claude-opus-5-5': [4, 20],
  'claude-opus-5': [5, 25],
  'claude-opus-4-8': [5, 25],
  'claude-haiku-5-5': [0.1, 0.5],
};

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    model: { type: 'string', default: anthropicModel },
    hint: { type: 'string' },
    language: { type: 'string', default: 'en' },
  },
});
if (!(values.model in visionModels)) {
  console.error(`--model is one of ${Object.keys(visionModels).join(', ')}`);
  process.exit(1);
}
const model = values.model as VisionModel;

const apiKey = process.env['ANTHROPIC_API_KEY'];
if (apiKey === undefined || apiKey === '') {
  console.error('Set ANTHROPIC_API_KEY to run the eval.');
  process.exit(1);
}
if (positionals.length === 0) {
  console.error('Pass one or more JPEG files.');
  process.exit(1);
}

const rows: Record<string, string | number>[] = [];
let totalCost = 0;
for (const file of positionals) {
  const name = path.basename(file);
  const request = receiptReadRequestSchema.safeParse({
    image: await readFile(file, 'base64'),
    language: values.language,
    currencyHint: values.hint ?? null,
  });
  if (!request.success) {
    rows.push({ file: name, error: request.error.issues.map((issue) => issue.message).join('; ') });
    continue;
  }
  const started = performance.now();
  try {
    const read = await readReceipt({ apiKey }, request.data, model);
    const [inPrice, outPrice] = pricePerMillion[read.model] ?? [Number.NaN, Number.NaN];
    const cost = (read.inputTokens * inPrice + read.outputTokens * outPrice) / 1_000_000;
    totalCost += cost;
    rows.push({
      file: name,
      amount: read.output?.amount ?? '-',
      currency: read.output?.currency ?? '-',
      merchant: read.output?.merchant ?? '-',
      at: read.output?.at ?? '-',
      sure: read.output === null ? '-' : String(read.output.sure),
      ms: Math.round(performance.now() - started),
      in: read.inputTokens,
      out: read.outputTokens,
      usd: cost.toFixed(4),
      model: read.model,
    });
  } catch (error) {
    rows.push({ file: name, error: error instanceof Error ? error.message : 'failed' });
  }
}
console.table(rows);
console.log(
  `${model}: total ${totalCost.toFixed(4)} USD, ${(totalCost / rows.length).toFixed(4)} per photo`,
);
