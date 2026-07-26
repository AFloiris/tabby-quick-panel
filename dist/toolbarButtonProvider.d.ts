import { ToolbarButtonProvider } from 'tabby-core';
import { QuickPanelSidebarHostService } from './services/sidebarHost.service';
export declare class QuickPanelToolbarButtonProvider extends ToolbarButtonProvider {
    private sidebarHost;
    constructor(sidebarHost: QuickPanelSidebarHostService);
    provide(): {
        icon: string;
        title: string;
        touchBarNSImage: string;
        weight: number;
        click: () => void;
    }[];
}
