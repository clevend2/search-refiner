import { Runtime } from "webextension-polyfill"
import { IS_ENABLED_PORT } from "../constants"
import { ContentConnector } from "../types/search-refiner"

export const connectToContent: ContentConnector = (onConnect, getUserEnabled, setTabEnabled) => {
  const contentListener = async (port: Runtime.Port) => {
    switch (port.name) {
      case IS_ENABLED_PORT:
        port.postMessage(await getUserEnabled())

        port.onMessage.addListener(async (isEnabled, sender) => {
          const tabId = sender.sender?.tab?.id

          if (tabId) {
            await setTabEnabled(tabId, isEnabled)
          }
        })
        break
    }
  }

  onConnect.addListener(contentListener)

  return () => {
    onConnect.removeListener(contentListener)
  }
}
