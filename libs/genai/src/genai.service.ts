import { Injectable, Logger } from '@nestjs/common';
import { LazyModuleLoader } from '@nestjs/core';

@Injectable()
export class GenAIService {
  private readonly logger = new Logger(GenAIService.name);

  constructor(private lazyModuleLoader: LazyModuleLoader) {}

  generate(options: { prompt: string }) {
    this.logger.verbose(options);

    return {
      content: 'Generated text',
    };
  }

  async loadSearchRecipeService() {
    const { SearchRecipeModule } =
      await import('../search-recipe/search-recipe.module.ts');
    const { SearchRecipeService } =
      await import('../search-recipe/search-recipe.service.ts');

    const moduleRef = await this.lazyModuleLoader.load(
      () => SearchRecipeModule,
    );
    const searchRecipeService = moduleRef.get(SearchRecipeService);

    return searchRecipeService;
  }
}

export type TGenAIService = GenAIService;
