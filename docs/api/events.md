# 事件

事件 API 用于读取插件进入上下文、监听再次进入和处理退出清理。

## getEnterAction

读取当前进入动作，与 `onPluginEnter` 最近一次收到的参数相同。

```ts
api.getEnterAction(): PluginEnterAction
```

```js
const action = api && api.getEnterAction ? api.getEnterAction() : null

if (action && action.type !== 'img') {
  text.value = action.payload || ''
}
```

## onPluginEnter

监听首次挂载和后续再次进入。用户从搜索框再次命中同一插件时，宿主通常不会重新挂载组件，而是触发该回调。

```ts
api.onPluginEnter(
  callback: (action: PluginEnterAction) => void
): () => void
```

```js
let removeEnter = null

if (api && api.onPluginEnter) {
  removeEnter = api.onPluginEnter((action) => {
    if (action.type === 'img') return
    text.value = action.payload || ''
  })
}

// onBeforeUnmount(() => removeEnter && removeEnter())
```

## onPluginOut

监听插件退出。适合停止计时器、取消任务或保存临时状态。

```ts
api.onPluginOut(callback: () => void): () => void
```

```js
const removeOut = api && api.onPluginOut
  ? api.onPluginOut(() => {
      clearInterval(timer)
    })
  : null
```

## onPluginDetach

监听当前插件成功分离为独立窗口。回调在窗口创建成功后触发，独立窗口中的调用会返回 `false`。

```ts
api.onPluginDetach(callback: () => void): () => void
```

## onThemeChange

监听宿主最终生效的明暗主题。注册时会先收到一次当前主题，后续应用设置或系统主题变化都会触发。

```ts
api.onThemeChange(callback: (theme: 'light' | 'dark') => void): () => void
```

```js
const removeTheme = api && api.onThemeChange
  ? api.onThemeChange((theme) => {
      document.documentElement.dataset.theme = theme
    })
  : null
```

## onWindowShow / onWindowHide

监听主窗口显示和隐藏。独立窗口中不会把独立窗口的原生显示状态转换为这两个事件。

```ts
api.onWindowShow(callback: () => void): () => void
api.onWindowHide(callback: () => void): () => void
```

适合暂停轮询、恢复焦点或刷新一次轻量数据；回调中不要执行高频网络任务。

## PluginEnterAction

```ts
type PluginEnterAction = {
  code: string
  type: 'open' | 'text' | 'regex' | 'over' | 'img'
  payload: string
}
```

| 类型 | 来源 | `payload` |
| --- | --- | --- |
| `open` | 直接打开插件 | 通常为空字符串 |
| `text` | 字符串指令命中 | 搜索文本 |
| `regex` | 正则指令命中 | 命中文本 |
| `over` | 文本长度区间命中 | 命中文本 |
| `img` | 图片指令或剪贴板图片 | 图片 data URL |
