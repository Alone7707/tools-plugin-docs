# 1. 下载插件模板

这是与 AToolBox 完整项目同步的可运行插件模板，包含文本工作台、进入动作、剪贴板、隔离存储、系统通知、主题和宿主顶栏交互示例。

## 下载

[**插件模板 ZIP**](/templates/plugin-example.zip)

## 使用

1. 解压 ZIP，并复制一份作为自己的插件目录。
2. 修改 `manifest.json` 中的 `code`、`name`、`description` 和 `author`。
3. 进入[2. 开发](/getting-started)编写插件功能。

完成模板下载后，不要直接上传；下一步先完成插件开发。

模板入口是原生 ESM，使用宿主提供的 `window.Vue`，不需要安装 Vue，也不能使用 Node.js、Electron 或 `require`。
