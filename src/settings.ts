import { Injectable } from '@angular/core'
import { SettingsTabProvider } from 'tabby-settings'

import { QuickPanelSettingsTabComponent } from './components/settingsTab.component'

@Injectable()
export class QuickPanelSettingsTabProvider extends SettingsTabProvider {
  id = 'quick-panel'
  icon = 'list'
  title = '快捷命令'

  getComponentType (): any {
    return QuickPanelSettingsTabComponent
  }
}
