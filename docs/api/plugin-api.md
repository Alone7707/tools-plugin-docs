# API 参考

插件通过组件的 `api` prop 获取 ToolZen 宿主能力。`api` 由宿主按插件 `code` 创建，每个插件实例的存储空间相互隔离。

```vue
<script setup>
const props = defineProps({
  /** 宿主公开插件 API。 */
  api: { type: Object, default: null }
})
// 宿主传入的插件运行参数。
</script>
```

浏览器预览、加载失败恢复等场景中 `api` 可能为 `null`，每次调用前都要判断对象和方法是否存在。

## 分类索引

API 按用途拆分为独立页面。每个分类页分别说明能力用途、调用签名、参数、返回值、示例和使用边界。

| 分类 | 公开能力 |
| --- | --- |
| [事件](/api/events) | `getEnterAction`、`onPluginEnter`、`onPluginOut`、`onPluginDetach`、`onThemeChange`、`onWindowShow`、`onWindowHide` |
| [窗口](/api/window) | `hideMainWindow`、`showMainWindow`、`outPlugin`、`detachWindow`、`setExpendHeight`、`isDetachedWindow`、`isWindowActive`、`getWindowType`、`redirect`、`setSubtitle`、`setDetachPayload`、`isDarkColors` |
| [快捷键](/api/shortcut) | `registerShortcut`、`unregisterShortcut` |
| [复制](/api/copy) | `copyText`、`readClipboardText`、`readClipboardImage`、`readClipboardFiles`、`clearClipboard`、`copyClipboardImage`、`copyFile` |
| [输入](/api/input) | `initialText`、`enterAction`、后续输入处理 |
| [文件](/api/file) | `getPathForFile`、`file.scan`、`file.exists`、`file.reveal`、`file.read`、`file.grant`、`file.rename`、`file.write` |
| [网络](/api/network) | `api.network.fetch`、宿主主进程代发请求、响应流式读取与错误码 |
| [系统](/api/system) | `toast`、`showNotification`、`showOpenDialog`、`showSaveDialog`、`shellBeep`、`shellOpenExternal`、`shellOpenPath`、`shellTrashItem`、`getFileIcon`、`getNativeId`、`getPluginLocalDataPath`、`getPluginTempPath`、`api.lan.*`（含 `getInterfaces`、`scan`、`cancelScan`）、`getLocalAddresses`、`renderQrCode`、`getAppName`、`getAppVersion`、`getApiLevel`、`hasCapability`、`getCapabilities`、`getPlatform`、`isDev`、`isMacOS`、`isWindows`、`isLinux` |
| [屏幕](/api/screen) | `desktopCapturer.getSources`、`capture.getStream`、`systemPreferences.getMediaAccessStatus`、`overlay.selectRegion`、`floatWindow.*`、`postFloatMessage` / `onFloatMessage`、`holdSessionReset`、`screenColorPick`、显示器查询、鼠标坐标和 DIP 坐标转换 |
| [窗口](/api/window) | `hideMainWindow`、`hideMainWindowKeepAlive`、`holdSessionReset`、`outPlugin`、`setExpendHeight`、`detachWindow`、独立窗口 |
| [用户](/api/user) | `pluginCode`、`getPluginInfo`、`getPluginConfig`、账号与插件身份边界 |
| [数据存储](/api/db) | `db.get/put/remove`、`dbStorage.getItem/setItem/removeItem` |
| [动态指令](/api/features) | `features[].cmds`、`clipboardRules`、进入动作、运行期增删入口（`setFeature` / `getFeatures` / `removeFeature`） |
| [搜索框集成](/api/search) | `onMainPush`、`onPluginReady`、预挂载与推送结果的边界 |
| [定时任务](/api/schedule) | `requestSchedule`、`getSchedules`、`removeSchedule`、`onScheduleTrigger`、cron 写法 |
| [AI 能力](/api/ai) | `ai`、`allAiModels`、`registerTool`、函数调用循环、额度分档 |

## 通用约定

- 事件监听方法返回取消函数，组件卸载时必须调用。
- **判断宿主能力用 `api.hasCapability()` 或 `api.getApiLevel()`，不要解析 `getAppVersion()` 的版本号。** 版本号里既有修 bug 也有加能力，拿它当能力判据迟早误判。注意 `hasCapability` 本身在老客户端上不存在，调用前要判 `typeof`——写法见[版本与兼容性](/compatibility)。
- 插件声明了 `requires` / `optional` 之后，宿主会在加载前替你判定能不能跑：缺 `requires` 直接拦在升级提示页，缺 `optional` 只提示「有几项功能不可用」。能用降级解决的优先写 `optional`。
- 全局快捷键跟着插件实例走：插件退出时宿主自动注销，不需要在 `onPluginOut` 里额外收尾。
- `Promise<boolean>` 返回 `false` 时表示动作未完成或被宿主拒绝。
- 原生文件对话框需要在 `manifest.permissions` 中声明 `file:dialog`；未声明时不会弹出系统窗口。
- 文件读取需要 `file:read`，**读取文件内容**需要 `file:read-content`，文件写入需要 `file:write`；`file.rename`、`file.write` 与 `file.read` 只受理本会话已登记进授权集合的路径，拖入插件自身拖放区的文件需要先调用 `api.file.grant()`。详见[文件](/api/file)。
- 跨域网络请求需要 `network:fetch`，用 `api.network.fetch()` 由宿主主进程代发，不受 CORS 限制；未声明权限时它抛 `TypeError`。浏览器自带的 `fetch` 只适合同源场景。详见[网络](/api/network)。
- 局域网自动发现需要 `lan:discover`，用 `api.lan.advertise()` / `api.lan.discover()` 让同网段的两台电脑互相看见；组播被网络屏蔽时会如实回 `ok: false`，插件应退回手工交换连接码。详见[系统](/api/system)。
- **网段扫描需要 `lan:scan`**（与 `lan:discover` 是**两项不同的权限**，别混），用 `api.lan.getInterfaces()` 选网段、`api.lan.scan()` 扫、`api.lan.cancelScan()` 取消；只能扫本机网卡当前所在的网段，每台结果都带本轮响应证据。详见[系统](/api/system#网段扫描apilanscan)。
- `api.renderQrCode()`、`api.getLocalAddresses()` 与 `api.holdSessionReset()` / `api.hideMainWindowKeepAlive()` **不需要权限**（分别是纯计算、只读本机网卡、以及「别把我卸载掉」），但仍登记在能力清单里（`qrcode:render` / `lan:discover`），便于老客户端被 `requires` 拦下。
- 录屏 / 截屏需要 `screen:capture`：`api.desktopCapturer.getSources()` 枚举屏幕与窗口，`api.capture.getStream()` 按源取流（可带系统声音），`api.overlay.selectRegion()` 做桌面级区域选区。未声明权限时枚举回空数组、取流直接抛错。详见[屏幕](/api/screen)。
- **系统外壳操作需要 `system:shell`**：`api.shellOpenPath()` 用默认程序打开、`api.shellTrashItem()` 移入回收站、`api.getFileIcon()` 取图标。`shellTrashItem` 是**用户可见的破坏性操作**，只在用户明确点选时调用。详见[系统](/api/system#系统外壳操作systemshell)。
- **把文件写进剪贴板需要 `clipboard:write-files`**（与写文本的 `clipboard:write` 是两项权限），用 `api.copyFile(paths)`；粘到别的应用里会真的产生副本。详见[复制](/api/copy)。
- **定时任务需要 `schedule:request`**：用 `api.requestSchedule()` 申请、`api.onScheduleTrigger()` 接收触发。**它能让插件在用户没打开它的时候被自动唤起**，只在用户明确需要「定期自动做某事」时才申请。详见[定时任务](/api/schedule)。
- **运行期增删搜索入口需要 `feature:dynamic`**（`api.setFeature()` 等），**往搜索框推送结果需要 `feature:mainpush`**（`api.onMainPush()`，还需在功能上声明 `mainPush: true`）。推送回调在**每次按键时被同步调用**，必须快、必须稳。详见[搜索框集成](/api/search)。
- **调用平台 AI 需要 `ai:chat`**（`api.ai()` / `api.allAiModels()`），**注册 AI 工具需要 `ai:tools`**（`api.registerTool()`）。**AI 调用消耗平台的付费额度**，插件额度与用户的内置对话额度**分开计算**（默认 50 次/天）。详见 [AI 能力](/api/ai)。
- `api.onPluginReady()`、`api.getNativeId()`、`api.getPluginLocalDataPath()` / `api.getPluginTempPath()` **不需要权限**（分别是「宿主通知插件已就绪」、设备标识、插件自己的目录）。
- 剪贴板读写会按 `manifest.permissions` 做能力检查；未声明权限时返回空值或 `false`。
- 插件不能直接调用 Node.js、Electron 主进程、`require` 或内部 IPC。
- `window.toolzen` 是宿主内部 bridge，不是第三方插件的稳定 API。
