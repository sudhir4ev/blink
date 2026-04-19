import { Injectable, Logger } from '@nestjs/common';
import { Annotation, StateGraph } from '@langchain/langgraph';
import { z } from 'zod';
import { RelationalStorage } from '@lib/storage';
import { resolve } from 'node:path';
import {
  initSearchRecipe,
  initSearchRecipeGoldTable,
} from './search-recipe-init';
import { seedSearchRecipe, SeedProgressMetadata } from './search-recipe-seed';
import { MetadataFilter, parseQuery } from './search-recipe-query-parse';
import { getLLM } from './getLLM';
import { sqlTool } from './sqlTool';

const SEED_BATCH_SIZE = 2000;
const SEED_CSV_PATH = resolve(
  process.cwd(),
  '.assets',
  'recipes_w_search_terms.csv',
);
const SEARCH_RECIPE_COLUMNS = [
  'name: Text',
  'description: Text',
  'ingredients_list: Array of strings. cast to text[] in WHERE clause to find matching ingredients.',
  // 'serving_size: Number',
] as const;

const SQL_QUERY_SCHEMA = z.object({
  sql: z.string(),
});

const QUERY_GRAPH_ANNOTATION = Annotation.Root({
  query: Annotation<string>,
  metadata: Annotation<MetadataFilter>,
  sql: Annotation<string>,
  rows: Annotation<Record<string, unknown>[]>,
});

const SQL_QUERY_PROMPT = (params: {
  query: string;
  metadata: MetadataFilter;
}) => `
You are generating PostgreSQL SQL for the "search_recipe" table.

Allowed table:
- 'gold.search_recipe'

Allowed columns:
- ${SEARCH_RECIPE_COLUMNS.join('\n- ')}

Requirements:
- Use only SELECT or WITH queries.
- Never write mutating SQL (INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, CREATE).
- Use only the allowed columns listed above.
- Ignore any metadata fields that are not present in allowed columns.
- If filters exist in metadata, prefer applying them in WHERE clauses.
- Keep result size reasonable with LIMIT 25 unless user asks for more.
- Return SQL query as a string in a JSON object with one key: "sql".

User query:
${params.query}

Parsed metadata (JSON):
${JSON.stringify(params.metadata)}
`;

@Injectable()
export class SearchRecipeService {
  private readonly logger = new Logger(SearchRecipeService.name);

  constructor(private readonly relationalStorage: RelationalStorage) {}

  async query(options: { query: string }) {
    const queryGraph = this.buildQueryGraph();
    const graphOutput = await queryGraph.invoke({
      query: options.query,
    });

    return graphOutput.rows ?? [];
  }

  async init() {
    await initSearchRecipe(this.relationalStorage);
    await initSearchRecipeGoldTable(this.relationalStorage);
  }

  seed(): AsyncGenerator<
    SeedProgressMetadata,
    { status: 'completed'; message: string; inserted: number; total: number },
    void
  > {
    return seedSearchRecipe(
      this.relationalStorage,
      {
        seedBatchSize: SEED_BATCH_SIZE,
        seedCsvPath: SEED_CSV_PATH,
      },
      this.logger,
    );
  }

  private buildQueryGraph() {
    const parseMetadataNode = async (
      state: typeof QUERY_GRAPH_ANNOTATION.State,
    ) => {
      const { metadata } = await parseQuery(state.query, {
        llm: getLLM('QUERY_PARSE'),
      });
      console.log('Parsed metadata:', JSON.stringify(metadata, null, 2));
      return { metadata };
    };

    const generateSqlNode = async (
      state: typeof QUERY_GRAPH_ANNOTATION.State,
    ) => {
      const prompt = SQL_QUERY_PROMPT({
        query: state.query,
        metadata: state.metadata ?? {},
      });

      const llmResponse = await getLLM('SQL_QUERY')
        .withStructuredOutput(SQL_QUERY_SCHEMA)
        .invoke(prompt);

      const validatedSqlQuery = SQL_QUERY_SCHEMA.safeParse(llmResponse);
      if (!validatedSqlQuery.success) {
        throw new Error(
          `Generated SQL validation failed: ${validatedSqlQuery.error.message}`,
        );
      }

      console.log('Generated SQL_QUERY:\n', validatedSqlQuery.data.sql, '\n');
      return { sql: validatedSqlQuery.data.sql };
    };

    const executeSqlNode = async (
      state: typeof QUERY_GRAPH_ANNOTATION.State,
    ) => {
      if (!state.sql) {
        throw new Error('SQL generation failed: empty SQL query.');
      }

      const rows = await sqlTool(this.relationalStorage, state.sql);
      return { rows };
    };

    return new StateGraph(QUERY_GRAPH_ANNOTATION)
      .addNode('parse_metadata', parseMetadataNode)
      .addNode('generate_sql', generateSqlNode)
      .addNode('execute_sql', executeSqlNode)
      .addEdge('__start__', 'parse_metadata')
      .addEdge('parse_metadata', 'generate_sql')
      .addEdge('generate_sql', 'execute_sql')
      .addEdge('execute_sql', '__end__')
      .compile();
  }
}
