import { Module } from '@nestjs/common';
import { JanuService } from './janu.service';

@Module({
  providers: [JanuService],
  exports: [JanuService],
})
export class JanuModule {}
