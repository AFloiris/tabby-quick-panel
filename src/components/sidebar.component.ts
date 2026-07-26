import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core'
import { ConfigService } from 'tabby-core'
import { Subscription } from 'rxjs'

import { QuickPanelCommand, QuickPanelCommandGroup } from '../api'
import { QuickPanelCommandSenderService } from '../services/commandSender.service'
import { QuickPanelCommandStoreService } from '../services/commandStore.service'
import { QuickPanelSidebarHostService } from '../services/sidebarHost.service'

interface SidebarGroup {
  id?: string
  key: string
  name: string
  commands: QuickPanelCommand[]
}

type SidebarListItem =
  | { type: 'group', key: string, group: SidebarGroup }
  | { type: 'command', key: string, group: SidebarGroup, command: QuickPanelCommand }

@Component({
  selector: 'quick-panel-sidebar',
  template: `
    <section
      #panelRoot
      class="tabby-quick-panel-root"
      tabindex="-1"
      (keydown)="onKeyDown($event)"
      (focus)="ensureSelection()"
    >
      <div class="quick-panel-shell">
        <input
          #searchInput
          class="quick-panel-search form-control form-control-sm"
          type="search"
          aria-label="搜索快捷命令"
          placeholder="输入搜索，↑↓ 选择，←→ 展开"
          [(ngModel)]="filter"
          (ngModelChange)="refresh()"
        >

        <div class="quick-panel-content">
          <ng-container *ngIf="groups.length; else emptyState">
            <section class="quick-panel-group" *ngFor="let group of groups; trackBy: trackByGroup">
              <button
                class="quick-panel-group-title quick-panel-list-item"
                type="button"
                [class.quick-panel-selected]="isGroupSelected(group)"
                [attr.aria-expanded]="!isCollapsed(group)"
                (click)="toggleGroup(group)"
              >
                <span
                  class="fa fa-fw fas text-muted"
                  [class.fa-chevron-right]="isCollapsed(group)"
                  [class.fa-chevron-down]="!isCollapsed(group)"
                ></span>
                <span class="fa fa-fw far fa-folder text-muted"></span>
                <span>{{ group.name }}</span>
              </button>
              <button
                class="quick-panel-command tree-item"
                type="button"
                *ngFor="let command of commandsForGroup(group); trackBy: trackByCommand"
                [class.quick-panel-selected]="isCommandSelected(command)"
                (click)="sendAndReturnFocus(command)"
                [title]="command.command"
              >
                <span class="quick-panel-icon fa fa-fw fas fa-terminal text-muted"></span>
                <span class="quick-panel-command-body">
                  <span class="quick-panel-command-name">{{ command.name }}</span>
                  <span class="quick-panel-command-text">{{ command.command || '（空命令）' }}</span>
                </span>
                <span class="actions" *ngIf="command.appendNewline">
                  <span class="action">回车</span>
                </span>
              </button>
            </section>
          </ng-container>

          <ng-template #emptyState>
            <div class="quick-panel-empty">
              暂无快捷命令。可在设置 -> 快捷命令 中添加。
            </div>
          </ng-template>
        </div>
      </div>

      <div class="quick-panel-grabber" (mousedown)="startResize($event)"></div>
    </section>
  `,
  styles: [`
    .quick-panel-shell {
      display: flex;
      flex: 1;
      flex-direction: column;
      height: 100%;
      min-height: 0;
      padding: .5rem;
    }

    .quick-panel-search.form-control {
      background-color: var(--theme-bg) !important;
      border: 1px solid var(--theme-secondary);
      border-radius: .35rem;
      color: var(--theme-fg) !important;
      margin-bottom: .45rem;
      outline: none;
      padding: .35rem .5rem;
    }

    .quick-panel-search.form-control:focus {
      background-color: var(--theme-bg) !important;
      border-color: var(--theme-primary);
      box-shadow: 0 0 0 1px var(--theme-primary);
      color: var(--theme-fg) !important;
    }

    .quick-panel-search.form-control::placeholder {
      color: var(--theme-secondary-fg);
      opacity: .72;
    }

    .quick-panel-content {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      scrollbar-width: none;
    }

    .quick-panel-content::-webkit-scrollbar {
      display: none;
    }

    .quick-panel-group-title {
      align-items: center;
      background: transparent;
      border: 0;
      border-radius: .3rem;
      color: inherit;
      cursor: pointer;
      display: flex;
      gap: .25rem;
      opacity: .72;
      padding: calc(.28rem * calc(var(--spaciness) * var(--spaciness))) .2rem;
      text-align: left;
      width: 100%;
    }

    .quick-panel-group-title:hover,
    .quick-panel-selected {
      background-color: var(--theme-secondary);
      opacity: 1;
    }

    .quick-panel-selected {
      box-shadow: inset 2px 0 0 var(--theme-primary);
      color: var(--theme-fg);
    }

    .quick-panel-command {
      align-items: center;
      background: transparent;
      border: 0;
      border-radius: .3rem;
      color: inherit;
      cursor: pointer;
      display: flex;
      gap: .5rem;
      min-height: 36px;
      overflow: hidden;
      padding: calc(.28rem * calc(var(--spaciness) * var(--spaciness))) .35rem;
      position: relative;
      text-align: left;
      width: 100%;
    }

    .quick-panel-command:hover {
      background-color: var(--theme-secondary);
    }

    .quick-panel-icon {
      flex: 0 0 20px;
      width: 20px;
    }

    .quick-panel-command-body {
      display: block;
      flex: 1 1 auto;
      min-width: 0;
    }

    .quick-panel-command-name {
      color: var(--theme-fg);
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .quick-panel-command-text {
      color: var(--theme-secondary-fg);
      display: block;
      font-family: var(--terminal-font, Consolas, monospace);
      font-size: .75rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .actions {
      display: none;
      flex-direction: row;
      gap: calc(.25rem * calc(var(--spaciness) * var(--spaciness)));
      height: 100%;
      padding: calc(.25rem * calc(var(--spaciness) * var(--spaciness)));
      position: absolute;
      right: 0;
      top: 0;
      background: var(--theme-secondary);
    }

    .quick-panel-command:hover .actions {
      display: flex;
    }

    .action {
      align-items: center;
      background-color: var(--theme-bg-more-2);
      border-radius: .2rem;
      display: flex;
      font-size: .6rem;
      height: 100%;
      justify-content: center;
      padding: 0 calc(.34rem * calc(var(--spaciness) * var(--spaciness)));
    }

    .quick-panel-empty {
      color: var(--theme-secondary-fg);
      line-height: 1.45;
      opacity: .8;
      padding: 1rem .25rem;
    }

    .quick-panel-grabber {
      background-color: var(--theme-secondary-fg);
      border: 3px solid var(--theme-secondary);
      border-radius: .4rem;
      cursor: col-resize;
      display: block;
      height: 25px;
      position: absolute;
      top: 50%;
      width: 7px;
      z-index: 1;
    }

    :host-context(.tabby-quick-panel-side-left) .quick-panel-grabber {
      right: -4px;
    }

    :host-context(.tabby-quick-panel-side-right) .quick-panel-grabber {
      left: -4px;
    }
  `]
})
export class QuickPanelSidebarComponent implements OnInit, OnDestroy {
  @ViewChild('panelRoot', { static: true }) panelRoot!: ElementRef<HTMLElement>
  @ViewChild('searchInput', { static: true }) searchInput!: ElementRef<HTMLInputElement>

  filter = ''
  groups: SidebarGroup[] = []
  private collapsedGroupKeys: Record<string, boolean> = {}
  private panelIsResizing = false
  private panelStartWidth = 0
  private panelStartX = 0
  private selectedKey?: string
  private subscription = new Subscription()

  constructor (
    private config: ConfigService,
    private sender: QuickPanelCommandSenderService,
    private store: QuickPanelCommandStoreService,
    private sidebarHost: QuickPanelSidebarHostService,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit (): void {
    this.refresh()
    this.subscription.add(this.config.changed$.subscribe(() => {
      this.refresh()
      this.changeDetector.markForCheck()
    }))
  }

  ngOnDestroy (): void {
    this.subscription.unsubscribe()
  }

  focusPanel (): void {
    this.ensureSelection()
    this.searchInput.nativeElement.focus()
    this.scrollSelectedIntoView()
  }

  sendAndReturnFocus (command: QuickPanelCommand): void {
    const sent = this.sender.send(command)
    if (!sent) {
      return
    }

    this.sender.focusActiveTerminal()
  }

  onKeyDown (event: KeyboardEvent): void {
    if (event.target instanceof HTMLInputElement && !this.isNavigationKey(event.key)) {
      return
    }

    if (this.isSearchKey(event)) {
      event.preventDefault()
      event.stopPropagation()
      this.applySearchKey(event.key)
      return
    }

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault()
        event.stopPropagation()
        this.moveSelection(-1)
        return
      case 'ArrowDown':
        event.preventDefault()
        event.stopPropagation()
        this.moveSelection(1)
        return
      case 'ArrowRight':
        event.preventDefault()
        event.stopPropagation()
        this.enterGroup()
        return
      case 'ArrowLeft':
        event.preventDefault()
        event.stopPropagation()
        this.exitGroup()
        return
      case 'Enter':
        event.preventDefault()
        event.stopPropagation()
        this.confirmSelection()
        return
      case 'Escape':
        event.preventDefault()
        event.stopPropagation()
        this.sender.focusActiveTerminal()
        return
    }
  }

  startResize (event: MouseEvent): void {
    this.panelIsResizing = true
    this.panelStartX = event.clientX
    this.panelStartWidth = this.store.value.sidebar.width
    event.preventDefault()
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove (event: MouseEvent): void {
    if (!this.panelIsResizing) {
      return
    }

    const sidebar = this.store.value.sidebar
    const delta = sidebar.side === 'right'
      ? this.panelStartX - event.clientX
      : event.clientX - this.panelStartX

    this.sidebarHost.setLiveWidth(this.panelStartWidth + delta)
  }

  @HostListener('document:mouseup')
  stopResize (): void {
    if (!this.panelIsResizing) {
      return
    }

    this.panelIsResizing = false
    void this.sidebarHost.persistLayout()
  }

  refresh (): void {
    const quickPanel = this.store.value
    const filter = this.filter.trim().toLowerCase()
    const groupNameById = new Map(
      quickPanel.groups.map(group => [group.id, group.name.toLowerCase()])
    )
    const visibleCommands = quickPanel.commands.filter(command => {
      if (!filter) {
        return true
      }

      return command.name.toLowerCase().includes(filter) ||
        command.command.toLowerCase().includes(filter) ||
        Boolean(command.groupId && groupNameById.get(command.groupId)?.includes(filter))
    })

    const configuredGroups = quickPanel.groups
      .map(group => this.createSidebarGroup(group, visibleCommands))
      .filter(group => group.commands.length)

    const ungrouped = visibleCommands.filter(command => !command.groupId)
    this.groups = ungrouped.length
      ? [...configuredGroups, { key: 'group:ungrouped', name: '未分组', commands: ungrouped }]
      : configuredGroups

    this.ensureSelection()
  }

  trackByGroup (_index: number, group: SidebarGroup): string {
    return group.key
  }

  trackByCommand (_index: number, command: QuickPanelCommand): string {
    return command.id
  }

  private createSidebarGroup (
    group: QuickPanelCommandGroup,
    commands: QuickPanelCommand[]
  ): SidebarGroup {
    return {
      id: group.id,
      key: this.groupKey(group.id),
      name: group.name,
      commands: commands.filter(command => command.groupId === group.id)
    }
  }

  commandsForGroup (group: SidebarGroup): QuickPanelCommand[] {
    return this.isCollapsed(group) ? [] : group.commands
  }

  toggleGroup (group: SidebarGroup): void {
    this.selectedKey = group.key
    this.collapsedGroupKeys[group.key] = !this.isCollapsed(group)
    this.ensureSelection()
    this.scrollSelectedIntoView()
  }

  isCollapsed (group: SidebarGroup): boolean {
    return Boolean(this.collapsedGroupKeys[group.key])
  }

  isGroupSelected (group: SidebarGroup): boolean {
    return this.selectedKey === group.key
  }

  isCommandSelected (command: QuickPanelCommand): boolean {
    return this.selectedKey === this.commandKey(command)
  }

  ensureSelection (): void {
    const items = this.getVisibleItems()
    if (!items.length) {
      this.selectedKey = undefined
      return
    }

    if (!this.selectedKey || !items.some(item => item.key === this.selectedKey)) {
      this.selectedKey = items[0].key
    }
  }

  private moveSelection (delta: number): void {
    const items = this.getVisibleItems()
    if (!items.length) {
      return
    }

    this.ensureSelection()
    const currentIndex = Math.max(0, items.findIndex(item => item.key === this.selectedKey))
    const nextIndex = Math.min(items.length - 1, Math.max(0, currentIndex + delta))
    this.selectedKey = items[nextIndex].key
    this.scrollSelectedIntoView()
  }

  private enterGroup (): void {
    const item = this.getSelectedItem()
    if (!item || item.type !== 'group') {
      return
    }

    if (this.isCollapsed(item.group)) {
      this.collapsedGroupKeys[item.group.key] = false
      return
    }

    const firstCommand = item.group.commands[0]
    if (firstCommand) {
      this.selectedKey = this.commandKey(firstCommand)
      this.scrollSelectedIntoView()
    }
  }

  private exitGroup (): void {
    const item = this.getSelectedItem()
    if (!item) {
      return
    }

    if (item.type === 'command') {
      this.selectedKey = item.group.key
      this.scrollSelectedIntoView()
      return
    }

    this.collapsedGroupKeys[item.group.key] = true
  }

  private confirmSelection (): void {
    const item = this.getSelectedItem()
    if (!item) {
      return
    }

    if (item.type === 'group') {
      this.toggleGroup(item.group)
      return
    }

    this.sendAndReturnFocus(item.command)
  }

  private getSelectedItem (): SidebarListItem | null {
    this.ensureSelection()
    return this.getVisibleItems().find(item => item.key === this.selectedKey) ?? null
  }

  private getVisibleItems (): SidebarListItem[] {
    return this.groups.flatMap(group => {
      const groupItem: SidebarListItem = { type: 'group', key: group.key, group }
      if (this.isCollapsed(group)) {
        return [groupItem]
      }

      return [
        groupItem,
        ...group.commands.map(command => ({
          type: 'command' as const,
          key: this.commandKey(command),
          group,
          command
        }))
      ]
    })
  }

  private scrollSelectedIntoView (): void {
    window.requestAnimationFrame(() => {
      this.panelRoot.nativeElement
        .querySelector('.quick-panel-selected')
        ?.scrollIntoView({ block: 'nearest' })
    })
  }

  private isNavigationKey (key: string): boolean {
    return [
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Enter',
      'Escape'
    ].includes(key)
  }

  private isSearchKey (event: KeyboardEvent): boolean {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return false
    }

    return event.key.length === 1 ||
      event.key === 'Backspace' ||
      event.key === 'Delete'
  }

  private applySearchKey (key: string): void {
    if (key === 'Backspace') {
      this.filter = this.filter.slice(0, -1)
    } else if (key === 'Delete') {
      this.filter = ''
    } else {
      this.filter = `${this.filter}${key}`
    }

    this.refresh()
    this.searchInput.nativeElement.focus()
  }

  private groupKey (id?: string): string {
    return `group:${id ?? 'ungrouped'}`
  }

  private commandKey (command: QuickPanelCommand): string {
    return `command:${command.id}`
  }
}
