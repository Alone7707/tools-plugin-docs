# AToolBox 插件开发

AToolBox 插件是由桌面端动态加载的 Vue 3 ESM 组件。插件运行在 Electron 的渲染层，但第三方代码不应直接依赖 Node.js、Electron 主进程或任意 IPC 通道。

## 先记住三条边界

1. 入口必须 `export default` 一个 Vue 组件。
2. Vue 从 `window.Vue` 获取，不要在插件包中重复打包 Vue。
3. 宿主能力通过 `api` prop 传入；优先使用 [受控插件 API](/api/plugin-api)，不要把 `window.atoolbox` 当作第三方稳定 API。

## 快速入口

| 目标 | 文档 |
| --- | --- |
| 下载插件模板 | [插件模板下载](/example) |
| 调用宿主能力 | [开放 API](/api/plugin-api) |
| 开始编写插件 | [开发教程](/getting-started) |
| 本地热更新与排错 | [调试教程](/debugging) |
| 调用线上 HTTP API | [https://tools.770733914.xyz](https://tools.770733914.xyz) |
| 打开插件后台 | [后台地址](https://tools.770733914.xyz/admin) |
| 上传、送审和发布版本 | [上传教程](/release) |

开放 API 的类型补充和事件约定可从侧边栏进入；开发教程中包含运行模型、Manifest 和权限说明。
