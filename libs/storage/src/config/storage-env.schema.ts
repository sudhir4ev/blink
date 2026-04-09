/**
 * Required env for storage adapters (Postgres + Redis).
 * Align with docker-compose.yml defaults for local development.
 */
import { z } from 'zod';

export const storageEnvSchema = z.object({
  POSTGRES_HOST: z.string().min(1),
  POSTGRES_PORT: z.coerce.number().int().positive().default(5432),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_DATABASE: z.string().min(1),
  REDIS_HOST: z.string().min(1),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().int().min(0).default(0),
});

export type StorageEnv = z.infer<typeof storageEnvSchema>;

export const relationalStorageEnvSchema = storageEnvSchema.pick({
  POSTGRES_HOST: true,
  POSTGRES_PORT: true,
  POSTGRES_USER: true,
  POSTGRES_PASSWORD: true,
  POSTGRES_DATABASE: true,
});

export type RelationalStorageEnv = z.infer<typeof relationalStorageEnvSchema>;

export const documentStorageEnvSchema = storageEnvSchema.pick({
  REDIS_HOST: true,
  REDIS_PORT: true,
  REDIS_PASSWORD: true,
  REDIS_DB: true,
});

export type DocumentStorageEnv = z.infer<typeof documentStorageEnvSchema>;

export function getStorageEnv(): StorageEnv {
  return storageEnvSchema.parse(process.env);
}

export function getRelationalStorageEnv(): RelationalStorageEnv {
  return relationalStorageEnvSchema.parse(process.env);
}

export function getDocumentStorageEnv(): DocumentStorageEnv {
  return documentStorageEnvSchema.parse(process.env);
}
