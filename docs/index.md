# AToolBox 插件开发

AToolBox 插件是由桌面端动态加载的 Vue 3 ESM 组件。插件运行在 Electron 的渲染层，但第三方代码不应直接依赖 Node.js、Electron 主进程或任意 IPC 通道。

## 先记住三条边界

1. 入口必须 `export default` 一个 Vue 组件。
2. Vue 从 `window.Vue` 获取，不要在插件包中重复打包 Vue。
3. 宿主能力通过 `api` prop 传入；优先使用 [受控插件 API](/api/plugin-api)，不要把 `window.atoolbox` 当作第三方稳定 API。

## 开发流程

| 阶段 | 进入 |
| --- | --- |
| 1. 下载插件模板 | [下载可运行模板](/example) |
| 2. 开发 | [编写插件代码](/getting-started) |
| 3. 选择插件 | [登记插件目录](/select-plugin) |
| 4. 调试 | [打开插件并重新加载](/debugging) |
| 5. 到开发者后台上传插件 | [上传插件](/release) |

## API 参考

宿主 API 已按事件、窗口、复制、输入、系统、屏幕、用户、数据存储和动态指令分类。每个分类页面独立说明用途、使用方法、返回值和约束。

| 目标 | 文档 |
| --- | --- |
| 浏览 API 分类 | [API 参考](/api/plugin-api) |
| 调用线上 HTTP API | [https://tools.770733914.xyz](https://tools.770733914.xyz) |

API 参考按能力分类展示宿主提供给插件的公开接口。
