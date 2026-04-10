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
}
