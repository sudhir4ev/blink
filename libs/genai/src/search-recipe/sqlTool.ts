type RelationalStorageLike = {
  query: (
    text: string,
    params?: unknown[],
  ) => Promise<{ rows: Record<string, unknown>[] }>;
};

const FORBIDDEN_SQL_KEYWORDS = [
  'insert',
  'update',
  'delete',
  'drop',
  'alter',
  'truncate',
  'create',
  'grant',
  'revoke',
  'comment',
] as const;

function normalizeSql(sql: string): string {
  return sql
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim();
}

function assertReadOnlySql(sql: string): void {
  const normalizedSql = normalizeSql(sql);
  if (!normalizedSql) {
    throw new Error('SQL query cannot be empty.');
  }

  if (!/^(select|with)\b/i.test(normalizedSql)) {
    throw new Error('Only read-only SQL queries (SELECT/WITH) are allowed.');
  }

  const multipleStatementsPattern = /;[\s\S]*\S/;
  if (multipleStatementsPattern.test(normalizedSql)) {
    throw new Error('Only a single SQL statement is allowed.');
  }

  const forbiddenPattern = new RegExp(
    `\\b(${FORBIDDEN_SQL_KEYWORDS.join('|')})\\b`,
    'i',
  );
  if (forbiddenPattern.test(normalizedSql)) {
    throw new Error('Unsafe SQL detected: mutating SQL is not allowed.');
  }
}

export async function sqlTool(
  relationalStorage: RelationalStorageLike,
  sqlQuery: string,
): Promise<Record<string, unknown>[]> {
  assertReadOnlySql(sqlQuery);
  const result = await relationalStorage.query(sqlQuery);
  return result.rows;
}
