import { ConfigService } from 'tabby-core';
import { QuickPanelCommand, QuickPanelCommandGroup, QuickPanelConfig } from '../api';
export declare class QuickPanelCommandStoreService {
    private config;
    constructor(config: ConfigService);
    get value(): QuickPanelConfig;
    save(): Promise<void>;
    addGroup(): Promise<QuickPanelCommandGroup>;
    deleteGroup(group: QuickPanelCommandGroup): Promise<void>;
    addCommand(groupId?: string): Promise<QuickPanelCommand>;
    duplicateCommand(source: QuickPanelCommand): Promise<QuickPanelCommand>;
    deleteCommand(command: QuickPanelCommand): Promise<void>;
}
