# 系统

系统 API 用于显示主应用 Toast、发送系统通知和打开外部链接。

## toast

在 ToolZen 当前宿主窗口显示短暂的全局 Toast。主窗口和独立插件窗口都会显示在当前插件所在窗口内，不需要声明权限。

```ts
api.toast(message: string, durationMs?: number): void
```

```js
if (api && api.toast) {
  api.toast('处理完成', 3000)
}
```

`durationMs` 为显示时长，单位是毫秒，省略时默认为 `3000`。Toast 适合反馈一次操作结果，不要用来持续输出日志。

## showNotification

发送系统通知，标题缺省使用插件名称。

```ts
api.showNotification(body: string, title?: string): Promise<boolean>
```

```js
const shown = api && api.showNotification
  ? await api.showNotification('处理完成', '文本工作台')
  : false
```

通知应对应用户能够理解的操作结果，不要用于高频日志输出。

## shellOpenExternal

使用系统默认浏览器打开 HTTP(S) 链接。

```ts
api.shellOpenExternal(url: string): Promise<boolean>
```

```js
if (api && api.shellOpenExternal) {
  await api.shellOpenExternal('https://toolzen.top/')
}
```

宿主只接受 `http://` 和 `https://` 地址；其他协议会被拒绝。

网络请求请用 `api.network.fetch()`（需要声明 `network:fetch`）：请求由宿主主进程发出，不受同源策略（CORS）限制，签名与标准 `fetch` 一致。浏览器自带的 `fetch` 仍然可用，但它跑在渲染层、受同源策略约束，跨域目标不返回 CORS 头就会失败。详见[网络](/api/network)。

## showOpenDialog

显示系统文件选择对话框，返回用户选择的路径数组；取消或未声明 `file:dialog` 时返回空数组。

```ts
api.showOpenDialog(options?: {
  title?: string
  defaultPath?: string
  buttonLabel?: string
  filters?: Array<{ name: string; extensions: string[] }>
  properties?: Array<'openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles'>
}): Promise<string[]>
```

宿主只返回路径，不替插件读取、写入或删除文件。

## showSaveDialog

显示系统文件保存对话框，返回用户选择的路径；取消或未声明 `file:dialog` 时返回空字符串。

```ts
api.showSaveDialog(options?: {
  title?: string
  defaultPath?: string
  buttonLabel?: string
  filters?: Array<{ name: string; extensions: string[] }>
}): Promise<string>
```

## shellBeep

播放系统提示音。成功返回 `true`。

```ts
api.shellBeep(): Promise<boolean>
```

## 应用运行环境

### getAppName / getAppVersion

读取宿主应用名称和版本。

```ts
api.getAppName(): Promise<string>
api.getAppVersion(): Promise<string>
```

### getPlatform

返回 Electron 的平台标识，例如 `win32`、`darwin`、`linux`。

```ts
api.getPlatform(): string
```

### isDev

判断当前是否为本地调试插件。通过开发者专区登记的插件返回 `true`，商店或远程插件返回 `false`。

```ts
api.isDev(): boolean
```

### isMacOS / isWindows / isLinux

按当前平台返回布尔值。

```ts
api.isMacOS(): boolean
api.isWindows(): boolean
api.isLinux(): boolean
```
