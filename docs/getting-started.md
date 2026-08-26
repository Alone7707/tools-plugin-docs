# 2. 开发

插件模板是一个远程 Vue 3 ESM 组件。将模板复制为自己的插件目录后，主要修改 `manifest.json` 和 `index.js`。

## 插件目录

```text
my_plugin/
├── manifest.json    # 必需：插件元数据
├── index.js         # 必需：ESM 入口
├── README.md        # 可选：说明文档
└── assets/          # 可选：图片与其他资源
```

上传包最多 20 个文件，单文件不超过 512 KB，总大小不超过 2 MB，目录最多 3 层。支持 `.js`、`.mjs`、`.json`、`.css`、`.md`、`.svg`、`.txt`、`.png`、`.jpg`、`.jpeg`、`.webp` 和 `.gif`。

## manifest.json

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

关键约束：

| 字段 | 规则 |
| --- | --- |
| `code` | 2-50 位 snake_case，小写字母开头；发布后不可修改 |
| `version` | 三段式版本号；发布新代码必须递增 |
| `entry` | 包内存在的 `.js` 或 `.mjs` 相对路径 |
| `runtime` | 固定为 `vue` |
| `permissions` | `clipboard:read`、`clipboard:write`、`network:fetch` 的组合 |

## 入口组件

入口必须默认导出 Vue 组件，并从 `window.Vue` 获取运行时：

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
    return () => h('main', { class: 'plugin-my-plugin' }, text.value || '请输入文本')
  }
})
```

`api` 可能为 `null`。使用复制、通知、存储、跳转或独立窗口能力前要判断方法是否存在；组件卸载时清理定时器和事件监听。宿主顶部标题栏由 AToolBox 绘制，插件不要自绘标题栏或声明 `-webkit-app-region: drag`。

完成代码开发后，进入[3. 选择插件](/select-plugin)，在客户端登记这个插件目录。
