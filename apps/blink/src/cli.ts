import { NestFactory } from '@nestjs/core';
import { CliAppModule } from './cli-app/cli-app.module';
import { Logger } from '@nestjs/common';

const logger = new Logger('CliAppModule');

async function bootstrap() {
  logger.log('Starting CLI application');
  await NestFactory.createApplicationContext(CliAppModule, { logger: false });
}

void bootstrap();
