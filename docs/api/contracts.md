# 事件、类型与错误

## `PluginEnterAction`

```ts
type PluginEnterAction = {
  code: string
  type: 'open' | 'text' | 'regex' | 'over' | 'img' | 'file'
  payload: string
  files?: string[]
}
```

| `type` | 来源 | `payload` |
| --- | --- | --- |
| `open` | 用户直接打开插件 | 通常为空串 |
| `text` | `features[].cmds` 字符串命中 | 搜索框文本 |
| `regex` | 正则指令命中 | 命中文本 |
| `over` | 长度区间命中 | 命中文本 |
| `img` | 图片指令或剪贴板图片 | 图片 data URL |
| `file` | 剪贴板文件候选，或剪贴板持有文件时按插件名打开 | 绝对路径用 `\n` 连接 |

`code` 是功能编码；没有显式声明时通常为 `main`，剪贴板识别入口使用 `clipboard`。插件应以 `type` 判断是否能把 `payload` 当作文本，`img` 类型不要直接写入文本框。

`type` 为 `file` 时，`files` 是绝对路径数组，`payload` 是同一批路径用 `\n` 连接的结果（留给只读字符串的插件）。两条触发路径：用户点击剪贴板文件候选卡片，以及剪贴板持有文件、插件声明了 `clipboard:read` 时用户按插件名打开插件（此时它是默认进入动作）。

独立窗口里的进入动作会被**规范化**，不保证仍带 `files`。需要在任何窗口都拿到文件列表的插件，不要依赖 `enterAction.files`，改为调用 `api.readClipboardFiles()`。

## 取消函数模式

所有 `on...` 监听器都返回取消函数：

```js
/** 订阅主题状态并在组件销毁时移除。 */
function subscribeTheme(api, onTheme) {
  if (!api || !api.onThemeChange) return () => {}
  const removeListener = api.onThemeChange(onTheme)
  // 监听器清理函数。
  return removeListener
}
```

对 `window.toolzen` 的 preload 事件也是同样约定：`onXxx(callback) => () => void`。

## 错误行为

- Electron IPC 失败会由 preload 去掉通道名和包装错误，只保留可读的首行错误信息后重新抛出。
- API 返回 `boolean` 时，`false` 表示动作未完成或被宿主拒绝；不要把它当作异常字符串。
- 剪贴板方法未获得对应权限时不会抛错，读取返回空字符串（`readClipboardFiles` 返回空数组），写入返回 `false`。
- `registerShortcut` 注册不上时不抛错，返回 `false`；原因（写法不合法 / 被占用）写在插件控制台里。
- `screenColorPick` 取消返回 `null`；`api.screenColorPick` 将主进程 `{ sRGBHex }` 转换为 `{ hex }`。
- 原生文件对话框取消时分别返回空数组和空字符串；未声明 `file:dialog` 时不弹框。
- 文件读取接口未声明 `file:read` 时不抛错，返回空信封：`file.scan` 返回 `{ ok: false, code: 'NOT_SUPPORTED', entries: [], errors: [], truncated: false }`，`file.exists` 返回 `{ ok: false, code: 'NOT_SUPPORTED', exists: [...] }`（`exists` 仍是与输入**等长**的 `false` 数组，保持按下标对应），`file.reveal` 返回 `false`，`readClipboardFiles` 返回空数组。
- `file.rename` 未声明 `file:write` 时逐项返回 `results[].ok === false`、`code: 'NOT_SUPPORTED'`，诊断口径 `items[].status` 为 `failed`、`reason` 为 `permission-denied`，整批调用本身不抛错；`file.grant` 则返回 `{ ok: false, granted: [] }`，并把这类路径逐项写进 `rejected`，`reason` 为 `permission-denied`。授权范围之外的源路径不会被改动，只会计入 `not-granted`。
- `file.rename` 的单项失败不会中断整批，每个条目各有 `results[].code` / `items[].status` 和 `reason` / `error`；顶层 `ok` 只在全部成功时为 `true`，`code` 取第一条失败项的错误码；一次调用超过 5000 项会直接报错。
- `file.scan` 遇到不存在的路径也不抛错：该路径进 `errors`，`code` 为 `ENOENT`，不会出现在 `entries` 里，也不影响其他条目的返回。
- `api.network.fetch` 未声明 `network:fetch` 时**直接抛 `TypeError`**（消息点明缺少哪个权限），不会发出请求。
- `api.network.fetch` 的网络失败抛带 `code` 的 `TypeError`（例如 `ENOTFOUND`、`ETIMEDOUT`、`ECONNREFUSED`、`ABORT_ERR`、`EFBIG`）；`init.signal` 触发的中断以 `AbortError` 收尾；浏览器预览等没有主进程的环境抛 `NOT_SUPPORTED`。详见[网络](/api/network)。
- 显示器查询与坐标换算只返回几何信息，不授予截图、窗口移动或文件读写权限。
- 远程入口加载失败会在宿主显示错误和“重新加载”操作，插件本身无法绕过入口校验。

## 与标准浏览器能力的关系

插件可使用标准 `fetch`、DOM、`localStorage` 和 Vue 运行时。插件与宿主共用渲染层上下文，浏览器 `fetch` 因此受同源策略约束：目标服务不返回 CORS 头就会直接失败（报 `Failed to fetch`）。要访问跨域服务（例如用户自建的模型网关）改用 `api.network.fetch()`，请求由宿主主进程发出，不受 CORS 限制，签名与返回值与标准 `fetch` 一致；它需要 `network:fetch` 权限，未声明时抛 `TypeError`。复制文本优先使用 `api.copyText`，因为窗口失焦时浏览器剪贴板策略可能拒绝直接写入。
