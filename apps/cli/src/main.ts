import { NestFactory } from '@nestjs/core';
import { CliModule } from './cli.module';
import { Logger } from '@nestjs/common';

const logger = new Logger('CliAppModule');
async function bootstrap() {
  logger.log('Starting CLI application');
  await NestFactory.createApplicationContext(CliModule, { logger: false });
}

void bootstrap();
