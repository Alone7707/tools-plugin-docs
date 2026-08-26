# AToolBox 插件开发

AToolBox 插件是由桌面端动态加载的 Vue 3 ESM 组件。插件运行在 Electron 的渲染层，但第三方代码不应直接依赖 Node.js、Electron 主进程或任意 IPC 通道。

## 先记住三条边界

1. 入口必须 `export default` 一个 Vue 组件。
2. Vue 从 `window.Vue` 获取，不要在插件包中重复打包 Vue。
3. 宿主能力通过 `api` prop 传入；优先使用 [受控插件 API](/api/plugin-api)，不要把 `window.atoolbox` 当作第三方稳定 API。

## 文档导航

| 目标 | 文档 |
| --- | --- |
| 写出第一个能运行的插件 | [快速开始](/getting-started) |
| 理解加载方式、props 和版本缓存 | [运行模型与目录结构](/runtime) |
| 配置 `manifest.json` | [Manifest 规范](/manifest) |
| 下载并修改可运行的插件代码 | [完整示例插件](/example) |
| 调用复制、存储、通知、取色、跳转和独立窗口 | [受控插件 API](/api/plugin-api) |
| 为插件项目补充编辑器类型提示 | [TypeScript 类型参考](/api/types) |
| 查阅 Electron preload 暴露的全部方法 | [Electron Bridge 完整清单](/api/electron-bridge) |
| 处理进入事件、卸载和错误 | [事件、类型与错误](/api/contracts) |
| 在本地热更新插件 | [本地调试](/debugging) |
| 上传、送审和发布版本 | [上传、审核与发布](/release) |

## 代码事实来源

本文档按当前仓库实现整理。接口实现位于 `desktop-client/src/preload/index.ts` 和 `desktop-client/src/renderer/src/utils/pluginApi.ts`；插件加载器位于 `desktop-client/src/renderer/src/components/plugins/RemotePluginHost.vue`。如果实现与文档不一致，以代码和服务端清单校验为准。
