import { Component, OnInit } from '@angular/core'

import { QuickPanelCommand, QuickPanelCommandGroup, QuickPanelConfig } from '../api'
import { QuickPanelCommandStoreService } from '../services/commandStore.service'

@Component({
  selector: 'quick-panel-settings-tab',
  template: `
    <div class="quick-panel-settings">
      <h3>快捷命令</h3>
      <p class="settings-intro">管理固定侧边栏、命令分组和常用命令。快捷键可在 Tabby 的 Hotkeys 中调整。</p>

      <section class="settings-section">
        <button class="section-header" type="button" (click)="sidebarExpanded = !sidebarExpanded">
          <span class="fa fa-fw fas" [class.fa-chevron-down]="sidebarExpanded" [class.fa-chevron-right]="!sidebarExpanded"></span>
          <span>
            <strong>侧边栏</strong>
            <small>位置、宽度和打开后的焦点行为</small>
          </span>
        </button>

        <div class="section-body" *ngIf="sidebarExpanded">
          <label class="switch-row">
            <input type="checkbox" [(ngModel)]="model.sidebar.visible" (change)="save()">
            <span>显示侧边栏</span>
          </label>

          <div class="form-grid">
            <label class="field">
              <span>显示位置</span>
              <select [(ngModel)]="model.sidebar.side" (change)="save()">
                <option value="left">左侧</option>
                <option value="right">右侧</option>
              </select>
            </label>
            <label class="field">
              <span>宽度</span>
              <input type="number" min="180" max="640" step="10" [(ngModel)]="model.sidebar.width" (change)="save()">
            </label>
          </div>

          <label class="switch-row">
            <input type="checkbox" [(ngModel)]="model.sidebar.focusOnToggle" (change)="save()">
            <span>按 Alt+Shift+Q 打开时自动进入键盘选择</span>
          </label>
        </div>
      </section>

      <section class="settings-section">
        <button class="section-header" type="button" (click)="groupsExpanded = !groupsExpanded">
          <span class="fa fa-fw fas" [class.fa-chevron-down]="groupsExpanded" [class.fa-chevron-right]="!groupsExpanded"></span>
          <span>
            <strong>分组</strong>
            <small>{{ model.groups.length }} 个分组</small>
          </span>
        </button>

        <div class="section-body" *ngIf="groupsExpanded">
          <div class="section-toolbar">
            <button class="btn btn-primary" type="button" (click)="addGroup()">新增分组</button>
          </div>

          <div class="settings-empty" *ngIf="!model.groups.length">
            暂无分组。未分组命令会显示在“未分组”下。
          </div>

          <article class="settings-item group-card" *ngFor="let group of model.groups; trackBy: trackByGroup">
            <button class="item-summary group-summary" type="button" (click)="toggleGroupEditor(group)">
              <span class="fa fa-fw fas" [class.fa-chevron-down]="isGroupExpanded(group)" [class.fa-chevron-right]="!isGroupExpanded(group)"></span>
              <span class="summary-main">
                <strong>{{ group.name || '未命名分组' }}</strong>
                <small>{{ groupCommandCount(group.id) }} 条命令</small>
              </span>
            </button>

            <div class="item-details" *ngIf="isGroupExpanded(group)">
              <label class="field">
                <span>分组名称</span>
                <input type="text" placeholder="例如：Git、Docker、服务器运维" [(ngModel)]="group.name" (blur)="save()">
              </label>

              <div class="command-actions">
                <span class="settings-hint">删除分组后，组内命令会移动到“未分组”。</span>
                <button class="btn btn-link danger" type="button" (click)="deleteGroup(group)">删除分组</button>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section class="settings-section">
        <button class="section-header" type="button" (click)="commandsExpanded = !commandsExpanded">
          <span class="fa fa-fw fas" [class.fa-chevron-down]="commandsExpanded" [class.fa-chevron-right]="!commandsExpanded"></span>
          <span>
            <strong>命令</strong>
            <small>{{ model.commands.length }} 条命令</small>
          </span>
        </button>

        <div class="section-body" *ngIf="commandsExpanded">
          <div class="section-toolbar">
            <button class="btn btn-primary" type="button" (click)="addCommand()">新增命令</button>
          </div>

          <div class="settings-empty" *ngIf="!model.commands.length">
            暂无命令。
          </div>

          <article class="settings-item command-card" *ngFor="let command of model.commands; trackBy: trackByCommand">
            <button class="item-summary command-summary" type="button" (click)="toggleCommand(command)">
              <span class="fa fa-fw fas" [class.fa-chevron-down]="isCommandExpanded(command)" [class.fa-chevron-right]="!isCommandExpanded(command)"></span>
              <span class="summary-main">
                <strong>{{ command.name || '未命名命令' }}</strong>
                <code>{{ command.command || '（空命令）' }}</code>
              </span>
              <span class="summary-meta">{{ groupName(command.groupId) }}</span>
            </button>

            <div class="item-details" *ngIf="isCommandExpanded(command)">
              <div class="form-grid">
                <label class="field">
                  <span>名称</span>
                  <input type="text" placeholder="显示在侧边栏中的名称" [(ngModel)]="command.name" (blur)="save()">
                </label>
                <label class="field">
                  <span>分组</span>
                  <select [(ngModel)]="command.groupId" (change)="save()">
                    <option [ngValue]="undefined">未分组</option>
                    <option *ngFor="let group of model.groups; trackBy: trackByGroup" [ngValue]="group.id">
                      {{ group.name }}
                    </option>
                  </select>
                </label>
              </div>

              <label class="field block-label">
                <span>命令内容</span>
                <textarea rows="3" placeholder="输入要发送到当前终端的命令" [(ngModel)]="command.command" (blur)="save()"></textarea>
              </label>

              <div class="command-actions">
                <label class="switch-row">
                  <input type="checkbox" [(ngModel)]="command.appendNewline" (change)="save()">
                  <span>发送后追加回车</span>
                </label>
                <div class="action-buttons">
                  <button class="btn btn-secondary" type="button" (click)="duplicateCommand(command)">复制</button>
                  <button class="btn btn-link danger" type="button" (click)="deleteCommand(command)">删除</button>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .quick-panel-settings {
      color: var(--theme-fg);
      max-width: 920px;
      padding-bottom: 32px;
    }

    .quick-panel-settings h3 {
      color: var(--theme-fg);
      margin-bottom: 8px;
    }

    .settings-intro,
    small,
    .settings-empty,
    .settings-hint,
    .summary-meta,
    code {
      color: var(--theme-secondary-fg);
    }

    .settings-intro {
      line-height: 1.45;
      margin-bottom: 16px;
    }

    .settings-section {
      background: var(--theme-bg-more-2);
      border: 1px solid var(--theme-secondary);
      border-radius: .45rem;
      margin-top: 12px;
      overflow: hidden;
    }

    .section-header,
    .item-summary {
      align-items: center;
      background: transparent;
      border: 0;
      color: inherit;
      cursor: pointer;
      display: flex;
      gap: 10px;
      text-align: left;
      width: 100%;
    }

    .section-header {
      padding: 12px;
    }

    .section-header:hover,
    .item-summary:hover {
      background: var(--theme-secondary);
    }

    .section-header span:last-child,
    .summary-main {
      display: flex;
      flex: 1;
      flex-direction: column;
      min-width: 0;
    }

    .section-body {
      border-top: 1px solid var(--theme-secondary);
      padding: 12px;
    }

    .section-toolbar {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 10px;
    }

    .form-grid {
      display: grid;
      gap: 12px;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      margin: 10px 0;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin: 10px 0;
    }

    .field > span,
    .switch-row {
      color: var(--theme-fg);
    }

    .quick-panel-settings input:not([type='checkbox']),
    .quick-panel-settings select,
    .quick-panel-settings textarea {
      background-color: var(--theme-bg) !important;
      border: 1px solid var(--theme-secondary);
      border-radius: .3rem;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, .03);
      caret-color: var(--theme-fg);
      color: var(--theme-fg) !important;
      outline: none;
      padding: 7px 9px;
      width: 100%;
    }

    .quick-panel-settings input:not([type='checkbox']):focus,
    .quick-panel-settings select:focus,
    .quick-panel-settings textarea:focus {
      border-color: var(--theme-primary);
      box-shadow: 0 0 0 1px var(--theme-primary);
    }

    .quick-panel-settings select option {
      background-color: var(--theme-bg);
      color: var(--theme-fg);
    }

    .quick-panel-settings input::placeholder,
    .quick-panel-settings textarea::placeholder {
      color: var(--theme-secondary-fg);
      opacity: .72;
    }

    .switch-row {
      align-items: center;
      display: flex;
      gap: 8px;
      margin: 8px 0;
    }

    .switch-row input[type='checkbox'] {
      accent-color: var(--theme-primary);
    }

    .settings-item {
      background: var(--theme-bg);
      border: 1px solid var(--theme-secondary);
      border-radius: .4rem;
      margin: 8px 0;
      overflow: hidden;
    }

    .item-summary {
      min-height: 46px;
      padding: 8px 10px;
    }

    .summary-main strong,
    .summary-main code {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .summary-main code {
      background: transparent;
      font-size: .78rem;
      padding: 0;
    }

    .summary-meta {
      flex: 0 0 auto;
      font-size: .78rem;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .item-details {
      border-top: 1px solid var(--theme-secondary);
      padding: 10px;
    }

    .command-actions {
      align-items: center;
      display: flex;
      gap: 12px;
      justify-content: space-between;
      margin-top: 10px;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
    }

    .settings-hint {
      font-size: .78rem;
      line-height: 1.35;
    }

    .settings-empty {
      line-height: 1.45;
      padding: 8px 0;
    }

    .quick-panel-settings .btn.btn-secondary {
      background-color: var(--theme-bg-more-2);
      border-color: var(--theme-secondary);
      color: var(--theme-fg);
    }

    .quick-panel-settings .btn.btn-link {
      color: var(--theme-fg);
    }

    .danger {
      color: #ff6b6b !important;
    }
  `]
})
export class QuickPanelSettingsTabComponent implements OnInit {
  model!: QuickPanelConfig
  sidebarExpanded = true
  groupsExpanded = true
  commandsExpanded = true
  private expandedGroupIds: Record<string, boolean> = {}
  private expandedCommandIds: Record<string, boolean> = {}

  constructor (
    private store: QuickPanelCommandStoreService
  ) {}

  ngOnInit (): void {
    this.model = this.store.value
  }

  async save (): Promise<void> {
    await this.store.save()
    this.model = this.store.value
  }

  async addGroup (): Promise<void> {
    const group = await this.store.addGroup()
    this.expandedGroupIds[group.id] = true
    this.model = this.store.value
  }

  async deleteGroup (group: QuickPanelCommandGroup): Promise<void> {
    delete this.expandedGroupIds[group.id]
    await this.store.deleteGroup(group)
    this.model = this.store.value
  }

  async addCommand (): Promise<void> {
    const command = await this.store.addCommand()
    this.expandedCommandIds[command.id] = true
    this.model = this.store.value
  }

  async duplicateCommand (command: QuickPanelCommand): Promise<void> {
    const copy = await this.store.duplicateCommand(command)
    this.expandedCommandIds[copy.id] = true
    this.model = this.store.value
  }

  async deleteCommand (command: QuickPanelCommand): Promise<void> {
    delete this.expandedCommandIds[command.id]
    await this.store.deleteCommand(command)
    this.model = this.store.value
  }

  toggleCommand (command: QuickPanelCommand): void {
    this.expandedCommandIds[command.id] = !this.isCommandExpanded(command)
  }

  isCommandExpanded (command: QuickPanelCommand): boolean {
    return Boolean(this.expandedCommandIds[command.id])
  }

  toggleGroupEditor (group: QuickPanelCommandGroup): void {
    this.expandedGroupIds[group.id] = !this.isGroupExpanded(group)
  }

  isGroupExpanded (group: QuickPanelCommandGroup): boolean {
    return Boolean(this.expandedGroupIds[group.id])
  }

  groupCommandCount (groupId: string): number {
    return this.model.commands.filter(command => command.groupId === groupId).length
  }

  groupName (groupId?: string): string {
    if (!groupId) {
      return '未分组'
    }

    return this.model.groups.find(group => group.id === groupId)?.name ?? '未分组'
  }

  trackByGroup (_index: number, group: QuickPanelCommandGroup): string {
    return group.id
  }

  trackByCommand (_index: number, command: QuickPanelCommand): string {
    return command.id
  }
}
