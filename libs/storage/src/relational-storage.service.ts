import { Inject, Injectable } from '@nestjs/common';
import type { PoolClient, QueryResult, QueryResultRow } from 'pg';
import type { RelationalStorageAdapter } from './adapters/types';
import { getRelationalStorageEnv } from './config/storage-env.schema';
import type { StorageHealthCheckResult } from './storage-health.types';
import { RELATIONAL_STORAGE_ADAPTER } from './storage.tokens';

@Injectable()
export class RelationalStorage {
  constructor(
    @Inject(RELATIONAL_STORAGE_ADAPTER)
    private readonly adapter: RelationalStorageAdapter,
  ) {}

  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    return this.adapter.query<T>(text, params);
  }

  execute(text: string, params?: unknown[]): Promise<number> {
    return this.adapter.execute(text, params);
  }

  transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    return this.adapter.transaction(fn);
  }

  async healthCheck(): Promise<StorageHealthCheckResult> {
    let configError: string | undefined;
    try {
      getRelationalStorageEnv();
    } catch (err) {
      configError = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        config: { ok: false, error: configError },
        reachable: { ok: false },
      };
    }

    try {
      await this.query('SELECT 1');
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
