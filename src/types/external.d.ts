import { Storage as PolyFillStorage } from "webextension-polyfill"
export interface Stemmer {
  stem(token: string): string;
  tokenizeAndStem(text: string): string[];
  attach(): void;
}

export namespace Storage {
  type onChanged = PolyFillStorage.Static["onChanged"]

  interface StorageArea extends PolyFillStorage.StorageArea {
    getBytesInUse?(keys?: null | string | string[]): Promise<number>
  }
}  

declare class SentimentAnalyzer {
  constructor(stemmer: Stemmer);
  getSentiment(words: string[]): number;
}

declare enum RelationType {
  QUOTE,
  SENTENCE,
  COMPOUND
}

interface Relation {
  tokens: Token[],
  type: RelationType,
}

interface Token {
  text: string,
  relations?: Relation[]
  type?: string,
  severity?: number
}

interface Encoding {
  /// IDs produced by the `Tokenizer`
  ids: number[],
  /// Type of the IDs
  type_ids: number[],
  /// Tokens associated to each ID
  tokens: string[],
  /// Indice of the word associated to each token/ID
  words: (number | null)[],
  /// Offsets of the token/ID from the NormalizedString
  offsets: number[][],
  /// Mask identifying special tokens
  special_tokens_mask: number[],
  /// Mask identifying padding tokens for the attention mechanism
  attention_mask: number[]
}

