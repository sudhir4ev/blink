import { Controller, Inject } from '@nestjs/common';
import { Command } from 'commander';
import { COMMANDER_PROGRAM, LOGGER } from '../contants';
import { SearchRecipeService } from '@repo/genai/search-recipe/search-recipe.service';
import { GenAIService } from '@repo/genai';

@Controller('search-recipe')
export class SearchRecipeController {
  private readonly mainCommand = this.program
    .command('search-recipe')
    .description('Manage used / installed generator version');

  private readonly initCommand = this.mainCommand
    .command('init')
    .description('Initialize search recipe')
    .action(() => this.init());

  // private readonly seedCommand = this.mainCommand
  //   .command('seed')
  //   .description('Seed search recipe')
  //   .action(() => this.seed());

  constructor(
    @Inject(COMMANDER_PROGRAM) private readonly program: Command,
    @Inject(LOGGER) private readonly logger: LOGGER,
    private readonly genaiService: GenAIService,
  ) {}

  private async init() {
    const searchRecipeService =
      await this.genaiService.loadSearchRecipeService();
    this.logger.log('Initializing search recipe');
    await searchRecipeService.init();
  }

  // private async seed() {
  //   const searchRecipeService =
  //     await this.genaiService.loadSearchRecipeService();
  //   await searchRecipeService.seed();
  // }
}
