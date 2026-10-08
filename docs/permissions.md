# 权限与能力矩阵

权限写在 `manifest.json` 的 `permissions` 数组中，并展示给用户。声明应与插件实际行为一致；未声明的能力不能通过绕过 `api` 或动态脚本加载来获得。

## 权限与「能力声明」不是一回事

这两个概念名字很像、取值也重叠，但管的是两条独立的轴，**别混**：

| | `permissions` | `requires` / `optional` / `minApiLevel` |
| --- | --- | --- |
| 管什么 | **安全**：插件获准做什么 | **兼容**：宿主会不会做 |
| 谁来判 | 服务端审核 + 用户知情同意 + 运行期权限门 | 客户端在**加载插件之前**判定 |
| 不满足时 | 调用被拦截（返回空值或抛错） | 缺 `requires` 拒绝打开；缺 `optional` 只提示降级 |
| 缺失的原因 | 插件没声明（改 manifest 重发即可） | 客户端版本旧（要升级客户端） |

同一个名字（如 `screen:capture`）会同时出现在两边，但回答的问题不同：

```jsonc
{
  "permissions": ["screen:capture"],   // 「我要用屏幕采集」——审核与授权
  "requires": ["screen:capture"]        // 「宿主得会屏幕采集」——版本判定
}
```

**两者都要满足才能真正调用。** 只声明 `permissions` 而不声明 `requires` 时，插件在旧客户端上会被加载起来、然后在调用处失败；声明了 `requires` 则会在加载前就被拦下并给出可读提示。详见[版本与兼容性](/compatibility)。

## 权限清单

| 权限 | 允许的行为 | 推荐接口 | 风险提示 |
| --- | --- | --- | --- |
| `clipboard:read` | 读取剪贴板内容或声明剪贴板识别规则 | `api.readClipboardText()`、`api.readClipboardImage()`、`api.readClipboardFiles()`、`initialText` / `enterAction` | 只处理插件必要的数据，不要长期保存 |
| `clipboard:write` | 将结果写入系统剪贴板或清空剪贴板 | `api.copyText(text)`、`api.copyClipboardImage(dataUrl)`、`api.clearClipboard()` | 不要覆盖用户剪贴板而不提示 |
| `network:fetch` | 由宿主主进程代发网络请求 | `api.network.fetch()` | 不受同源策略（CORS）限制，可访问任意 `http(s)` 服务，且不带宿主自身 cookie；应披露数据去向 |
| `file:dialog` | 打开系统文件选择或保存对话框 | `api.showOpenDialog()`、`api.showSaveDialog()` | 只读取用户主动选择的路径；宿主不替插件读写文件 |
| `file:read` | 读取用户交给插件的文件**信息**（名称、大小、时间） | `api.file.scan()`、`api.file.exists()`、`api.file.reveal()` | 只扫描必要的路径，不要遍历用户整个磁盘。它**不返回文件内容** |
| `file:read-content` | 按路径与偏移读取文件**内容** | `api.file.read()` | **能拿到文件字节本身**。只在用户明确选择/拖入的文件上读取，不要拿它遍历磁盘 |
| `file:write` | 在用户本次授权范围内重命名文件、写入新文件 | `api.file.grant()`、`api.file.rename()`、`api.file.write()` | 会改动用户磁盘；先 `dryRun` 并把结果展示给用户。写入只受理用户交出来的路径 |
| `lan:discover` | 在同网段播报自己的存在、搜索同网段的其它 ToolZen | `api.lan.advertise()`、`api.lan.discover()`、`api.lan.stop()` | 会向本地网络广播一个含 `payload` 的小报文（同网段可见）；不要把敏感信息放进 `payload` |
| `screen:capture` | 枚举屏幕与窗口、采集画面与系统声音、区域选区、置顶悬浮窗 | `api.desktopCapturer.getSources()`、`api.capture.getStream()`、`api.overlay.selectRegion()`、`api.floatWindow.*` | **能拿到用户屏幕上的全部内容**，包括其它应用的窗口；只在用户明确发起录制后采集，不要后台常开，并说明录制内容存在哪里 |

全局快捷键（`api.registerShortcut`）不需要声明权限：它只在插件运行期间生效，退出即自动注销，且组合键被宿主或其他应用占用时宿主会直接拒绝。它抢的是系统级键位，插件仍要挑得克制，并在注册失败时如实提示用户。

## 能力分层

| 层级 | 入口 | 第三方插件是否依赖 |
| --- | --- | --- |
| 稳定插件 API | 组件 `api` prop | 是，推荐 |
| 浏览器标准能力 | DOM、`fetch`、`localStorage`、`window.Vue` | 可用，遵守权限和兼容性；源码由 Vite 编译后运行。浏览器 `fetch` 受同源策略约束，跨域请求改用 `api.network.fetch()` |
| Electron preload bridge | `window.toolzen` | 仅使用本文明确标为公开的能力；默认不依赖 |
| 主进程 IPC | `ipcRenderer.invoke/send` 对应通道 | 禁止 |
| 文件层 | `api.file.*`（受 `file:read` / `file:write` 约束） | 是，但只在用户交出来的路径范围内 |
| 屏幕采集层 | `api.desktopCapturer.*` / `api.capture.*` / `api.overlay.*`（受 `screen:capture` 约束） | 是，但只在用户发起录制之后 |

文件层单独成层，并且分成**三项**权限，别把它们当成一件事：

| 权限 | 覆盖 | 给的是什么 |
| --- | --- | --- |
| `file:read` | `file.scan` / `file.exists` / `file.reveal` | 只有**元信息**（名称、大小、时间、是否目录） |
| `file:read-content` | `file.read` | **文件字节本身** |
| `file:write` | `file.grant` / `file.rename` / `file.write` | 写入与改名 |
| `clipboard:read` | `readClipboardFiles` | 剪贴板里的文件路径 |

`file:read` 与 `file:read-content` **刻意分开**：前者自 1 级起就发给插件了，用途只有元信息；如果把「读字节」并进同一个权限名，**已发布的插件会静默获得读任意文件内容的能力**——用户当初同意的是「读文件信息」，不是「读文件内容」。分开之后，商店与用户都能看到这次授权升级。

读取内容的护栏比扫描更严：`file.scan` 只要求声明权限，而 `file.read` **只肯读本会话已授权集合里的路径**，没 `grant` 过的一律回 `not-granted`。拖进插件自身拖放区的文件要先 `api.getPathForFile()` + `api.file.grant()`。

局域网层（`lan:discover`）也单独成层：播报与搜索要在**主进程**开一个组播套接字（渲染层不能监听端口），所以必须由宿主代劳。未声明 `lan:discover` 时 `advertise` / `discover` 回 `{ ok: false, code: 'invalid' }`、`stop` 回 `false`，一个包都不会发出去。详见[系统](/api/system)。

屏幕采集层同样单独成层，原因和文件层一样：它有一部分必须在**主进程**执行。采集源无法在渲染层枚举（W3C 规范禁止 `enumerateDevices` 暴露它们，`desktopCapturer` 也只在主进程可用），`getDisplayMedia` 在没有宿主安装 request handler 时必抛 `NotSupportedError`，系统回环音频也只能由主进程给出。未声明 `screen:capture` 时：枚举回空数组、`getMediaAccessStatus` 回 `'unknown'`、`selectRegion` 回 `null`，而 `capture.getStream` **直接抛错**（静默给一条空流会让插件以为录上了）。详见[屏幕](/api/screen)。

**不需要权限的四项**：

| 接口 | 为什么不需要 |
| --- | --- |
| `api.holdSessionReset()` / `api.hideMainWindowKeepAlive()` | 只表达「别把本页卸载掉」，不读也不改用户数据 |
| `api.renderQrCode()` | 纯计算：把一段文本画成图片，不碰用户任何数据 |
| `api.getLocalAddresses()` | 只读本机网卡地址，不含用户数据；且这些地址在同网段本来就是公开的 |

它们仍登记在**能力清单**里（`qrcode:render` / `lan:discover`），这样老客户端能被 `requires` 拦下，而不是加载起来再报一个看不懂的错。前面三项解决的是「主窗口收起 30 秒后插件页被会话重置卸载、后台任务中断」这个问题。

`network:fetch` 的执行方式与文件能力不同：它对应 `api.network.fetch()`，请求由宿主**主进程**发出，不受渲染层同源策略约束，因此目标服务不需要返回 CORS 头。未声明 `network:fetch` 时 `api.network.fetch` 直接抛 `TypeError`（消息点明缺少哪个权限），不会发出任何请求。插件仍可继续使用全局 `fetch`，但它跑在渲染层、只能访问同源地址；老宿主没有 `api.network.fetch` 时应退回全局 `fetch`。详见[网络](/api/network)。

需要说清楚实际执行方式：渲染层按声明拦截调用，未声明时 `file.scan` 返回 `{ ok: false, code: 'NOT_SUPPORTED', entries: [] }`、`file.exists` 返回 `{ ok: false, code: 'NOT_SUPPORTED', exists: [...与输入等长的 false] }`、`file.reveal` 返回 `false`，`rename` 逐项返回 `NOT_SUPPORTED` 并在 `items[].reason` 里给 `permission-denied`，`grant` 返回 `{ ok: false, granted: [] }` 并在 `rejected` 里逐项报 `permission-denied`，而不是抛异常。但写入的真正护栏不是权限字符串本身，而是宿主维护的**已授权路径集合**——`rename` 只受理本会话已登记进该集合的路径。宿主自动登记剪贴板文件、文件对话框选中的路径和粘贴进搜索框的文件；用户拖入插件自身拖放区的文件需要插件自己调用 `api.file.grant()`。这个集合不落盘、重启即清空。

## 审核关注点

- 权限声明与实现行为是否匹配。
- 网络请求是否指向插件说明中披露的服务。
- 是否存在混淆代码、远程脚本执行器或隐藏的数据采集。
- 剪贴板识别正则是否可编译、范围是否克制。
- 通知、复制和外链操作是否给用户明确反馈。
