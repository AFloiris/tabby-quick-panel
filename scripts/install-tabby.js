'use strict'

const childProcess = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

const pluginRoot = path.resolve(__dirname, '..')
const packageJsonPath = path.join(pluginRoot, 'package.json')
const packageJson = readJson(packageJsonPath)
const packageName = packageJson.name
const shouldRestart = process.argv.includes('--restart')

if (!packageName) {
  throw new Error('package.json must define a package name')
}

const distEntry = path.join(pluginRoot, packageJson.main || 'dist/index.js')
if (!fs.existsSync(distEntry)) {
  throw new Error(`Build output is missing: ${distEntry}`)
}

const tabbyPluginsDir = getTabbyPluginsDir()
const tabbyPluginsPackagePath = path.join(tabbyPluginsDir, 'package.json')

fs.mkdirSync(tabbyPluginsDir, { recursive: true })

const tabbyPluginsPackage = fs.existsSync(tabbyPluginsPackagePath)
  ? readJson(tabbyPluginsPackagePath)
  : {}

tabbyPluginsPackage.dependencies = tabbyPluginsPackage.dependencies || {}
tabbyPluginsPackage.dependencies[packageName] = toFileDependency(pluginRoot)
writeJson(tabbyPluginsPackagePath, tabbyPluginsPackage)

const installedPackageDir = getInstalledPackageDir(tabbyPluginsDir, packageName)
fs.rmSync(installedPackageDir, { recursive: true, force: true })

runNpm(['install', '--legacy-peer-deps', '--no-audit', '--no-fund'], tabbyPluginsDir)

if (shouldRestart) {
  stopTabby()
  startTabby()
}

console.log(`Installed ${packageName} into ${tabbyPluginsDir}`)

function getTabbyPluginsDir () {
  if (process.env.TABBY_PLUGINS_DIR) {
    return path.resolve(process.env.TABBY_PLUGINS_DIR)
  }

  if (process.platform === 'win32') {
    if (!process.env.APPDATA) {
      throw new Error('APPDATA is not set; set TABBY_PLUGINS_DIR explicitly')
    }
    return path.join(process.env.APPDATA, 'tabby', 'plugins')
  }

  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'tabby', 'plugins')
  }

  const configHome = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config')
  return path.join(configHome, 'tabby', 'plugins')
}

function toFileDependency (targetPath) {
  return `file:${targetPath.replace(/\\/g, '/')}`
}

function getInstalledPackageDir (pluginsDir, name) {
  return path.join(pluginsDir, 'node_modules', ...name.split('/'))
}

function readJson (filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function writeJson (filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

function runNpm (args, cwd) {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  const result = childProcess.spawnSync(npmCommand, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    process.exit(result.status)
  }
}

function stopTabby () {
  if (process.platform !== 'win32') {
    console.warn('Automatic Tabby restart is currently only supported on Windows.')
    return
  }

  runPowerShell([
    "$ErrorActionPreference = 'Stop'",
    "Get-Process -Name Tabby -ErrorAction SilentlyContinue | Stop-Process -Force"
  ].join('; '))
}

function startTabby () {
  if (process.platform !== 'win32') {
    return
  }

  runPowerShell([
    "$candidate = Join-Path $env:LOCALAPPDATA 'Programs\\Tabby\\Tabby.exe'",
    'if (Test-Path -LiteralPath $candidate) { Start-Process -FilePath $candidate; exit 0 }',
    "$command = Get-Command Tabby.exe -ErrorAction SilentlyContinue",
    'if ($command) { Start-Process -FilePath $command.Source; exit 0 }',
    "Write-Error 'Cannot find Tabby.exe'"
  ].join('; '))
}

function runPowerShell (command) {
  const result = childProcess.spawnSync('powershell.exe', [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-Command',
    command
  ], {
    stdio: 'inherit',
    shell: false
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    process.exit(result.status)
  }
}
