import { HotkeyProvider } from 'tabby-core';
export declare class QuickPanelHotkeyProvider extends HotkeyProvider {
    provide(): Promise<{
        id: string;
        name: string;
    }[]>;
}
