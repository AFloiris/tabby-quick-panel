export interface SidebarDockTarget {
    mainContent: HTMLElement;
    windowElement: HTMLElement;
}
export declare function findSidebarDockTarget(document: Pick<Document, 'querySelector'>, layoutSelector: string): SidebarDockTarget | null;
