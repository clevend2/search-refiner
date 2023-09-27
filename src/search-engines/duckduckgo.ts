import logger from "../logger"
import { Destructor } from "../types/browser-adapters"
import { DefaultResultAction, Domain, Engine, Result, ResultAction, ResultActionType, ResultListener, TagAction } from "../types/search-refiner"



/**
 * result container watcher
 * - watches for any containers
 * - fires onFound
 * - fires onLost
 * 
 * results observer
 * - watches a given container
 * - has disconnect callback
 * 
 * 
 */

const DOMAIN_PATTERN = /^https:\/\/[w.]*duckduckgo.com/gi

const PREFIX = "search-refiner"

const RESULTS_CONTAINER_SELECTOR = `.results.js-results, .results.js-vertical-results`

const RESULT_SELECTOR = `.result:not(.result--more)`

const AD_SELECTOR = `.badge--ad`

const RESULT_ACTIONS_CONTAINER_SELECTOR = `.result__extras__url`

const RESULT_DOMAIN_ATTRIBUTE = "data-domain"

const RESULT_TITLE_SELECTOR = ".result__title > .result__a"

const RESULT_LINK_SELECTOR = ".result__title > .result__a"

const RESULT_DESCRIPTION_SELECTOR = ".result__snippet"

const RESULT_CONTAINER_DATA_PROP = `data-${PREFIX}-result-container`

const RESULT_DATA_PROP = `data-${PREFIX}-result`

const RESULT_ACTIONS_CLASS = `${PREFIX}-actions`

const RESULT_ACTION_CLASS = `${PREFIX}-action`

const TIMEOUT = 10000

const TEMPLATES: Record<ResultActionType, (action: any) => string> = {  
  [ResultActionType.DEFAULT]: (action: DefaultResultAction): string => /* html */`
    <span title="${action.props?.title}">${action.props?.text}</span>
  `,
  [ResultActionType.TAG]: (action: TagAction): string => /* html */`
    <span title="${action.props?.title}" style="color: white; background: ${action.props?.color};">${action.props?.text}</span>
  `
}

const CSS = /* css */`
  .${PREFIX}-actions {
    display: flex;
  }

  [class^="${PREFIX}-action"] {
    margin-right: 1em;
  }
`
/** Result ID static counter -- increment when result is added (not persistent) */
let IDCounter = 0

function getUrl (el: HTMLElement): string {
  return el.querySelector(RESULT_LINK_SELECTOR)?.getAttribute("href") || ""
}

function getDomain (el: HTMLElement): Domain {
  const url = new URL(getUrl(el))
  
  return {
    domain: url.hostname,
    blocked: false,
    note: "",
  }
}

function getTitle (el: HTMLElement): string {
  return el.querySelector(RESULT_TITLE_SELECTOR)?.textContent || ""
}

function getDescription (el: HTMLElement): string {
  return el.querySelector(RESULT_DESCRIPTION_SELECTOR)?.textContent || ""
}

function makeSlug (result: Partial<Result>) {
  return `r-${result?.domain?.domain}-${result?.title?.substr(0, 8)}-${++IDCounter}`
}

function buildResultFromEl(el: HTMLElement): Result {
  const tempResult = {
    url: getUrl(el),
    title: getTitle(el),
    description: getDescription(el),
    domain: getDomain(el),
    el
  }

  return {
    slug: makeSlug(tempResult),
    ...tempResult,
  }
}

function attachResultContainer (el: HTMLElement) {
  logger("attachResultContainer", el)
  el.setAttribute(RESULT_CONTAINER_DATA_PROP, "1")
}

function getActionsEl (result: Result): HTMLElement | null {
  return result.el.querySelector(`.${RESULT_ACTIONS_CLASS}`)
}

function createActionsEl (window: Window): HTMLElement {
  const actionsEl = window.document.createElement('div')

  actionsEl.setAttribute('class', RESULT_ACTIONS_CLASS)

  return actionsEl as HTMLElement
}

function getActionClass (action: ResultAction) {
  return `${RESULT_ACTION_CLASS}-${action.name}`
}

function getActionEl (result: Result, action: ResultAction): HTMLElement | null {
  const actionClass = getActionClass(action)

  return result.el.querySelector(`.${actionClass}`)
}

function createActionEl (window: Window, action: ResultAction): HTMLElement {
  const actionClass = getActionClass(action)
  const actionEl = window.document.createElement('div')

  actionEl.setAttribute('class', actionClass)

  actionEl.innerHTML = TEMPLATES[action.type] && TEMPLATES[action.type](action)

  return actionEl as HTMLElement
}

function attachResult(window: Window, result: Result): void {
  logger("attachResult", result)
  result.el.setAttribute(RESULT_DATA_PROP, result.slug)

  if (!getActionsEl(result)) {
    const actionsEl = createActionsEl(window)

    const urlEl = result.el.querySelector(RESULT_ACTIONS_CONTAINER_SELECTOR)
  
    if (urlEl) {
      urlEl.appendChild(actionsEl)
    } else {
      // error
    }
  }
}

function detachResult (result: Result) {
  logger("detachResult", result)
  result.el.removeAttribute(RESULT_DATA_PROP)
  getActionsEl(result)?.remove()
}

function detachResultContainer (el: HTMLElement) {
  logger("detachResultContainer", el)
  el.removeAttribute(RESULT_CONTAINER_DATA_PROP)
}

function isResultContainer (el: HTMLElement): boolean {
  return el?.matches(RESULTS_CONTAINER_SELECTOR)
}

function isResultEl (el: HTMLElement): boolean {
  return el?.matches(RESULT_SELECTOR)
}

function getElementFromNode (node: Node): HTMLElement | null {
  return node.nodeType === Node.ELEMENT_NODE ? node as HTMLElement : null
}

function getExistingResults(window: Window) {
  const resultContainers = window.document.querySelectorAll<HTMLElement>(RESULTS_CONTAINER_SELECTOR)
  
  resultContainers.forEach((resultContainer) => {
    const resultEls = Array.from<HTMLElement>(resultContainer.querySelectorAll(RESULT_SELECTOR))

    resultEls.map(buildResultFromEl)
  })

  const results: HTMLElement[] = Array.from(window.document.querySelectorAll(`[${RESULT_DATA_PROP}]`))
  
  return results.map(buildResultFromEl)
}

export const engine: Engine = {
  isInWindow(window) {
    return DOMAIN_PATTERN.test(window.location.href)
  },
  applyToExistingResults(window, onResult) {
    getExistingResults(window).map(onResult)
  },
  getCss() {
    return CSS
  },
  observeResults (window, onResult) {
    const documentObserverOptions: MutationObserverInit = {
      childList: true,
      subtree: true
    }
  
    const existingResultContainers = window.document.querySelectorAll<HTMLElement>(RESULTS_CONTAINER_SELECTOR)
  
    const onResultAddedToContainer = (el: HTMLElement) => {
      const result = buildResultFromEl(el)
      attachResult(window, result)
      onResult(result)
    }

    existingResultContainers.forEach((resultContainer) => {
      const elsAlreadyAddedToContainer = Array.from<HTMLElement>(resultContainer.querySelectorAll(RESULT_SELECTOR))
  
      elsAlreadyAddedToContainer.map(onResultAddedToContainer)
    })
  
    const documentObserver = new MutationObserver((mutations) => {
      logger("documentObserver", mutations)
      mutations.forEach(mutation => {
        if (mutation.addedNodes?.length) {
          mutation.addedNodes.forEach((node) => {
            const el = getElementFromNode(node)
            
            if (el) {
              if (isResultContainer(el)) {
                logger("isResultContainer", el)
                attachResultContainer(el)

                const elsAlreadyAddedToContainer = Array.from<HTMLElement>(el.querySelectorAll(RESULT_SELECTOR))
  
                elsAlreadyAddedToContainer.map(onResultAddedToContainer)
              }
  
              if (isResultEl(el)) {
                logger("isResultEl", el)
                onResultAddedToContainer(el)
              }
            }
          })
        }
  
        if (mutation.removedNodes?.length) {
          mutation.removedNodes.forEach((node) => {
            const el = node as HTMLElement
            
            if (isResultContainer(el)) {
              detachResultContainer(el)
            }

            if (isResultEl(el)) {
              const result = buildResultFromEl(el)

              detachResult(result)
            }
          })
        }
      })
    })
  
    documentObserver.observe(window.document, documentObserverOptions)
  
    return documentObserver
  },
  addResultAction(window: Window, result: Result, action: ResultAction) {
    logger("addResultAction", result, action)

    if (!getActionEl(result, action)) {
      const actionEl = createActionEl(window, action)

      actionEl.onclick = action.fn
      
      const actionsEl = getActionsEl(result)
      
      if (actionsEl) {
        actionsEl.appendChild(actionEl)
      } else {
        throw new Error("No actions container found in result, should have been added by now!")
      }
    }
  },
  async hideResult(result) {
    logger("hideResult", result)
    if (result.el.style.display !== "none") {
      if (result.el.style.display) {
        result.el.dataset[`${PREFIX}-original-display`] = result.el.style.display
      }
      result.el.style.display = "none"
    }
  },
  async showResult(result) {
    logger("showResult", result)
    if (result.el.style.display === "none") {
      result.el.style.display = result.el.dataset[`${PREFIX}-original-display`] || "block"
    }
  }
}