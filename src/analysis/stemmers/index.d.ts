export interface Stemmer {
  stem(token: string): string;
  tokenizeAndStem(text: string): string[];
  attach(): void;
}

declare let PorterStemmer: Stemmer;
declare let LancasterStemmer: Stemmer;