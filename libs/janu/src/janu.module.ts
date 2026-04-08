import { Module } from '@nestjs/common';
import { JanuService } from './search-recipe.service';

@Module({
  providers: [JanuService],
  exports: [JanuService],
})
export class JanuModule {}
