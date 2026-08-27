# 2. 开发

插件模板是一个远程 Vue 3 ESM 组件。将模板复制为自己的插件目录后，主要修改 `manifest.json` 和 `index.js`。

## 插件是什么

AToolBox 插件由宿主动态加载，负责界面和业务逻辑；复制、通知、存储、跳转与独立窗口等系统能力由宿主通过 `api` 提供。

插件运行在 Electron 渲染层，但不提供 Node.js、Electron 主进程、`require`、`fs` 或任意 IPC 能力。

## 开发前准备

- 安装并登录 AToolBox 客户端。
- 准备支持 JavaScript 的代码编辑器。
- 了解基础的 JavaScript、HTML、CSS 和 Vue 3。
- 下载[空白插件模板](/example)；需要查询能力时可同时下载 API 示例。
- 在客户端申请插件开发者资格。

## 创建插件工程

解压模板并复制为自己的插件目录：

```text
my_plugin/
├── manifest.json
├── index.js
└── README.md
```

先修改 `manifest.json` 中的基本信息：

```json
{
  "code": "my_plugin",
  "name": "我的插件",
  "version": "1.0.0",
  "description": "插件功能说明",
  "author": "Developer",
  "entry": "index.js",
  "runtime": "vue",
  "category": "开发工具",
  "keywords": ["tool"],
  "tags": ["工具"],
  "icon": "🧩",
  "permissions": [],
  "features": [],
  "clipboardRules": [],
  "config": {},
  "changelog": [
    { "version": "1.0.0", "notes": "首个版本" }
  ]
}
```

字段要点：

- `code` 是插件唯一编码，使用 snake_case，发布后不可修改。
- `version` 使用三段式版本号，发布新代码时必须递增。
- `entry` 指向包内的 `.js` 或 `.mjs` 入口文件。
- `runtime` 当前固定为 `vue`。
- `permissions` 只声明插件实际需要的权限。

## 编写入口组件

入口文件必须是原生 JavaScript ESM，并默认导出一个 Vue 组件：

```js
const { defineComponent, ref, h } = window.Vue

export default defineComponent({
  name: 'MyPlugin',
  props: {
    config: { type: Object, default: () => ({}) },
    initialText: { type: String, default: '' },
    enterAction: { type: Object, default: null },
    api: { type: Object, default: null }
  },
  setup(props) {
    const text = ref(props.initialText)
    return () => h('main', { class: 'plugin-my-plugin' }, text.value || '你好，AToolBox')
  }
})
```

开发时注意：

- Vue 运行时从 `window.Vue` 获取，不要重复打包 Vue。
- `api` 可能为空，调用具体能力前应判断方法是否存在。
- 事件监听和定时器需要在组件卸载时清理。
- CSS 类名使用 `plugin-` 前缀，避免覆盖宿主样式。
- 标题栏由宿主绘制，不要自绘标题栏或使用 `-webkit-app-region: drag`。

宿主能力见 [API 参考](/api/plugin-api)。

## 下一步

代码开发完成后，进入[3. 选择插件](/select-plugin)，在客户端登记这个插件目录。
