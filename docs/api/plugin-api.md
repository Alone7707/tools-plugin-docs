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
| [复制](/api/copy) | `copyText`、`readClipboardText`、`readClipboardImage`、`readClipboardFiles`、`clearClipboard`、`copyClipboardImage` |
| [输入](/api/input) | `initialText`、`enterAction`、后续输入处理 |
| [文件](/api/file) | `getPathForFile`、`file.scan`、`file.exists`、`file.reveal`、`file.read`、`file.grant`、`file.rename`、`file.write` |
| [网络](/api/network) | `api.network.fetch`、宿主主进程代发请求、响应流式读取与错误码 |
| [系统](/api/system) | `toast`、`showNotification`、`showOpenDialog`、`showSaveDialog`、`shellBeep`、`shellOpenExternal`、`api.lan.*`、`getLocalAddresses`、`renderQrCode`、`getAppName`、`getAppVersion`、`getApiLevel`、`hasCapability`、`getCapabilities`、`getPlatform`、`isDev`、`isMacOS`、`isWindows`、`isLinux` |
| [屏幕](/api/screen) | `desktopCapturer.getSources`、`capture.getStream`、`systemPreferences.getMediaAccessStatus`、`overlay.selectRegion`、`floatWindow.*`、`postFloatMessage` / `onFloatMessage`、`holdSessionReset`、`screenColorPick`、显示器查询、鼠标坐标和 DIP 坐标转换 |
| [窗口](/api/window) | `hideMainWindow`、`hideMainWindowKeepAlive`、`holdSessionReset`、`outPlugin`、`setExpendHeight`、`detachWindow`、独立窗口 |
| [用户](/api/user) | `pluginCode`、`getPluginInfo`、`getPluginConfig`、账号与插件身份边界 |
| [数据存储](/api/db) | `db.get/put/remove`、`dbStorage.getItem/setItem/removeItem` |
| [动态指令](/api/features) | `features[].cmds`、`clipboardRules`、进入动作 |

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
- `api.renderQrCode()`、`api.getLocalAddresses()`、`api.holdSessionReset()` 与 `api.hideMainWindowKeepAlive()` **不需要权限**（分别是纯计算、只读本机网卡、以及「别把我卸载掉」），但仍登记在能力清单里，便于老客户端被 `requires` 拦下。
- 录屏 / 截屏需要 `screen:capture`：`api.desktopCapturer.getSources()` 枚举屏幕与窗口，`api.capture.getStream()` 按源取流（可带系统声音），`api.overlay.selectRegion()` 做桌面级区域选区。未声明权限时枚举回空数组、取流直接抛错。详见[屏幕](/api/screen)。
- 剪贴板读写会按 `manifest.permissions` 做能力检查；未声明权限时返回空值或 `false`。
- 插件不能直接调用 Node.js、Electron 主进程、`require` 或内部 IPC。
- `window.toolzen` 是宿主内部 bridge，不是第三方插件的稳定 API。
