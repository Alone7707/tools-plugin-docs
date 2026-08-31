# Electron Bridge 完整清单

`window.toolzen` 是 preload 脚本通过 `contextBridge` 暴露给渲染层的完整对象。它服务于主窗口、插件窗口、开发者专区、个人中心和若干专用覆盖层，并不等同于第三方插件 SDK。

新版代码统一使用 `window.toolzen`。`window.atoolbox` 仅作为旧版插件兼容别名保留，新插件不要继续依赖该名称。

第三方插件的稳定入口是 `api` prop。只有 [受控插件 API](/api/plugin-api) 明确列出的方法才应作为插件依赖。下表仍完整记录当前 bridge，便于维护者、宿主页面和内部插件查阅。

## 数据、账号与反馈

| 方法 | 参数 | 返回值 | 适用范围 |
| --- | --- | --- | --- |
| `getData` | 无 | `Promise<AppData>` | 宿主页面读取本地应用数据 |
| `registerUser` | `{ username, password, nickname?, email, emailCode }` | `Promise<UserProfile>` | 账号页 |
| `sendRegisterEmailCode` | `{ email }` | `Promise<{ ttlSeconds, resendSeconds, devCodeLogged }>` | 注册页 |
| `loginUser` | `{ username, password }` | `Promise<UserProfile>` | 登录页 |
| `logoutUser` | 无 | `Promise<boolean>` | 账号页 |
| `onSessionExpired` | `(callback: () => void)` | `() => void` | 会话失效事件 |
| `updateUserProfile` | `{ nickname, email?, avatar? }` | `Promise<UserProfile>` | 个人资料 |
| `refreshUserProfile` | 无 | `Promise<UserProfile \| null>` | 重新拉取当前用户 |
| `updateUserPassword` | `{ oldPassword, newPassword }` | `Promise<boolean>` | 密码设置 |
| `uploadAvatar` | `{ dataBase64, mimeType?, fileName? }` | `Promise<{ url, src }>` | 头像上传 |
| `resolveAvatar` | `remoteUrl: string` | `Promise<string>` | 解析头像缓存地址 |
| `onAvatarCacheReady` | `(payload: { sourceUrl, dataUrl })` | `() => void` | 头像缓存事件 |
| `copyClipboard` | `text: string` | `Promise<boolean>` | 主进程剪贴板写入 |
| `readClipboardText` | 无 | `Promise<string>` | 读取系统剪贴板文本 |
| `readClipboardImage` | 无 | `Promise<string>` | 读取系统剪贴板图片 Data URL |
| `clearClipboard` | 无 | `Promise<boolean>` | 清空系统剪贴板 |
| `copyClipboardImage` | `dataUrl: string` | `Promise<boolean>` | 写入系统剪贴板图片 |
| `getDeveloperApplication` | 无 | `Promise<DeveloperApplicationState>` | 开发者申请页 |
| `submitDeveloperApplication` | `{ plan, contactType, contact }` | `Promise<DeveloperApplicationState>` | 开发者申请页 |
| `listFeedback` | 无 | `Promise<FeedbackListState>` | 反馈页 |
| `getFeedbackDetail` | `id: number` | `Promise<FeedbackDetailState>` | 反馈详情页 |
| `submitFeedback` | `{ type, title, content, attachments }` | `Promise<FeedbackDetailState>` | 反馈页 |
| `replyFeedback` | `{ id, content, attachments? }` | `Promise<FeedbackDetailState>` | 反馈详情页 |
| `getFeedbackUnread` | 无 | `Promise<number>` | 反馈红点 |
| `uploadFeedbackShot` | `{ dataBase64, mimeType?, fileName? }` | `Promise<{ url, src }>` | 反馈附件 |
| `onFeedbackUnreadChanged` | `(unread: number)` | `() => void` | 反馈未读推送 |
| `getDonationConfig` | `force?: boolean` | `Promise<DonationConfig>` | 打赏页；`force` 跳过缓存 |

## 插件登记、商店与配置

| 方法 | 参数 | 返回值 | 适用范围 |
| --- | --- | --- | --- |
| `listDevPlugins` | 无 | `Promise<{ devPlugins, plugins, port }>` | 开发者专区；确保调试服务启动 |
| `addDevPlugin` | 无 | `Promise<{ canceled, devPlugins, plugins, record? }>` | 选择目录登记调试插件 |
| `addDevPluginPaths` | `paths: string[]` | `Promise<DevPluginDropResult>` | 拖拽目录登记 |
| `getDroppedPath` | `file: File` | `string` | 通过 Electron `webUtils` 反查拖入路径 |
| `onDevPluginsChanged` | `() => void` | `() => void` | 调试插件列表变化 |
| `removeDevPlugin` | `code: string` | `Promise<{ devPlugins, plugins }>` | 删除调试登记 |
| `reloadDevPlugin` | `code: string` | `Promise<{ devPlugins, plugins, record }>` | 重新读取 manifest |
| `openDevPluginDirectory` | `code: string` | `Promise<boolean>` | 打开系统文件管理器目录 |
| `openDevPluginInMainWindow` | `code: string` | `Promise<boolean>` | 在主窗口打开调试插件 |
| `onPluginOpenRequest` | `(payload: { pluginCode })` | `() => void` | 开发者专区通知主窗口打开插件 |
| `togglePlugin` | `code: string` | `Promise<PluginRecord[]>` | 启用/停用插件 |
| `importPlugin` | 无 | `Promise<PluginRecord[]>` | 导入本地插件包 |
| `installRemotePlugin` | `{ code, name, entryUrl, ...metadata }` | `Promise<PluginRecord[]>` | 安装远程 Vue 插件 |
| `listStorePlugins` | `{ keyword?, category?, sort? }?` | `Promise<StoreCatalogItem[]>` | 拉取商店目录 |
| `getStorePlugin` | `code: string` | `Promise<StoreCatalogItem>` | 拉取商店详情 |
| `reportStoreDownload` | `code: string` | `Promise<boolean>` | 上报下载计数，失败静默 |
| `deletePlugin` | `code: string` | `Promise<PluginRecord[]>` | 卸载插件 |
| `savePluginConfig` | `{ code, config }` | `Promise<PluginRecord[]>` | 保存插件配置 |
| `hashText` | `{ algorithm, text }` | `Promise<string>` | 主进程计算文本哈希 |

`installRemotePlugin` 的元数据字段包括 `description`、`version`、`author`、`icon`、`keywords`、`permissions`、`config`、`tone`、`clipboardRules` 和 `features`。第三方插件运行时不应自行调用插件安装、删除或配置接口。

## 插件独立窗口

| 方法 | 参数 | 返回值 | 适用范围 |
| --- | --- | --- | --- |
| `openPluginWindow` | `PluginWindowOpenPayload` | `Promise<boolean>` | 已安装且启用插件；创建或聚焦独立窗口 |
| `getPluginWindowContext` | 无 | `Promise<PluginWindowContext \| null>` | 当前独立插件窗口 |
| `getPluginWindowState` | 无 | `Promise<{ maximized: boolean } \| null>` | 当前独立插件窗口 |
| `minimizePluginWindow` | 无 | `Promise<boolean>` | 当前独立插件窗口 |
| `togglePluginWindowMaximize` | 无 | `Promise<{ maximized: boolean } \| null>` | 当前独立插件窗口 |
| `onPluginWindowMaximizedChanged` | `(maximized: boolean)` | `() => void` | 当前独立插件窗口 |
| `closePluginWindow` | 无 | `Promise<boolean>` | 当前独立插件窗口；其他窗口调用不执行关闭 |

第三方插件应使用 `api.detachWindow()` 和 `api.outPlugin()`，由宿主自动绑定 `pluginCode`、入口和主题上下文。

## 开发者专区与个人中心窗口

| 方法 | 参数 | 返回值 |
| --- | --- | --- |
| `openDeveloperWindow` | 无 | `Promise<boolean>` |
| `getDeveloperWindowState` | 无 | `Promise<{ maximized: boolean } \| null>` |
| `minimizeDeveloperWindow` | 无 | `Promise<boolean>` |
| `toggleDeveloperWindowMaximize` | 无 | `Promise<{ maximized: boolean } \| null>` |
| `onDeveloperWindowMaximizedChanged` | `(maximized: boolean)` | `() => void` |
| `closeDeveloperWindow` | 无 | `Promise<boolean>` |
| `openAccountWindow` | `view?: 'account' \| 'developer' \| 'feedback' \| 'donation' \| 'settings'` | `Promise<boolean>` |
| `getAccountWindowState` | 无 | `Promise<{ open, maximized }>` |
| `minimizeAccountWindow` | 无 | `Promise<boolean>` |
| `toggleAccountWindowMaximize` | 无 | `Promise<{ maximized: boolean } \| null>` |
| `closeAccountWindow` | 无 | `Promise<boolean>` |
| `reattachAccountWindow` | `view?` | `Promise<boolean>` |
| `onAccountWindowMaximizedChanged` | `(maximized: boolean)` | `() => void` |
| `onAccountWindowChanged` | `(open: boolean)` | `() => void` |
| `onAccountWindowViewRequest` | `(view: string)` | `() => void` |
| `onPersonalCenterOpenRequest` | `(view: string)` | `() => void` |
| `onAppDataChanged` | `(reason: string)` | `() => void` |

## 取色、通知与悬浮工具

| 方法 | 参数 | 返回值 | 适用范围 |
| --- | --- | --- | --- |
| `pickScreenColor` | 无 | `Promise<{ sRGBHex: string } \| null>` | 全屏取色流程 |
| `getPrimaryDisplay` | 无 | `Promise<PluginDisplayInfo>` | 主屏幕几何信息 |
| `getAllDisplays` | 无 | `Promise<PluginDisplayInfo[]>` | 全部屏幕几何信息 |
| `getCursorScreenPoint` | 无 | `Promise<{ x, y }>` | 当前鼠标屏幕坐标 |
| `getDisplayNearestPoint` | `{ x, y }` | `Promise<PluginDisplayInfo>` | 指定点最近屏幕 |
| `getDisplayMatching` | `{ x, y, width, height }` | `Promise<PluginDisplayInfo>` | 指定矩形匹配屏幕 |
| `screenToDipPoint` / `dipToScreenPoint` | `{ x, y }` | `Promise<{ x, y }>` | 屏幕像素与 DIP 点换算 |
| `screenToDipRect` / `dipToScreenRect` | `{ x, y, width, height }` | `Promise<{ x, y, width, height }>` | 屏幕像素与 DIP 矩形换算 |
| `sampleScreenPick` | `{ x, y }` | `Promise<{ width, height, rgba, hex } \| null>` | 取色覆盖窗内部 |
| `onScreenPickState` | `(state: { ready, x?, y? })` | `() => void` | 取色覆盖窗内部 |
| `completeScreenPick` | `hex: string \| null` | 无 | 取色覆盖窗确认/取消 |
| `showNotification` | `{ title, body? }` | `Promise<boolean>` | 系统通知 |
| `showOpenDialog` | `PluginOpenDialogOptions` | `Promise<string[]>` | 文件选择对话框；插件 API 需 `file:dialog` |
| `showSaveDialog` | `PluginSaveDialogOptions` | `Promise<string>` | 文件保存对话框；插件 API 需 `file:dialog` |
| `shellBeep` | 无 | `Promise<boolean>` | 系统提示音 |
| `showFloatImage` | `dataUrl: string` | `Promise<boolean>` | 创建置顶图片窗 |
| `getFloatImageData` | 无 | `Promise<string>` | 悬浮图片窗读取自身内容 |
| `resizeFloatImage` | `{ width, height }` | 无 | 悬浮图片窗等比缩放 |
| `beginFloatImageDrag` | `mode: string` | 无 | 悬浮图片窗开始移动/缩放 |
| `updateFloatImageDrag` | 无 | 无 | 悬浮图片窗拖拽中 |
| `endFloatImageDrag` | 无 | 无 | 悬浮图片窗结束拖拽 |
| `showFloatImageMenu` | 无 | 无 | 悬浮图片窗右键菜单 |
| `closeFloatImage` | 无 | 无 | 关闭悬浮图片窗 |
| `getFloatBallState` | 无 | `Promise<{ icon, updateAvailable }>` | 悬浮球窗口 |
| `beginFloatBallDrag` | 无 | 无 | 悬浮球开始拖动 |
| `updateFloatBallDrag` | 无 | 无 | 悬浮球拖动中 |
| `endFloatBallDrag` | 无 | 无 | 悬浮球抬手处理 |
| `showFloatBallMenu` | 无 | 无 | 悬浮球右键菜单 |
| `onFloatBallUpdateState` | `(available: boolean)` | `() => void` | 悬浮球更新红点 |
| `onShortcutClipboardImageCandidate` | `(dataUrl: string)` | `() => void` | 快捷键唤出图片候选 |

第三方插件可直接使用 `api.screenColorPick` 和 `api.showNotification`。悬浮图片/悬浮球其余方法是专用窗口内部协议，不对远程插件开放。

## 设置、主题与窗口外壳

| 方法 | 参数 | 返回值 |
| --- | --- | --- |
| `saveSettings` | `Settings` | `Promise<Settings>` |
| `previewWindowOpacity` | `opacity: number` | `Promise<boolean>`；只预览不落盘 |
| `getAutoLaunchStatus` | 无 | `Promise<{ configured, openAtLogin, executableWillLaunchAtLogin, wasOpenedAtLogin, isPackaged }>` |
| `getSystemTheme` | 无 | `Promise<'light' \| 'dark'>` |
| `onThemeSettingChanged` | `(theme: 'light' \| 'dark' \| 'system')` | `() => void` |
| `onSystemThemeChanged` | `(theme: 'light' \| 'dark')` | `() => void` |
| `getDefaultTitleBarStyle` | 无 | `Promise<'mac' \| 'win'>` |
| `onTitleBarStyleChanged` | `(titleBarStyle: 'mac' \| 'win')` | `() => void` |
| `onWindowHidden` | `() => void` | `() => void` |
| `onWindowShown` | `() => void` | `() => void` |
| `onApplicationsChanged` | `(applications: unknown)` | `() => void` |
| `onApplicationIconsUpdated` | `(icons: Record<string, string>)` | `() => void` |
| `onWindowSessionReset` | `() => void` | `() => void` |
| `notifyWindowSessionResetDone` | 无 | 无 |
| `onWindowFocusSearch` | `() => void` | `() => void` |
| `resizeWindowHeight` | `{ height, minimumHeight?, animate?, durationMs? }` | `Promise<number>` |
| `holdWindowVisible` | 无 | `Promise<boolean>` |
| `releaseWindowVisible` | 无 | `Promise<boolean>` |
| `holdUpdateWindowVisible` | `held: boolean` | `Promise<boolean>` |
| `beginWindowDrag` | 无 | 无 |
| `updateWindowDrag` | 无 | 无 |
| `endWindowDrag` | 无 | 无 |
| `minimizeWindow` | 无 | `Promise<void>` |
| `closeWindow` | 无 | `Promise<void>` |

插件主题请使用 `api.isDarkColors()` 读取；不要依赖内部主题事件或手动修改宿主窗口透明度。

## 更新、备份、同步与应用启动

| 方法 | 参数 | 返回值 |
| --- | --- | --- |
| `getUpdateState` | 无 | `Promise<AppUpdateState>` |
| `checkUpdate` | 无 | `Promise<UpdateCheckResult>` |
| `downloadUpdate` | 无 | `Promise<boolean>` |
| `cancelUpdate` | 无 | `Promise<boolean>` |
| `onUpdateStateChanged` | `(state: AppUpdateState)` | `() => void` |
| `exportData` | 无 | `Promise<boolean>` |
| `importData` | 无 | `Promise<AppData>` |
| `testWebDavConnection` | `WebDavConnectionSettings` | `Promise<{ connected: true, remotePath }>` |
| `backupToWebDav` | `WebDavConnectionSettings` | `Promise<WebDavBackupResult>` |
| `listWebDavBackups` | `WebDavConnectionSettings` | `Promise<WebDavBackupFile[]>` |
| `restoreWebDavBackup` | `{ settings, remoteFilePath }` | `Promise<AppData>` |
| `testSyncConnection` | 无 | `Promise<SyncHealth>` |
| `loginServer` | `{ username, password }` | `Promise<Settings>` |
| `pullServerData` | 无 | `Promise<AppData>` |
| `listApplications` | `forceRescan?: boolean` | `Promise<LocalApplication[]>` |
| `openApplication` | `string \| ApplicationLaunchPayload` | `Promise<boolean>` |
| `showApplicationInFolder` | `applicationPath: string` | `Promise<boolean>` |
| `openApplicationAsAdmin` | `string \| ApplicationLaunchPayload` | `Promise<boolean>` |
| `openExternalUrl` | `url: string` | `Promise<boolean>` |
| `listRecentLaunchers` | 无 | `Promise<RecentLauncher[]>` |
| `addRecentLauncher` | `RecentLauncherPayload` | `Promise<RecentLauncher[]>` |
| `deleteRecentLauncher` | `id: number` | `Promise<RecentLauncher[]>` |
| `listPinnedLaunchers` | 无 | `Promise<PinnedLauncher[]>` |
| `togglePinnedLauncher` | `PinnedLauncherPayload` | `Promise<PinnedLauncher[]>` |
| `deletePinnedLauncher` | `itemKey: string` | `Promise<PinnedLauncher[]>` |
| `listLogs` | 无 | `Promise<OperationLog[]>` |
| `clearLogs` | 无 | `Promise<OperationLog[]>` |
| `listSearchHistory` | 无 | `Promise<SearchHistoryRecord[]>` |
| `addSearchHistory` | `Omit<SearchHistoryRecord, 'id' \| 'createdAt'>` | `Promise<SearchHistoryRecord[]>` |
| `deleteSearchHistory` | `id: number` | `Promise<SearchHistoryRecord[]>` |
| `clearSearchHistory` | 无 | `Promise<SearchHistoryRecord[]>` |
| `suspendGlobalShortcut` | 无 | `Promise<boolean>` |
| `resumeGlobalShortcut` | 无 | `Promise<boolean>` |
| `onShortcutRecordingCaptured` | `(shortcut: string)` | `() => void` |
| `onShortcutClipboardCandidate` | `(text: string)` | `() => void` |

这些方法涉及账号、应用启动、备份、更新或宿主窗口状态。第三方插件应通过 `api` 使用最小能力集，不要读取或修改这些内部数据。
