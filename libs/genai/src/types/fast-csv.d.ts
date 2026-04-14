declare module 'fast-csv' {
  export type ParseOptions = {
    headers?: boolean;
    trim?: boolean;
    ignoreEmpty?: boolean;
  };

  export function parse<I, O = I>(
    options?: ParseOptions,
  ): NodeJS.ReadWriteStream & AsyncIterable<O>;
}
