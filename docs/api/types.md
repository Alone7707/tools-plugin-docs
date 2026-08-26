# TypeScript 类型参考

AToolBox 当前直接加载的是原生 JavaScript ESM；TypeScript 或 Vue SFC 需要在本地构建为符合规范的 `.js` / `.mjs` 文件后再上传。类型声明用于编辑器提示，不会注入运行时。

## 下载声明文件

[下载 `atoolbox-plugin-api.d.ts`](/types/atoolbox-plugin-api.d.ts)

在插件源码项目中引用：

```ts
/// <reference path="./types/atoolbox-plugin-api.d.ts" />
```

## 核心类型

```ts
type PluginEnterAction = {
  code: string
  type: 'open' | 'text' | 'regex' | 'over' | 'img'
  payload: string
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
```

完整声明包含 `AToolBoxPluginApi`、剪贴板、运行环境、主题事件、JSON 存储、字符串存储、进入/退出事件和独立窗口参数。插件组件仍应把 `api` 视为可空值，因为浏览器预览或非宿主加载环境不会提供它。
