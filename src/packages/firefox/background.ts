import { onConnect, getUserEnabled, setTabEnabled } from "../../browser-adapters/firefox/firefox-adapter-background"
import { connectToContent } from "../../search-refiner/search-refiner-background"

connectToContent(onConnect, getUserEnabled, setTabEnabled)