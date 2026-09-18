# 快捷键

快捷键 API 用于注册**系统级全局快捷键**：用户在别的应用里按下组合键，回调也会在插件的宿主窗口里执行。适合「用户不在插件页上，也要有一个入口」的场景，例如一键读剪贴板、一键把窗口唤出来。

快捷键不需要在 `manifest.permissions` 里声明。

## registerShortcut

注册一个全局快捷键。组合键写法与 Electron 的 Accelerator 一致（`CommandOrControl`、`Alt`、`Shift` 作为修饰键，最后一段是主键），至少要带一个修饰键。

```ts
api.registerShortcut(accelerator: string, callback: () => void): Promise<boolean>
```

```js
const registered = api && api.registerShortcut
  ? await api.registerShortcut('CommandOrControl+Shift+K', () => {
      // 用户在任何应用里按下 Ctrl/Cmd+Shift+K 都会走到这里。
    })
  : false
```

主键可以是单个字母或数字、`F1`–`F24`，以及 `Space`、`Tab`、`Enter`、`Escape`、`Backspace`、`Delete`、`Insert`、`Home`、`End`、`PageUp`、`PageDown`、方向键、`Plus`、`Minus`、`PrintScreen`。

返回 `true` 表示已经登记进系统；返回 `false` 表示这次没注册上。插件应当如实反馈，不要在自己界面上写「快捷键已生效」。会有下面几种情况：

| 情况 | 说明 |
| --- | --- |
| 写法不合法 | 没有修饰键、主键不认识、修饰键重复。单键组合键宿主不受理：那会把整个系统的那个键从所有应用手里抢走。 |
| 被宿主占用 | 组合键正是客户端自己的呼出快捷键，或 `Alt+Space` 这类窗口系统键。 |
| 被别的插件窗口占用 | 同一个组合键全局只有一个注册方；主窗口与独立窗口各注册一份时，只有先注册的那个生效。 |
| 被其他应用占用 | 系统里已经有别的软件占着它。 |

同一个组合键的等价写法（`CommandOrControl+K` 与 `CmdOrCtrl+K`）只认第一次注册的写法，第二种写法会返回 `false`。注册失败的具体原因会打在插件控制台里，便于排查。

### 生效范围与生命周期

- 快捷键是**系统级**的：主窗口收起、用户切到别的应用，只要插件还在跑，按下组合键就会触发回调。
- 回调在插件所在窗口的渲染层执行。主窗口收起之后，插件页会一直挂到「会话重置」到点（默认 30 秒，可在设置里调整）才卸载；插件页一被卸载，宿主就把它的快捷键注销掉。需要「收起之后仍然随叫随到」的插件，请在这个窗口期里完成自己的事，或者用 `api.showMainWindow()` 把窗口唤回来。
- 插件退出（用户返回启动器、`api.outPlugin()`、独立窗口关闭）时宿主自动注销它的全部快捷键，插件不需要在 `onPluginOut` 里额外收尾。
- 宿主重新注册自己的呼出快捷键时（用户在设置里改键、或刚录完新组合键），插件快捷键会跟着重新登记；万一此时组合键被新的呼出键抢走，宿主会注销这条登记，对应回调也就不再触发。宿主录制快捷键期间，插件快捷键会临时让出系统，录完自动补回。

组合键是全局资源，插件之间不会互相礼让：被拒绝时应当降级（例如提示用户当前快捷键不可用），而不是反复重试。

## unregisterShortcut

注销全局快捷键。不传参数时注销当前插件在这个窗口注册的全部快捷键。

```ts
api.unregisterShortcut(accelerator?: string): Promise<boolean>
```

```js
if (api && api.unregisterShortcut) {
  await api.unregisterShortcut('CommandOrControl+Shift+K')
}
```

适合把「要不要接管这个组合键」做成开关的场景：功能关掉时就把组合键还给系统，别让它一直占着。

## 完整示例

```vue
<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  /** 宿主公开插件 API。 */
  api: { type: Object, default: null }
})
const shortcutReady = ref(false)
// 当前是否真的接管了全局快捷键。

onMounted(async () => {
  if (!props.api || !props.api.registerShortcut) return
  shortcutReady.value = await props.api.registerShortcut('CommandOrControl+Shift+K', () => {
    // 用户没在看插件时，把窗口唤回来再做事。
    void props.api.showMainWindow()
  })
})

onBeforeUnmount(() => {
  // 宿主在插件退出时会自动注销；这里显式让出一次，是为了「同一次进入里主动停用」也能生效。
  if (shortcutReady.value) void props.api.unregisterShortcut('CommandOrControl+Shift+K')
})
</script>

<template>
  <p>{{ shortcutReady ? '按下 Ctrl/Cmd+Shift+K 可用' : '当前无法注册全局快捷键' }}</p>
</template>
```

## 使用边界

- 插件页内部的普通按键用 DOM `keydown` 就够了；全局快捷键是给「用户不在这个页面上」的场景准备的，别拿它当页面内的快捷键。
- 组合键请挑得克制，避开系统和常用软件的高频键位；注册不上要如实告诉用户。
- 需要用户知道快捷键是什么，就用 `api.toast` 或界面文案说明，别让用户自己猜。
- 相关能力：[窗口](/api/window) 的 `showMainWindow`、`isWindowActive`，[系统](/api/system) 的 `toast`、`showNotification`。
