/**
 * Find what user is asking about from the query.
 * Extract
 * 1. metadata filters.
 * 2. semantic query
 *
 */

import { ChatOllama } from '@langchain/ollama';
import { z } from 'zod';

const QUERY_PARSE_PROMPT = (query: string) => `
You are a interpreter of questions regarding a recipe book. 
You are to analyse the query string and extract metadata from the query.   

Here is the list of all available metadata types: 
------ 
1. ingredients: find all ingredients listed in the question 
2. serving_size: count any people or kids mentioned in the question. add them up to a single head count, representing number of servings required to feed the adults and kids 
------

Here is the question: 
------
${query}
------

Return response in JSON string only, no additional details or explanations.

JSON format: 
{ 
  "ingredients": ..., 
  "serving_size": ...
}
`;

const metadataSchema = z
  .object({
    ingredients: z.array(z.string().trim().min(1)).optional(),
    serving_size: z.number().int().positive().optional(),
  })
  .strict();

export type MetadataFilter = z.infer<typeof metadataSchema>;

export async function parseQuery(query: string, options: { llm: ChatOllama }) {
  const { llm } = options;
  console.log(query);

  // return Promise.resolve({
  //   metadataFilters: [] as MetadataFilter[],
  //   semanticQuery: query,
  // });

  const prompt = QUERY_PARSE_PROMPT(query);
  const llmResponse = await llm
    .withStructuredOutput(metadataSchema)
    .invoke(prompt);

  const validatedParsedQuery = metadataSchema.safeParse(llmResponse);

  if (!validatedParsedQuery.success) {
    console.warn(
      `Query parse validation failed: ${validatedParsedQuery.error.message}`,
    );
    throw new Error(
      `Query parse validation failed: ${validatedParsedQuery.error.message}`,
    );
  }

  return {
    metadata: {
      ingredients: validatedParsedQuery.data.ingredients,
    },
  };
}
