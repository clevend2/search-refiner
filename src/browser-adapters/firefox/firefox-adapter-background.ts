import * as webextension from "webextension-polyfill"
import { BackgroundBrowserAdapters } from "../../types/browser-adapters"
// import { LOGGER_PORT } from "./_shared"

// const loggerQueue: string[] = []

// let loggerPorts: webextension.Runtime.Port[] = []


// browserAdapter.onConnect.addListener((port) => {
//   switch (port.name) {
//     case LOGGER_PORT:
//       // clean up old port references (if any)
//       loggerPorts = loggerPorts.filter(oldPort => oldPort.sender?.id !== port.sender?.id || oldPort.name !== port.name)

//       loggerPorts.push(port)

//       loggerQueue.forEach((m, i) => {
//         loggerPorts.forEach(port => {
//           port.postMessage(m)
//         })
//         loggerQueue.splice(i, 1)
//       })
//       break
//   }
// })

export * from "./_shared"

export const getUserEnabled: BackgroundBrowserAdapters.GlobalGetter<boolean> = async () => {
  return await webextension.browserAction.isEnabled({})
}

export const setUserEnabled: BackgroundBrowserAdapters.GlobalSetter<boolean> = async (enabled) => {
  if (enabled) {
    await webextension.browserAction.enable()
  } else {
    await webextension.browserAction.disable()
  }
}

export const setTabEnabled: BackgroundBrowserAdapters.TabSetter<boolean> = async (tabId, enabled) => {
  if (enabled) {
    await webextension.browserAction.enable(tabId)
  } else {
    await webextension.browserAction.disable(tabId)
  }
}

export const connectToTab: BackgroundBrowserAdapters.TabConnector = (tabId, connectInfo) => {
  return webextension.tabs.connect(tabId, connectInfo)
}

export const sendMessageToTab: BackgroundBrowserAdapters.MessageSender = (tabId, message, options) => {
  return webextension.tabs.sendMessage(tabId, message, options)
}

export const openPopup: BackgroundBrowserAdapters.PopupOpener = webextension.browserAction.openPopup

export const onButtonClicked: BackgroundBrowserAdapters.ButtonClickEvent = webextension.browserAction.onClicked

export const onTabActivated: BackgroundBrowserAdapters.TabActivatedEvent = webextension.tabs.onActivated

export const onTabUpdated: BackgroundBrowserAdapters.TabUpdatedEvent = webextension.tabs.onUpdated