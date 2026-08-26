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

export type AToolBoxPluginApi = {
  pluginCode: string
  /** 复制文本到系统剪贴板。 */
  copyText: (text: string) => Promise<boolean>
  /** 发送系统通知。 */
  showNotification: (body: string, title?: string) => Promise<boolean>
  /** 最小化主窗口。 */
  hideMainWindow: () => void
  /** 返回搜索首页；独立窗口中关闭当前窗口。 */
  outPlugin: () => void
  /** 将当前插件分离为独立窗口。 */
  detachWindow: (options?: PluginDetachWindowOptions) => Promise<boolean>
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
  db: PluginDocumentStore
  dbStorage: PluginStringStore
  /** 调起全屏取色。 */
  screenColorPick: () => Promise<{ hex: string } | null>
  /** 用系统默认浏览器打开 HTTP(S) 链接。 */
  shellOpenExternal: (url: string) => void
  /** 判断宿主当前是否为深色主题。 */
  isDarkColors: () => boolean
  /** 设置宿主标题栏副标题。 */
  setSubtitle: (text: string) => void
  /** 设置双击标题栏分离时读取的动态载荷。 */
  setDetachPayload: (provider: PluginDetachPayloadProvider | null) => void
}

export type AToolBoxPluginProps = {
  config: Record<string, string | number | boolean>
  initialText: string
  enterAction: PluginEnterAction | null
  api: AToolBoxPluginApi | null
}
