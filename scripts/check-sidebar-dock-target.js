'use strict'

const assert = require('assert')
const { findSidebarDockTarget } = require('../.tmp-sidebar-target-test/sidebarDockTarget')

function createElement (classNames = []) {
  return {
    parentElement: null,
    classList: {
      contains: className => classNames.includes(className)
    }
  }
}

const missingDocument = {
  querySelector: () => null
}

assert.strictEqual(
  findSidebarDockTarget(missingDocument, '.content.main'),
  null,
  'early Tabby startup must not throw when the main content has not been created yet'
)

const mainContent = createElement(['content', 'main'])
const windowElement = createElement(['window'])
mainContent.parentElement = windowElement

const readyDocument = {
  querySelector: selector => selector === '.content.main' ? mainContent : null
}

assert.deepStrictEqual(
  findSidebarDockTarget(readyDocument, '.content.main'),
  { mainContent, windowElement }
)

console.log('sidebar dock target regression passed')
