import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { NgModule } from '@angular/core'
import {
  ConfigProvider,
  HotkeyProvider,
  ToolbarButtonProvider
} from 'tabby-core'
import TabbyCoreModule from 'tabby-core'
import { SettingsTabProvider } from 'tabby-settings'

import { QuickPanelSidebarComponent } from './components/sidebar.component'
import { QuickPanelSettingsTabComponent } from './components/settingsTab.component'
import { QuickPanelConfigProvider } from './config'
import { QuickPanelHotkeyProvider } from './hotkeys'
import { QuickPanelSettingsTabProvider } from './settings'
import { QuickPanelToolbarButtonProvider } from './toolbarButtonProvider'
import { QuickPanelCommandSenderService } from './services/commandSender.service'
import { QuickPanelCommandStoreService } from './services/commandStore.service'
import { QuickPanelSidebarHostService } from './services/sidebarHost.service'

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TabbyCoreModule
  ],
  declarations: [
    QuickPanelSidebarComponent,
    QuickPanelSettingsTabComponent
  ],
  entryComponents: [
    QuickPanelSidebarComponent,
    QuickPanelSettingsTabComponent
  ],
  providers: [
    QuickPanelCommandSenderService,
    QuickPanelCommandStoreService,
    QuickPanelSidebarHostService,
    {
      provide: ConfigProvider,
      useClass: QuickPanelConfigProvider,
      multi: true
    },
    {
      provide: HotkeyProvider,
      useClass: QuickPanelHotkeyProvider,
      multi: true
    },
    {
      provide: SettingsTabProvider,
      useClass: QuickPanelSettingsTabProvider,
      multi: true
    },
    {
      provide: ToolbarButtonProvider,
      useClass: QuickPanelToolbarButtonProvider,
      multi: true
    }
  ]
})
export default class QuickPanelModule {
  constructor (
    sidebarHost: QuickPanelSidebarHostService
  ) {
    sidebarHost.start()
  }
}
