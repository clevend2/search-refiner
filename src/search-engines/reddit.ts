import engine from "./_shared/base"

const DOMAIN_PATTERN = /^https:\/\/[w.]*duckduckgo.com/gi

const RESULTS_CONTAINER_SELECTOR = ".results.js-results, .results.js-vertical-results"

const RESULT_SELECTOR = ".result:not(.result--more)"

const RESULT_ACTIONS_CONTAINER_SELECTOR = ".result__extras__url"

const RESULT_TITLE_SELECTOR = ".title"

const RESULT_LINK_SELECTOR = "a.title"

const RESULT_DESCRIPTION_SELECTOR = ".result__snippet"

function getUrl (el: HTMLElement): string {
  return el.querySelector(RESULT_LINK_SELECTOR)?.getAttribute("href") || ""
}

function getTitle (el: HTMLElement): string {
  return el.querySelector(RESULT_TITLE_SELECTOR)?.textContent || ""
}

function getDescription (el: HTMLElement): string {
  return el.querySelector(RESULT_DESCRIPTION_SELECTOR)?.textContent || ""
}

export const redditEngine = engine({
  resultBuilder(el) {
    return {
      url: getUrl(el),
      title: getTitle(el),
      description: getDescription(el),
      el
    }
  },
  selectors: {
    resultContainer: RESULTS_CONTAINER_SELECTOR,
    result: RESULT_SELECTOR,
    actionContainer: RESULT_ACTIONS_CONTAINER_SELECTOR
  },
  domainPattern: DOMAIN_PATTERN
})