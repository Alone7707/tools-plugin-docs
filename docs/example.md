# 1. 下载插件模板

根据开发目标选择空白模板或完整 API 示例。两个压缩包都可直接在 AToolBox 开发者专区中选择并调试。

## 下载

### 空白插件模板

最小可运行插件骨架，只保留 `manifest.json`、原生 ESM 入口和四个标准 props，适合直接开始业务开发。

[**下载空白插件模板 ZIP**](https://docs.a-tools.cc.cd/templates/plugin-template.zip.html)

### 插件 API 示例

按事件、窗口、剪贴板、系统、屏幕、插件身份和数据存储分类，提供全部第三方稳定公开 API 的调用示例。

[**下载插件 API 示例 ZIP**](https://docs.a-tools.cc.cd/templates/plugin-api-example.zip.html)

## 使用

1. 开发新插件时下载空白模板；查看宿主能力时下载 API 示例。
2. 解压 ZIP，并复制一份作为自己的插件目录。
3. 修改 `manifest.json` 中的 `code`、`name`、`description` 和 `author`。
4. 进入[2. 开发](/getting-started)编写插件功能。

完成模板下载后，不要直接上传；下一步先完成插件开发。

两个下载包的入口都是原生 ESM，使用宿主提供的 `window.Vue`，不需要安装 Vue，也不能使用 Node.js、Electron 或 `require`。
