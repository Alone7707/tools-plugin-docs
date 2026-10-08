# 版本与兼容性

## 版本字段的职责

| 字段 | 作用 | 修改规则 |
| --- | --- | --- |
| `code` | 插件的长期身份、存储命名空间和安装索引 | 发布后不可修改 |
| `version` | 入口模块缓存指纹和商店发布版本 | 代码、清单或资源变更时递增 |
| `entry` | 包内入口文件路径 | 变更后递增版本并确保文件存在 |
| `runtime` | 插件运行时 | 当前固定为 `vue` |

## 开发环境与生产环境

| 场景 | 加载方式 | 修改后处理 |
| --- | --- | --- |
| 本地调试 | 客户端托管 `dist` 入口，附带重载指纹 | Vite 重建后点击“重新加载” |
| 已安装插件 | `entryUrl?v=<version>` | 必须递增 `version` 并重新安装/更新 |
| 独立窗口 | 复用同一插件上下文和版本 | 由宿主绑定入口和 `pluginCode` |

## 兼容性策略

- 新增 API 时，插件应使用 `api && api.method` 或可选链检测。
- 删除或改变 API 返回值时，应先保留旧行为，并在本页记录迁移说明。
- `enterAction.payload` 可能是文本，也可能是图片 data URI；处理前先判断 `type`。
- `api.onPluginEnter`、`api.onPluginOut`、`api.onThemeChange` 等所有事件监听都返回清理函数；组件卸载时必须调用。
- 不要依赖未在稳定插件 API 页面列出的 IPC 通道、内部事件名或窗口 DOM 结构。

## 插件代码会更新，宿主能力不会

这是理解本页其余内容的**前提**，值得单独说清楚。

你的插件代码是远程 ESM，改完发布即生效，用户下次打开就是新版。但**插件能调用的宿主能力长在客户端里**——宿主多会一样东西，就必须发一版客户端。而总有一部分用户停在旧版本没更新。

所以「我的插件在旧客户端上会怎样」不是意外情况，而是**必然要面对的常态**。下面两节给出两条应对路径，**优先用第二条**。

## 路径一：运行时探测（细粒度降级）

适合「这个能力缺了只是少个功能」的场景。

### 用 `hasCapability` 探测（推荐）

宿主从 **0.0.29** 起提供能力探测接口：

| 接口 | 签名 | 说明 |
| --- | --- | --- |
| `api.getApiLevel` | `() => number` | 宿主 API 级别。级别越高能力越多，只增不减 |
| `api.hasCapability` | `(name) => boolean` | 宿主是否具备某个能力（名字与 `permissions` 一致） |
| `api.getCapabilities` | `() => string[]` | 宿主全部能力名，按首次出现的级别排序 |

**这三个接口在老客户端上根本不存在**，直接调用会抛 `TypeError`——那正是我们要避免的事。所以必须用兜底写法：

```js
/**
 * 探测宿主能力。
 *
 * 注意两点：
 * 1. 老客户端上 hasCapability 这个方法不存在，所以必须判 typeof；
 * 2. 它回答的是「宿主会不会」，不代表你的插件被授权。真实调用仍要过权限门
 *    （manifest 里声明的 permissions）。
 */
function supports(api, name) {
  try {
    return typeof api.hasCapability === 'function' && api.hasCapability(name) === true
  } catch {
    return false
  }
}

if (supports(api, 'screen:capture')) {
  const stream = await api.capture.getStream({ sourceId })
  // ...
} else {
  api.toast('屏幕录制需要升级 ToolZen 客户端')
  // 更好的做法：退回旧实现，而不是只弹个提示
}
```

### 用 `typeof` 探测（老客户端也能用）

`hasCapability` 本身在老客户端上不存在，所以如果你的插件要兼容**更早**的版本，仍然需要 `typeof` 兜底：

| 能力 | 探测方式 | 老客户端上的表现 |
| --- | --- | --- |
| 屏幕采集 `api.desktopCapturer` / `api.capture` / `api.overlay` | `typeof api?.desktopCapturer?.getSources === 'function'` | 枚举回空数组；`capture.getStream` 抛错 |
| `api.file.write` | `typeof api?.file?.write === 'function'` | 退回「保存对话框 + 浏览器下载」，功能可用但拿不到落盘路径 |
| `api.holdSessionReset` / `api.hideMainWindowKeepAlive` | `typeof api?.holdSessionReset === 'function'` | 不存在；后台任务会在会话重置（默认 30 秒）后被卸载。老客户端上只能提示用户别收起窗口 |
| `api.systemPreferences.getMediaAccessStatus` | `typeof api?.systemPreferences?.getMediaAccessStatus === 'function'` | 不存在；被系统拒时只能给出笼统的错误提示 |
| `api.network.fetch` | `typeof api?.network?.fetch === 'function'` | 退回浏览器 `fetch`（受同源策略约束，跨域会失败） |

`api.overlay.selectRegion()` 返回的是 **DIP 屏幕坐标**矩形；把它交给 `api.getDisplayMatching(rect)` 可以换算到采集流内的位置。

## 路径二：声明式兼容（让宿主替你判定，推荐）

比手写探测更省事，而且**用户在你插件被打开之前就知道要升级**。在 `manifest.json` 里声明：

```jsonc
{
  "minApiLevel": 2,                     // 粗粒度：至少 2 级宿主
  "requires": ["screen:capture"],        // 硬依赖：缺了拒绝打开
  "optional": ["file:dialog", "file:write"]  // 可选：缺了只降级，不影响加载
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `minApiLevel` | `number` | 宿主 API 级别下限。不声明 = 不挑宿主。可以不写，让宿主按 `requires` 推导；写了就必须 ≥ `requires` 隐含的级别，否则上传会被打回 |
| `requires` | `string[]` | **硬依赖**的宿主能力，最多 12 项。缺任一项，宿主拒绝打开并显示升级提示页 |
| `optional` | `string[]` | **可选**能力，最多 12 项。缺失时插件照常加载，宿主在界面上提示「有几项功能在当前客户端不可用」 |

### 判定规则

1. 缺 `requires` 任一项 → **拒绝打开**，提示页写明缺的是哪项能力，并给出「前往更新」入口；
2. 缺 `optional` → **正常加载**，宿主提示缺了几项；
3. `minApiLevel` 高于本机级别 → **拒绝打开**；
4. 三者取严：`requires` 隐含的级别与 `minApiLevel` 谁高听谁的。

### 当前的能力级别对照

| apiLevel | 能力 |
| --- | --- |
| 1 | `clipboard:read`、`clipboard:write`、`network:fetch`、`file:dialog`、`file:read`、`file:write` |
| 2 | `screen:capture` |
| 3 | `file:read-content`、`lan:discover`、`qrcode:render` |

> **不要用 `getAppVersion()` 判断能力。** 版本号里既有修 bug 也有加能力，拿它比较迟早误判。判断能力请用 `apiLevel` 或 `hasCapability()`。

### 怎么写才对

- **能用降级解决的，一律写 `optional`，别写 `requires`。** `requires` 意味着「这个插件在旧客户端上完全不能用」，对用户是硬伤害；
- **只有「整个插件在旧客户端上毫无意义」时才写 `requires`**（例如纯录屏插件）；
- 不写任何兼容字段是合法的（等价于「不挑宿主」），但插件里就该用上面的探测兜住新能力；
- **权限与能力是两条独立的轴**：`permissions` 管安全（我要读你的剪贴板，服务端审核、用户知情），`requires` / `optional` 管兼容（宿主得会屏幕采集）。两者都要满足才能真正调用。同一个名字会同时出现在两边，但回答的问题不同。

### 商店里用户会看到什么

声明之后你不必做任何商店侧的事——商店页会自动展示兼容状态：

- 卡片上出现「需更新客户端」徽标；
- 未安装的用户点「安装」会被拦下（避免白装一次再卸载）；
- 已经装过的用户仍能打开，看到的是升级提示页。

## 服务端上传校验

`minApiLevel` / `requires` / `optional` 会在上传时校验，以下情况会被打回（HTTP 400）：

- 未知能力名（只认上面级别对照表里登记过的）；
- 同一能力同时出现在 `requires` 和 `optional`；
- `minApiLevel` 不是 ≥ 1 的整数，或超过上限；
- `minApiLevel` 低于 `requires` 隐含的级别（自相矛盾，客户端会按更严的那个执行）。

## 发布前兼容性清单

1. `manifest.code`、`manifest.entry` 与包内文件一致。
2. 版本号符合三段式 semver，且高于已发布版本。
3. 浏览器预览中 `api` 为空时仍不会白屏。
4. 主窗口和独立窗口都能处理进入动作与退出清理。
5. 深色主题下插件内容可读，且未覆盖宿主全局样式。
6. `manifest.permissions` 里的每一项都真的用到了——多声明会让用户在安装时看到不必要的授权提示。
7. 用到了较新的宿主能力时，已在 `requires` / `optional` 里声明，且**优先写成 `optional`**（见上文「怎么写才对」）。
8. 声明的每一项能力，插件代码里都真的会用到——`requires` 会把旧客户端用户整个挡在门外，别把用不到的能力写进去。
