export interface SidebarDockTarget {
  mainContent: HTMLElement
  windowElement: HTMLElement
}

export function findSidebarDockTarget (
  document: Pick<Document, 'querySelector'>,
  layoutSelector: string
): SidebarDockTarget | null {
  const mainContent = document.querySelector(layoutSelector) as HTMLElement | null
  const windowElement = mainContent?.parentElement

  if (!mainContent || !windowElement?.classList.contains('window')) {
    return null
  }

  return {
    mainContent,
    windowElement
  }
}
