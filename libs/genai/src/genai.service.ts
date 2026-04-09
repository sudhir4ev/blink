import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class GenAIService {
  private readonly logger = new Logger(GenAIService.name);

  generate(options: { prompt: string }) {
    this.logger.verbose(options);

    return {
      content: 'Generated text',
    };
  }
}

export type TGenAIService = GenAIService;
