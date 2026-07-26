import {
  ApplicationRef,
  ComponentFactoryResolver,
  ComponentRef,
  EmbeddedViewRef,
  Inject,
  Injectable,
  Injector
} from '@angular/core'
import { DOCUMENT } from '@angular/common'
import { ConfigService, HotkeysService } from 'tabby-core'
import { Subscription } from 'rxjs'

import { HOTKEY_FOCUS_SIDEBAR, HOTKEY_TOGGLE_SIDEBAR, QuickPanelSide } from '../api'
import { QuickPanelSidebarComponent } from '../components/sidebar.component'
import { QuickPanelCommandStoreService } from './commandStore.service'
import { findSidebarDockTarget } from './sidebarDockTarget'

const LAYOUT_RETRY_DELAY_MS = 50
const MAX_LAYOUT_RETRIES = 120

@Injectable()
export class QuickPanelSidebarHostService {
  private started = false
  private hostElement?: HTMLElement
  private componentRef?: ComponentRef<QuickPanelSidebarComponent>
  private styleElement?: HTMLStyleElement
  private pendingLayoutRetry: number | null = null
  private layoutRetryCount = 0
  private layoutWarningIssued = false
  private subscriptions = new Subscription()

  constructor (
    private appRef: ApplicationRef,
    private resolver: ComponentFactoryResolver,
    private injector: Injector,
    private config: ConfigService,
    private hotkeys: HotkeysService,
    private store: QuickPanelCommandStoreService,
    @Inject(DOCUMENT) private document: Document
  ) {}

  start (): void {
    if (this.started) {
      return
    }

    this.started = true
    this.attachStyles()

    this.subscriptions.add(this.config.ready$.subscribe(() => {
      this.applyVisibilityFromConfig()
      this.applyLayout()
    }))

    this.subscriptions.add(this.config.changed$.subscribe(() => {
      this.applyVisibilityFromConfig()
      this.applyLayout()
    }))

    this.subscriptions.add(this.hotkeys.hotkey$.subscribe(hotkey => {
      if (hotkey === HOTKEY_TOGGLE_SIDEBAR) {
        this.toggle()
      }
      if (hotkey === HOTKEY_FOCUS_SIDEBAR) {
        this.focus()
      }
    }))
  }

  async toggle (): Promise<void> {
    const quickPanel = this.store.value
    quickPanel.sidebar.visible = !quickPanel.sidebar.visible
    await this.store.save()
    this.applyVisibilityFromConfig()
    this.applyLayout()
    if (quickPanel.sidebar.visible && quickPanel.sidebar.focusOnToggle) {
      this.focusComponent()
    }
  }

  async hide (): Promise<void> {
    const quickPanel = this.store.value
    quickPanel.sidebar.visible = false
    await this.store.save()
    this.cancelLayoutRetry()
    this.applyVisibilityFromConfig()
    this.applyLayout()
  }

  async focus (): Promise<void> {
    const quickPanel = this.store.value
    if (!quickPanel.sidebar.visible) {
      quickPanel.sidebar.visible = true
      await this.store.save()
      this.applyVisibilityFromConfig()
      this.applyLayout()
    }

    this.focusComponent()
  }

  setLiveWidth (width: number): void {
    const quickPanel = this.store.value
    quickPanel.sidebar.width = this.clamp(width, 180, 640)
    this.applyLayout()
  }

  async persistLayout (): Promise<void> {
    await this.store.save()
  }

  private applyVisibilityFromConfig (): void {
    const sidebar = this.store.value.sidebar
    if (sidebar.visible) {
      this.showComponent()
      return
    }

    this.destroyComponent()
  }

  private showComponent (): void {
    if (!this.hostElement) {
      this.hostElement = this.document.createElement('div')
      this.hostElement.className = 'tabby-quick-panel-host'
    }

    if (!this.placeHost(this.store.value.sidebar.side)) {
      this.scheduleLayoutRetry()
      return
    }

    this.cancelLayoutRetry()
    if (this.componentRef) {
      return
    }

    const factory = this.resolver.resolveComponentFactory(QuickPanelSidebarComponent)
    this.componentRef = factory.create(this.injector, [], this.hostElement)
    this.appRef.attachView(this.componentRef.hostView)

    const rootNode = (this.componentRef.hostView as EmbeddedViewRef<unknown>).rootNodes[0] as HTMLElement | undefined
    if (rootNode && rootNode !== this.hostElement) {
      this.hostElement.appendChild(rootNode)
    }
  }

  private focusComponent (): void {
    window.requestAnimationFrame(() => {
      this.componentRef?.instance.focusPanel()
    })
  }

  private destroyComponent (): void {
    this.cancelLayoutRetry()

    if (this.componentRef) {
      this.appRef.detachView(this.componentRef.hostView)
      this.componentRef.destroy()
      this.componentRef = undefined
    }

    if (this.hostElement) {
      this.hostElement.remove()
      this.hostElement = undefined
    }

    this.document.body.classList.remove(
      'tabby-quick-panel-visible',
      'tabby-quick-panel-side-left',
      'tabby-quick-panel-side-right'
    )
  }

  private applyLayout (): void {
    const sidebar = this.store.value.sidebar
    const body = this.document.body
    body.style.setProperty('--tabby-quick-panel-width', `${sidebar.width}px`)
    body.classList.toggle('tabby-quick-panel-visible', sidebar.visible)
    body.classList.toggle('tabby-quick-panel-side-left', sidebar.visible && sidebar.side === 'left')
    body.classList.toggle('tabby-quick-panel-side-right', sidebar.visible && sidebar.side === 'right')

    this.hostElement?.classList.toggle('tabby-quick-panel-side-left', sidebar.side === 'left')
    this.hostElement?.classList.toggle('tabby-quick-panel-side-right', sidebar.side === 'right')
    if (sidebar.visible && !this.placeHost(sidebar.side)) {
      this.scheduleLayoutRetry()
    }
  }

  private placeHost (side: QuickPanelSide): boolean {
    if (!this.hostElement) {
      return true
    }

    const target = findSidebarDockTarget(this.document, this.store.value.sidebar.layoutSelector)
    if (!target) {
      return false
    }

    if (side === 'left') {
      target.windowElement.insertBefore(this.hostElement, target.mainContent)
      return true
    }

    target.windowElement.appendChild(this.hostElement)
    return true
  }

  private scheduleLayoutRetry (): void {
    if (this.pendingLayoutRetry !== null) {
      return
    }

    if (this.layoutRetryCount >= MAX_LAYOUT_RETRIES) {
      if (!this.layoutWarningIssued) {
        console.warn('[tabby-quick-panel] 未找到 Tabby 主窗口，快捷命令侧边栏暂未挂载。')
        this.layoutWarningIssued = true
      }
      return
    }

    this.pendingLayoutRetry = window.setTimeout(() => {
      this.pendingLayoutRetry = null
      this.layoutRetryCount += 1

      if (!this.store.value.sidebar.visible) {
        return
      }

      this.applyVisibilityFromConfig()
      this.applyLayout()
    }, LAYOUT_RETRY_DELAY_MS)
  }

  private cancelLayoutRetry (): void {
    if (this.pendingLayoutRetry !== null) {
      window.clearTimeout(this.pendingLayoutRetry)
      this.pendingLayoutRetry = null
    }

    this.layoutRetryCount = 0
    this.layoutWarningIssued = false
  }

  private attachStyles (): void {
    if (this.styleElement) {
      return
    }

    this.styleElement = this.document.createElement('style')
    this.styleElement.id = 'tabby-quick-panel-styles'
    this.styleElement.textContent = `
      .tabby-quick-panel-host {
        background-color: var(--theme-bg-more-2);
        display: flex;
        flex: 0 0 var(--tabby-quick-panel-width, 300px);
        height: 100%;
        min-height: 0;
        min-width: 0;
        position: relative;
        width: var(--tabby-quick-panel-width, 300px);
        z-index: 1;
      }

      .tabby-quick-panel-host.tabby-quick-panel-side-left {
        border-right: 1px solid var(--theme-secondary);
      }

      .tabby-quick-panel-host.tabby-quick-panel-side-right {
        border-left: 1px solid var(--theme-secondary);
      }

      .tabby-quick-panel-root {
        background-color: var(--theme-bg-more-2);
        color: inherit;
        display: flex;
        flex-direction: column;
        font-size: 12px;
        height: 100%;
        min-height: 0;
        position: relative;
        width: 100%;
      }
    `
    this.document.head.appendChild(this.styleElement)
  }

  private clamp (value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, Math.round(value)))
  }
}
