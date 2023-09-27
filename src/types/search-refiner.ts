import { Aggregates } from "../analysis/analysis"
import { BackgroundBrowserAdapters, ContentBrowserAdapters, SharedBrowserAdapters } from "./browser-adapters"

export enum ResultActionType {
  DEFAULT = "default",
  TAG = "tag"
}

export interface DefaultActionProps {
  title: string
  text: string
}

export interface TagProps {
  color: string
  text: string
  title: string
}

export interface ResultActionState<Props> {
  match(aggregates: Aggregates): boolean
  props(aggregates: Aggregates): Props
}

interface BaseResultAction {
  name: string
  fn: EventListener
  transformer?: (el: HTMLElement) => HTMLElement
}

export interface DefaultResultAction extends BaseResultAction {
  type: typeof ResultActionType.DEFAULT,
  props: DefaultActionProps
}

export interface TagAction extends BaseResultAction {
  type: typeof ResultActionType.TAG,
  props: TagProps
}

export type ResultAction = DefaultResultAction | TagAction

export interface Domain {
  domain: string
  blocked: boolean
  note: string
}

export interface Result {
  slug: string
  url: string
  title: string
  description: string
  el: HTMLElement
  domain: Domain
}

export interface ResultListener {
  (result: Result): void
}

export type Destructor = () => void

export interface Engine {
  isInWindow: (window: Window) => boolean,
  getCss: () => string,
  observeResults: (window: Window, onResult: ResultListener) => MutationObserver
  applyToExistingResults: (window: Window, onResult: ResultListener) => void
  hideResult: (result: Result) => Promise<void>
  showResult: (result: Result) => Promise<void>
  addResultAction: (window: Window, result: Result, action: ResultAction) => void
}

interface ConnectionPayload {
  engine?: Engine,
}

export interface BackgroundConnector {
  (connect: ContentBrowserAdapters.Connector, engine: Engine, onEnabled: (cp: ConnectionPayload) => void, onDisabled: (cp: ConnectionPayload) => void): Destructor
}

export interface EngineAttacher {
  (getWindow: ContentBrowserAdapters.WindowGetter, getStorage: SharedBrowserAdapters.StorageAccessor, engine: Engine, onResult: ResultListener): Destructor
}

export interface ResultTester {
  (getStorage: SharedBrowserAdapters.StorageAccessor, result: Result): Promise<boolean>
}

export interface DomainAction {
  (getStorage: SharedBrowserAdapters.StorageAccessor, domain: string): Promise<void>
}

export interface ContentConnector {
  (onConnect: SharedBrowserAdapters.ConnectEvent, getUserEnabled: BackgroundBrowserAdapters.GlobalGetter<boolean>, setTabEnabled: BackgroundBrowserAdapters.TabSetter<boolean>): Destructor
}
