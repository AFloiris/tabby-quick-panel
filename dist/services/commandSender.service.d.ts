import { AppService } from 'tabby-core';
import { QuickPanelCommand } from '../api';
export declare class QuickPanelCommandSenderService {
    private app;
    constructor(app: AppService);
    send(command: QuickPanelCommand): boolean;
    focusActiveTerminal(): boolean;
    private resolveTerminal;
}
