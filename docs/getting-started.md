# 快速开始

## 1. 准备运行环境

在仓库根目录执行：

```bash
pnpm install
pnpm dev:server
pnpm dev
```

将插件目录放在 `server/public/plugins/<plugin-folder>/`，开发服务会把它作为静态资源托管。桌面端开发模式使用该目录下的入口 URL 加载插件。

## 2. 创建最小插件

目录：

```text
my_plugin/
├── manifest.json
└── index.js
```

`manifest.json`：

```json
{
  "code": "word_counter",
  "name": "字数统计",
  "version": "1.0.0",
  "description": "统计文本中的字符、词和行",
  "author": "开发者",
  "entry": "index.js",
  "runtime": "vue",
  "category": "效率办公",
  "keywords": ["word", "字数"],
  "permissions": ["clipboard:write"],
  "features": [
    { "name": "字数统计", "description": "统计输入文本", "code": "count", "cmds": ["字数"] }
  ],
  "config": { "showStats": true }
}
```

`index.js`：

```js
const VueRuntime = window.Vue
// 宿主注入的 Vue 运行时。

if (!VueRuntime) throw new Error('AToolBox Vue runtime is unavailable')

const { defineComponent, ref, computed, h, onMounted, onBeforeUnmount } = VueRuntime
// 插件使用的 Vue API。

export default defineComponent({
  name: 'WordCounterPlugin',
  props: {
    config: { type: Object, default: () => ({}) },
    initialText: { type: String, default: '' },
    enterAction: { type: Object, default: null },
    api: { type: Object, default: null }
  },
  setup(props) {
    const text = ref(String(props.initialText || ''))
    // 当前编辑文本。
    const characterCount = computed(() => Array.from(text.value).length)
    // Unicode 字符数。
    let removeEnterListener = null
    // 进入事件取消函数。

    /** 同步宿主再次进入插件时带入的文本。 */
    function handlePluginEnter(action) {
      if (action && action.type !== 'img') text.value = String(action.payload || '')
    }

    onMounted(() => {
      if (props.api && props.api.onPluginEnter) {
        removeEnterListener = props.api.onPluginEnter(handlePluginEnter)
      }
    })

    onBeforeUnmount(() => {
      removeEnterListener && removeEnterListener()
      removeEnterListener = null
    })

    return () => h('main', { class: 'plugin-word-counter' }, [
      h('textarea', {
        value: text.value,
        onInput: (event) => { text.value = event.target.value }
      }),
      h('p', null, `字符数：${characterCount.value}`),
      h('button', {
        type: 'button',
        onClick: () => props.api && props.api.copyText(text.value)
      }, '复制')
    ])
  }
})
```

## 3. 调试入口

开发者专区可以登记插件目录。重新登记或点击“重新加载”会递增调试版本指纹，浏览器会重新请求模块；开发模式不需要为了每次改动修改正式版本号。

## 4. 验收前检查

- 入口文件是原生 ESM，且存在 `export default`。
- 没有 `require`、`fs`、`electron`、`ipcRenderer` 或 Node 内置模块。
- 所有定时器、事件监听器在 `onBeforeUnmount` / `onUnmounted` 中清理。
- 自定义 CSS 使用 `plugin-` 前缀，不覆盖宿主全局样式。
- 代码改动后递增 `manifest.version` 再发布。
