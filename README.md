# Tabby Quick Panel

Tabby Terminal 的固定式快捷命令侧边栏插件。

这个插件用于替代弹窗式快捷命令菜单：

- 保存常用终端命令到 Tabby 配置中
- 支持命令分组
- 支持发送后追加回车
- 支持通过 `Alt+Shift+Q` 显示或隐藏左/右侧固定侧边栏
- 支持通过 `Alt+Q` 聚焦侧边栏并使用键盘选择命令
- 侧边栏挂载到 Tabby 主窗口 flex 布局中，行为接近原生 Profile Sidebar

## 状态

这是一个可运行的 Tabby 插件实现，不需要修改 Tabby core。Tabby 当前没有公开的一等侧边栏 provider，因此插件会动态挂载到 Tabby 的 `.window.h-100.d-flex` 布局容器中；配置、快捷键、设置页和工具栏按钮仍然使用公开插件 provider。

侧边栏布局参考 Tabby 1.0.235 的原生 `profile-tree`：面板作为 `.content.main` 旁边的 flex 子元素存在，不使用 fixed overlay，也不通过给终端区域打 margin 来挤出空间。

## 开发

```bash
npm install
npm run typecheck
npm run build
```

编译后的插件入口是 `dist/index.js`。

## 本地安装

开发调试可使用 Tabby 的插件开发方式：

```bash
set TABBY_PLUGINS=%CD%
tabby --debug
```

也可以执行构建后，将包含 `package.json`、`dist/index.js` 和 `README.md` 的整个插件目录放入 Tabby 本地插件目录。

## 配置

打开 Settings -> 快捷命令。

- 侧边栏：设置显示位置、宽度，以及 `Alt+Shift+Q` 打开后是否自动聚焦。
- 分组：管理命令分组；每个分组可单独展开或折叠。
- 命令：管理命令名称、分组、命令内容，以及发送后是否追加回车；每条命令可单独展开或折叠。

## 键盘操作

- `Alt+Shift+Q`：显示或隐藏侧边栏。
- `Alt+Q`：聚焦侧边栏。
- 普通字符：直接输入到搜索框并过滤命令。
- `ArrowUp` / `ArrowDown`：在可见分组和命令之间移动选择。
- `ArrowRight`：展开选中的分组，或在已展开分组中进入第一条命令。
- `ArrowLeft`：从命令返回所属分组，或折叠选中的分组。
- `Enter`：发送选中的命令，焦点回到当前终端，侧边栏保持显示。
- `Escape`：焦点回到当前终端，侧边栏保持显示。

## 说明

命令发送到 Tabby 当前活动终端标签页。如果当前标签页是 Split Tab，则发送到 Split Tab 内当前聚焦的终端。
