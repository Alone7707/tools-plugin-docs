# 窗口

窗口 API 用于隐藏主窗口、退出插件、打开独立窗口、跨插件跳转和控制宿主标题栏。

## hideMainWindow

最小化主窗口，不会主动卸载当前插件。

```ts
api.hideMainWindow(): void
```

```js
if (api && api.hideMainWindow) api.hideMainWindow()
```

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
