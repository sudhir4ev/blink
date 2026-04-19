type RelationalStorageLike = {
  healthCheck: () => Promise<unknown>;
  query: (sql: string, values?: unknown[]) => Promise<unknown>;
};

export async function initSearchRecipe(
  relationalStorage: RelationalStorageLike,
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
  console.log('Search recipe table created');
}

export const initSearchRecipeGoldTable = async (
  relationalStorage: RelationalStorageLike,
) => {
  await relationalStorage.query(`
    DROP SCHEMA IF EXISTS gold CASCADE;`);
  await relationalStorage.query(`
    CREATE SCHEMA IF NOT EXISTS gold;`);

  await relationalStorage.query(`
    DROP TABLE IF EXISTS gold.search_recipe CASCADE;`);

  await relationalStorage.query(`
    CREATE TABLE IF NOT EXISTS gold.search_recipe (
      id INT PRIMARY KEY,
      name VARCHAR(255),
      description TEXT,
      ingredients TEXT[],
      ingredients_raw_str TEXT[],
      serving_size INTEGER,
      servings INTEGER,
      steps TEXT,
      tags TEXT[],
      search_terms TEXT[]
    )
  `);
  console.log('Search recipe gold table created');
};
