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
