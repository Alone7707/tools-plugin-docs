# 系统

系统 API 用于显示主应用 Toast、发送系统通知、打开外部链接，以及**局域网自动发现**、**网段扫描**、**生成二维码**与读取本机网卡地址。

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
| `getApiLevel()` | 宿主 API 级别。当前：1 = 首批能力，2 = 屏幕采集，3 = 读取文件内容 / 局域网发现 / 生成二维码，4 = 网段扫描 |
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

## 网段扫描（api.lan.scan）

列出**本机所在网段**上此刻在线的设备。需要声明 `lan:scan`（**与上面的 `lan:discover` 是不同的权限**，见[权限与能力矩阵](/permissions)）。

这和上面那组「局域网自动发现」回答的是两个不同的问题：

| | `lan.discover`（`lan:discover`） | `lan.scan`（`lan:scan`） |
| --- | --- | --- |
| 问的是 | 「这个网段上有哪些**装了 ToolZen** 的设备」 | 「这个网段上**有哪些设备**」 |
| 手段 | 组播小报文（只在自己人之间往来） | 朝每台设备发 TCP 连接 |
| 对端要求 | 对方也装了 ToolZen 并开着插件 | 无，路由器、打印机、手机都算 |
| 结果 | 对端的 `name` 与 `payload` | 地址、MAC、开放端口 |

### 先选网段：getInterfaces

```ts
api.lan.getInterfaces(): Promise<Array<{
  id: string            // 网卡标识
  name: string          // 网卡名，如 'WLAN' / '以太网' / 'en0'
  address: string       // 本机在这块网卡上的地址
  prefixLength: number  // 子网前缀，如 24
  netmask: string
  kind: 'wifi' | 'ethernet' | 'virtual' | 'loopback' | 'unknown'   // 启发式判定，只用于显示
  isDefault: boolean    // 是否承担默认路由（路由器所在的那块网卡）
  networkId: string     // 网段标识，如 '192.168.1.0/24' —— 扫描时用它
  mac: string
}>>
```

只包含 **IPv4、非回环**的网卡。IPv6 不列：一个 `/64` 前缀下有 2^64 个地址，逐台探测不是这套接口能做的事，列出来只会诱使插件去扫一个永远扫不完的网段。

`kind` 是**启发式**判定的，虚拟机网卡优先于有线网卡（因为 `vEthernet` 里也含 `ethernet`，顺序反了就会把虚拟网卡认成有线网卡）。它只适合拿来做图标，别拿它做逻辑判断。

`isDefault` 是全表最有用的一个字段：多网卡机器上（VPN、WSL、Hyper-V、Docker 都会加网卡）应当**优先展示它**，而不是数组第一条——`networkInterfaces` 的顺序既不是路由优先级，也不是接口优先级。

### 扫描

```ts
api.lan.scan(request: {
  requestId: string     // 本轮扫描的标识，自己生成；取消时用它
  interfaceId: string   // 取自 getInterfaces()
  networkId: string     // 取自 getInterfaces()；必须逐字命中本机某块网卡当前的网段
  timeoutMs?: number    // 时长上限（毫秒），默认 20000，范围 1000–120000
}): Promise<{
  ok: boolean
  requestId: string
  devices: Array<{
    address: string
    mac: string         // 扫描后从系统邻居表补的；读不到是空串
    evidence: 'port-open' | 'host-rejected'
    openPorts: number[] // evidence 为 'host-rejected' 时是空数组
    self: boolean
  }>
  scannedAt: number     // 本轮结束时刻（epoch 毫秒）
  coverage: {
    interfaceId: string
    networkId: string
    total: number       // 网段内的主机总数（截断前）
    probed: number      // 本轮真正探测过的地址数
    truncated: boolean  // 是否因为网段太大只扫了其中一段
    elapsedMs: number
  }
  code?: string         // 'ok' | 'timeout' | 'cancelled' | 'invalid' | 'too-many'
  message?: string
}>

api.lan.cancelScan(requestId: string): Promise<boolean>
```

最小用法：

```js
const interfaces = await api.lan.getInterfaces()
// 优先用承担默认路由的那块网卡。
const target = interfaces.find((item) => item.isDefault) || interfaces[0]
if (!target) {
  api.toast('这台机器没有可扫描的网段')
  return
}

const requestId = 'scan-' + Date.now()
const result = await api.lan.scan({
  requestId,
  interfaceId: target.id,
  networkId: target.networkId,
  timeoutMs: 20000
})

if (!result.ok) {
  // code: 'cancelled' / 'invalid' / 'too-many'——message 里有具体原因。
  console.warn(result.message)
}

for (const device of result.devices) {
  console.log(device.address, device.mac, device.openPorts.join('/'))
}

// 结果不全时如实告诉用户，而不是假装扫完了。
if (result.code === 'timeout' || result.coverage.truncated) {
  api.toast('结果可能不完整，可再扫一次或缩短范围')
}
```

### 「在线」是怎么判定的

`devices` 里的每一台都带**本轮真的收到了对方的报文**这一个依据，`evidence` 只有两种取值：

- **`port-open`**：某个端口完成了 TCP 三次握手，对端主动应答了；
- **`host-rejected`**：某个端口回了 RST（端口没开），但这个 RST 是**对方亲自回的**，同样证明它此刻在网段上。

**系统 ARP 缓存不参与在线判定。** 那张表里的条目能存活很久，拔了网线、关了机的机器照样躺在里面；拿它当依据，界面上就会一直挂着一台早就不在的设备。宿主只在**已经确认在线之后**才从邻居表给设备补 `mac` 字段，所以 `mac` 为空只说明读不到，不代表设备不在线。

反过来说：**没响应就是没进清单**。防火墙静默丢弃（DROP）的设备是扫不出来的，这与「不在线」在结果上无法区分——插件不要把它解释成「这台机器肯定不在」。

### 可扫范围

`networkId` 必须**逐字命中本机某块网卡当前的网段**（地址与掩码都要对上）。不匹配时 `scan` 回 `{ ok: false, code: 'invalid' }`，一发包都不发。

这不是防谁，而是不让这套接口变成一台任意网段的扫描器：**插件能扫的范围，与用户这台电脑此刻所在的网络完全重合**。用户换了网络，可扫的网段就跟着变；用户没连的网络，插件一个包也发不出去。

几个边界：

- 网段超过 **1024 台主机**时只扫前面一段，`coverage.truncated` 为 `true`、`coverage.total` 报的是网段实际大小。/24（254 台）是最常见的情况，一次能扫完；/16 那种会截断。
- 单次扫描最多 **120000 毫秒**；撞上上限会提前收工，`code` 为 `'timeout'`，**`devices` 里是已经扫到的那部分，不是空的**——大网段上时间不够是常态，把扫到的一半丢掉才是真的浪费。插件应当照常展示，并提示结果可能不全。
- 同一个插件实例同时最多跑 **2 轮**扫描；超了回 `{ ok: false, code: 'too-many' }`。
- 同一个 `requestId` 不许重入。

### 取消

```js
const pending = api.lan.scan({ requestId, interfaceId, networkId })
// 用户按了「停止」，或者插件要退出：
const cancelled = await api.lan.cancelScan(requestId)
const result = await pending
// result.ok === false，result.code === 'cancelled'
```

- **只取消得动本插件实例发起的那些。** 同一个窗口里另一个插件、或者别的窗口，拿了 `requestId` 也停不了（回 `false`）。
- 找不到就回 `false`：已经跑完、已经被取消过、或者压根不是自己发起的，都算找不到。
- **插件退出时宿主自动收掉它名下所有还在跑的扫描**（组件卸载、窗口关闭都会触发），插件不必在 `onPluginOut` 里额外收尾。
- 被取消时 `devices` 里是**已经扫到的那部分**，同样每台都带证据——可以显示「扫到一半被停了」，而不是清空。

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

> 它和 `api.lan.getInterfaces()` 的区别：这个是「这台机器有哪些地址」的老接口，**含回环、含 IPv6**，不给你网段；要扫网段请用 `api.lan.getInterfaces()`（它只列可扫的 IPv4 网卡，并带 `networkId` 与 `isDefault`），那个登记在 `lan:scan` 能力下、4 级起可用。

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
