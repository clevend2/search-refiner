import logger from "../../logger"
import { DefaultResultAction, Domain, Engine, Result, ResultAction, ResultActionType, TagAction } from "../../types/search-refiner"

const PREFIX = "search-refiner"

const RESULT_CONTAINER_DATA_PROP = /** */`data-${PREFIX}-result-container`

const RESULT_DATA_PROP = /** */`data-${PREFIX}-result`

const RESULT_ACTIONS_CLASS = /** */`${PREFIX}-actions`

const RESULT_ACTION_CLASS = /** */`${PREFIX}-action`

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

type RawResult = Pick<Result, "url" | "title" | "description" | "el">

interface ResultBuilder {
  (el: HTMLElement): RawResult
}

interface EngineProps {
  resultBuilder: ResultBuilder,
  selectors: {
    resultContainer: string,
    result: string,
    actionContainer: string
  },
  domainPattern: RegExp
}

/** Result ID static counter -- increment when result is added (not persistent) */
let IDCounter = 0

function makeDomain (result: RawResult): Domain {
  const url = new URL(result.url)
  
  return {
    domain: url.hostname,
    blocked: false,
    note: "",
  }
}

function makeSlug (result: RawResult) {
  return `r-${result.title.substr(0, 8)}-${++IDCounter}`
}

function attachResultContainer (el: HTMLElement) {
  logger("attachResultContainer", el)
  el.setAttribute(RESULT_CONTAINER_DATA_PROP, "1")
}

function createActionsEl (window: Window): HTMLElement {
  const actionsEl = window.document.createElement('div')

  actionsEl.setAttribute('class', RESULT_ACTIONS_CLASS)

  return actionsEl as HTMLElement
}

function getActionsEl (result: Result): HTMLElement | null {
  return result.el.querySelector(`.${RESULT_ACTIONS_CLASS}`)
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

function detachResultContainer (el: HTMLElement) {
  logger("detachResultContainer", el)
  el.removeAttribute(RESULT_CONTAINER_DATA_PROP)
}


function getElementFromNode (node: Node): HTMLElement | null {
  return node.nodeType === Node.ELEMENT_NODE ? node as HTMLElement : null
}

export default (props: EngineProps): Engine => {
  function isResultContainer (el: HTMLElement): boolean {
    return el?.matches(props.selectors.resultContainer)
  }
  
  function isResult (el: HTMLElement): boolean {
    return el?.matches(props.selectors.result)
  }

  function getResultFromEl (el: HTMLElement): Result {
    const builtResult = props.resultBuilder(el)

    return {
      ...builtResult,
      domain: makeDomain(builtResult),
      slug: makeSlug(builtResult),
    }
  }

  function getActionContainer (result: Result): HTMLElement | null {
    return result.el.querySelector(props.selectors.actionContainer)
  }

  function attachResult(window: Window, result: Result): void {
    logger("attachResult", result)
    result.el.setAttribute(RESULT_DATA_PROP, result.slug)

    const actionsEl = getActionsEl(result)
  
    if (!actionsEl) {
      getActionContainer(result)?.appendChild(createActionsEl(window))
    }
  }
  
  function detachResult (result: Result) {
    logger("detachResult", result)
    result.el.removeAttribute(RESULT_DATA_PROP)
    getActionsEl(result)?.remove()
  }

  function getExistingResults(window: Window) {
    const resultContainers = window.document.querySelectorAll<HTMLElement>(props.selectors.resultContainer)
    
    resultContainers.forEach((resultContainer) => {
      const resultEls = Array.from<HTMLElement>(resultContainer.querySelectorAll(props.selectors.result))
  
      resultEls.map(getResultFromEl)
    })
  
    const results: HTMLElement[] = Array.from(window.document.querySelectorAll(`[${RESULT_DATA_PROP}]`))
    
    return results.map(getResultFromEl)
  }

  return {
    isInWindow(window) {
      return props.domainPattern.test(window.location.href)
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
    
      const existingResultContainers = window.document.querySelectorAll<HTMLElement>(props.selectors.resultContainer)
    
      const onResultAddedToContainer = (el: HTMLElement) => {
        const result = getResultFromEl(el)
        attachResult(window, result)
        onResult(result)
      }

      existingResultContainers.forEach((resultContainer) => {
        const elsAlreadyAddedToContainer = Array.from<HTMLElement>(resultContainer.querySelectorAll(props.selectors.result))
    
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

                  const elsAlreadyAddedToContainer = Array.from<HTMLElement>(el.querySelectorAll(props.selectors.result))
    
                  elsAlreadyAddedToContainer.map(onResultAddedToContainer)
                }
    
                if (isResult(el)) {
                  logger("isResult", el)
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

              if (isResult(el)) {
                const result = getResultFromEl(el)

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
        
        const actionsEl = getActionContainer(result)
        
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
}