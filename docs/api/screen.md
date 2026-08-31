# 屏幕

ToolZen 向第三方插件开放全屏取色能力、显示器布局查询和坐标换算能力。

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

显示器信息只读；插件不能通过这些接口移动宿主窗口或执行屏幕截图。Electron 坐标转换在非 Windows 平台通常返回等价坐标。
