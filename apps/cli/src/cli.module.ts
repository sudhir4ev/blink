import { Inject, Module, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Command } from 'commander';
import { COMMANDER_PROGRAM, LOGGER } from './contants';
import { CliService } from './cli.service';
import { JanuModule } from '@lib/janu';
import { SearchRecipeController } from './search-recipe/search-recipe.controller';
import { StorageModule } from '@lib/storage';
import { GenAIModule } from '@repo/genai';

@Module({
  imports: [ConfigModule.forRoot(), JanuModule, GenAIModule, StorageModule],
  providers: [
    {
      provide: LOGGER,
      useValue: console,
    },
    {
      provide: COMMANDER_PROGRAM,
      useValue: new Command('blink-cli').usage('<command> [<args>]'),
    },
    CliService,
  ],
  controllers: [SearchRecipeController],
})
export class CliModule implements OnApplicationBootstrap {
  constructor(@Inject(COMMANDER_PROGRAM) private readonly program: Command) {}

  onApplicationBootstrap() {
    this.program.parse(process.argv);
  }
}
