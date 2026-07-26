import { Injectable } from '@angular/core'
import { AppService, BaseTabComponent, SplitTabComponent } from 'tabby-core'
import { BaseTerminalTabComponent } from 'tabby-terminal'

import { QuickPanelCommand, buildCommandPayload } from '../api'

@Injectable()
export class QuickPanelCommandSenderService {
  constructor (
    private app: AppService
  ) {}

  send (command: QuickPanelCommand): boolean {
    const terminal = this.resolveTerminal(this.app.activeTab)
    if (!terminal) {
      console.warn('[tabby-quick-panel] 未找到可接收快捷命令的当前终端标签页。')
      return false
    }

    terminal.sendInput(buildCommandPayload(command))
    return true
  }

  focusActiveTerminal (): boolean {
    const terminal = this.resolveTerminal(this.app.activeTab)
    if (!terminal) {
      return false
    }

    terminal.emitFocused()
    return true
  }

  private resolveTerminal (tab: BaseTabComponent | null | undefined): BaseTerminalTabComponent<any> | null {
    if (!tab) {
      return null
    }

    if (tab instanceof BaseTerminalTabComponent) {
      return tab
    }

    if (tab instanceof SplitTabComponent) {
      return this.resolveTerminal(tab.getFocusedTab())
    }

    return null
  }
}
