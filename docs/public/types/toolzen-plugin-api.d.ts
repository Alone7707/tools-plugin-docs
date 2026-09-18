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
  /** 是否把目录展开成其中的条目；递归最多 8 层，目录本身不再单独列出。 */
  recursive?: boolean
  /** 按条目名匹配的简易 glob：* 不跨路径分隔符，** 跨路径分隔符，? 匹配一个字符。 */
  match?: string
  /** 返回条目的上限，默认 2000，硬上限 10000。 */
  limit?: number
}

export type PluginFileEntry = {
  path: string
  name: string
  isDirectory: boolean
  /** 目录恒为 0。 */
  sizeBytes: number
  /** 毫秒时间戳。 */
  modifiedAt: number
  /** 路径不存在时为 false，其余字段为零值。 */
  exists: boolean
}

export type PluginFileRenameRequest = {
  items: Array<{ from: string; to: string }>
  /** 只预览计划结果，不改动磁盘；推荐先用它给用户确认。 */
  dryRun?: boolean
  /** onConflict: 'overwrite' 的别名。 */
  allowOverwrite?: boolean
  /** 目标已存在时的策略，默认 'error'。 */
  onConflict?: 'error' | 'skip' | 'overwrite'
}

export type PluginFileRenameItem = {
  from: string
  to: string
  status: 'planned' | 'applied' | 'skipped' | 'failed'
  reason?: string
  error?: string
}

export type PluginFileRenameResult = {
  dryRun: boolean
  items: PluginFileRenameItem[]
  /** 真正执行成功的重命名，按执行顺序；把 from / to 对调再调一次即可撤销。 */
  applied: Array<{ from: string; to: string }>
}

export type PluginFileGrantResult = {
  granted: string[]
  rejected: Array<{ path: string; reason: string }>
}

export type PluginFileApi = {
  /** 展开一批绝对路径，返回条目元信息；需要 file:read，未授权时返回空数组。 */
  scan: (paths: string[], options?: PluginFileScanOptions) => Promise<PluginFileEntry[]>
  /** 判断路径是否存在，结果与输入按下标一一对应；需要 file:read，未授权时返回等长的 false 数组。 */
  exists: (paths: string[]) => Promise<boolean[]>
  /** 打开系统文件管理器并选中该路径；需要 file:read。 */
  reveal: (path: string) => Promise<boolean>
  /** 把绝对路径登记进本次会话的已授权集合；需要 file:write。 */
  grant: (paths: string[]) => Promise<PluginFileGrantResult>
  /** 批量重命名，只受理本次会话授权集合内的源路径；需要 file:write。 */
  rename: (request: PluginFileRenameRequest) => Promise<PluginFileRenameResult>
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
