import { Runtime, BrowserAction, Tabs } from "webextension-polyfill"
import { Storage as StorageExt } from "./external"

type Destructor = () => void

interface BrowserStorage extends StorageExt.StorageArea {
  onChanged: StorageExt.onChanged
}

export declare namespace SharedBrowserAdapters {
  interface Logger {
    (...message: any[]): void
  }

  interface StorageAccessor {
    (): BrowserStorage
  }

  type ConnectEvent = Runtime.Static["onConnect"]

  type MessageEvent = Runtime.Static["onMessage"]
}

export declare namespace BackgroundBrowserAdapters {
  type PopupOpener = BrowserAction.Static["openPopup"]

  interface GlobalGetter<T> {
    (): Promise<T>
  }

  interface GlobalSetter<T> {
    (newValue: T): Promise<void>
  }

  interface TabSetter<T> {
    (tabId: number, newValue: T): Promise<void>
  }

  type TabConnector = Tabs.Static["connect"]

  type MessageSender = Tabs.Static["sendMessage"]

  type ButtonClickEvent = BrowserAction.Static["onClicked"]

  type TabActivatedEvent = Tabs.Static["onActivated"]

  type TabUpdatedEvent = Tabs.Static["onUpdated"]
}

export declare namespace ContentBrowserAdapters {
  interface WindowGetter {
    (): Window
  }

  type MessageSender = Runtime.Static["sendMessage"]

  type Connector = Runtime.Static["connect"]
}