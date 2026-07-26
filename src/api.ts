export const CONFIG_KEY = 'quickPanel'
export const HOTKEY_TOGGLE_SIDEBAR = 'quick-panel.toggle-sidebar'
export const HOTKEY_FOCUS_SIDEBAR = 'quick-panel.focus-sidebar'

export type QuickPanelSide = 'left' | 'right'

export interface QuickPanelCommandGroup {
  id: string
  name: string
}

export interface QuickPanelCommand {
  id: string
  name: string
  command: string
  groupId?: string
  appendNewline: boolean
}

export interface QuickPanelSidebarConfig {
  visible: boolean
  side: QuickPanelSide
  width: number
  focusOnToggle: boolean
  topOffset: number
  reserveTerminalSpace: boolean
  layoutSelector: string
}

export interface QuickPanelConfig {
  groups: QuickPanelCommandGroup[]
  commands: QuickPanelCommand[]
  sidebar: QuickPanelSidebarConfig
}

export const DEFAULT_QUICK_PANEL_CONFIG: QuickPanelConfig = {
  groups: [],
  commands: [],
  sidebar: {
    visible: false,
    side: 'right',
    width: 300,
    focusOnToggle: false,
    topOffset: 34,
    reserveTerminalSpace: true,
    layoutSelector: '.content.main'
  }
}

export function cloneDefaultConfig (): QuickPanelConfig {
  return JSON.parse(JSON.stringify(DEFAULT_QUICK_PANEL_CONFIG))
}

export function createId (prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function buildCommandPayload (command: QuickPanelCommand): string {
  if (!command.appendNewline) {
    return command.command
  }

  return command.command.endsWith('\n') ? command.command : `${command.command}\n`
}
