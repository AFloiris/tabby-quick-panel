import { QuickPanelConfig } from '../api';
export declare function getQuickPanelConfig(configRoot: Record<string, any>): QuickPanelConfig;
export declare function normalizeQuickPanelConfigInto(target: any): QuickPanelConfig;
export declare function replaceArray<T>(target: T[], next: T[]): void;
