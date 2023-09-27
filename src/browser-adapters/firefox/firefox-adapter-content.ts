import * as webextension from "webextension-polyfill"
import { ContentBrowserAdapters } from "../../types/browser-adapters"

export * from "./_shared"

export const getWindow: ContentBrowserAdapters.WindowGetter = () => {
  return window
}

export const connect: ContentBrowserAdapters.Connector = webextension.runtime.connect

export const sendMessage: ContentBrowserAdapters.MessageSender = webextension.runtime.sendMessage