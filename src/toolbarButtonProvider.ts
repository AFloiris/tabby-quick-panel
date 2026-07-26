import { Injectable } from '@angular/core'
import { ToolbarButtonProvider } from 'tabby-core'

import { QuickPanelSidebarHostService } from './services/sidebarHost.service'

const PANEL_ICON = `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
  stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="4" width="18" height="16" rx="2"></rect>
  <path d="M9 4v16"></path>
  <path d="M6 8h1"></path>
  <path d="M6 12h1"></path>
  <path d="M6 16h1"></path>
  <path d="M12 9h6"></path>
  <path d="M12 13h6"></path>
  <path d="M12 17h4"></path>
</svg>`

@Injectable()
export class QuickPanelToolbarButtonProvider extends ToolbarButtonProvider {
  constructor (
    private sidebarHost: QuickPanelSidebarHostService
  ) {
    super()
  }

  provide () {
    return [
      {
        icon: PANEL_ICON,
        title: '快捷命令',
        touchBarNSImage: 'NSTouchBarSidebarTemplate',
        weight: 10,
        click: () => {
          void this.sidebarHost.toggle()
        }
      }
    ]
  }
}
