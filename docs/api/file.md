# 文件

文件 API 面向「用户把文件交给插件」这一类场景：读取剪贴板里的文件、还原拖入文件的路径、按需扫描文件信息，以及在用户明确同意后批量重命名。所有参数都是绝对路径，相对路径不会被受理。

文件能力分成两层权限：`file:read` 管读取（`file.scan`、`file.exists`、`file.reveal`），`file:write` 管写入（`file.grant`、`file.rename`）。写在 `manifest.json` 的 `permissions` 里。

写入的底线只有一条：**重命名只会碰本会话已登记进授权集合的路径**。这个集合由宿主维护，不随清单上的权限字符串放大；剪贴板文件和文件对话框选中的路径由宿主自动登记，用户拖进插件自己拖放区的文件则需要插件显式 `grant`。

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

展开一批绝对路径，返回每个条目的元信息。需要 `file:read`。

```ts
api.file.scan(paths: string[], options?: PluginFileScanOptions): Promise<PluginFileEntry[]>
```

```ts
type PluginFileScanOptions = {
  recursive?: boolean
  match?: string
  limit?: number
}

type PluginFileEntry = {
  path: string
  name: string
  isDirectory: boolean
  sizeBytes: number
  modifiedAt: number
  exists: boolean
}
```

- `modifiedAt` 是毫秒时间戳；目录的 `sizeBytes` 恒为 `0`。
- 路径不存在时不抛错：该条目返回 `exists: false`，其余字段是零值。
- `recursive: true` 会把目录展开成它里面的条目，目录本身不再单独列出；递归最多 8 层。
- `match` 是按条目名匹配的简易 glob：`*` 不跨路径分隔符，`**` 跨路径分隔符，`?` 匹配一个字符。
- `limit` 默认 2000，硬上限 10000；条目按遍历顺序返回。

```js
const entries = await api.file.scan(['D:/notes'], {
  recursive: true,
  match: '*.md',
  limit: 500
})

const files = entries.filter((item) => !item.isDirectory && item.exists)
```

## file.exists

判断这些路径现在是否存在。需要 `file:read`。结果数组与输入**按下标一一对应**，适合先检查「这个名字是不是已经被占了」。未声明 `file:read` 时不抛错，返回与输入**等长**的 `false` 数组，仍然按下标对应。

```ts
api.file.exists(paths: string[]): Promise<boolean[]>
```

```js
const [taken] = await api.file.exists([targetPath])

if (taken) {
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
api.file.grant(paths: string[]): Promise<PluginFileGrantResult>
```

```ts
type PluginFileGrantResult = {
  granted: string[]
  rejected: Array<{ path: string; reason: string }>
}
```

```js
const result = await api.file.grant(paths)

if (result.rejected.length) {
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
  items: Array<{ from: string; to: string }>
  dryRun?: boolean
  allowOverwrite?: boolean
  onConflict?: 'error' | 'skip' | 'overwrite'
}

type PluginFileRenameItem = {
  from: string
  to: string
  status: 'planned' | 'applied' | 'skipped' | 'failed'
  reason?: string
  error?: string
}

type PluginFileRenameResult = {
  dryRun: boolean
  items: PluginFileRenameItem[]
  applied: Array<{ from: string; to: string }>
}
```

`allowOverwrite: true` 是 `onConflict: 'overwrite'` 的别名；`onConflict` 默认 `'error'`。

**推荐流程**：先用 `dryRun: true` 调一次，把 `status: 'planned'` 会改动的结果、以及 `skipped` / `failed` 的条目展示给用户，确认后再真实调用一次。

单项失败**不会中断整批**：每个 `item` 都有自己的结果，失败项与成功项在同一次调用里并存。

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

一次调用最多 5000 个条目，更长的批次会被直接拒绝并报错。

`applied` 是真正落地成功的重命名，按执行顺序排列——把它反过来再调一次 `rename`（`from` 与 `to` 对调）就是撤销。

```js
const items = paths.map((path) => ({ from: path, to: `${path}.bak` }))

const preview = await api.file.rename({ items, dryRun: true })
const blocked = preview.items.filter((item) => item.status !== 'planned')

if (blocked.length === 0) {
  const result = await api.file.rename({ items })
  const undo = result.applied.map(({ from, to }) => ({ from: to, to: from }))
  // 需要撤回时：await api.file.rename({ items: undo })
}
```
