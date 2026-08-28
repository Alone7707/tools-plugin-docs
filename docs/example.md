# 1. 下载插件模板

根据开发目标选择空白模板或完整 API 示例。两个压缩包都包含 Vue 源码、构建配置和示例产物；修改源码后必须重新构建，不能直接上传模板自带的 `dist`。

## 下载

### 空白插件模板

最小可运行 Vue + Vite 插件工程，包含 `src/App.vue`、`src/main.js` 和构建配置，适合直接开始业务开发。

[**下载空白插件模板 ZIP**](https://docs.a-tools.cc.cd/templates/plugin-template.zip.html)

### 插件 API 示例

按事件、窗口、剪贴板、系统、屏幕、插件身份和数据存储分类，提供全部第三方稳定公开 API 的调用示例。

[**下载插件 API 示例 ZIP**](https://docs.a-tools.cc.cd/templates/plugin-api-example.zip.html)

## 使用

1. 开发新插件时下载空白模板；查看宿主能力时下载 API 示例。
2. 解压 ZIP，并复制一份作为自己的插件目录。
3. 修改 `manifest.json` 中的 `code`、`name`、`description` 和 `author`。
4. 进入[2. 开发](/getting-started)编写插件功能。

完成模板下载后，不要直接上传。开发、调试完成后执行 `pnpm build`，最终只上传重新生成的 `dist` 目录。

两个下载包都使用标准 Vue SFC 开发。首次开发需在插件目录执行 `pnpm install`；构建后的 `dist/index.js` 使用宿主提供的 `window.Vue`，不能使用 Node.js、Electron 或 `require`。
