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

## 较新的能力与降级

下面这些是后来加上的，老客户端上不存在。**都必须先探测再调用**，否则会在老客户端上抛错或静默失效。

| 能力 | 探测方式 | 老客户端上的表现 |
| --- | --- | --- |
| 屏幕采集 `api.desktopCapturer` / `api.capture` / `api.overlay` | `typeof api?.desktopCapturer?.getSources === 'function'` | 枚举回空数组；`capture.getStream` 抛错。**声明了 `screen:capture` 的老客户端会因为「未知权限」拒绝安装**，所以只有确实需要录屏的插件才声明它 |
| `api.file.write` | `typeof api?.file?.write === 'function'` | 退回「保存对话框 + 浏览器下载」，功能可用但拿不到落盘路径 |
| `api.holdSessionReset` / `api.hideMainWindowKeepAlive` | `typeof api?.holdSessionReset === 'function'` | 不存在；后台任务会在会话重置（默认 30 秒）后被卸载。老客户端上只能提示用户别收起窗口 |
| `api.systemPreferences.getMediaAccessStatus` | `typeof api?.systemPreferences?.getMediaAccessStatus === 'function'` | 不存在；被系统拒时只能给出笼统的错误提示 |
| `api.network.fetch` | `typeof api?.network?.fetch === 'function'` | 退回浏览器 `fetch`（受同源策略约束，跨域会失败） |

`api.overlay.selectRegion()` 返回的是 **DIP 屏幕坐标**矩形；把它交给 `api.getDisplayMatching(rect)` 可以换算到采集流内的位置。

## 发布前兼容性清单

1. `manifest.code`、`manifest.entry` 与包内文件一致。
2. 版本号符合三段式 semver，且高于已发布版本。
3. 浏览器预览中 `api` 为空时仍不会白屏。
4. 主窗口和独立窗口都能处理进入动作与退出清理。
5. 深色主题下插件内容可读，且未覆盖宿主全局样式。
6. `manifest.permissions` 里的每一项都真的用到了——多声明会让用户在安装时看到不必要的授权提示。
