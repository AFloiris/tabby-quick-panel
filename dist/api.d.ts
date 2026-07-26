export declare const CONFIG_KEY = "quickPanel";
export declare const HOTKEY_TOGGLE_SIDEBAR = "quick-panel.toggle-sidebar";
export declare const HOTKEY_FOCUS_SIDEBAR = "quick-panel.focus-sidebar";
export type QuickPanelSide = 'left' | 'right';
export interface QuickPanelCommandGroup {
    id: string;
    name: string;
}
export interface QuickPanelCommand {
    id: string;
    name: string;
    command: string;
    groupId?: string;
    appendNewline: boolean;
}
export interface QuickPanelSidebarConfig {
    visible: boolean;
    side: QuickPanelSide;
    width: number;
    focusOnToggle: boolean;
    topOffset: number;
    reserveTerminalSpace: boolean;
    layoutSelector: string;
}
export interface QuickPanelConfig {
    groups: QuickPanelCommandGroup[];
    commands: QuickPanelCommand[];
    sidebar: QuickPanelSidebarConfig;
}
export declare const DEFAULT_QUICK_PANEL_CONFIG: QuickPanelConfig;
export declare function cloneDefaultConfig(): QuickPanelConfig;
export declare function createId(prefix: string): string;
export declare function buildCommandPayload(command: QuickPanelCommand): string;
