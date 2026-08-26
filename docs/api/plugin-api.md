# 受控插件 API

远程插件通过 `api` prop 获取 API。`api` 由宿主按插件 `code` 创建，每个插件实例的存储命名空间独立。浏览器直开、加载错误恢复页等场景 `api` 可能为 `null`，调用前应判空。

## 能力总览

| 方法 | 签名 | 作用 |
| --- | --- | --- |
| `copyText` | `(text: string) => Promise<boolean>` | 通过主进程复制文本；窗口失焦时仍可用 |
| `showNotification` | `(body: string, title?: string) => Promise<boolean>` | 发送系统通知；标题缺省使用插件名 |
| `hideMainWindow` | `() => void` | 最小化主窗口 |
| `outPlugin` | `() => void` | 返回搜索首页；独立窗口中关闭当前插件窗口 |
| `detachWindow` | `(options?: PluginDetachWindowOptions) => Promise<boolean>` | 将当前插件分离到可调整大小的独立窗口 |
| `isDetachedWindow` | `() => boolean` | 判断当前实例是否在独立窗口 |
| `redirect` | `(code: string, payload?: string) => void` | 打开另一个已安装插件并携带文本 |
| `getEnterAction` | `() => PluginEnterAction` | 读取当前进入动作 |
| `onPluginEnter` | `(callback) => () => void` | 注册首次挂载和再次进入回调，返回取消函数 |
| `onPluginOut` | `(callback) => () => void` | 注册插件退出回调，返回取消函数 |
| `db.get` | `<T>(key: string) => T \| null` | 读取隔离的 JSON 文档 |
| `db.put` | `(key: string, value: unknown) => boolean` | 写入隔离的 JSON 文档 |
| `db.remove` | `(key: string) => boolean` | 删除隔离的 JSON 文档 |
| `dbStorage.getItem` | `(key: string) => string \| null` | 读取隔离字符串 |
| `dbStorage.setItem` | `(key: string, value: string) => void` | 写入隔离字符串 |
| `dbStorage.removeItem` | `(key: string) => void` | 删除隔离字符串 |
| `screenColorPick` | `() => Promise<{ hex: string } \| null>` | 全屏取色，用户取消时返回 `null` |
| `shellOpenExternal` | `(url: string) => void` | 用系统默认浏览器打开 http(s) 链接 |
| `isDarkColors` | `() => boolean` | 读取当前主题是否为深色 |
| `setSubtitle` | `(text: string) => void` | 设置宿主标题栏副标题，最多 40 字；传空串清除 |
| `setDetachPayload` | `(provider: (() => PluginDetachWindowOptions \| null \| void) \| null) => void` | 提供双击分离时读取的动态载荷 |

## 独立窗口参数

```ts
type PluginDetachWindowOptions = {
  title?: string
  featureCode?: string
  initialText?: string
  width?: number
  height?: number
}
```

`pluginCode`、入口地址和运行类型由宿主绑定，插件不能通过此 API 替换身份或加载任意页面。`setDetachPayload` 的返回值也只接受上述字段。

## 存储示例

```js
/** 保存当前草稿。 */
function saveDraft(api, text) {
  if (!api || !api.db) return false
  return api.db.put('draft', { text, savedAt: Date.now() })
}

/** 读取当前插件草稿。 */
function loadDraft(api) {
  const draft = api && api.db ? api.db.get('draft') : null
  // 当前插件的草稿文档。
  return draft && typeof draft.text === 'string' ? draft.text : ''
}
```

存储键最终落在 `atoolbox-plugin-db:<pluginCode>:<key>` 命名空间；不要把用户密码或访问令牌写入插件存储。

## 进入动作与生命周期

```js
/** 绑定插件进入事件并返回清理函数。 */
function bindPluginEnter(api, applyPayload) {
  if (!api || !api.onPluginEnter) return () => {}
  return api.onPluginEnter((action) => {
    if (action.type !== 'img') applyPayload(action.payload || '')
  })
}
```

常驻插件在搜索框中再次命中时不会重新挂载，而是触发 `onPluginEnter`。在组件卸载时执行取消函数，避免热重载或切换插件后保留旧闭包。

## 推荐调用顺序

1. 优先调用 `api.copyText`、`api.showNotification` 等受控方法。
2. 对 `api` 和具体成员做能力检测，保证浏览器预览可用。
3. 需要离开时调用 `api.outPlugin`，不直接操作宿主 DOM。
4. 需要双击分离带走当前编辑内容时注册 `api.setDetachPayload`，传函数而不是静态对象。
