import { Module } from '@nestjs/common';
import { DocumentStorage } from './document-storage.service';
import { RelationalStorage } from './relational-storage.service';
import { PostgresRelationalAdapter } from './adapters/postgres.relational.adapter';
import { RedisDocumentAdapter } from './adapters/redis.document.adapter';
import {
  DOCUMENT_STORAGE_ADAPTER,
  RELATIONAL_STORAGE_ADAPTER,
} from './storage.tokens';

@Module({
  providers: [
    PostgresRelationalAdapter,
    RedisDocumentAdapter,
    {
      provide: RELATIONAL_STORAGE_ADAPTER,
      useExisting: PostgresRelationalAdapter,
    },
    {
      provide: DOCUMENT_STORAGE_ADAPTER,
      useExisting: RedisDocumentAdapter,
    },
    RelationalStorage,
    DocumentStorage,
  ],
  exports: [RelationalStorage, DocumentStorage],
})
export class StorageModule {}
