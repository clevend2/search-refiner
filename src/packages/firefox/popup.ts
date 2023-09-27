import { getStorage } from "../../browser-adapters/firefox/firefox-adapter-background"
import { Storage } from "webextension-polyfill"
import { STORAGE_DOMAINS } from "../../constants"
import { DomainsModel } from "../../models/domains"
import { Domain } from "../../types/search-refiner"

const domainsContainer = window.document.querySelector<HTMLElement>(".domains")

const DOMAIN_TEMPLATE = window.document.querySelector<HTMLTemplateElement>("#domain")?.content.firstElementChild as HTMLElement

const UNBLOCK_TEMPLATE = window.document.querySelector<HTMLTemplateElement>("#action-unblock")?.content.firstElementChild as HTMLElement

function cloneElement(el: Node): HTMLElement {
  return el.cloneNode(true) as HTMLElement
}

function findElement(container: HTMLElement, selector: string): HTMLElement {
  const el = container.querySelector<HTMLElement>(selector)

  if (!el)
    throw new Error(`could not find popup element for selector ${selector}`)

  return el
}

function getDescEl(domainEl: HTMLElement): HTMLElement {
  return findElement(domainEl, ".desc")
}

function getActionsEl(domainEl: HTMLElement): HTMLElement {
  return findElement(domainEl, ".actions")
}

function getDomainEl (domain: Domain): HTMLElement | null {
  if (domainsContainer) {
    return window.document.getElementById(domain.domain)
  } else {
    throw new Error("domains container not found in popup!")
  }
}

function createDomainEl (domain: Domain): void {
  if (!DOMAIN_TEMPLATE) {
    throw new Error("domain template not found!")
  }

  const domainEl = cloneElement(DOMAIN_TEMPLATE)

  domainEl.setAttribute("id", domain.domain)

  const descEl = getDescEl(domainEl)

  descEl.textContent = domain.domain

  const actionsEl = getActionsEl(domainEl)

  const unblockEl = cloneElement(UNBLOCK_TEMPLATE)

  unblockEl.onclick = () => {
    DomainsModel.removeDomain(getStorage(), domain.domain)
  }

  actionsEl.append(unblockEl)

  if (domainsContainer) {
    domainsContainer.append(domainEl)
  } else {
    throw new Error("domains container not found in popup!")
  }
}

const onDomainsChanged = (domains: Storage.StorageChange) => { 
  console.log("onDomainsChanged", domains)
  const oldDomains = Object.keys(domains?.oldValue || {})
  const newDomains = Object.keys(domains?.newValue || {})
  const keptDomains = newDomains.filter(d => oldDomains.includes(d))
  const removedDomains = oldDomains.filter(d => !keptDomains.includes(d))
  const addedDomains = newDomains.filter(d => !oldDomains.includes(d))

  removedDomains.forEach(d => {
    const domainEl = getDomainEl(domains.oldValue[d])
    console.log("getDomainEl", domains.oldValue[d], domainEl)
    domainEl?.remove()
  })

  addedDomains.forEach(d => {
    getDomainEl(domains.newValue[d]) || createDomainEl(domains.newValue[d])
  })

  keptDomains.forEach(d => {
    // nothing for now -- nothing editable 
  })
}

const onStorageChanged = async (changes: Record<string, Storage.StorageChange>) => {
  if (changes[STORAGE_DOMAINS]) {
    onDomainsChanged(changes[STORAGE_DOMAINS])
  }
}

const storage = getStorage()

storage.onChanged.addListener(onStorageChanged)

DomainsModel.getDomains(storage).then((domains) => {
  if (domains) {
    onDomainsChanged({
      newValue: domains 
    })
  }
})