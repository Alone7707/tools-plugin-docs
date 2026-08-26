# 事件、类型与错误

## `PluginEnterAction`

```ts
type PluginEnterAction = {
  code: string
  type: 'open' | 'text' | 'regex' | 'over' | 'img'
  payload: string
}
```

| `type` | 来源 | `payload` |
| --- | --- | --- |
| `open` | 用户直接打开插件 | 通常为空串 |
| `text` | `features[].cmds` 字符串命中 | 搜索框文本 |
| `regex` | 正则指令命中 | 命中文本 |
| `over` | 长度区间命中 | 命中文本 |
| `img` | 图片指令或剪贴板图片 | 图片 data URL |

`code` 是功能编码；没有显式声明时通常为 `main`，剪贴板识别入口使用 `clipboard`。插件应以 `type` 判断是否能把 `payload` 当作文本，`img` 类型不要直接写入文本框。

## 取消函数模式

所有 `on...` 监听器都返回取消函数：

```js
/** 订阅主题状态并在组件销毁时移除。 */
function subscribeTheme(api, onTheme) {
  if (!api || !api.onPluginEnter) return () => {}
  const removeListener = api.onPluginEnter(onTheme)
  // 监听器清理函数。
  return removeListener
}
```

对 `window.atoolbox` 的 preload 事件也是同样约定：`onXxx(callback) => () => void`。

## 错误行为

- Electron IPC 失败会由 preload 去掉通道名和包装错误，只保留可读的首行错误信息后重新抛出。
- API 返回 `boolean` 时，`false` 表示动作未完成或被宿主拒绝；不要把它当作异常字符串。
- `screenColorPick` 取消返回 `null`；`api.screenColorPick` 将主进程 `{ sRGBHex }` 转换为 `{ hex }`。
- 远程入口加载失败会在宿主显示错误和“重新加载”操作，插件本身无法绕过入口校验。

## 与标准浏览器能力的关系

插件可使用标准 `fetch`、DOM、`localStorage` 和 Vue 运行时。网络请求应声明 `network:fetch` 并满足目标服务 CORS。复制文本优先使用 `api.copyText`，因为窗口失焦时浏览器剪贴板策略可能拒绝直接写入。
