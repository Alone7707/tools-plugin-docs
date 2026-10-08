# 系统

系统 API 用于显示主应用 Toast、发送系统通知、打开外部链接，以及**局域网自动发现**、**生成二维码**与读取本机网卡地址。

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

> `getAppVersion()` 返回的是给人看的版本号（如 `0.0.29`）。**不要拿它判断宿主有没有某个能力**——版本号里既有修 bug 也有加能力，比较版本号迟早误判。判断能力请用下面的 `getApiLevel()` / `hasCapability()`。

### getApiLevel / hasCapability / getCapabilities

探测宿主具备哪些能力。宿主 API 级别（`apiLevel`）**只增不减**：新增能力时 +1，级别越高能力越多。

```ts
api.getApiLevel(): number
api.hasCapability(name: string): boolean
api.getCapabilities(): string[]
```

| 接口 | 说明 |
| --- | --- |
| `getApiLevel()` | 宿主 API 级别。当前：1 = 首批能力，2 = 屏幕采集，3 = 读取文件内容 / 局域网发现 / 生成二维码 |
| `hasCapability(name)` | 宿主是否具备某个能力，名字与 `permissions` 一致（如 `screen:capture`） |
| `getCapabilities()` | 宿主全部能力名，按首次出现的级别排序 |

**这三个接口不需要任何权限**：它们只回答「宿主会不会」，不读也不改用户数据。

**注意区分两件事**：`hasCapability()` 回答的是「**这台客户端会不会**」，不代表「**你的插件有没有被授权**」。后者看 `manifest.permissions`，由权限门管。两者都要满足才能真正调用——能力缺失是版本问题（要升级客户端），权限缺失是插件自身声明问题（改 manifest 重发即可）。

**老客户端上这三个方法不存在**，直接调用会抛 `TypeError`。必须用兜底写法：

```js
/** 探测宿主能力；老客户端没有 hasCapability，缺方法即视为不支持。 */
function supports(api, name) {
  try {
    return typeof api.hasCapability === 'function' && api.hasCapability(name) === true
  } catch {
    return false
  }
}

if (supports(api, 'screen:capture')) {
  const stream = await api.capture.getStream({ sourceId })
} else {
  api.toast('屏幕录制需要升级 ToolZen 客户端')
}
```

更省事的做法是在 `manifest.json` 里声明 `requires` / `optional`，让宿主在加载前替你判定，并把结果直接告诉用户。详见[版本与兼容性](/compatibility)。

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

## 局域网自动发现（api.lan）

让**同一局域网**内两台装了 ToolZen 的电脑互相看见，不需要任何服务器，数据不出本地网络。需要声明 `lan:discover`。

插件跑在渲染进程里，**不能监听端口**，所以组播套接字由宿主主进程代管。宿主在管理范围组播地址（`239.255.77.90:47823`）上收发一个小 JSON 报文，只在本网段传播（TTL = 1）。

```ts
api.lan.advertise(request: {
  service: string    // 服务标识，最长 40 字符；同一项服务的对端才会互相发现
  name?: string      // 展示名，通常是本机名
  payload?: string   // 交给对端的载荷，最长 2048 字符
}): Promise<{ ok: boolean; id?: string; name?: string; code?: string; message?: string }>

api.lan.discover(request: {
  service: string
  timeoutMs?: number  // 等待时长，默认 3000，上限 15000
}): Promise<{
  ok: boolean
  peers: Array<{ id: string; service: string; name: string; address: string; payload: string }>
  code?: string
  message?: string
}>

api.lan.stop(id?: string): Promise<boolean>
```

最小用法（两端都调同一段代码即可）：

```js
// 一侧：把自己的连接码挂上去播报。
const advertised = await api.lan.advertise({
  service: 'lan-file-transfer',
  name: '我的电脑',
  payload: connectionCode
})

if (!advertised.ok) {
  // 网络屏蔽了组播：退回「手工复制粘贴连接码」那条路，别卡在「正在搜索」。
  api.toast('当前网络不支持自动发现，请手工交换连接码')
}

// 另一侧：搜一轮。
const found = await api.lan.discover({ service: 'lan-file-transfer', timeoutMs: 3000 })
for (const peer of found.peers) {
  console.log(peer.name, peer.address, peer.payload)
}

// 收工时停掉（插件卸载时宿主也会自动收摊）。
await api.lan.stop(advertised.id)
```

语义要点：

- **`discover` 是「探一次、等一会儿」，不是持续订阅。** 它只返回**这一轮**听到的对端（每次调用会清掉上一轮的记录）。要长期盯着就自己隔几秒调一次——一次调用只占一个短窗口，不会在插件被卸载后还留一条监听。
- **对端超过 10 秒没有心跳就算下线**（宿主每 3 秒播报一次）。所以别把 `discover` 的结果长期缓存。
- **`payload` 最长 2048 字符**，正好够放一条 SDP 连接码。更大的内容请走已经建立好的数据通道。
- **`payload` 是同网段可见的**：不要把密码、令牌这类敏感内容放进去。
- **窗口销毁时广告自动撤下**，插件不必在 `onPluginOut` 里额外收尾；`stop(id)` 只肯停自己登记的广告。

### 组播被网络屏蔽时

企业 WiFi、访客网络、部分路由器会屏蔽组播。此时 `advertise` / `discover` 会如实回 `ok: false`（`code: 'unavailable'`，`message` 里是原因），**不是**回一个空的对端列表——两者含义不同，前者是「这条路走不通」，后者是「这一轮没人应答」。

插件应当据此退回手工交换连接码，而不是让用户一直看「正在搜索」：

```js
const found = await api.lan.discover({ service: 'lan-file-transfer' })

if (!found.ok) {
  // 组播不可用：显示「手工输入连接码」的入口。
  mode.value = 'manual'
} else if (!found.peers.length) {
  // 组播可用但没人应答：提示对方也打开插件。
  api.toast('没有搜到设备，请确认对方也打开了本插件')
}
```

## 读取本机网卡地址（getLocalAddresses）

列出本机的网卡地址，用于排查「两台电脑不在同一网段」这类连接失败。

```ts
api.getLocalAddresses(): Promise<Array<{
  interface: string          // 网卡名，如 'WLAN' / '以太网'
  address: string
  family: 'IPv4' | 'IPv6'
  internal: boolean          // 回环地址（127.0.0.1 / ::1）
}>>
```

**不需要任何权限**：只读、不含用户数据，而且这些地址在同网段本来就是公开的。仍登记为 `lan:discover` 能力，让老客户端能被 `requires` 拦下。

```js
const addresses = await api.getLocalAddresses()
const lan = addresses.filter((item) => !item.internal && item.family === 'IPv4')

if (lan.length > 1) {
  // 多张网卡时提示用户确认对方在同一网段。
  api.toast(`本机有 ${lan.length} 个局域网地址：${lan.map((item) => item.address).join('、')}`)
}
```

拿不到网卡信息时返回空数组（老宿主上这个接口不存在，也回空数组），不会抛错。

## 生成二维码（renderQrCode）

把一段文本渲染成二维码 PNG Data URL。

```ts
api.renderQrCode(request: {
  text: string
  size?: number    // 图片边长（像素），默认 320，范围 64–1024
  margin?: number  // 静默区宽度（模块数），默认 2，范围 0–8
  level?: 'L' | 'M' | 'Q' | 'H'   // 纠错级别，默认 'M'
}): Promise<{ ok: boolean; dataUrl?: string; size?: number; code?: string; message?: string }>
```

**不需要任何权限**：纯计算，不读也不改用户数据。仍登记为 `qrcode:render` 能力，让老客户端能被 `requires` 拦下。

典型用途是把长连接码变成二维码，对端扫码即可，省掉「复制长文本漏字符」这一类问题：

```js
const qr = await api.renderQrCode({ text: connectionCode, size: 320 })

if (qr.ok) {
  // 直接塞进 <img src>。
  image.value = qr.dataUrl
  // 也可以复制到剪贴板（需要 clipboard:write）。
  await api.copyClipboardImage(qr.dataUrl)
} else {
  api.toast(`生成二维码失败：${qr.message || qr.code}`)
}
```

文本超出二维码容量时会回 `{ ok: false, code: 'failed' }`，**不会**给一张扫不出来的图。
