# 窗口

窗口 API 用于显示或隐藏主窗口、退出插件、调整高度、打开独立窗口、跨插件跳转和控制宿主标题栏。

## showMainWindow

显示并聚焦 ToolZen 主窗口。返回 `false` 表示当前宿主没有可用主窗口。

```ts
api.showMainWindow(): Promise<boolean>
```

## setExpendHeight

调整主窗口内容高度。方法名沿用兼容 API 的拼写；独立窗口调用返回 `0`。

```ts
api.setExpendHeight(
  height: number,
  options?: { minimumHeight?: number; animate?: boolean; durationMs?: number }
): Promise<number>
```

```js
await api.setExpendHeight(560, { minimumHeight: 420, animate: true })
```

`height` 是内容高度，返回值是实际落地的高度；`options.minimumHeight` 抬高的是窗口的最小内容高度——设置之后窗口不会再被压到该值以下。`height` 和 `minimumHeight` 都会被宿主夹取到当前屏幕的可用工作区内。

`animate` 与 `durationMs` 控制这次高度变化的过渡动画：`animate: true` 开启过渡，`durationMs` 指定毫秒时长，省略时使用宿主默认值。独立窗口调用返回 `0`。

## hideMainWindow

最小化主窗口，不会主动卸载当前插件。

```ts
api.hideMainWindow(): void
```

```js
if (api && api.hideMainWindow) api.hideMainWindow()
```

> 注意：窗口收起后，宿主默认会在「设置 → 会话重置」的等待时间（默认 30 秒）后把界面重置回
> 搜索首页，**插件页随之被卸载**。后台任务型插件（录制、导出、长轮询、批量处理）要用
> `api.hideMainWindowKeepAlive()` 或 `api.holdSessionReset(true)`，否则任务会在 30 秒后被静默中断。

## hideMainWindowKeepAlive

收起主窗口，并让本插件页**不被会话重置卸载**。**不需要任何权限。**

```ts
api.hideMainWindowKeepAlive(hold?: boolean): void   // hold 默认 true
```

```js
// 开始一个后台任务：收起窗口，但别把我卸载掉
api.hideMainWindowKeepAlive()

// ... 任务结束 ...
api.holdSessionReset(false)
```

「隐藏窗口 + 别重置我」是后台任务型插件最常见的组合，所以并成一次调用——分开调容易漏掉后一步，
漏了的后果是任务在 30 秒后被静默中断。语义上等价于 `holdSessionReset(true)` 之后
`hideMainWindow()`。

传 `hold: false` 表示「收起窗口，但照常按会话重置时间卸载我」。

## holdSessionReset

单独控制会话持有，不涉及窗口。**不需要任何权限。**

```ts
api.holdSessionReset(held: boolean): Promise<boolean>
```

宿主会做三件兜底：同一插件重复 hold 不会叠加、插件页卸载时自动释放、主窗口重新显示后
下一次隐藏会重新计时。建议在 `onPluginOut` 里也释放一次，语义更清楚。

## outPlugin

主窗口中返回搜索首页；独立窗口中关闭当前插件窗口。

```ts
api.outPlugin(): void
```

```js
if (api && api.outPlugin) api.outPlugin()
```

## detachWindow

将当前插件分离为独立窗口。

```ts
api.detachWindow(options?: PluginDetachWindowOptions): Promise<boolean>
```

```ts
type PluginDetachWindowOptions = {
  title?: string
  featureCode?: string
  initialText?: string
  width?: number
  height?: number
}
```

```js
const opened = api && api.detachWindow
  ? await api.detachWindow({
      title: '文本工作台',
      initialText: text.value,
      width: 720,
      height: 560
    })
  : false
```

## isDetachedWindow

判断当前实例是否运行在独立窗口中。

```ts
api.isDetachedWindow(): boolean
```

```js
const detached = Boolean(api && api.isDetachedWindow && api.isDetachedWindow())
```

## getWindowType

读取当前插件窗口类型。

```ts
api.getWindowType(): 'main' | 'detach'
```

`'main'` 表示插件运行在主窗口工作区，`'detach'` 表示运行在可调整尺寸的独立窗口。

## isWindowActive

判断这个插件的宿主窗口此刻是不是「正对着用户」：窗口已聚焦、可见、且未最小化。返回 `false` 就说明用户已经切到别的应用、把主窗口收起来了，或者把独立窗口最小化了。

```ts
api.isWindowActive(): Promise<boolean>
```

```js
const active = api && api.isWindowActive ? await api.isWindowActive() : true
if (!active) {
  await api.showNotification('导出完成，共 128 条', '文本工作台')
}
```

适合耗时任务收尾时使用：用户在等的时候会切走去干别的，跑完了得有个地方告诉他结果。配合 [showNotification](/api/system) 就是「干完了、但你没在看，所以弹系统通知」这套做法。

两点需要留意：

- 这是**窗口**级的答案。主窗口里用户点回启动器页面之后插件页会被卸载，此时窗口若仍是前台，答案依然是 `true`。插件页卸载后插件代码也不再运行，所以只有「界面已卸载、收尾逻辑仍在模块级状态里继续跑」这类插件才需要再结合自己的挂载状态判断。
- 它返回 `Promise`。窗口状态由主进程掌握，这里拿到的是一次查询结果，不是本地状态变量。

## redirect

打开另一个已安装插件，并把可选文本传给目标插件。

```ts
api.redirect(code: string, payload?: string): void
```

```js
if (api && api.redirect) api.redirect('json_toolbox', text.value)
```

## setSubtitle

设置宿主标题栏中插件名右侧的功能副标题，最多 40 个字符。传空字符串可清除。

```ts
api.setSubtitle(text: string): void
```

```js
if (api && api.setSubtitle) api.setSubtitle('文本工作台')
```

## setDetachPayload

注册一个函数，让宿主在用户双击标题栏分离窗口时读取最新内容。

```ts
api.setDetachPayload(
  provider: (() => PluginDetachWindowOptions | null | void) | null
): void
```

```js
if (api && api.setDetachPayload) {
  api.setDetachPayload(() => ({
    initialText: text.value,
    width: 720,
    height: 560
  }))
}
```

组件卸载时调用 `api.setDetachPayload(null)` 取消注册。

## isDarkColors

读取宿主当前是否使用深色主题。

```ts
api.isDarkColors(): boolean
```

```js
const dark = Boolean(api && api.isDarkColors && api.isDarkColors())
```

插件不要自绘宿主标题栏，也不要声明 `-webkit-app-region: drag`。
