import initWASM, { tokenize } from "../../wasm/pkg"
import { sentiment } from "./analyzers"
import { AnalysisReducer, SentimentAggregate } from "./analyzers/sentiment"
import { Manifest, runtime } from "webextension-polyfill"
import { Encoding, Token } from "../types/external"
import logger from "../logger"

export interface Aggregates {
  sentiment: SentimentAggregate
}

function getUrlFromManifest (specifier: string): string {
  const resources = (runtime.getManifest() as Manifest.WebExtensionManifest).web_accessible_resources as string[]

  return runtime.getURL(
    resources.find(file => file.includes(specifier)) || "NOTFOUND"
  )
}

async function getEncoding (str: string): Promise<Encoding> {
  const vocabText = await (await fetch(getUrlFromManifest("txt"))).text()
  const path = getUrlFromManifest("wasm")

  const encoding = await initWASM(path).then(() => {
    try {
      return tokenize(vocabText, str)
    } catch (e) {
      console.warn("Error during wasm:", e)
    }
  }) 

  return encoding as Encoding
}

function tokenizeEncoding (enc: Encoding): Token[] {
  return enc.ids.map((id, idx) => {
    return {
      text: enc.tokens[idx]
    }
  })
}

export async function analyzeStr (str: string): Promise<Aggregates> {
  const encoding = await getEncoding(str)

  const tokens = tokenizeEncoding(encoding)

  const rootAccumulator = new Map<AnalysisReducer<any>, any>()

  rootAccumulator.set(sentiment.reducer, {
    score: 0,
    negator: 1,
    nrHits: 0
  })

  tokens.reduce((rootAcc, token) => {
    rootAcc.forEach((acc, reducer) => {
      rootAcc.set(reducer, reducer(acc, token))
    })

    return rootAcc
  }, rootAccumulator)


  return {
    sentiment: sentiment.aggregator(rootAccumulator.get(sentiment.reducer), tokens)
  }
}