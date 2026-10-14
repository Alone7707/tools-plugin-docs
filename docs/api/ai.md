# AI 能力

ToolZen 内置平台 AI 服务（多模型），插件可以直接调用它，也可以把自己的能力注册成「工具」让模型调用。两项能力都在 apiLevel 8 引入：

| 能力 | 权限 | 做什么 |
| --- | --- | --- |
| `ai` / `allAiModels` | `ai:chat` | 调用平台模型 |
| `registerTool` | `ai:tools` | 把插件能力注册成 AI 可调用的工具 |

> **AI 调用消耗平台的付费额度。** 插件额度与用户的内置对话额度**分开计算**（默认每人每天 50 次，所有插件合计），插件烧光自己那一档不影响用户的对话额度。但请勿循环调用或在后台空转，并在界面上如实显示剩余次数。

## 额度是分开的两档

| | 内置 AI 对话 | 插件 AI 调用 |
| --- | --- | --- |
| 计数 | 按模型各自配置 | 所有插件合计，默认 50 次/天 |
| 端点 | `/api/user/ai-chat/stream` | `/api/user/ai-chat/plugin-stream` |

分开的理由是成本与体验：插件可以循环调用（工具调用会一轮轮发请求），共用一个额度池时**一个跑飞的插件就能把用户当天的对话次数吃光**，而用户只会以为客户端坏了。

额度用满时 `api.ai()` 会以一个说明性的错误被拒绝，文案会点明「内置 AI 对话的额度不受影响」。

## 读取可用模型

```ts
api.allAiModels(): Promise<PluginAiModel[]>
```

```js
const models = await api.allAiModels()
// [{ id, label, remaining, unlimited, vision? }]
```

- **不需要权限**：它只列一下有哪些模型可用，不消耗额度、不读用户数据。
- **未登录时返回空数组**，插件据此显示登录引导。
- `remaining` 是**插件额度**的剩余次数，**与内置对话界面上显示的那个数字是两回事**。
- **判定「还能不能用」要用 `unlimited`，不要只看 `remaining`**：不限量时 `remaining` 恒为 0，而 0 不代表用完了。只看 `remaining` 会把一个不限量的账号显示成「已用完」。

## 调用模型

```ts
api.ai(options: PluginAiOptions, streamCallback?: (chunk: PluginAiStreamChunk) => void): Promise<PluginAiResult> & { abort(): void }
```

### 一次性调用

```js
const result = await api.ai({
  messages: [
    { role: 'system', content: '你是一个简洁的助手。' },
    { role: 'user', content: '用一句话解释什么是防抖。' }
  ]
})

console.log(result.content)
console.log(`用了 ${result.rounds} 轮，模型 ${result.model}`)
```

### 流式调用

传了 `streamCallback` 就是流式，逐块回调，最终仍 resolve 成完整结果：

```js
const call = api.ai(
  { messages: [{ role: 'user', content: '写一首关于秋天的短诗' }], stream: true },
  (chunk) => {
    // chunk.delta 是本次增量文本
    output.value += chunk.delta
  }
)

// 用户点「停止」
stopButton.onclick = () => call.abort()

const result = await call
```

中止后那个 Promise 会以 `name === 'AbortError'` 的错误被拒绝：

```js
try {
  const result = await call
} catch (error) {
  if (error.name === 'AbortError') {
    // 用户主动停止，不是失败
  } else {
    api.toast(`对话失败：${error.message}`)
  }
}
```

### options 字段

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `messages` | 是 | 对话消息，至少要有一条 `user` |
| `model` | 否 | 模型 id（取自 `allAiModels()`）；不传用默认模型 |
| `stream` | 否 | 是否流式；为真时**必须**传 `streamCallback` |
| `reasoningEffort` | 否 | 思考强度：`'none'` / `'low'` / `'medium'` / `'high'`。`'none'` 表示关闭思考 |
| `tools` | 否 | 参与函数调用的工具名数组（由 `registerTool` 注册） |

### 返回值

```ts
type PluginAiResult = {
  content: string            // 模型的完整回复文本
  reasoningContent?: string  // 部分模型单独回传的思考内容
  model: string              // 实际使用的模型 id
  rounds: number             // 一共发起了几轮上游请求（有工具调用时会大于 1）
}
```

## 注册工具让模型调用

```ts
api.registerTool(definition: PluginToolDefinition, handler: (context: PluginToolContext) => unknown): boolean
```

```js
api.registerTool(
  {
    name: 'get_weather',
    description: '查询指定城市的当前天气。用户问天气时调用它。',
    parameters: {
      type: 'object',
      properties: {
        city: { type: 'string', description: '城市名，例如「北京」' }
      },
      required: ['city']
    }
  },
  async ({ arguments: args }) => {
    const weather = await fetchWeather(String(args.city))
    return { city: args.city, temperature: weather.temp, condition: weather.text }
  }
)
```

注册之后，在 `api.ai()` 的 `options.tools` 里点名它，模型就可能调用：

```js
const result = await api.ai({
  messages: [{ role: 'user', content: '北京今天天气怎么样？' }],
  tools: ['get_weather']
})
```

### 要点

- **`description` 是模型判断「什么时候该用这个工具」的唯一依据**，写清楚：做什么、什么时候用、有什么副作用。没有描述的工具基本没用。
- **`parameters` 是 JSON Schema 的子集**：`type` / `description` / `properties` / `required` / `items` / `enum`。没有参数的工具可以省。
- **handler 的返回值会被转成字符串回给模型**：字符串原样、对象与数组 `JSON.stringify`、`undefined` / `null` 回空串。结果超过 **32000 字符会被截断**（模型的上下文有限）。
- **handler 抛错不会中断对话**：宿主会把错误消息作为工具结果回给模型，模型下一轮能自己纠正。
- **模型给的参数不可信**：它可能拼错 JSON、传错类型。宿主已经兜住了（解析失败会回一段描述性文本给模型），但你的 handler 仍应当校验自己关心的字段。
- 工具循环**上限 8 轮**（防止两个工具互相触发无限烧额度），到顶会用已有的正文收尾。
- 插件退出时工具**自动注销**，不必手动清理。

### 参数不可信的实际表现

模型调用工具时传的是一个 JSON 字符串。下面这些情况宿主都会兜住，**不会**让对话中断：

| 模型给的 | 宿主的行为 |
| --- | --- |
| 一段不是 JSON 的文本 | 回「参数不是合法的 JSON」给模型，让它重试 |
| `[1,2]`（数组）或 `42`（数字） | 回「参数必须是 JSON 对象」 |
| 一个不存在的工具名 | 回「工具不存在」 |
| 空参数 | 按「无参数」处理，给 handler 传 `{}` |

## 完整例子：带工具的多轮对话

```js
// 1. 注册工具（放在 setup 里，或 onPluginReady 之后）
api.registerTool(
  {
    name: 'search_notes',
    description: '在用户的本地笔记里搜索关键词，返回匹配的笔记标题与摘要。',
    parameters: {
      type: 'object',
      properties: { keyword: { type: 'string', description: '搜索关键词' } },
      required: ['keyword']
    }
  },
  async ({ arguments: args }) => {
    const hits = searchLocalNotes(String(args.keyword))
    return hits.slice(0, 5).map((note) => ({ title: note.title, excerpt: note.excerpt }))
  }
)

// 2. 带工具发起对话
const result = await api.ai({
  messages: [{ role: 'user', content: '我之前记过关于「防抖」的笔记吗？' }],
  tools: ['search_notes']
})

// result.content 已经是模型看过工具结果之后的最终回复
console.log(result.content)
```

宿主负责整个循环：把工具定义发给模型 → 模型回工具调用 → 执行工具 → 把结果发回去 → 直到模型不再要工具。

## 使用边界

- 工具名在**单个插件内唯一**，同名后注册的覆盖先注册的。
- `api.ai()` 需要用户**已登录**；未登录时以错误拒绝，插件应当先调 `allAiModels()` 判断并显示登录引导。
- 插件额度用满后要等到**次日**才恢复，插件应当如实提示而不是让用户反复重试。
- 不要用 AI 能力处理用户未明确交出的隐私数据。

## 老客户端上的行为

`ai:chat` / `ai:tools` 是 apiLevel 8 引入的。老客户端上 `api.ai()` 不存在，调用会以错误被拒绝（而不是静默返回空值——调用方需要知道失败原因）。

```js
function supports(api, name) {
  try {
    return typeof api.hasCapability === 'function' && api.hasCapability(name) === true
  } catch {
    return false
  }
}

if (!supports(api, 'ai:chat')) {
  api.toast('AI 能力需要升级 ToolZen 客户端')
}
```

也可以直接在 manifest 里声明 `requires: ["ai:chat"]`，让宿主在加载前拦下并提示升级——详见[版本与兼容性](/compatibility)。
