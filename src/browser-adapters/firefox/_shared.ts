import * as webextension from "webextension-polyfill"
import { SharedBrowserAdapters } from "../../types/browser-adapters"
import browserStorage from "./browser-storage"

export const getStorage: SharedBrowserAdapters.StorageAccessor = () => {
  return browserStorage
}

export const onConnect: SharedBrowserAdapters.ConnectEvent = webextension.runtime.onConnect

export const onMessage: SharedBrowserAdapters.MessageEvent = webextension.runtime.onMessage