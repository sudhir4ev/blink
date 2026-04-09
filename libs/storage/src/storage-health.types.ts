export type StorageHealthCheckResult = {
  ok: boolean;
  config: { ok: boolean; error?: string };
  reachable: { ok: boolean; error?: string };
};
