# 2. 开发

插件模板是一个标准 Vue 3 + Vite 工程。将模板复制为自己的插件目录后，在 `src` 中使用 `.vue` 和 `.js` 文件开发，构建后的 `dist` 才是客户端调试和后台上传的插件包。

## 插件是什么

ToolZen 插件由宿主动态加载，负责界面和业务逻辑；复制、通知、存储、跳转与独立窗口等系统能力由宿主通过 `api` 提供。

插件运行在 Electron 渲染层，但不提供 Node.js、Electron 主进程、`require`、`fs` 或任意 IPC 能力。

## 开发前准备

- 安装并登录 ToolZen 客户端。
- 准备支持 JavaScript 的代码编辑器。
- 了解基础的 JavaScript、HTML、CSS 和 Vue 3。
- 下载[空白插件模板](/example)；需要查询能力时可同时下载 API 示例。
- 在客户端申请插件开发者资格。

## 创建插件工程

解压模板并复制为自己的插件目录：

```text
my_plugin/
├── package.json
├── vite.config.js
├── manifest.json
├── src/
│   ├── App.vue
│   └── main.js
```

安装依赖并开始构建：

```bash
pnpm install
pnpm dev       # 调试阶段持续构建，监听 src 下的 .vue / .js 文件
pnpm build     # 发布前生成正式插件包到 dist
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
- `entry` 固定指向构建包内的 `index.js`；源码入口是 `src/main.js`。
- `runtime` 当前固定为 `vue`。
- `permissions` 只声明插件实际需要的权限。

完整的顶层字段、嵌套字段、校验限制和默认值见 [`manifest.json` 字段参考](/manifest)。

## 编写 Vue 组件

在 `src/App.vue` 中使用 Vue 单文件组件：

```vue
<script setup>
import { ref } from 'vue'

const props = defineProps({
  /** 宿主传入的初始文本。 */
  initialText: { type: String, default: '' },
  /** 宿主公开的插件 API。 */
  api: { type: Object, default: null }
})
// 插件运行参数。
const text = ref(props.initialText)
// 当前编辑文本。
</script>

<template>
  <main class="plugin-my-plugin">{{ text || '你好，ToolZen' }}</main>
</template>
```

`src/main.js` 只负责导出根组件：

```js
import App from './App.vue'

export default App
```

开发时注意：

- Vite 配置会把源码中的 `vue` 导入映射到宿主 `window.Vue`，不要手动修改为 Electron API。
- `api` 可能为空，调用具体能力前应判断方法是否存在。
- 事件监听和定时器需要在组件卸载时清理。
- CSS 类名使用 `plugin-` 前缀，避免覆盖宿主样式。
- 标题栏由宿主绘制，不要自绘标题栏或使用 `-webkit-app-region: drag`。

宿主能力见 [API 参考](/api/plugin-api)。

## 下一步

代码开发完成后，保持 `pnpm dev` 运行并进入[3. 选择插件](/select-plugin)，在客户端登记持续构建生成的 `dist` 目录。
