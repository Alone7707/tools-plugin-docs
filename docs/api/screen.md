# 屏幕

ToolZen 向第三方插件开放屏幕采集（录屏）、全屏取色、显示器布局查询和坐标换算能力。

## 屏幕采集

录屏 / 截屏类插件需要的能力，全部归 `screen:capture` 一个权限管。声明方式：

```json
{ "permissions": ["screen:capture"] }
```

> **为什么枚举必须走宿主**：采集源无法在渲染层枚举——W3C 规范明确禁止
> `enumerateDevices` 暴露它们，`desktopCapturer` 也自 Electron 17 起只在主进程可用。
> 所以窗口标题、缩略图、应用图标只能由宿主主进程交出来。

### desktopCapturer.getSources

枚举可录制的屏幕与窗口。

```ts
type DesktopSource = {
  id: string                                  // 传给 capture.getStream 的源标识，形如 screen:0:0 / window:123:0
  name: string                                // 窗口标题 / 屏幕名
  kind: 'screen' | 'window'
  display_id: string                          // 屏幕源才有，对应 Display.id
  thumbnail: string                           // 缩略图 Data URL；未请求缩略图时为空串
  appIcon: string                             // 应用图标 Data URL；屏幕源恒为空串
}

api.desktopCapturer.getSources(options?: {
  types?: Array<'screen' | 'window'>          // 默认两者都要
  thumbnailSize?: { width: number; height: number }   // 给 0 表示不要缩略图
  fetchWindowIcons?: boolean                  // 默认 true
}): Promise<DesktopSource[]>
```

```js
// 只枚举不显示缩略图时传 0：明显更快，IPC 也更小
const sources = await api.desktopCapturer.getSources({ thumbnailSize: { width: 0, height: 0 } })
const windows = sources.filter((item) => item.kind === 'window')
```

### capture.getStream

按源取流，返回标准的 `MediaStream`，可直接喂给 `MediaRecorder`。

```ts
api.capture.getStream(options?: {
  sourceId?: string
  kind?: 'screen' | 'window'
  audio?: { speaker?: boolean; microphone?: boolean }
  fps?: number
  width?: number
  height?: number
}): Promise<MediaStream>
```

```js
button.onclick = async () => {
  const stream = await api.capture.getStream({
    sourceId: target.id,
    audio: { speaker: true },   // 系统声音
    fps: 30
  })
  const recorder = new MediaRecorder(stream)
  recorder.start()
}
```

**必须在用户手势里调用。** `getDisplayMedia` 要求 transient user activation 且文档处于聚焦状态；
放在定时器里或 `await` 一大段之后再调会被拒。

**`sourceId` 为什么要先交给宿主**：`getDisplayMedia` 按规范不接受 `deviceId`，插件没法在调用时
直接指定「我要第三个窗口」。`getStream` 内部先把选择通过 IPC 交给主进程，宿主的 request handler
再据此授权。

**系统声音看平台**：

| 平台 | 情况 |
|------|------|
| Windows | 可靠 |
| macOS | 需要 14.2+ 且宿主 `Info.plist` 带 `NSAudioCaptureUsageDescription`；缺了会**静默**给一条永远没有数据的音轨 |
| Linux | PulseAudio / PipeWire **不支持**，该选项会被忽略 |

宿主没给出音轨时会在控制台留一条警告；结合下面的 `getMediaAccessStatus` 判断是不是被系统拒了。

### systemPreferences.getMediaAccessStatus

查询系统级媒体权限状态（macOS 的 TCC、Windows 的隐私总开关）。被系统拒绝时渲染层只会看到
一个 `NotAllowedError`，拿这个才能给出「去系统设置里授权」这种可操作提示。

```ts
api.systemPreferences.getMediaAccessStatus(
  type: 'screen' | 'microphone' | 'camera'
): Promise<'not-determined' | 'granted' | 'denied' | 'restricted' | 'unknown'>
```

```js
const status = await api.systemPreferences.getMediaAccessStatus('screen')
if (status === 'denied') {
  api.toast('屏幕录制被系统拒绝，请到「系统设置 → 隐私与安全性 → 屏幕录制」里勾选本应用')
}
```

Linux 上这个接口可能直接抛，宿主统一回 `'unknown'`。

### overlay.selectRegion

在**真实桌面**上开一层透明置顶覆盖层，让用户直接框选区域（而不是只能在插件窗口内拖）。

```ts
type ScreenRect = { x: number; y: number; width: number; height: number }

api.overlay.selectRegion(): Promise<ScreenRect | null>
```

返回**屏幕坐标（DIP）**矩形，取消时返回 `null`。配合 `api.getDisplayMatching(rect)` 即可换算到
采集流内的位置。覆盖层横跨所有显示器的并集，跨屏框选能一次画完。

### holdSessionReset

阻止主窗口隐藏后的会话重置，让插件页留在内存里。**不需要任何权限。**

```ts
api.holdSessionReset(held: boolean): Promise<boolean>
```

主窗口收起后，宿主默认会在「设置 → 会话重置」的等待时间（默认 30 秒）后把界面重置回搜索首页，
插件页随之被卸载。后台任务型插件（录制、导出、长轮询、批量处理）会因此中断。

开始任务时 `holdSessionReset(true)`、结束时 `holdSessionReset(false)`。

宿主会做三件兜底：同一插件重复 hold 不会叠加、插件页卸载时自动释放、主窗口重新显示后下一次
隐藏会重新计时。建议在 `onPluginOut` 里也释放一次。

配套的快捷方法见[窗口](/api/window)的 `api.hideMainWindowKeepAlive()`——「收起窗口 + 别卸载我」
一次搞定。

### floatWindow

在**所有应用之上**开一个小窗，加载**插件自己的产物**。用途是录屏期间的控制条这类
「要浮在桌面最上层、不在任务栏、还要盖得住别的应用」的界面。

分工是**窗口能力归宿主、样式归插件**：宿主负责置顶 / 透明无边框 / 不进任务栏 / 拖动跟手 /
排除自身采集，插件在自己的产物里渲染那条控制条。

```ts
type PluginFloatWindowOptions = {
  width?: number                // DIP，默认 392
  height?: number               // DIP，默认 60
  excludeFromCapture?: boolean  // 排除自身采集，默认 true
  showInactive?: boolean        // 无焦点显示，默认 true
  persistPosition?: boolean     // 记住上次落点，默认 true
}

api.floatWindow.open(options?: PluginFloatWindowOptions): Promise<boolean>
api.floatWindow.close(): Promise<boolean>
api.floatWindow.resize(size: { width: number; height: number }): Promise<boolean>
api.floatWindow.beginDrag(): void
api.floatWindow.updateDrag(): void
api.floatWindow.endDrag(): void
```

```js
// 开始录制：先开悬浮控制条，再收起主窗口
await api.floatWindow.open({ width: 392, height: 60 })

// ... 录制中 ...

// 停止录制：必须真的关掉
await api.floatWindow.close()
```

悬浮窗里跑的是**同一份插件代码**，靠 `api.getWindowType() === 'float'` 认出自己那一侧，
只渲染控制条而不是完整界面：

```js
if (api.getWindowType() === 'float') {
  // 只渲染那条控制条
  return
}
// 否则渲染完整界面
```

两个窗口之间用消息通道通信：

```ts
api.postFloatMessage(payload: unknown): Promise<boolean>  // 发给「另一个」插件窗口
api.onFloatMessage(callback: (payload: unknown) => void): () => void
```

```js
// 主窗口：把计时推给控制条
setInterval(() => { api.postFloatMessage({ elapsed }) }, 250)

// 控制条：接收状态、把「结束」转发回去
const off = api.onFloatMessage((payload) => {
  if (payload?.action === 'stop') return
  elapsed.value = payload?.elapsed
})
```

**方向由宿主按发送者身份判定**：主窗口发出去 → 悬浮窗收到；悬浮窗发出去 → 主窗口收到。
两个窗口调的是同一个方法，插件不用自己判断方向。

几条必须知道的约束：

| 约束 | 说明 |
| --- | --- |
| **`excludeFromCapture` 默认开着，别关** | 不排除自身采集的话，用户录完会发现录像里有一条控制条在飘，而且永久留在成品里 |
| **同一插件只有一个悬浮窗** | 重复 `open()` 会把它拎到前面，不叠第二个 |
| **`close()` 必须真的调到** | 这个窗口不在任务栏、也没有别的关闭入口，漏关的话用户屏幕上会永久留一条浮着的窗口，只能重启客户端。宿主在插件页卸载 / 停用 / 删除时会兜底关一次 |
| **拖动位移由宿主按屏幕坐标算** | 多屏 + 混合 DPI 下渲染层拿不到准确的全局坐标，自己算会漂。插件只给三个信令 |
| **`resize` 只改尺寸不动位置** | 越界值收窄到 200–900 × 40–320 |

> **窗口尺寸会带一圈非客户区**：Windows 上无边框透明窗实测请求 `392×60` 拿到 `396×65`。
> 这是平台行为，按内容算高度时留一点余量即可。

## screenColorPick

调起全屏取色器。用户完成取色后返回十六进制颜色，取消时返回 `null`。

```ts
api.screenColorPick(): Promise<{ hex: string } | null>
```

```js
const color = api && api.screenColorPick
  ? await api.screenColorPick()
  : null

if (color) {
  text.value = color.hex
}
```

返回示例：

```json
{
  "hex": "#1677ff"
}
```

## 显示器与坐标

```ts
type ScreenPoint = { x: number; y: number }
type ScreenRect = { x: number; y: number; width: number; height: number }
type Display = {
  id: number
  bounds: ScreenRect
  workArea: ScreenRect
  workAreaSize: { width: number; height: number }
  scaleFactor: number
  rotation: number
  touchSupport: string
}

api.getPrimaryDisplay(): Promise<Display>
api.getAllDisplays(): Promise<Display[]>
api.getCursorScreenPoint(): Promise<ScreenPoint>
api.getDisplayNearestPoint(point: ScreenPoint): Promise<Display>
api.getDisplayMatching(rect: ScreenRect): Promise<Display>
api.screenToDipPoint(point: ScreenPoint): Promise<ScreenPoint>
api.dipToScreenPoint(point: ScreenPoint): Promise<ScreenPoint>
api.screenToDipRect(rect: ScreenRect): Promise<ScreenRect>
api.dipToScreenRect(rect: ScreenRect): Promise<ScreenRect>
```

显示器信息只读；插件不能通过这些接口移动宿主窗口。需要抓屏或录屏请用上面的
`desktopCapturer` / `capture`（需声明 `screen:capture`）。Electron 坐标转换在非 Windows 平台
通常返回等价坐标。
