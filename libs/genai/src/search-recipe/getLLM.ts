import { ChatOllama } from '@langchain/ollama';

const LLM_MODELS = {
  QUERY_ENCODING: 'deepseek-r1:8b',
  QUERY_PARSE: 'llama3:8b',
  SQL_QUERY: 'llama3:8b',
} as const;

export const getLLM = (model: keyof typeof LLM_MODELS): ChatOllama => {
  const llm = new ChatOllama({
    model: LLM_MODELS[model],
    temperature: 0,
  });

  console.log(`Using ${model} LLM: ${LLM_MODELS[model]}`);
  return llm;
};
