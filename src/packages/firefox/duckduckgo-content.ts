import { connect, getStorage, getWindow } from "../../browser-adapters/firefox/firefox-adapter-content"
import logger from "../../logger"
import * as searchRefiner from "../../search-refiner/search-refiner-content"
import { engine } from "../../search-engines/duckduckgo"
import { Aggregates, analyzeStr } from "../../analysis/analysis"
import { Result, ResultActionState, ResultActionType, TagProps } from "../../types/search-refiner"

let detachEngine: () => void

let onDOMLoaded: () => void
let onPopState: () => void
let onBeforeUnload: () => void

searchRefiner.connectToBackground(connect, engine,
  () => {
    logger("onEnabled", engine)

    const window = getWindow()

    const onResult = async (result: Result) => {
      logger("onResult", result)
    
      if (await searchRefiner.resultHasDomain(getStorage, result)) {
        engine.hideResult(result)
      } else {
        engine.showResult(result)
        
        engine.addResultAction(window, result, {
          name: 'block',
          type: ResultActionType.DEFAULT,
          props: {
            text: "X Block",
            title: "Block this domain"
          },
          fn: (e) => {
            e.preventDefault()
            e.stopPropagation()
            
            searchRefiner.blockDomain(getStorage, result.domain.domain)
          }
        })

        const makeSentimentBadge = (aggregates: Aggregates, title: string, text: string, hue = 0) => {
          const sat = `${100 * Math.abs(aggregates.sentiment.score)}%`
        
          const light = "50%"

          return {
            text,
            title: `${title} (${aggregates.sentiment.score})`,
            color: `hsl(${hue}, ${sat}, ${light})`
          }
        }
    
        const sentimentStates: ResultActionState<TagProps>[] = [
          {
            match(aggregates) {
              return aggregates.sentiment.score > 0.15
            },
            props(aggregates) {
              return makeSentimentBadge(aggregates, "Positive", "😀")
            }
          },
          {
            match(aggregates) {
              return aggregates.sentiment.score <= 0.15 && aggregates.sentiment.score > 0.05
            },
            props(aggregates) {
              return makeSentimentBadge(aggregates, "Somewhat Positive", "🙂")
            }
          },
          {
            match(aggregates) {
              return aggregates.sentiment.score <= 0.05 && aggregates.sentiment.score > -0.05
            },
            props(aggregates) {    
              return makeSentimentBadge(aggregates, "Neutral", "😐")

            }
          },
          {
            match(aggregates) {
              return aggregates.sentiment.score <= -0.05 && aggregates.sentiment.score >= -0.15
            },
            props(aggregates) {   
              return makeSentimentBadge(aggregates, "Somewhat Negative", "🙁")
            }
          },
          {
            match(aggregates) {
              return aggregates.sentiment.score < -0.15
            },
            props(aggregates) {   
              return makeSentimentBadge(aggregates, "Negative", "😡")
            }
          }
        ]

        const analyses = await Promise.all([
          analyzeStr(result.title),
          analyzeStr(result.description)
        ])

        const aggregates = analyses.reduce((outlier, aggregate) => {
          if (!outlier?.sentiment || Math.abs(outlier?.sentiment.score) < Math.abs(aggregate.sentiment.score)) {
            return aggregate
          }

          return outlier
        })
    
        logger("analyzeStr", result, analyses)
    
        engine.addResultAction(window, result, {
          name: 'sentiment',
          type: ResultActionType.TAG,
          props: sentimentStates.find((ras) => ras.match(aggregates))?.props(aggregates) || {
            text: "?",
            title: "Unknown (?)",
            color: "#000"
          },
          fn: (e) => {
            e.preventDefault()
            e.stopPropagation()
          }
        })
      }
    }

    detachEngine && detachEngine()
    detachEngine = searchRefiner.attachEngine(getWindow, getStorage, engine, onResult)

    onDOMLoaded = () => {
      console.log('onDOMLoaded')
      detachEngine && detachEngine()
      detachEngine = searchRefiner.attachEngine(getWindow, getStorage, engine, onResult)
    }

    onBeforeUnload = () => {
      console.log('onBeforeUnload')
      detachEngine && detachEngine()
    }

    onPopState = () => {
      console.log('onPopState')
      detachEngine && detachEngine()
      detachEngine = searchRefiner.attachEngine(getWindow, getStorage, engine, onResult)
    }

    window.addEventListener("DOMContentLoaded", onDOMLoaded)

    window.onbeforeunload = onBeforeUnload

    window.onpopstate = onPopState
  },
  () => {
    logger("onDisabled", detachEngine)
    
    const window = getWindow()

    window.removeEventListener("DOMContentLoaded", onDOMLoaded)

    window.onbeforeunload = null

    window.onpopstate = null

    detachEngine && detachEngine()
  },
)