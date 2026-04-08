import { Module } from '@nestjs/common';
import { SearchRecipeService } from './search-recipe.service';

@Module({
  providers: [SearchRecipeService],
  exports: [SearchRecipeService],
})
export class JanuModule {}
