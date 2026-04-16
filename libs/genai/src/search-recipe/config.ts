export const RECIPE_FIELDS = {
  metadata: {
    id: 'id',
    serving_size: 'serving_size',
    servings: 'servings',
    tags: 'tags',
    ingredients: 'ingredients',
    ingredients_raw_str: 'ingredients_raw_str',
  },
  content: {
    name: 'name',
    steps: 'steps',
    description: 'description',
  },
} as const;

export type RecipeFields = (typeof RECIPE_FIELDS)[keyof typeof RECIPE_FIELDS];
export type RecipeMetadataFields =
  (typeof RECIPE_FIELDS.metadata)[keyof typeof RECIPE_FIELDS.metadata];
export type RecipeContentFields =
  (typeof RECIPE_FIELDS.content)[keyof typeof RECIPE_FIELDS.content];
