'use strict'

const assert = require('assert')
const { getQuickPanelConfig } = require('../.tmp-config-test/services/quickPanelConfig')

const quickPanel = {
  groups: [{ id: 'g1', name: '' }],
  commands: [{ id: 'c1', name: '', command: 42, groupId: '', appendNewline: 1 }],
  sidebar: { visible: true, side: 'invalid', width: 9999, topOffset: -10, layoutSelector: '' }
}

const configRoot = {}
Object.defineProperty(configRoot, 'quickPanel', {
  enumerable: true,
  get () {
    return quickPanel
  }
})

const normalized = getQuickPanelConfig(configRoot)

assert.strictEqual(normalized, quickPanel)
assert.deepStrictEqual(normalized.groups, [{ id: 'g1', name: '未命名分组' }])
assert.deepStrictEqual(normalized.commands, [{
  id: 'c1',
  name: '未命名命令',
  command: '',
  groupId: undefined,
  appendNewline: true
}])
assert.deepStrictEqual(normalized.sidebar, {
  visible: true,
  side: 'right',
  width: 640,
  topOffset: 0,
  focusOnToggle: false,
  reserveTerminalSpace: true,
  layoutSelector: '.content.main'
})

let rootAssignmentFailed = false
try {
  configRoot.quickPanel = {}
} catch (_error) {
  rootAssignmentFailed = true
}

assert.strictEqual(rootAssignmentFailed, true)
assert.strictEqual(configRoot.quickPanel, quickPanel)

console.log('config getter-only regression passed')
