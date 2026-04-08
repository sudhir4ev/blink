import { Inject, Injectable } from '@nestjs/common';
import type { DocumentStorageAdapter } from './adapters/types';
import { getDocumentStorageEnv } from './config/storage-env.schema';
import type { StorageHealthCheckResult } from './storage-health.types';
import { DOCUMENT_STORAGE_ADAPTER } from './storage.tokens';

@Injectable()
export class DocumentStorage {
  constructor(
    @Inject(DOCUMENT_STORAGE_ADAPTER)
    private readonly adapter: DocumentStorageAdapter,
  ) {}

  get(key: string): Promise<string | null> {
    return this.adapter.get(key);
  }

  set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    return this.adapter.set(key, value, ttlSeconds);
  }

  delete(key: string): Promise<void> {
    return this.adapter.delete(key);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.adapter.get(key);
    if (raw === null) {
      return null;
    }
    return JSON.parse(raw) as T;
  }

  async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.adapter.set(key, JSON.stringify(value), ttlSeconds);
  }

  async healthCheck(): Promise<StorageHealthCheckResult> {
    let configError: string | undefined;
    try {
      getDocumentStorageEnv();
    } catch (err) {
      configError = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        config: { ok: false, error: configError },
        reachable: { ok: false },
      };
    }

    try {
      await this.adapter.ping();
      return {
        ok: true,
        config: { ok: true },
        reachable: { ok: true },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        config: { ok: true },
        reachable: { ok: false, error: message },
      };
    }
  }
}
