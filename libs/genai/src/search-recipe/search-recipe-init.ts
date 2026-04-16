type RelationalStorageLike = {
  healthCheck: () => Promise<unknown>;
  query: (sql: string, values?: unknown[]) => Promise<unknown>;
};

type LoggerLike = {
  log: (message: string) => void;
};

export async function initSearchRecipe(
  relationalStorage: RelationalStorageLike,
  logger?: LoggerLike,
) {
  await relationalStorage.healthCheck();
  await relationalStorage.query(`
    CREATE TABLE IF NOT EXISTS search_recipe (
      id INT PRIMARY KEY,
      name VARCHAR(255),
      description TEXT,
      ingredients TEXT,
      ingredients_raw_str TEXT,
      serving_size INTEGER,
      servings INTEGER,
      steps TEXT,
      tags TEXT,
      search_terms TEXT
    )
  `);
  logger?.log('Search recipe table created');
}
