import type { PoolClient, QueryResult, QueryResultRow } from 'pg';

export interface RelationalStorageAdapter {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<T>>;
  execute(text: string, params?: unknown[]): Promise<number>;
  transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

export interface DocumentStorageAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  ping(): Promise<void>;
  close(): Promise<void>;
}
