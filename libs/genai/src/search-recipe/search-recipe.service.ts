import { Injectable, Logger } from '@nestjs/common';
import { RelationalStorage } from '@lib/storage';
import { resolve } from 'node:path';
import { initSearchRecipe } from './search-recipe-init';
import { seedSearchRecipe, SeedProgressMetadata } from './search-recipe-seed';
import { parseQuery } from './search-recipe-query-parse';
import { getLLM } from './getLLM';

const SEED_BATCH_SIZE = 1000;
const SEED_CSV_PATH = resolve(
  process.cwd(),
  '.assets',
  'recipes_w_search_terms.csv',
);

@Injectable()
export class SearchRecipeService {
  private readonly logger = new Logger(SearchRecipeService.name);

  constructor(private readonly relationalStorage: RelationalStorage) {}

  async query(options: { query: string }) {
    const { metadata } = await parseQuery(options.query, {
      llm: getLLM('QUERY_PARSE'),
    });

    // 2. Construct SQL query based on metadata

    // 3. Execute SQL query

    return "''";
  }

  async init() {
    await runSearchRecipeInit(this.relationalStorage, this.logger);
  }

  seed(): AsyncGenerator<
    SeedProgressMetadata,
    { status: 'completed'; message: string; inserted: number; total: number },
    void
  > {
    return runSearchRecipeSeed(
      this.relationalStorage,
      {
        seedBatchSize: SEED_BATCH_SIZE,
        seedCsvPath: SEED_CSV_PATH,
      },
      this.logger,
    );
  }
}

const runSearchRecipeInit = initSearchRecipe as (
  relationalStorage: RelationalStorage,
  logger?: { log: (message: string) => void },
) => Promise<void>;

const runSearchRecipeSeed = seedSearchRecipe as (
  relationalStorage: RelationalStorage,
  options: { seedBatchSize: number; seedCsvPath: string },
  logger?: { error: (message: string) => void },
) => AsyncGenerator<
  SeedProgressMetadata,
  { status: 'completed'; message: string; inserted: number; total: number },
  void
>;
