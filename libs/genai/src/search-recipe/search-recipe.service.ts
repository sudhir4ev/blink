import { Injectable, Logger } from '@nestjs/common';
import { ChatOllama } from '@langchain/ollama';
import { RelationalStorage } from '@lib/storage';
import { existsSync, createReadStream } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'fast-csv';
import { execSync } from 'node:child_process';

@Injectable()
export class SearchRecipeService {
  private readonly logger = new Logger(SearchRecipeService.name);
  private readonly seedBatchSize = 1000;
  private readonly seedCsvPath = resolve(
    process.cwd(),
    '.assets',
    'recipes_w_search_terms.csv',
  );

  constructor(private readonly relationalStorage: RelationalStorage) {}

  async query(options: { query: string }) {
    const llm = new ChatOllama({
      model: 'deepseek-r1:8b', // 'qwen3.5', 'deepseek-r1:8b', 'minimax-m2.5:cloud'
      temperature: 0,
      // Optional: add other parameters
      // topP: 0.9,
      // numPredict: 256,
    });

    const result = await llm.invoke(options.query);

    return result.content;
  }

  async init() {
    await this.relationalStorage.healthCheck();
    // import csv to search_recipe table
    await this.relationalStorage.query(`
      CREATE TABLE IF NOT EXISTS search_recipe (
        id INT PRIMARY KEY,
        name VARCHAR(255),
        description TEXT,
        ingredients TEXT,
        ingredients_raw_str TEXT,
        serving_size INTEGER,
        servings INTEGER,
        steps TEXT,
        tags TEXT,
        search_terms TEXT
      )
    `);
    this.logger.log('Search recipe table created');
  }

  seed(): AsyncGenerator<
    SeedProgressMetadata,
    { status: 'completed'; message: string; inserted: number; total: number },
    void
  > {
    const csvPath = this.seedCsvPath;
    if (!existsSync(csvPath)) {
      throw new Error(`CSV file not found at ${csvPath}`);
    }

    return this.seedGenerator(csvPath);
  }

  private async *seedGenerator(
    csvPath: string,
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
      message: `Counting rows...`,
      inserted: 0,
      batches: 0,
    };

    try {
      for await (const csvRow of inputStream) {
        current += 1;
        batch.push(this.mapCsvRow(csvRow));

        if (batch.length === this.seedBatchSize) {
          const insertedThisBatch = await this.insertBatch(batch);
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
        const insertedThisBatch = await this.insertBatch(batch);
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
      this.logger.error(`Failed to seed search_recipe: ${message}`);
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

  private mapCsvRow(csvRow: SearchRecipeCsvRow): SearchRecipeSeedRow {
    return {
      id: Number(csvRow.id),
      name: csvRow.name ?? '',
      description: csvRow.description ?? '',
      ingredients: csvRow.ingredients ?? '',
      ingredients_raw_str: csvRow.ingredients_raw_str ?? '',
      serving_size: this.parseLeadingInt(csvRow.serving_size),
      servings: this.parseLeadingInt(csvRow.servings),
      steps: csvRow.steps ?? '',
      tags: csvRow.tags ?? '',
      search_terms: csvRow.search_terms ?? '',
    };
  }

  private parseLeadingInt(value?: string): number | null {
    if (!value) {
      return null;
    }
    const match = value.match(/^-?\d+/);
    return match ? Number(match[0]) : null;
  }

  private async insertBatch(batch: SearchRecipeSeedRow[]): Promise<number> {
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
    const result = await this.relationalStorage.query(sql, values);
    return result.rowCount ?? batch.length;
  }
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
