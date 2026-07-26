import { Injectable } from '@angular/core'
import { HotkeyProvider } from 'tabby-core'

import { HOTKEY_FOCUS_SIDEBAR, HOTKEY_TOGGLE_SIDEBAR } from './api'

@Injectable()
export class QuickPanelHotkeyProvider extends HotkeyProvider {
  async provide () {
    return [
      {
        id: HOTKEY_TOGGLE_SIDEBAR,
        name: '显示/隐藏快捷命令侧边栏'
      },
      {
        id: HOTKEY_FOCUS_SIDEBAR,
        name: '聚焦快捷命令侧边栏'
      }
    ]
  }
}
