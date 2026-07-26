import {
  CONFIG_KEY,
  QuickPanelCommand,
  QuickPanelCommandGroup,
  QuickPanelConfig,
  QuickPanelSidebarConfig,
  cloneDefaultConfig
} from '../api'

export function getQuickPanelConfig (configRoot: Record<string, any>): QuickPanelConfig {
  const quickPanel = configRoot[CONFIG_KEY]
  if (!quickPanel) {
    throw new Error(`Missing ${CONFIG_KEY} config. Confirm QuickPanelConfigProvider is registered.`)
  }

  return normalizeQuickPanelConfigInto(quickPanel)
}

export function normalizeQuickPanelConfigInto (target: any): QuickPanelConfig {
  const normalized = normalizeQuickPanelConfig(target)

  setArray(target, 'groups', normalized.groups)
  setArray(target, 'commands', normalized.commands)
  Object.assign(ensureObject(target, 'sidebar'), normalized.sidebar)

  return target as QuickPanelConfig
}

export function replaceArray<T> (target: T[], next: T[]): void {
  target.splice(0, target.length, ...next)
}

function setArray<T> (target: any, key: string, next: T[]): void {
  if (Array.isArray(target[key])) {
    replaceArray(target[key], next)
    return
  }

  target[key] = next
}

function ensureObject (target: any, key: string): Record<string, any> {
  if (target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
    return target[key]
  }

  target[key] = {}
  return target[key]
}

function normalizeQuickPanelConfig (source: Partial<QuickPanelConfig> | undefined): QuickPanelConfig {
  const defaults = cloneDefaultConfig()
  const candidate = source ?? defaults
  const groups = Array.isArray(candidate.groups) ? candidate.groups : defaults.groups
  const commands = Array.isArray(candidate.commands) ? candidate.commands : defaults.commands
  const sidebar = {
    ...defaults.sidebar,
    ...(candidate.sidebar ?? {})
  }

  return {
    groups: normalizeGroups(groups),
    commands: normalizeCommands(commands),
    sidebar: normalizeSidebar(sidebar, defaults.sidebar)
  }
}

function normalizeGroups (groups: any[]): QuickPanelCommandGroup[] {
  return groups
    .filter(group => group && typeof group.id === 'string')
    .map(group => ({
      id: group.id,
      name: typeof group.name === 'string' && group.name.trim() ? group.name : '未命名分组'
    }))
}

function normalizeCommands (commands: any[]): QuickPanelCommand[] {
  return commands
    .filter(command => command && typeof command.id === 'string')
    .map(command => ({
      id: command.id,
      name: typeof command.name === 'string' && command.name.trim() ? command.name : '未命名命令',
      command: typeof command.command === 'string' ? command.command : '',
      groupId: typeof command.groupId === 'string' && command.groupId ? command.groupId : undefined,
      appendNewline: Boolean(command.appendNewline)
    }))
}

function normalizeSidebar (
  sidebar: Partial<QuickPanelSidebarConfig>,
  defaults: QuickPanelSidebarConfig
): QuickPanelSidebarConfig {
  return {
    visible: Boolean(sidebar.visible),
    side: sidebar.side === 'left' ? 'left' : 'right',
    width: clampNumber(sidebar.width, 180, 640, defaults.width),
    focusOnToggle: Boolean(sidebar.focusOnToggle),
    topOffset: clampNumber(sidebar.topOffset, 0, 160, defaults.topOffset),
    reserveTerminalSpace: Boolean(sidebar.reserveTerminalSpace),
    layoutSelector: typeof sidebar.layoutSelector === 'string' && sidebar.layoutSelector.trim()
      ? sidebar.layoutSelector
      : defaults.layoutSelector
  }
}

function clampNumber (value: unknown, min: number, max: number, fallback: number): number {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) {
    return fallback
  }

  return Math.min(max, Math.max(min, Math.round(numeric)))
}
