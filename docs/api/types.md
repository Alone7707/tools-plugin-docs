# TypeScript 类型参考

ToolZen 当前直接加载的是原生 JavaScript ESM；TypeScript 或 Vue SFC 需要在本地构建为符合规范的 `.js` / `.mjs` 文件后再上传。类型声明用于编辑器提示，不会注入运行时。

## 下载声明文件

[下载 `toolzen-plugin-api.d.ts`](/types/toolzen-plugin-api.d.ts)

在插件源码项目中引用：

```ts
/// <reference path="./types/toolzen-plugin-api.d.ts" />
```

## 核心类型

```ts
type PluginEnterAction = {
  code: string
  type: 'open' | 'text' | 'regex' | 'over' | 'img' | 'file'
  payload: string
  files?: string[]
}

type PluginDetachWindowOptions = {
  title?: string
  featureCode?: string
  initialText?: string
  width?: number
  height?: number
}

type PluginInfo = {
  code: string
  name: string
  version: string
  type: 'builtin' | 'local' | 'remote'
}

type PluginTheme = 'light' | 'dark'

type PluginDialogFilter = { name: string; extensions: string[] }
type PluginOpenDialogOptions = {
  title?: string
  defaultPath?: string
  buttonLabel?: string
  filters?: PluginDialogFilter[]
  properties?: Array<'openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles'>
}
type PluginSaveDialogOptions = { title?: string; defaultPath?: string; buttonLabel?: string; filters?: PluginDialogFilter[] }
type PluginScreenPoint = { x: number; y: number }
type PluginScreenRect = { x: number; y: number; width: number; height: number }
type PluginDisplayInfo = { id: number; bounds: PluginScreenRect; workArea: PluginScreenRect; workAreaSize: { width: number; height: number }; scaleFactor: number; rotation: number; touchSupport: string }
type PluginFileScanOptions = { recursive?: boolean; includeDirectories?: boolean; includeHidden?: boolean; match?: string; limit?: number }
type PluginFileEntry = { path: string; directory: string; name: string; stem: string; extension: string; isDirectory: boolean; size: number; modifiedAt: number; createdAt: number; hidden: boolean; exists: boolean }
type PluginFileScanResult = { ok: boolean; entries: PluginFileEntry[]; errors: Array<{ path: string; code: string; message?: string }>; truncated: boolean; code?: string }
type PluginFileExistsResult = { ok: boolean; exists: boolean[]; code?: string }
type PluginFileRenameRequest = { items: Array<{ from: string; to: string }>; dryRun?: boolean; allowOverwrite?: boolean; onConflict?: 'error' | 'skip' | 'overwrite'; continueOnError?: boolean }
type PluginFileRenameResultItem = { from: string; to: string; ok: boolean; code?: string; message?: string }
type PluginFileRenameItem = { from: string; to: string; status: 'planned' | 'applied' | 'skipped' | 'failed'; reason?: string; error?: string }
type PluginFileRenameResult = { ok: boolean; dryRun: boolean; results: PluginFileRenameResultItem[]; succeeded: number; failed: number; items: PluginFileRenameItem[]; applied: Array<{ from: string; to: string }>; code?: string }
type PluginFileGrantResult = { ok: boolean; granted: string[]; rejected: Array<{ path: string; reason: string }> }
type PluginFileWriteRequest = { path: string; name?: string; data: ArrayBuffer | ArrayBufferView; mimeType?: string }
type PluginFileWriteResult = { ok: boolean; path?: string; code?: 'invalid' | 'not-granted' | 'EFBIG' | 'failed'; message?: string }
type PluginNetworkApi = { fetch: (input: string | Request, init?: RequestInit) => Promise<Response> }

type PluginDesktopSource = {
  id: string
  name: string
  kind: 'screen' | 'window'
  display_id: string
  thumbnail: string
  appIcon: string
}
type PluginDesktopSourcesOptions = {
  types?: Array<'screen' | 'window'>
  thumbnailSize?: { width: number; height: number }
  fetchWindowIcons?: boolean
}
type PluginCaptureStreamOptions = {
  sourceId?: string
  kind?: 'screen' | 'window'
  audio?: { speaker?: boolean; microphone?: boolean }
  fps?: number
  width?: number
  height?: number
}
type PluginMediaAccessType = 'screen' | 'microphone' | 'camera'
type PluginMediaAccessStatus = 'not-determined' | 'granted' | 'denied' | 'restricted' | 'unknown'
```

完整声明包含 `ToolZenPluginApi`、剪贴板、文件（含 `file.write`）、网络、屏幕采集（`desktopCapturer` / `capture` / `systemPreferences` / `overlay`）、会话持有（`holdSessionReset` / `hideMainWindowKeepAlive`）、运行环境、主题事件、JSON 存储、字符串存储、进入/退出事件和独立窗口参数。插件组件仍应把 `api` 视为可空值，因为浏览器预览或非宿主加载环境不会提供它。

## 权限与类型的对应

| 权限 | 相关类型 |
|------|----------|
| `file:read` / `file:write` | `PluginFileScanResult`、`PluginFileEntry`、`PluginFileRenameResult`、`PluginFileWriteRequest`、`PluginFileWriteResult` |
| `network:fetch` | `PluginNetworkApi` |
| `screen:capture` | `PluginDesktopSource`、`PluginDesktopSourcesOptions`、`PluginCaptureStreamOptions`、`PluginMediaAccessStatus`、`PluginScreenRect` |
| 不需要权限 | `PluginScreenPoint` / `PluginScreenRect`（显示器查询）、`PluginDisplayInfo`、会话持有相关方法 |
