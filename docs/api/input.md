# 输入

AToolBox 不提供模拟键盘输入 API。插件输入来自组件 props 和进入事件。

## initialText

插件打开时带入的初始文本，没有内容时为空字符串。

```js
export default {
  props: {
    initialText: { type: String, default: '' }
  }
}
```

## enterAction

描述本次进入插件的功能编码、触发方式和载荷。

```js
export default {
  props: {
    enterAction: { type: Object, default: null }
  }
}
```

## 处理后续输入

插件保持打开时，新的搜索文本通过 `onPluginEnter` 进入：

```js
const removeEnter = api && api.onPluginEnter
  ? api.onPluginEnter((action) => {
      if (action.type !== 'img') {
        text.value = action.payload || ''
      }
    })
  : null
```

图片进入动作的 `payload` 是 data URL。更多类型见[事件](/api/events)。
