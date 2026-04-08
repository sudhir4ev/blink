import { Module } from '@nestjs/common';
import { SearchRecipeService } from '@lib/janu';
import { StorageModule } from '@lib/storage';

@Module({
  imports: [StorageModule],
  providers: [SearchRecipeService],
  exports: [SearchRecipeService],
})
export class JanuModule {}
