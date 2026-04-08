import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SearchRecipeService {
  private readonly logger = new Logger(SearchRecipeService.name);

  query(options: { query: string }) {
    this.logger.verbose(options);

    return {
      recipes: [
        {
          name: 'Recipe 1',
          description: 'Description 1',
        },
      ],
    };
  }
}
