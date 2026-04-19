import { existsSync, createReadStream } from 'node:fs';
import { parse } from 'fast-csv';
import { execSync } from 'node:child_process';
import { RelationalStorage } from '@lib/storage';

type LoggerLike = {
  error: (message: string) => void;
};

type SeedSearchRecipeOptions = {
  seedBatchSize: number;
  seedCsvPath: string;
};

export function seedSearchRecipe(
  relationalStorage: RelationalStorage,
  options: SeedSearchRecipeOptions,
  logger?: LoggerLike,
): AsyncGenerator<
  SeedProgressMetadata,
  { status: 'completed'; message: string; inserted: number; total: number },
  void
> {
  if (!existsSync(options.seedCsvPath)) {
    throw new Error(`CSV file not found at ${options.seedCsvPath}`);
  }

  return seedGenerator(
    relationalStorage,
    options.seedCsvPath,
    options.seedBatchSize,
    logger,
  );
}

async function* seedGenerator(
  relationalStorage: RelationalStorage,
  csvPath: string,
  seedBatchSize: number,
  logger?: LoggerLike,
): AsyncGenerator<
  SeedProgressMetadata,
  { status: 'completed'; message: string; inserted: number; total: number },
  void
> {
  const parser = parse({
    headers: true,
    trim: true,
    ignoreEmpty: true,
  });

  const numRows = execSync(`wc -l ${csvPath}`, { encoding: 'utf-8' });
  const total = numRows.split(' ').filter(Boolean)[0];

  const inputStream = createReadStream(csvPath).pipe(
    parser,
  ) as AsyncIterable<SearchRecipeCsvRow>;

  const batch: SearchRecipeSeedRow[] = [];
  let current = 0;
  let inserted = 0;
  let batches = 0;

  yield {
    total: Number(total),
    current: 0,
    status: 'waiting',
    message: 'Counting rows...',
    inserted: 0,
    batches: 0,
  };

  try {
    for await (const csvRow of inputStream) {
      current += 1;
      batch.push(mapCsvRow(csvRow));

      if (batch.length === seedBatchSize) {
        const insertedThisBatch = await insertBatch(relationalStorage, batch);
        inserted += insertedThisBatch;
        batches += 1;
        batch.length = 0;

        yield {
          current,
          status: 'in_progress',
          message: `Loaded ${inserted} rows so far`,
          inserted,
          batches,
        };
      }
    }

    if (batch.length > 0) {
      const insertedThisBatch = await insertBatch(relationalStorage, batch);
      inserted += insertedThisBatch;
      batches += 1;

      yield {
        current,
        status: 'in_progress',
        message: `Loaded ${inserted} rows so far`,
        inserted,
        batches,
      };
    }

    const message = `Seed complete. Loaded ${inserted} rows in ${batches} batches.`;
    yield {
      current,
      total: current,
      status: 'completed',
      message,
      inserted,
      batches,
    };
    return {
      status: 'completed',
      message,
      inserted,
      total: current,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger?.error(`Failed to seed search_recipe: ${message}`);
    yield {
      current,
      status: 'error',
      message: 'Failed to seed search_recipe',
      error: message,
      inserted,
      batches,
    };
    throw error;
  }
}

function mapCsvRow(csvRow: SearchRecipeCsvRow): SearchRecipeSeedRow {
  return {
    id: Number(csvRow.id),
    name: csvRow.name ?? '',
    description: csvRow.description ?? '',
    ingredients: csvRow.ingredients ?? '',
    ingredients_raw_str: csvRow.ingredients_raw_str ?? '',
    serving_size: parseLeadingInt(csvRow.serving_size),
    servings: parseLeadingInt(csvRow.servings),
    steps: csvRow.steps ?? '',
    tags: csvRow.tags ?? '',
    search_terms: csvRow.search_terms ?? '',
  };
}

function parseLeadingInt(value?: string): number | null {
  if (!value) {
    return null;
  }
  const match = value.match(/^-?\d+/);
  return match ? Number(match[0]) : null;
}

async function insertBatch(
  relationalStorage: RelationalStorage,
  batch: SearchRecipeSeedRow[],
): Promise<number> {
  const columns = [
    'id',
    'name',
    'description',
    'ingredients',
    'ingredients_raw_str',
    'serving_size',
    'servings',
    'steps',
    'tags',
    'search_terms',
  ] as const;

  const values: unknown[] = [];
  const placeholders = batch.map((row, rowIndex) => {
    const offset = rowIndex * columns.length;
    values.push(
      row.id,
      row.name,
      row.description,
      row.ingredients,
      row.ingredients_raw_str,
      row.serving_size,
      row.servings,
      row.steps,
      row.tags,
      row.search_terms,
    );

    const indexedPlaceholders = columns
      .map((_, columnIndex) => `$${offset + columnIndex + 1}`)
      .join(', ');
    return `(${indexedPlaceholders})`;
  });

  const updateClause = columns
    .filter((column) => column !== 'id')
    .map((column) => `${column} = EXCLUDED.${column}`)
    .join(', ');

  const sql = `
    INSERT INTO search_recipe (${columns.join(', ')})
    VALUES ${placeholders.join(', ')}
    ON CONFLICT (id) DO UPDATE SET ${updateClause}
  `;
  const result = await relationalStorage.query(sql, values);
  return result?.rowCount ?? batch.length;
}

type SearchRecipeCsvRow = {
  id: string;
  name: string;
  description: string;
  ingredients: string;
  ingredients_raw_str: string;
  serving_size: string;
  servings: string;
  steps: string;
  tags: string;
  search_terms: string;
};

type SearchRecipeSeedRow = {
  id: number;
  name: string;
  description: string;
  ingredients: string;
  ingredients_raw_str: string;
  serving_size: number | null;
  servings: number | null;
  steps: string;
  tags: string;
  search_terms: string;
};

export type SeedProgressMetadata = {
  current: number;
  total?: number;
  status: 'waiting' | 'in_progress' | 'completed' | 'error';
  message: string;
  error?: string;
  inserted: number;
  batches: number;
};
