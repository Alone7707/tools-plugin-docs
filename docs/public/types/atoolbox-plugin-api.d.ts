export type PluginEnterAction = {
  code: string
  type: 'open' | 'text' | 'regex' | 'over' | 'img'
  payload: string
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

export type AToolBoxPluginApi = {
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
  /** 发送系统通知。 */
  showNotification: (body: string, title?: string) => Promise<boolean>
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

export type AToolBoxPluginProps = {
  config: Record<string, string | number | boolean>
  initialText: string
  enterAction: PluginEnterAction | null
  api: AToolBoxPluginApi | null
}
