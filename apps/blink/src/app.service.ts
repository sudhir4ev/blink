import { Injectable } from '@nestjs/common';
import { GenAIService } from '@repo/genai';

@Injectable()
export class AppService {
  constructor(private genaiService: GenAIService) {}

  async execGenAIService() {
    const searchRecipeService =
      await this.genaiService.loadSearchRecipeService();
    return searchRecipeService.search({ query: 'Hello, world!' });
  }
}
