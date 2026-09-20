# 网络

插件运行在客户端的渲染进程里（没有 webview / iframe），因此插件里的浏览器 `fetch` 受**同源策略**约束：目标服务不返回 CORS 头就直接失败，典型表现是 `Failed to fetch`。用户自建的模型网关通常就是这种情况。

`api.network.fetch` 解决这个约束：插件的请求由**宿主主进程**发出，不受 CORS 限制；响应体**边收边推**，所以流式对话（SSE）的逐字输出与直连完全一致。用法与浏览器 `fetch` 同名同形。

```js
const resp = await api.network.fetch('https://example.com/v1/chat/completions', {
  method: 'POST',
  headers: [['Authorization', 'Bearer sk-xxx'], ['Content-Type', 'application/json']],
  body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: '你好' }], stream: true })
})

if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${await resp.text()}`)

const reader = resp.body.getReader()   // 与直连一样，可以边收边读
```

## 能力声明

在 `manifest.json` 的 `permissions` 里声明 `network:fetch`：

```json
{
  "permissions": ["network:fetch"]
}
```

`api.network.fetch` 与文件能力不同，**不返回空信封**：未声明 `network:fetch` 时它直接抛 `TypeError`，消息点明缺少哪个权限，并且**不会发出任何请求**。插件应在调用前用可选链判断能力是否存在（见下文「兼容与降级」）。

## fetch

```ts
api.network.fetch(input: string | Request, init?: RequestInit): Promise<Response>
```

### 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `input` | `string \| Request` | 目标地址，或一个 `Request` 对象；只接受 `http:` / `https:` |
| `init.method` | `string` | HTTP 方法，默认 `GET` |
| `init.headers` | `[string, string][] \| Record<string, string> \| Headers` | 请求头，推荐按 `[名, 值]` 成对传 |
| `init.body` | `string` | 请求体；**只支持字符串**，`FormData` / `Blob` / `URLSearchParams` 等会抛 `TypeError` |
| `init.signal` | `AbortSignal` | 中断请求；中断以 `AbortError` 收尾 |
| `init.redirect`、`init.cache` 等 | — | 按标准 `RequestInit` 语义透传，宿主不额外解释 |

请求头推荐写成 `[名, 值]` 数组：同名头**不会被覆盖**，会按传入顺序全部保留，因此可以重复发送 `Accept` 这类头。普通对象和 `Headers` 实例同样接受，只是无法表达同名多值。

需要 JSON 请自己序列化：`body: JSON.stringify(payload)`，并记得带上 `Content-Type`。

### 返回值

返回的是**真正的 `Response`**，不是宿主自造的替身：

| 成员 | 说明 |
| --- | --- |
| `status` / `statusText` | HTTP 状态码与状态文本 |
| `ok` | `200`–`299` 为 `true` |
| `headers` | 响应头，按标准 `Headers` 读取 |
| `body` | `ReadableStream<Uint8Array>`，可 `getReader()` 边收边读 |
| `text()` / `json()` | 照常可用，等价于一次性读完 `body` |

注意 `Response` 的 `body` 只能消费一次：`text()` / `json()` 与 `getReader()` 不要混用，读过一次再读会抛错。

## 流式读取

`resp.body.getReader()` 与直连一致。下面把响应原样拼接成文本：

```js
const resp = await api.network.fetch(url, {
  method: 'POST',
  headers: [['Content-Type', 'application/json']],
  body: JSON.stringify({ stream: true })
})

if (!resp.ok || !resp.body) throw new Error(`HTTP ${resp.status}`)

const reader = resp.body.getReader()
const decoder = new TextDecoder()
let text = ''

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  text += decoder.decode(value, { stream: true })
}
```

### SSE 逐字输出

宿主把字节块边收边推，所以按 SSE 的 `data:` 行切分就能实现逐字输出。下面是一个 OpenAI 兼容接口的最小实现：

```js
async function streamChat(api, messages, onDelta) {
  const resp = await api.network.fetch('https://example.com/v1/chat/completions', {
    method: 'POST',
    headers: [['Authorization', 'Bearer sk-xxx'], ['Content-Type', 'application/json']],
    body: JSON.stringify({ model: 'gpt-4o', messages, stream: true })
  })

  if (!resp.ok || !resp.body) throw new Error(`HTTP ${resp.status}`)

  const reader = resp.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    // 一个字节块可能切在半行上，留到下一轮再拼。
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data:')) continue
      const data = line.slice(5).trim()
      if (!data || data === '[DONE]') continue

      const chunk = JSON.parse(data)
      const delta = chunk.choices?.[0]?.delta?.content
      if (delta) onDelta(delta)   // 每收到一段就刷一次界面
    }
  }
}
```

### 中断

用标准的 `AbortController`：

```js
const controller = new AbortController()

try {
  const resp = await api.network.fetch(url, { signal: controller.signal })
  // ...
} catch (error) {
  if (error.name === 'AbortError') return   // 用户主动取消，不是故障
  throw error
}
```

用户点击「停止」时，在别处调用 `controller.abort()` 即可结束这次请求。

## 错误

中断和失败分两种收尾方式：

- `init.signal` 触发的中断以 **`AbortError`**（`DOMException`）收尾，`error.name === 'AbortError'`，这是用户取消，不是故障。
- 其余失败抛 **`TypeError`**，并带 `code` 字段：

```js
try {
  await api.network.fetch(url)
} catch (error) {
  if (error.name === 'AbortError') return
  api.toast(`请求失败：${error.code ?? error.message}`)
}
```

| `code` | 含义 |
| --- | --- |
| `ENOTFOUND` | 域名解析不了。 |
| `ETIMEDOUT` | 连接或读取响应头超时。 |
| `ECONNREFUSED` | 目标端口拒绝连接。 |
| `ABORT_ERR` | 宿主内部的中止路径（区别于 `init.signal` 的 `AbortError`）。 |
| `EFBIG` | 响应体超过单次 256 MB 上限。 |
| `NOT_SUPPORTED` | 当前环境没有主进程（例如浏览器预览），能力不可用。 |

系统网络栈还可能透出其他错误码，判断失败时不要只匹配表中这几项，`error.code ?? error.message` 一起显示更稳妥。

## 边界与限制

- **只接受 `http:` / `https:`**。相对路径、`file:`、`data:`、`blob:` 等一律拒绝。
- **不带宿主自己的 cookie**。请求以独立的网络会话发出，宿主窗口的登录态不会泄漏给插件请求的目标服务。
- **请求体只支持字符串**。`FormData` / `Blob` / `ReadableStream` 等会抛 `TypeError`；上传文件请自行编码，例如 Base64 后放进 JSON。
- **等响应头有超时**：默认 2 分钟，宿主实现的上限是 10 分钟，插件无法调高。这个时限只覆盖「等到响应头」为止。
- **响应体不设时限**：开始推送后没有总时长限制，靠 `init.signal` 结束。长时间对话需要自己控制中断时机。
- **单次响应体上限 256 MB**：超过会以 `EFBIG` 失败。
- **无正文响应**：`204` / `205` / `304` 的 `resp.body === null`，读之前先判断。
- **浏览器预览不可用**：没有主进程的环境抛 `NOT_SUPPORTED`，插件要做降级。

```js
if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
if (!resp.body) return ''            // 204 / 205 / 304
const text = await resp.text()
```

## 与浏览器 fetch 的差异

| 维度 | 浏览器 `fetch` | `api.network.fetch` |
| --- | --- | --- |
| 发起方 | 渲染层 | 宿主主进程 |
| CORS | 受同源策略约束，跨域需目标返回 CORS 头 | 不受 CORS 限制 |
| 权限 | 不需要 | 必须声明 `network:fetch`，否则抛 `TypeError` |
| Cookie | 按 `credentials` 带上当前站点 cookie | 不带宿主自身 cookie |
| 请求体 | 支持 `FormData` / `Blob` / `ReadableStream` 等 | 只支持字符串 |
| 允许的协议 | 相对路径与 `data:` / `blob:` 等 | 仅 `http:` / `https:` |
| 超时 | 由浏览器网络栈决定 | 等响应头默认 2 分钟、上限 10 分钟；响应体靠中断结束 |
| 响应体上限 | 没有固定上限 | 单次 256 MB（`EFBIG`） |
| 浏览器预览 | 可用 | 抛 `NOT_SUPPORTED` |
| 返回值 | `Response` | 同样是真正的 `Response` |
| 流式读取 | `resp.body.getReader()` | 一致，SSE 逐字输出可用 |

## 兼容与降级

宿主是逐步更新的，不能假定 `api.network.fetch` 一定存在。按能力检测选取实现：优先用宿主代发，没有该能力时退回全局 `fetch`（此时只能访问同源地址）。

```js
const netFetch = api && api.network && api.network.fetch
  ? api.network.fetch.bind(api.network)
  : fetch
```

浏览器预览里 `api` 为空、或 `api.network` 不存在时都会走到 `fetch` 分支；这个分支在预览环境能用，但在跨域目标上仍会被 CORS 拦下。声明了 `network:fetch` 的插件在旧宿主上不会因此报错，只是会退回浏览器的同源限制。
