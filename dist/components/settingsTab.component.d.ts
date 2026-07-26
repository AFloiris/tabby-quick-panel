import { OnInit } from '@angular/core';
import { QuickPanelCommand, QuickPanelCommandGroup, QuickPanelConfig } from '../api';
import { QuickPanelCommandStoreService } from '../services/commandStore.service';
export declare class QuickPanelSettingsTabComponent implements OnInit {
    private store;
    model: QuickPanelConfig;
    sidebarExpanded: boolean;
    groupsExpanded: boolean;
    commandsExpanded: boolean;
    private expandedGroupIds;
    private expandedCommandIds;
    constructor(store: QuickPanelCommandStoreService);
    ngOnInit(): void;
    save(): Promise<void>;
    addGroup(): Promise<void>;
    deleteGroup(group: QuickPanelCommandGroup): Promise<void>;
    addCommand(): Promise<void>;
    duplicateCommand(command: QuickPanelCommand): Promise<void>;
    deleteCommand(command: QuickPanelCommand): Promise<void>;
    toggleCommand(command: QuickPanelCommand): void;
    isCommandExpanded(command: QuickPanelCommand): boolean;
    toggleGroupEditor(group: QuickPanelCommandGroup): void;
    isGroupExpanded(group: QuickPanelCommandGroup): boolean;
    groupCommandCount(groupId: string): number;
    groupName(groupId?: string): string;
    trackByGroup(_index: number, group: QuickPanelCommandGroup): string;
    trackByCommand(_index: number, command: QuickPanelCommand): string;
}
