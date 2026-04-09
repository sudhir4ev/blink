import { Injectable } from '@nestjs/common';
import { LazyModuleLoader } from '@nestjs/core';

@Injectable()
export class AppService {
  constructor(private lazyModuleLoader: LazyModuleLoader) {}

  getHello(): string {
    return 'Hello World!';
  }

  async execGenAIService() {
    const { GenAIModule } = await import('@repo/genai/genai.module.ts');
    const { GenAIService } = await import('@repo/genai/genai.service.ts');

    const moduleRef = await this.lazyModuleLoader.load(() => GenAIModule);
    const genaiService = moduleRef.get(GenAIService);

    return genaiService.generate({ prompt: 'Hello, world!' });
  }
}
