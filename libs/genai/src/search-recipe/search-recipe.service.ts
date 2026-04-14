import { Injectable, Logger } from '@nestjs/common';
import { ChatOllama } from '@langchain/ollama';
import { RelationalStorage } from '@lib/storage';

@Injectable()
export class SearchRecipeService {
  private readonly logger = new Logger(SearchRecipeService.name);

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

  async seed() {
    /**
     * returns a generator function that yields a progress metadata object describing progress of the seed operation.
     * example: {
     *  current: number;
     *  total: number;
     *  status: string;
     *  message: string;
     *  error: string;
     * }
     */
  }
}
