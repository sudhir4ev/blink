import { Controller, Inject } from '@nestjs/common';
import { Command } from 'commander';
import cliProgress, { Presets } from 'cli-progress';
import { COMMANDER_PROGRAM, LOGGER } from '../contants';
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

  private readonly seedCommand = this.mainCommand
    .command('seed')
    .description('Seed search recipe')
    .action(() => this.seed());

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

  private async seed() {
    const searchRecipeService =
      await this.genaiService.loadSearchRecipeService();
    const stream = searchRecipeService.seed();
    const metadata = await stream.next();

    const progressBar = new cliProgress.SingleBar({}, Presets.shades_classic);

    progressBar.start(metadata.value.total ?? 0, 0);
    for await (const progress of stream) {
      progressBar.update(progress.inserted);
    }
  }
}
