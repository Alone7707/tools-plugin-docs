export type PluginEnterAction = {
  code: string
  type: 'open' | 'text' | 'regex' | 'over' | 'img' | 'file'
  payload: string
  /** type 为 'file' 时的绝对路径列表；payload 是同一批路径用 \n 连接的结果。 */
  files?: string[]
}

export type PluginDetachWindowOptions = {
  title?: string
  featureCode?: string
  initialText?: string
  width?: number
  height?: number
}

export type PluginDetachPayloadProvider = () => PluginDetachWindowOptions | null | void

export type PluginInfo = {
  code: string
  name: string
  version: string
  type: 'builtin' | 'local' | 'remote'
}

export type PluginDocumentStore = {
  /** 读取当前插件命名空间内的 JSON 文档。 */
  get: <T = unknown>(key: string) => T | null
  /** 写入当前插件命名空间内的 JSON 文档。 */
  put: (key: string, value: unknown) => boolean
  /** 删除当前插件命名空间内的 JSON 文档。 */
  remove: (key: string) => boolean
}

export type PluginStringStore = {
  /** 读取当前插件命名空间内的字符串。 */
  getItem: (key: string) => string | null
  /** 写入当前插件命名空间内的字符串。 */
  setItem: (key: string, value: string) => void
  /** 删除当前插件命名空间内的字符串。 */
  removeItem: (key: string) => void
}

export type PluginDialogFilter = { name: string; extensions: string[] }
export type PluginOpenDialogOptions = {
  title?: string
  defaultPath?: string
  buttonLabel?: string
  filters?: PluginDialogFilter[]
  properties?: Array<'openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles' | 'createDirectory' | 'promptToCreate' | 'noResolveAliases' | 'treatPackageAsDirectory'>
}
export type PluginSaveDialogOptions = { title?: string; defaultPath?: string; buttonLabel?: string; filters?: PluginDialogFilter[] }
export type PluginScreenPoint = { x: number; y: number }
export type PluginScreenRect = { x: number; y: number; width: number; height: number }
export type PluginDisplayInfo = { id: number; bounds: PluginScreenRect; workArea: PluginScreenRect; workAreaSize: { width: number; height: number }; scaleFactor: number; rotation: number; touchSupport: string }

export type PluginFileScanOptions = {
  /** 是否继续往下钻子目录；默认 false（但目录本身一律展开一层），递归深度上限 8 层。 */
  recursive?: boolean
  /** 把展开出来的子目录也作为条目返回；默认 false，只回文件。被扫描的根目录自己不会作为条目出现。 */
  includeDirectories?: boolean
  /** 是否包含以点开头的隐藏项；默认 true。 */
  includeHidden?: boolean
  /** 宿主扩展：简易 glob（* 不跨目录、** 跨目录、? 单字符）。 */
  match?: string
  /** 返回条目的上限，默认 20000，最大 50000；撞上限时 truncated 为 true。 */
  limit?: number
}

export type PluginFileEntry = {
  /** 绝对路径。 */
  path: string
  /** 父目录绝对路径。 */
  directory: string
  /** 含扩展名的文件名。 */
  name: string
  /** 不带扩展名的主名；无扩展名时等于 name。 */
  stem: string
  /** 扩展名含点；目录与无扩展名文件为空串。 */
  extension: string
  isDirectory: boolean
  /** 字节；目录为 0。 */
  size: number
  /** 毫秒时间戳。 */
  modifiedAt: number
  /** 毫秒时间戳；取不到时与 modifiedAt 相同。 */
  createdAt: number
  /** 以点开头的隐藏项。 */
  hidden: boolean
  /** 这条路径当时是否存在（缺失的路径不会进 entries）。 */
  exists: boolean
}

export type PluginFileScanError = {
  path: string
  /** 读不动的路径对应的错误码，例如 EACCES / ENOENT。 */
  code: string
  message?: string
}

export type PluginFileScanResult = {
  ok: boolean
  entries: PluginFileEntry[]
  /** 读不动的路径（缺失路径在这里，code 为 ENOENT），个别路径失败不影响其他条目。 */
  errors: PluginFileScanError[]
  truncated: boolean
  code?: string
}

export type PluginFileExistsResult = {
  ok: boolean
  /** 与入参按下标一一对应；未声明 file:read 时是等长的 false 数组。 */
  exists: boolean[]
  code?: string
}

export type PluginFileRenameRequest = {
  items: Array<{ from: string; to: string }>
  /** 只预检不落盘；推荐先用它给用户确认。 */
  dryRun?: boolean
  /** onConflict: 'overwrite' 的别名。 */
  allowOverwrite?: boolean
  /** 目标已存在时的策略，默认 'error'：目标存在判该项失败。 */
  onConflict?: 'error' | 'skip' | 'overwrite'
  /** 单项失败是否继续，默认 true。 */
  continueOnError?: boolean
}

export type PluginFileRenameResultItem = {
  from: string
  to: string
  ok: boolean
  code?: string
  message?: string
}

/** 宿主更细的诊断口径，与 results 并存。 */
export type PluginFileRenameItem = {
  from: string
  to: string
  /** planned = dryRun 预检通过。 */
  status: 'planned' | 'applied' | 'skipped' | 'failed'
  /** permission-denied | invalid | missing | not-granted | cross-directory | same-path | target-exists | target-directory | failed */
  reason?: string
  /** 系统调用报错的原文。 */
  error?: string
}

export type PluginFileRenameResult = {
  /** 全部成功才为 true。 */
  ok: boolean
  dryRun: boolean
  /** 与请求顺序一一对应。 */
  results: PluginFileRenameResultItem[]
  succeeded: number
  failed: number
  items: PluginFileRenameItem[]
  /** 真正落地的映射，按执行顺序；反着再调一次 rename（from / to 对调）就是撤销。 */
  applied: Array<{ from: string; to: string }>
  /** 第一条失败项的错误码。 */
  code?: string
}

export type PluginFileGrantResult = {
  ok: boolean
  granted: string[]
  /** 被拒的路径；未声明 file:write 时逐项为 permission-denied。 */
  rejected: Array<{ path: string; reason: string }>
}

export type PluginFileWriteResult = {
  ok: boolean
  /** 真实落盘路径，成功时才有；可直接喂给 file.reveal。 */
  path?: string
  code?: 'invalid' | 'not-granted' | 'EFBIG' | 'failed'
  message?: string
}

export type PluginFileWriteRequest = {
  /** 目标绝对路径；必须已在本次会话的已授权集合里。 */
  path: string
  /** 文件名，仅作参考。 */
  name?: string
  /** 二进制内容。 */
  data: ArrayBuffer | ArrayBufferView
  /** MIME 类型，仅作参考。 */
  mimeType?: string
}

export type PluginFileApi = {
  /** 展开一批绝对路径，返回条目元信息；需要 file:read。 */
  scan: (paths: string[], options?: PluginFileScanOptions) => Promise<PluginFileScanResult>
  /** 判断路径是否存在，exists 与入参按下标一一对应；需要 file:read，未授权时返回 { ok: false, code: 'NOT_SUPPORTED', exists: [...等长 false] }。 */
  exists: (paths: string[]) => Promise<PluginFileExistsResult>
  /** 打开系统文件管理器并选中该路径；需要 file:read。 */
  reveal: (path: string) => Promise<boolean>
  /** 把绝对路径登记进本次会话的已授权集合；需要 file:write。 */
  grant: (paths: string[]) => Promise<PluginFileGrantResult>
  /** 批量重命名，只受理本次会话授权集合内的源路径；需要 file:write。 */
  rename: (request: PluginFileRenameRequest) => Promise<PluginFileRenameResult>
  /**
   * 把二进制内容写入磁盘并返回真实落盘路径；需要 file:write。
   *
   * 只受理本次会话已授权集合内的路径（与 rename 同一层护栏）——最自然的用法是先
   * `showSaveDialog()` 让用户选位置（宿主会自动登记），再写。
   */
  write: (request: PluginFileWriteRequest) => Promise<PluginFileWriteResult>
}

/** 一个可录制的采集源；需要 screen:capture。 */
export type PluginDesktopSource = {
  /** 传给 capture.getStream 的源标识，形如 `screen:0:0` / `window:123:0`。 */
  id: string
  /** 窗口标题 / 屏幕名。 */
  name: string
  kind: 'screen' | 'window'
  /** 屏幕源才有，对应 Display.id。 */
  display_id: string
  /** 缩略图 Data URL；未请求缩略图时为空串。 */
  thumbnail: string
  /** 应用图标 Data URL；屏幕源恒为空串。 */
  appIcon: string
}

export type PluginDesktopSourcesOptions = {
  /** 要枚举的类型；不传时屏幕与窗口都要。 */
  types?: Array<'screen' | 'window'>
  /** 缩略图尺寸；给 0 表示不要缩略图（枚举更快、IPC 更小）。 */
  thumbnailSize?: { width: number; height: number }
  /** 是否抓取窗口图标；默认 true。 */
  fetchWindowIcons?: boolean
}

export type PluginCaptureStreamOptions = {
  /** 要采集的源 id，来自 desktopCapturer.getSources。 */
  sourceId?: string
  /** 源类型，仅作参考。 */
  kind?: 'screen' | 'window'
  /** 要混入的音轨。speaker 为系统回环音频（Windows 可靠 / macOS 需授权 / Linux 不支持）。 */
  audio?: { speaker?: boolean; microphone?: boolean }
  /** 目标帧率。 */
  fps?: number
  width?: number
  height?: number
}

export type PluginMediaAccessType = 'screen' | 'microphone' | 'camera'

export type PluginMediaAccessStatus = 'not-determined' | 'granted' | 'denied' | 'restricted' | 'unknown'

export type PluginScreenCaptureApi = {
  /** 枚举可录制的屏幕与窗口（标题 / 缩略图 / 应用图标）；需要 screen:capture。 */
  desktopCapturer: {
    getSources: (options?: PluginDesktopSourcesOptions) => Promise<PluginDesktopSource[]>
  }
  /**
   * 按源取流，返回标准 MediaStream；需要 screen:capture。
   *
   * **必须在用户手势里调用**：getDisplayMedia 要求 transient user activation 且文档处于聚焦状态。
   */
  capture: {
    getStream: (options?: PluginCaptureStreamOptions) => Promise<MediaStream>
  }
  /** 查询系统级媒体权限状态；需要 screen:capture。 */
  systemPreferences: {
    getMediaAccessStatus: (type: PluginMediaAccessType) => Promise<PluginMediaAccessStatus>
  }
  /** 桌面级区域选区，返回 DIP 屏幕坐标矩形；需要 screen:capture。 */
  overlay: {
    selectRegion: () => Promise<{ x: number; y: number; width: number; height: number } | null>
  }
  /**
   * 录制期间阻止会话重置（主窗口收起 30 秒后插件页默认会被卸载，录制会断）。
   * 开始录制 hold、结束 release；窗口关闭时宿主自动释放。需要 screen:capture。
   */
  holdSessionReset: (held: boolean) => Promise<boolean>
}

export type PluginNetworkApi = {
  /**
   * 由宿主主进程代发的网络请求，不受同源策略（CORS）限制；需要 `network:fetch` 权限。
   *
   * 返回真正的 `Response`：`status` / `statusText` / `ok` / `headers` / `body` 都可用，
   * `text()` / `json()` 照常，`body.getReader()` 可以像直连一样边收边读（流式对话逐字输出一致）。
   *
   * 未声明 `network:fetch` 时直接抛 `TypeError`（消息点明缺少哪个权限），不会发出请求。
   * `init.signal` 触发的中断以 `AbortError` 收尾；其余失败抛带 `code` 的 `TypeError`，
   * 取值为 `ENOTFOUND` | `ETIMEDOUT` | `ECONNREFUSED` | `ABORT_ERR` | `EFBIG` | `EINVALID_HEADER` | `NOT_SUPPORTED`
   * （系统网络栈还可能透出其他错误码）。等响应头默认 2 分钟、上限 10 分钟，响应体不设时限、
   * 单次上限 256 MB。仅接受 `http:` / `https:`，不带宿主自身 cookie，请求体只支持字符串。
   * 请求头的值不合法时（如带换行）以 `EINVALID_HEADER` 失败，宿主不会静默丢掉该头把请求发出去。
   */
  fetch: (input: string | Request, init?: RequestInit) => Promise<Response>
}

export type ToolZenPluginApi = {
  pluginCode: string
  /** 复制文本到系统剪贴板。 */
  copyText: (text: string) => Promise<boolean>
  /** 读取系统剪贴板中的纯文本；未授权或没有文本时返回空串。 */
  readClipboardText: () => Promise<string>
  /** 读取系统剪贴板中的图片 Data URL；未授权或没有图片时返回空串。 */
  readClipboardImage: () => Promise<string>
  /** 清空系统剪贴板；需要 clipboard:write。 */
  clearClipboard: () => Promise<boolean>
  /** 将图片 Data URL 写入系统剪贴板；需要 clipboard:write。 */
  copyClipboardImage: (dataUrl: string) => Promise<boolean>
  /** 读取系统剪贴板中文件的绝对路径；需要 clipboard:read，未授权或没有文件时返回空数组。 */
  readClipboardFiles: () => Promise<string[]>
  /** 把拖拽或粘贴进来的 File 还原成绝对路径；解析不出时返回空字符串，不需要权限。 */
  getPathForFile: (file: File) => string
  /** 发送系统通知。 */
  showNotification: (body: string, title?: string) => Promise<boolean>
  /** 在 ToolZen 宿主窗口显示短暂的全局 Toast。 */
  toast: (message: string, durationMs?: number) => void
  /** 显示文件选择对话框；需要 file:dialog。 */
  showOpenDialog: (options?: PluginOpenDialogOptions) => Promise<string[]>
  /** 显示文件保存对话框；需要 file:dialog。 */
  showSaveDialog: (options?: PluginSaveDialogOptions) => Promise<string>
  /** 播放系统提示音。 */
  shellBeep: () => Promise<boolean>
  /** 最小化主窗口。 */
  hideMainWindow: () => void
  /** 显示并聚焦主窗口。 */
  showMainWindow: () => Promise<boolean>
  /** 返回搜索首页；独立窗口中关闭当前窗口。 */
  outPlugin: () => void
  /** 将当前插件分离为独立窗口。 */
  detachWindow: (options?: PluginDetachWindowOptions) => Promise<boolean>
  /** 调整主窗口高度；独立窗口中返回 0。 */
  setExpendHeight: (height: number, options?: { minimumHeight?: number; animate?: boolean; durationMs?: number }) => Promise<number>
  /** 判断当前实例是否运行在独立窗口中。 */
  isDetachedWindow: () => boolean
  /** 本插件的宿主窗口此刻是否处于激活状态（已聚焦、可见、未最小化）。 */
  isWindowActive: () => Promise<boolean>
  /**
   * 注册一个系统级全局快捷键，写法见 Electron Accelerator，例如 `'CommandOrControl+Shift+K'`。
   *
   * 成功返回 `true`。写法不合法、组合键已经归宿主自己的呼出快捷键或别的插件窗口所有、
   * 或者系统里被别的应用占着时返回 `false`。至少要带一个修饰键：单键注册会把整个系统的那个键
   * 抢走，宿主不受理。
   *
   * 快捷键跟着插件实例走：插件退出时宿主自动注销，插件不用在 `onPluginOut` 里额外收尾。
   */
  registerShortcut: (accelerator: string, callback: () => void) => Promise<boolean>
  /** 注销全局快捷键；不传参数时注销本插件在这个窗口注册的全部快捷键。 */
  unregisterShortcut: (accelerator?: string) => Promise<boolean>
  /** 跳转到另一个已安装插件。 */
  redirect: (code: string, payload?: string) => void
  /** 读取当前进入动作。 */
  getEnterAction: () => PluginEnterAction
  /** 注册插件进入事件并返回取消函数。 */
  onPluginEnter: (callback: (action: PluginEnterAction) => void) => () => void
  /** 注册插件退出事件并返回取消函数。 */
  onPluginOut: (callback: () => void) => () => void
  /** 注册插件成功分离事件并返回取消函数。 */
  onPluginDetach: (callback: () => void) => () => void
  /** 注册明暗主题变化事件并返回取消函数。 */
  onThemeChange: (callback: (theme: 'light' | 'dark') => void) => () => void
  /** 注册主窗口显示事件并返回取消函数。 */
  onWindowShow: (callback: () => void) => () => void
  /** 注册主窗口隐藏事件并返回取消函数。 */
  onWindowHide: (callback: () => void) => () => void
  db: PluginDocumentStore
  dbStorage: PluginStringStore
  /** 受控的文件读取与重命名能力；写操作只受理本次会话授权的路径。 */
  file: PluginFileApi
  /** 由宿主主进程代发的网络请求，不受 CORS 限制；需要 network:fetch，未声明时 fetch 抛 TypeError。 */
  network: PluginNetworkApi
  /**
   * 屏幕采集能力（枚举 / 取流 / 权限状态 / 区域选区 / 录制期保持会话）；需要 screen:capture。
   *
   * 采集源无法在渲染层枚举（W3C 规范禁止），所以枚举与按源授权都由宿主主进程完成。
   */
  desktopCapturer: PluginScreenCaptureApi['desktopCapturer']
  /** 按源取流（可带系统声音）；需要 screen:capture，必须在用户手势里调用。 */
  capture: PluginScreenCaptureApi['capture']
  /** 查询系统级媒体权限状态；需要 screen:capture。 */
  systemPreferences: PluginScreenCaptureApi['systemPreferences']
  /** 桌面级区域选区；需要 screen:capture。 */
  overlay: PluginScreenCaptureApi['overlay']
  /** 录制期间阻止会话重置；需要 screen:capture。 */
  holdSessionReset: PluginScreenCaptureApi['holdSessionReset']
  /** 调起全屏取色。 */
  screenColorPick: () => Promise<{ hex: string } | null>
  /** 读取主屏幕信息。 */
  getPrimaryDisplay: () => Promise<PluginDisplayInfo>
  /** 读取全部屏幕信息。 */
  getAllDisplays: () => Promise<PluginDisplayInfo[]>
  /** 读取当前鼠标的屏幕坐标。 */
  getCursorScreenPoint: () => Promise<PluginScreenPoint>
  /** 读取距离指定点最近的屏幕信息。 */
  getDisplayNearestPoint: (point: PluginScreenPoint) => Promise<PluginDisplayInfo>
  /** 读取与指定矩形相交最多的屏幕信息。 */
  getDisplayMatching: (rect: PluginScreenRect) => Promise<PluginDisplayInfo>
  /** 将屏幕像素坐标转换为 DIP 坐标。 */
  screenToDipPoint: (point: PluginScreenPoint) => Promise<PluginScreenPoint>
  /** 将 DIP 坐标转换为屏幕像素坐标。 */
  dipToScreenPoint: (point: PluginScreenPoint) => Promise<PluginScreenPoint>
  /** 将屏幕像素矩形转换为 DIP 矩形。 */
  screenToDipRect: (rect: PluginScreenRect) => Promise<PluginScreenRect>
  /** 将 DIP 矩形转换为屏幕像素矩形。 */
  dipToScreenRect: (rect: PluginScreenRect) => Promise<PluginScreenRect>
  /** 用系统默认浏览器打开 HTTP(S) 链接；失败返回 false。 */
  shellOpenExternal: (url: string) => Promise<boolean>
  /** 判断宿主当前是否为深色主题。 */
  isDarkColors: () => boolean
  /** 设置宿主标题栏副标题。 */
  setSubtitle: (text: string) => void
  /** 设置双击标题栏分离时读取的动态载荷。 */
  setDetachPayload: (provider: PluginDetachPayloadProvider | null) => void
  /** 读取当前插件身份和运行类型。 */
  getPluginInfo: () => PluginInfo
  /** 读取安装时保存的插件配置副本。 */
  getPluginConfig: <T extends Record<string, unknown> = Record<string, unknown>>() => T
  /** 读取当前插件窗口类型。 */
  getWindowType: () => 'main' | 'detach'
  /** 读取应用名称。 */
  getAppName: () => Promise<string>
  /** 读取应用版本。 */
  getAppVersion: () => Promise<string>
  /** 读取 Electron 平台标识。 */
  getPlatform: () => string
  /** 判断是否为本地调试插件。 */
  isDev: () => boolean
  /** 判断当前系统是否为 macOS。 */
  isMacOS: () => boolean
  /** 判断当前系统是否为 Windows。 */
  isWindows: () => boolean
  /** 判断当前系统是否为 Linux。 */
  isLinux: () => boolean
}

export type ToolZenPluginProps = {
  config: Record<string, string | number | boolean>
  initialText: string
  enterAction: PluginEnterAction | null
  api: ToolZenPluginApi | null
}
