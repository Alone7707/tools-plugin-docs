# 文件

文件 API 面向「用户把文件交给插件」这一类场景：读取剪贴板里的文件、还原拖入文件的路径、按需扫描文件信息，以及在用户明确同意后批量重命名。所有参数都是绝对路径，相对路径不会被受理。

文件能力分成两层权限：`file:read` 管读取（`file.scan`、`file.exists`、`file.reveal`），`file:write` 管写入（`file.grant`、`file.rename`、`file.write`）。写在 `manifest.json` 的 `permissions` 里。

写入的底线只有一条：**重命名与写入只会碰本会话已登记进授权集合的路径**。这个集合由宿主维护，不随清单上的权限字符串放大；剪贴板文件和文件对话框选中的路径由宿主自动登记，用户拖进插件自己拖放区的文件则需要插件显式 `grant`。

## 插件怎么拿到剪贴板里的文件

这条链路的完整形态是「用户复制文件 → 呼出客户端 → 宿主列出候选 → 插件拿到路径」。先声明识别能力，两种写法等效，任选其一：

```json
{
  "clipboardRules": [
    {
      "name": "批量重命名",
      "pattern": "剪贴板中的文件或文件夹",
      "example": "D:\\photos\\IMG_0001.jpg",
      "action": "打开批量重命名",
      "matchType": "file"
    }
  ]
}
```

```json
{
  "features": [
    {
      "name": "批量重命名",
      "description": "重命名剪贴板中的文件",
      "code": "rename",
      "cmds": [{ "type": "file" }]
    }
  ]
}
```

用户在系统文件管理器里复制文件后按下呼出快捷键，宿主读到剪贴板里的绝对路径，把声明了 `matchType: "file"` 或 `cmds: [{ "type": "file" }]` 的插件列为「快捷识别」候选。用户点击候选卡片（或在剪贴板持有文件时按插件名打开插件）后，插件收到的进入动作是：

```ts
enterAction = {
  code: 'clipboard',                                               // 剪贴板识别入口为 clipboard；带 code 的指令入口用插件声明的编码
  type: 'file',
  payload: 'D:\\photos\\IMG_0001.jpg\nD:\\photos\\IMG_0002.jpg',    // 换行分隔的绝对路径
  files: ['D:\\photos\\IMG_0001.jpg', 'D:\\photos\\IMG_0002.jpg']  // 同一批路径的数组形式
}
```

```js
const removeEnter = api && api.onPluginEnter
  ? api.onPluginEnter((action) => {
      if (action.type !== 'file') return
      const paths = action.files ?? action.payload.split('\n').filter(Boolean)
      load(paths)
    })
  : null
```

`payload` 与 `files` 是同一批路径的两种形式，只为照顾只读字符串的插件。独立窗口里的进入动作会被**规范化**，不保证仍带 `files`，需要在任何窗口都拿到文件列表的插件应改为调用 `api.readClipboardFiles()`。

## readClipboardFiles

读取系统剪贴板中文件（或文件夹）的绝对路径。需要 `clipboard:read`。剪贴板里没有文件时返回空数组；只返回此刻真实存在的路径，并且已经去重。

```ts
api.readClipboardFiles(): Promise<string[]>
```

```js
const files = api && api.readClipboardFiles
  ? await api.readClipboardFiles()
  : []

if (files.length) {
  preview.value = files
}
```

Windows 上有一个实现细节值得留意：系统只通过 `CF_HDROP` 暴露复制的多文件列表，Electron 读不到，宿主改为向 PowerShell 请求一次 `FileDropList`，大约耗时 0.5 秒，并在宿主内部记忆 1 秒。因此**不要在循环或定时器里调用它**，一个用户动作调用一次即可。macOS 读粘贴板的文件列表，Linux 读 `text/uri-list`。

## getPathForFile

把拖拽或粘贴进来的 `File` 还原成绝对本地路径（Electron 32 移除了 `File.path`）。不需要权限。解析不出路径时返回空字符串——例如这次拖拽来自浏览器页面内部——所以调用后必须判断返回值。

```ts
api.getPathForFile(file: File): string
```

```js
const paths = Array.from(event.dataTransfer.files)
  .map((file) => api.getPathForFile(file))
  .filter(Boolean)
```

拖进插件自己拖放区的文件**不会被自动登记**：必须先用 `api.getPathForFile(file)` 拿到绝对路径，再调用 `api.file.grant([path])`，之后才允许重命名它。对已经登记过的路径重复 `grant` 是无害的空操作。插件自己拼出来的路径、或者从其他途径拿到的路径，同样要先 `grant`。

## file.scan

展开一批绝对路径，返回每个条目的元信息。需要 `file:read`。返回值是一个**信封对象**，条目在 `entries` 里：

```ts
api.file.scan(paths: string[], options?: PluginFileScanOptions): Promise<PluginFileScanResult>
```

```ts
type PluginFileScanOptions = {
  recursive?: boolean          // 是否继续往下钻子目录；默认 false（但目录本身一律展开一层）
  includeDirectories?: boolean // 把展开出来的子目录也作为条目返回；默认 false
  includeHidden?: boolean      // 是否包含以点开头的隐藏项；默认 true
  match?: string               // 简易 glob：* 不跨目录，** 跨目录，? 单字符
  limit?: number               // 默认 20000，最大 50000；撞上限时 truncated 为 true
}

type PluginFileEntry = {
  path: string        // 绝对路径
  directory: string   // 父目录绝对路径
  name: string        // 含扩展名的文件名
  stem: string        // 不带扩展名的主名；无扩展名时等于 name
  extension: string   // 扩展名含点；目录与无扩展名文件为空串
  isDirectory: boolean
  size: number        // 字节；目录为 0
  modifiedAt: number  // 毫秒时间戳
  createdAt: number   // 毫秒时间戳；取不到时与 modifiedAt 相同
  hidden: boolean     // 以点开头的隐藏项
  exists: boolean     // 这条路径当时是否存在
}

type PluginFileScanResult = {
  ok: boolean
  entries: PluginFileEntry[]
  errors: { path: string, code: string, message?: string }[]
  truncated: boolean
  code?: string
}
```

- **传入目录路径就会展开它的下一级子项**，不管 `recursive` 是什么；`recursive: true` 才会继续往下钻，递归深度上限 8 层。
- 被扫描的**根目录自己不会作为条目出现**；`includeDirectories` 只影响展开出来的子目录。默认只回文件。
- 路径不存在不抛错：该路径进 `errors`，`code` 是 `ENOENT`，其余路径照常返回。个别路径读不动（例如 `EACCES`）同样只影响它自己。
- `modifiedAt` / `createdAt` 都是毫秒时间戳；目录的 `size` 恒为 `0`，`extension` 为空串。
- `match` 是按条目名匹配的简易 glob：`*` 不跨路径分隔符，`**` 跨路径分隔符，`?` 匹配一个字符。
- `limit` 默认 20000，硬上限 50000；撞上上限时 `truncated` 为 `true`，条目按遍历顺序返回。
- 缺失的路径不会进 `entries`，所以正常返回的条目 `exists` 基本都是 `true`；要区分「路径不存在」请看 `errors`。

```js
const result = await api.file.scan(['D:/notes'], {
  recursive: true,
  match: '*.md',
  limit: 500
})

if (!result.ok) {
  api.toast(`扫描失败：${result.code}`)
} else {
  const files = result.entries.filter((entry) => !entry.isDirectory)
  const missing = result.errors.filter((error) => error.code === 'ENOENT')

  if (result.truncated) {
    api.toast('结果被截断，请缩小范围或指定 match')
  }
}
```

## file.exists

判断这些路径现在是否存在。需要 `file:read`。`exists` 数组与输入**按下标一一对应**，适合先检查「这个名字是不是已经被占了」。返回的同样是信封对象：

```ts
api.file.exists(paths: string[]): Promise<{ ok: boolean, exists: boolean[], code?: string }>
```

未声明 `file:read` 时不抛错，返回 `{ ok: false, code: 'NOT_SUPPORTED', exists: [...] }`，其中 `exists` 仍是与输入**等长**的 `false` 数组，不会给 `[]`。宿主回传的长度对不上时，渲染层退化成全部 `false`。

```js
const { ok, exists } = await api.file.exists([targetPath])

if (ok && exists[0]) {
  suggested.value = `副本-${suggested.value}`
}
```

## file.reveal

打开系统文件管理器并选中该路径。需要 `file:read`。路径本身已经不在了就打开它所在的目录；传入相对路径，或者连所在目录都不存在时返回 `false`。

```ts
api.file.reveal(path: string): Promise<boolean>
```

```js
const revealed = await api.file.reveal(outputPath)
```

## file.grant

把绝对路径登记进本会话的**已授权集合**——也就是 `rename` 会接受的集合。需要 `file:write`。只接受绝对路径，其余路径会以 `reason: 'invalid'` 出现在 `rejected` 里。

宿主只自动登记三类路径：从剪贴板读到的文件（`api.readClipboardFiles()` 读到的，以及 `type: 'file'` 进入动作带过来的）、用户在 `showOpenDialog` / `showSaveDialog` 中选中的路径，以及用户粘贴到启动器搜索框的文件。用户拖进插件自己拖放区的文件**不在**其中，那类文件必须由插件自己调用 `grant`。对已经登记过的路径重复 `grant` 是无害的空操作，可以放心把整批候选路径直接交进来。这个集合只活在本次应用会话里，**永不持久化**，重启客户端即清空。

```ts
api.file.grant(paths: string[]): Promise<{
  ok: boolean
  granted: string[]
  rejected: Array<{ path: string, reason: string }>
}>
```

```ts
type PluginFileGrantResult = {
  ok: boolean
  granted: string[]
  rejected: Array<{ path: string, reason: string }>
}
```

未声明 `file:write` 时返回 `{ ok: false, granted: [], rejected: [...] }`，`rejected` 里是**逐项**的 `reason: 'permission-denied'`。部分路径被拒不影响其余路径登记成功。

```js
const result = await api.file.grant(paths)

if (!result.ok) {
  api.toast('没有 file:write 权限，路径没能登记')
} else if (result.rejected.length) {
  api.toast(`有 ${result.rejected.length} 个路径无法处理`)
}
```

## file.rename

批量重命名。需要 `file:write`。这是唯一会改动用户磁盘的插件 API，所以它刻意做得很克制：只会动本会话授权集合里的源路径。

```ts
api.file.rename(request: PluginFileRenameRequest): Promise<PluginFileRenameResult>
```

```ts
type PluginFileRenameRequest = {
  items: Array<{ from: string, to: string }>
  dryRun?: boolean                                // 只预检不落盘
  allowOverwrite?: boolean                        // onConflict: 'overwrite' 的别名
  onConflict?: 'error' | 'skip' | 'overwrite'      // 默认 error：目标存在判该项失败
  continueOnError?: boolean                        // 单项失败是否继续，默认 true
}

type PluginFileRenameResultItem = {
  from: string
  to: string
  ok: boolean
  code?: string
  message?: string
}

type PluginFileRenameResult = {
  ok: boolean                                    // 全部成功才 true
  dryRun: boolean
  results: PluginFileRenameResultItem[]          // 与请求顺序一一对应
  succeeded: number
  failed: number
  items: PluginFileRenameItem[]                  // 宿主更细的诊断口径，见下
  applied: Array<{ from: string, to: string }>   // 真正落地的映射
  code?: string                                  // 第一条失败项的错误码
}

type PluginFileRenameItem = {
  from: string
  to: string
  status: 'planned' | 'applied' | 'skipped' | 'failed'   // planned = dryRun 预检通过
  reason?: string
  error?: string
}
```

`allowOverwrite: true` 是 `onConflict: 'overwrite'` 的别名；`onConflict` 默认 `'error'`。`results` 与 `items` 并存：`results` 是「与请求一一对应、看 `ok` 就够」的简洁口径，`items` 是宿主更细的诊断口径（`status` + `reason`）。

**推荐流程**：先用 `dryRun: true` 调一次，把 `status: 'planned'` 会改动的结果、以及 `skipped` / `failed` 的条目展示给用户，确认后再真实调用一次。`dryRun` 时 `applied` 是空数组。

单项失败**不会中断整批**（`continueOnError` 默认 `true`）：每个 `item` 都有自己的结果，失败项与成功项在同一次调用里并存。`ok` 只有在**全部成功**时才为 `true`；顶层 `code` 取第一条失败项的错误码。

`status` 的含义：

| `status` | 含义 |
| --- | --- |
| `planned` | 试运行中：这一步可以执行。 |
| `applied` | 已经真正执行。 |
| `skipped` | 按冲突策略主动跳过。 |
| `failed` | 没能执行，原因见 `reason` / `error`。 |

`failed` 与 `skipped` 条目的 `reason` 取值：

| `reason` | 含义 |
| --- | --- |
| `permission-denied` | 插件没有声明 `file:write`。 |
| `invalid` | 空路径、相对路径，或者把目录移动到它自己里面。 |
| `missing` | 源路径不存在。 |
| `not-granted` | 源路径不在本会话的已授权集合里。 |
| `cross-directory` | 目标目录既不是源文件自己的目录，也不是已授权的目录。 |
| `same-path` | `from` 与 `to` 相同。 |
| `target-exists` | 目标已存在，且冲突策略不允许覆盖。 |
| `target-directory` | 目标是目录，拒绝覆盖。 |
| `failed` | 操作系统拒绝了这次操作，原始信息在 `error` 里。 |

`results[].code` 与顶层 `code` 取同一套错误码：

| `code` | 含义 |
| --- | --- |
| `ENOT_ALLOWED` | 未授权，或跨目录移动。 |
| `ENOENT` | 源路径不存在。 |
| `EEXIST` | 目标已存在。 |
| `EACCES` / `EPERM` | 权限不足。 |
| `EBUSY` | 文件被其他进程占用。 |
| `EINVAL` | 名称非法。 |
| `ENAMETOOLONG` | 名称或路径超长。 |
| `EROFS` | 只读文件系统。 |
| `ENOSPC` | 空间不足。 |
| `NOT_SUPPORTED` | 宿主没实现该能力，或插件没声明权限。 |
| `INTERNAL` | 未预期的错误。 |

一次调用最多 5000 个条目，更长的批次会被直接拒绝并报错。

`applied` 是真正落地成功的重命名，按执行顺序排列——把它反过来再调一次 `rename`（`from` 与 `to` 对调）就是撤销。

```js
const items = paths.map((path) => ({ from: path, to: `${path}.bak` }))

const preview = await api.file.rename({ items, dryRun: true })
const blocked = preview.items.filter((item) => item.status !== 'planned')

if (blocked.length === 0) {
  const result = await api.file.rename({ items })

  if (!result.ok) {
    // 顶层 code 是第一条失败项的错误码；逐项结果在 result.results 里。
    api.toast(`有 ${result.failed} 项失败：${result.code}`)
  }

  const undo = result.applied.map(({ from, to }) => ({ from: to, to: from }))
  // 需要撤回时：await api.file.rename({ items: undo })
}
```

## file.write

把二进制内容写入磁盘，返回**真实落盘路径**。需要 `file:write`。

```ts
type PluginFileWriteResult = {
  ok: boolean
  path?: string      // 真实落盘路径，成功时才有；可直接喂给 api.file.reveal
  code?: 'invalid' | 'not-granted' | 'EFBIG' | 'failed'
  message?: string
}

api.file.write(request: {
  path: string                              // 目标绝对路径
  name?: string                             // 文件名，仅作参考
  data: ArrayBuffer | ArrayBufferView       // 二进制内容
  mimeType?: string                         // MIME 类型，仅作参考
}): Promise<PluginFileWriteResult>
```

它解决的是「保存之后拿不到路径」这个问题：走浏览器下载流程时功能可用，但插件不知道文件落在哪，
「在资源管理器中定位」就用不了。有了它就能拿到真实路径。

**护栏与 `rename` 一致**：只受理本会话已登记进授权集合的路径。最自然的用法是先
`api.showSaveDialog()` 让用户选位置（宿主会自动登记），再写：

```js
const target = await api.showSaveDialog({
  title: '保存录屏文件',
  defaultPath: 'recording.webm',
  filters: [{ name: 'WebM 视频', extensions: ['webm'] }]
})
if (!target) return   // 用户取消

const written = await api.file.write({
  path: target,
  name: 'recording.webm',
  data: await blob.arrayBuffer(),
  mimeType: blob.type
})

if (written.ok) {
  api.toast(`已保存到 ${written.path}`)
  await api.file.reveal(written.path)   // 一键定位
}
```

失败码：

| `code` | 含义 |
| --- | --- |
| `invalid` | 路径为空 / 不是绝对路径，或 `data` 不是二进制。 |
| `not-granted` | 路径不在本会话的已授权集合里（插件自己拼的路径会走到这里）。 |
| `EFBIG` | 内容超过单次上限（512MB）。 |
| `failed` | 操作系统拒绝了写入，原始信息在 `message` 里。 |

父目录不存在时宿主会自动补建，所以往「已授权目录 + 新的子路径」写不需要先建目录。
