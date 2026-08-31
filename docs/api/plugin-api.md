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
| [窗口](/api/window) | `hideMainWindow`、`showMainWindow`、`outPlugin`、`detachWindow`、`setExpendHeight`、`isDetachedWindow`、`getWindowType`、`redirect`、`setSubtitle`、`setDetachPayload`、`isDarkColors` |
| [复制](/api/copy) | `copyText`、`readClipboardText`、`readClipboardImage`、`clearClipboard`、`copyClipboardImage` |
| [输入](/api/input) | `initialText`、`enterAction`、后续输入处理 |
| [系统](/api/system) | `showNotification`、`showOpenDialog`、`showSaveDialog`、`shellBeep`、`shellOpenExternal`、`getAppName`、`getAppVersion`、`getPlatform`、`isDev`、`isMacOS`、`isWindows`、`isLinux` |
| [屏幕](/api/screen) | `screenColorPick`、显示器查询、鼠标坐标和 DIP 坐标转换 |
| [用户](/api/user) | `pluginCode`、`getPluginInfo`、`getPluginConfig`、账号与插件身份边界 |
| [数据存储](/api/db) | `db.get/put/remove`、`dbStorage.getItem/setItem/removeItem` |
| [动态指令](/api/features) | `features[].cmds`、`clipboardRules`、进入动作 |

## 通用约定

- 事件监听方法返回取消函数，组件卸载时必须调用。
- `Promise<boolean>` 返回 `false` 时表示动作未完成或被宿主拒绝。
- 原生文件对话框需要在 `manifest.permissions` 中声明 `file:dialog`；未声明时不会弹出系统窗口。
- 剪贴板读写会按 `manifest.permissions` 做能力检查；未声明权限时返回空值或 `false`。
- 插件不能直接调用 Node.js、Electron 主进程、`require` 或内部 IPC。
- `window.toolzen` 是宿主内部 bridge，不是第三方插件的稳定 API。
