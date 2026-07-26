import { Injectable } from '@angular/core'
import { ConfigProvider } from 'tabby-core'

import { HOTKEY_FOCUS_SIDEBAR, HOTKEY_TOGGLE_SIDEBAR, cloneDefaultConfig } from './api'

@Injectable()
export class QuickPanelConfigProvider extends ConfigProvider {
  defaults = {
    quickPanel: cloneDefaultConfig(),
    hotkeys: {
      [HOTKEY_TOGGLE_SIDEBAR]: [
        'Alt-Shift-Q'
      ],
      [HOTKEY_FOCUS_SIDEBAR]: [
        'Alt-Q'
      ]
    }
  }
}
