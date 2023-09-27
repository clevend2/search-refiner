import { Storage } from "webextension-polyfill"
import { BackgroundConnector, DomainAction, EngineAttacher, ResultTester } from "../types/search-refiner"
import { DomainsModel } from "../models/domains"
import logger from "../logger"
import { STORAGE_DOMAINS, IS_ENABLED_PORT, LOGGER_PORT } from "../constants"

export const connectToBackground: BackgroundConnector = (connect, engine, onEnabled, onDisabled) => {
  const isEnabledPort = connect({
    name: IS_ENABLED_PORT 
  })

  if (engine) {
    isEnabledPort.onMessage.addListener((isUserEnabled: boolean) => {
      if (isUserEnabled) {
        onEnabled({ engine })
      } else {
        onDisabled({ engine })
      }
    })

    isEnabledPort.postMessage(true)
  } else {
    onDisabled({})

    isEnabledPort.postMessage(false)
  }

  const loggerPort = connect({
    name: LOGGER_PORT 
  })

  loggerPort.onMessage.addListener((logMessage: string[]) => {
    console.log('background:', ...logMessage.map(m => JSON.parse(m)))
  })

  return () => {
    isEnabledPort.disconnect()
    loggerPort.disconnect()
  }
}

export const resultHasDomain: ResultTester = async (getStorage, result) => {
  const domains = await DomainsModel.getDomains(getStorage())

  return Object.entries(domains).some(([domainStr, domain]) => domain.blocked && domainStr === result.domain.domain)
}

export const attachEngine: EngineAttacher = (getWindow, getStorage, engine, onResult) => {
  const window = getWindow()
  const storage = getStorage()

  const css = engine.getCss()

  const stylesheet = window.document.createElement('style')

  stylesheet.textContent = css

  window.document.body.appendChild(stylesheet)

  const engineObserver = engine.observeResults(window, onResult)
  
  const onStorageChanged = async (changes: Record<string, Storage.StorageChange>) => {
    logger("onStorageChanged", changes)
    if (changes[STORAGE_DOMAINS]) {
      engine.applyToExistingResults(window, onResult)
    }
  }

  storage.onChanged.addListener(onStorageChanged)
  
  return () => {
    stylesheet.remove()
    
    engineObserver.disconnect()
    
    storage.onChanged.removeListener(onStorageChanged)
  }
}

export const blockDomain: DomainAction = async (getStorage, domainStr) => {
  const storage = getStorage()
  const domain = await DomainsModel.addDomain(storage, domainStr)

  domain.blocked = true

  await DomainsModel.setDomain(storage, domain)
}