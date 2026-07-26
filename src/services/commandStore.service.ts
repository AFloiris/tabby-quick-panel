import { Injectable } from '@angular/core'
import { ConfigService } from 'tabby-core'

import {
  QuickPanelCommand,
  QuickPanelCommandGroup,
  QuickPanelConfig,
  createId
} from '../api'
import { getQuickPanelConfig, replaceArray } from './quickPanelConfig'

@Injectable()
export class QuickPanelCommandStoreService {
  constructor (
    private config: ConfigService
  ) {}

  get value (): QuickPanelConfig {
    return getQuickPanelConfig(this.config.store)
  }

  async save (): Promise<void> {
    getQuickPanelConfig(this.config.store)
    await this.config.save()
  }

  async addGroup (): Promise<QuickPanelCommandGroup> {
    const group: QuickPanelCommandGroup = {
      id: createId('group'),
      name: '新建分组'
    }
    this.value.groups.push(group)
    await this.save()
    return group
  }

  async deleteGroup (group: QuickPanelCommandGroup): Promise<void> {
    const quickPanel = this.value
    replaceArray(quickPanel.groups, quickPanel.groups.filter(item => item.id !== group.id))
    quickPanel.commands
      .filter(command => command.groupId === group.id)
      .forEach(command => {
        command.groupId = undefined
      })
    await this.save()
  }

  async addCommand (groupId?: string): Promise<QuickPanelCommand> {
    const command: QuickPanelCommand = {
      id: createId('command'),
      name: '新建命令',
      command: '',
      groupId,
      appendNewline: false
    }
    this.value.commands.push(command)
    await this.save()
    return command
  }

  async duplicateCommand (source: QuickPanelCommand): Promise<QuickPanelCommand> {
    const command: QuickPanelCommand = {
      ...source,
      id: createId('command'),
      name: `${source.name} 副本`
    }
    this.value.commands.push(command)
    await this.save()
    return command
  }

  async deleteCommand (command: QuickPanelCommand): Promise<void> {
    const quickPanel = this.value
    replaceArray(quickPanel.commands, quickPanel.commands.filter(item => item.id !== command.id))
    await this.save()
  }
}
