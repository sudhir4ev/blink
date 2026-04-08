import { Inject, Module, OnApplicationBootstrap } from '@nestjs/common';
import { Command } from 'commander';
import { COMMANDER_PROGRAM } from './contants';
import { CliService } from './cli.service';
import { ConfigModule } from '@nestjs/config';
import { JanuModule } from '@lib/janu';

@Module({
  imports: [ConfigModule.forRoot(), JanuModule],
  providers: [
    {
      provide: COMMANDER_PROGRAM,
      useValue: new Command('blink-cli').usage('<command> [<args>]'),
    },
    CliService,
  ],
  controllers: [],
})
export class CliModule implements OnApplicationBootstrap {
  constructor(@Inject(COMMANDER_PROGRAM) private readonly program: Command) {}

  onApplicationBootstrap() {
    this.program
      .command('test')
      .description('Test LLMs behavior')
      .action(() => {
        console.log('test');
      });
    this.program.parse(process.argv);
  }
}
