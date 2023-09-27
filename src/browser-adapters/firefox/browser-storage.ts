import * as webextension from "webextension-polyfill"
import { BrowserStorage } from "../../types/browser-adapters"

function getStorageArea () {
  if (webextension.storage?.sync) {
    return webextension.storage?.sync
  } else {
    return webextension.storage?.local
  }
}

const browserStorage: BrowserStorage = {
  get: getStorageArea().get,
  set: getStorageArea().set,
  remove: getStorageArea().remove,
  clear: getStorageArea().clear,
  get onChanged() {
    return webextension.storage.onChanged 
  },
}

export default browserStorage