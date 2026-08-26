# 开发教程

## 开发流程

AToolBox 插件由宿主动态加载，是一个远程 Vue 3 ESM 组件。推荐流程如下：

1. 下载[插件模板](/example)，复制为新的插件目录。
2. 修改 `manifest.json` 和 `index.js`，完成组件功能。
3. 在客户端申请插件开发者资格。
4. 在开发者专区登记本地目录并调试。
5. 在[插件后台](https://tools.770733914.xyz/admin)上传、送审，审核通过后发布。

本地调试由 AToolBox 客户端动态托管；线上上传和开发者后台使用 `https://tools.770733914.xyz`。

## 申请开发者资格

在 AToolBox 客户端打开「个人中心 → 申请插件开发者」，填写插件计划和联系方式，提交后等待管理员审核。申请通过后，侧栏入口会变为「开发者专区」。

![申请插件开发者](/images/developer-apply.png)

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
