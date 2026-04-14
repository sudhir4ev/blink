import { Module } from '@nestjs/common';
import { SearchRecipeService } from './search-recipe.service';
import { StorageModule } from '@lib/storage';

@Module({
  imports: [StorageModule],
  providers: [SearchRecipeService],
  exports: [SearchRecipeService],
})
export class SearchRecipeModule {}
