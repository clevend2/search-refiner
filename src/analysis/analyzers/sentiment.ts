import * as patternSenimentVocab from '../English/pattern-sentiment-en.json'
import { words as negations } from '../English/negations_en.json'
import { PorterStemmer } from '../stemmers'
import { Token } from '../../types/external'

interface PatternWord {
  form: string,
  wordnet_id: string,
  pos: string,
  sense: string,
  polarity: number,
  subjectivity: number,
  intensity: number,
  confidence: number
}

export interface AnalysisReducer<Accumulator> {
  (acc: Accumulator, token: Token): Accumulator
}

export interface AnalysisAggregator<Accumulator, Aggregate> {
  (acc: Accumulator, tokens: Token[]): Aggregate
}

export interface SentimentAccumulator {
  score: number
  negator: 1 | -1
  nrHits: number
}

export interface SentimentAggregate {
  score: number
}

type PatternVocab = Record<string, PatternWord>

type PolarityVocab = Record<string, number>

const vocabPolarity: PolarityVocab = Object.fromEntries(Object.entries(patternSenimentVocab as unknown as PatternVocab).map(([word, info]) => ([word, info.polarity])))

const vocaStemmed: PolarityVocab = {}

for (const word in vocabPolarity) {
  vocaStemmed[PorterStemmer.stem(word)] = vocabPolarity[word]
}

/**
 * TODO: add weighting of score based on length of text (aka # of tokens) so short phrases are less rocked by particularly loaded words
 */
export const reducer: AnalysisReducer<SentimentAccumulator> = (acc, token) => {
  const text = token.text
  if (negations.indexOf(text) > -1) {
    acc.negator = -1
    acc.nrHits++
  } else {
    // First try without stemming
    if (vocaStemmed[text] !== undefined) {
      acc.score += acc.negator * vocaStemmed[text]
      acc.nrHits++
    } else {
      const stemmedWord = PorterStemmer.stem(text)
      if (vocaStemmed[stemmedWord] !== undefined) {
        acc.score += acc.negator * vocaStemmed[stemmedWord]
        acc.nrHits++
      }
    }
  }

  return acc
}

export const aggregator: AnalysisAggregator<SentimentAccumulator, SentimentAggregate> = (acc, tokens) => {
  console.log("Number of hits: " + acc.nrHits)
  return {
    score: acc.score / tokens.length
  }
}
