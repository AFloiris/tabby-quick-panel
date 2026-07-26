import { ConfigProvider } from 'tabby-core';
export declare class QuickPanelConfigProvider extends ConfigProvider {
    defaults: {
        quickPanel: import("./api").QuickPanelConfig;
        hotkeys: {
            "quick-panel.toggle-sidebar": string[];
            "quick-panel.focus-sidebar": string[];
        };
    };
}
