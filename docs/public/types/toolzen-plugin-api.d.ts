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
  /**
   * 写入起点（字节）。不传时按 0 处理，即「从 0 开始整份覆盖」的老语义（会截断）。
   *
   * 传了就从该偏移落笔且**不截断**，用于边收边写的大文件传输；目标不存在时新建。
   */
  offset?: number
  /** 写完把文件截断到「offset + 本次写入长度」；用于续传收尾时清掉遗留的多余尾巴。 */
  truncate?: boolean
}

export type PluginFileReadRequest = {
  /** 目标绝对路径；必须已在本次会话的已授权集合里。 */
  path: string
  /** 起始字节偏移，默认 0。 */
  offset?: number
  /** 本次最多读多少字节，默认到文件末尾；单次上限 64MB。 */
  length?: number
}

export type PluginFileReadResult = {
  ok: boolean
  /** 本次读到的字节；读到一个空块且 eof 为 true 表示已经到末尾。 */
  data?: ArrayBuffer
  /** 文件总大小（字节），便于算进度。 */
  size?: number
  /** 本次是否已读到文件末尾。 */
  eof?: boolean
  code?: 'invalid' | 'not-granted' | 'ENOENT' | 'EISDIR' | 'EACCES' | 'EBUSY' | 'failed'
  message?: string
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
   *
   * 传 `offset` 即可从中间续写（边收边落盘），不传则是「从 0 整份覆盖」的老语义。
   */
  write: (request: PluginFileWriteRequest) => Promise<PluginFileWriteResult>
  /**
   * 按偏移读取文件内容；需要 `file:read-content`——**不是** `file:read`。
   *
   * `file:read` 只给元信息，这个方法给的是文件字节本身，所以宿主单开了一项权限。
   * 授权护栏与 write 同级：只读本次会话已授权集合内的路径，没 grant 过的回 `not-granted`。
   *
   * 循环读时靠 `size` 与 `eof` 判断结束，不必先 scan：
   * ```js
   * let offset = 0
   * for (;;) {
   *   const chunk = await api.file.read({ path, offset, length: 4 * 1024 * 1024 })
   *   if (!chunk.ok) throw new Error(chunk.message)
   *   if (chunk.data.byteLength) send(chunk.data)
   *   offset += chunk.data.byteLength
   *   if (chunk.eof) break
   * }
   * ```
   */
  read: (request: PluginFileReadRequest) => Promise<PluginFileReadResult>
}

export type PluginLanAdvertiseRequest = {
  /** 服务标识，最长 40 字符；同一项服务的对端才会互相发现。 */
  service: string
  /** 展示名，通常是本机名。 */
  name?: string
  /** 交给对端的载荷，最长 2048 字符；连接码这类短文本走这里。 */
  payload?: string
}

export type PluginLanAdvertiseResult = {
  ok: boolean
  /** 停止播报时用。 */
  id?: string
  name?: string
  code?: string
  message?: string
}

export type PluginLanDiscoverRequest = {
  service: string
  /** 等待时长（毫秒），默认 3000，上限 15000。 */
  timeoutMs?: number
}

export type PluginLanPeer = {
  id: string
  service: string
  name: string
  /** 对端的局域网 IP。 */
  address: string
  payload: string
}

export type PluginLanDiscoverResult = {
  ok: boolean
  /** 只有这一轮听到的对端；每次调用会清掉上一轮的记录。 */
  peers: PluginLanPeer[]
  /** 组播被网络屏蔽时 ok 为 false，code 为 'unavailable'。 */
  code?: string
  message?: string
}

export type PluginLocalAddress = {
  interface: string
  address: string
  family: 'IPv4' | 'IPv6'
  /** 回环地址（127.0.0.1 / ::1）。 */
  internal: boolean
}

export type PluginQrCodeRequest = {
  text: string
  /** 图片边长（像素），默认 320，范围 64–1024。 */
  size?: number
  /** 静默区宽度（模块数），默认 2，范围 0–8。 */
  margin?: number
  /** 纠错级别，默认 'M'。 */
  level?: 'L' | 'M' | 'Q' | 'H'
}

export type PluginQrCodeResult = {
  ok: boolean
  /** PNG 的 Data URL，可直接喂给 copyClipboardImage 或 <img src>。 */
  dataUrl?: string
  size?: number
  code?: string
  message?: string
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

/** 置顶悬浮窗的打开参数。 */
export type PluginFloatWindowOptions = {
  /** 窗口宽高（DIP）。默认 392 × 60。 */
  width?: number
  height?: number
  /**
   * 排除自身采集：不允许这个窗口出现在屏幕录制里。默认 `true`。
   *
   * **别关**：不排除的话，用户录完会发现录像里有一条控制条在飘，而且永久留在成品里。
   */
  excludeFromCapture?: boolean
  /** 无焦点显示：弹出时不抢走用户正在操作的窗口焦点。默认 `true`。 */
  showInactive?: boolean
  /** 记住上次落点，下次在同一个位置打开。默认 `true`。 */
  persistPosition?: boolean
}

/**
 * 置顶悬浮窗：在所有应用之上开一个小窗，加载**插件自己的产物**。
 *
 * 分工是「窗口能力归宿主、样式归插件」——宿主负责置顶 / 透明无边框 / 不进任务栏 /
 * 拖动跟手 / 排除自身采集，插件在自己的产物里渲染那条控制条。
 *
 * 悬浮窗里跑的是同一份插件代码，靠 `getWindowType() === 'float'` 认出自己那一侧。
 */
export type PluginFloatWindowApi = {
  /** 打开悬浮窗（同一插件同时只留一个，重复调用会把它拎到前面）。需要 screen:capture。 */
  open: (options?: PluginFloatWindowOptions) => Promise<boolean>
  /**
   * 关闭悬浮窗。需要 screen:capture。
   *
   * **停止任务时必须真的调到**：这个窗口不在任务栏、也没有别的关闭入口，
   * 漏关的话用户屏幕上会永久留一条浮着的窗口。
   */
  close: () => Promise<boolean>
  /** 按内容重新量一次尺寸；只改尺寸不动位置，越界值收窄到 200–900 × 40–320。需要 screen:capture。 */
  resize: (size: { width: number; height: number }) => Promise<boolean>
  /**
   * 拖动三个信令：按下 → 拖动中（每次 pointermove）→ 抬手。需要 screen:capture。
   *
   * 位移由宿主按**屏幕坐标**算：多屏 + 混合 DPI 下渲染层拿不到准确的全局坐标，自己算会漂。
   */
  beginDrag: () => void
  updateDrag: () => void
  endDrag: () => void
}

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
  /** 置顶悬浮窗：在所有应用之上开一个小窗加载插件自己的产物；需要 screen:capture。 */
  floatWindow: PluginFloatWindowApi
  /**
   * 发一条消息给「另一个」插件窗口。需要 screen:capture。
   *
   * 方向由宿主按发送者身份判定：主窗口发出去 → 悬浮窗收到；悬浮窗发出去 → 主窗口收到。
   */
  postFloatMessage: (payload: unknown) => Promise<boolean>
  /** 接收另一个插件窗口发来的消息；返回取消函数。需要 screen:capture。 */
  onFloatMessage: (callback: (payload: unknown) => void) => () => void
  /**
   * 阻止主窗口隐藏后的会话重置，让插件页留在内存里。**不需要权限。**
   *
   * 主窗口收起后宿主默认会在会话重置等待时间（默认 30 秒）后卸载插件页，
   * 后台任务型插件（录制 / 导出 / 长轮询 / 批量处理）会因此中断。
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
  /** 受控的文件读取与重命名能力；写操作与读内容只受理本次会话授权的路径。 */
  file: PluginFileApi
  /**
   * 局域网自动发现：让同一局域网内两台装了 ToolZen 的电脑互相看见；需要 lan:discover。
   *
   * 宿主在主进程代管组播套接字（渲染层不能监听端口），报文不出本地网络。
   * 组播被网络屏蔽时 `advertise` / `discover` 会回 `ok: false`（`code: 'unavailable'`），
   * 插件应退回手工交换连接码，而不是卡在「正在搜索」。
   */
  lan: {
    /** 开始在同网段播报自己；返回的 id 交给 stop。窗口销毁时宿主自动收摊。 */
    advertise: (request: PluginLanAdvertiseRequest) => Promise<PluginLanAdvertiseResult>
    /** 搜一轮同网段的对端；语义是「探一次、等一会儿」，不是持续订阅。 */
    discover: (request: PluginLanDiscoverRequest) => Promise<PluginLanDiscoverResult>
    /** 停止播报；不传 id 时停掉本插件在当前窗口登记的全部广告。 */
    stop: (id?: string) => Promise<boolean>
  }
  /**
   * 列出本机网卡地址；**不需要权限**（只读、不含用户数据）。
   *
   * 用途是排查「两台电脑不在同一网段」。老宿主没有这条接口时回空数组。
   */
  getLocalAddresses: () => Promise<PluginLocalAddress[]>
  /**
   * 把一段文本渲染成二维码 PNG Data URL；**不需要权限**（纯计算）。
   *
   * 返回的地址可直接喂给 `copyClipboardImage`，也可以塞进 `<img src>`。
   */
  renderQrCode: (request: PluginQrCodeRequest) => Promise<PluginQrCodeResult>
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
  /**
   * 置顶悬浮窗：在所有应用之上开一个小窗加载插件自己的产物；需要 screen:capture。
   *
   * 录屏期间的控制条这类「要浮在桌面最上层、不在任务栏、还要盖得住别的应用」的界面用它。
   */
  floatWindow: PluginScreenCaptureApi['floatWindow']
  /**
   * 发一条消息给「另一个」插件窗口；需要 screen:capture。
   *
   * 方向由宿主按发送者身份判定，插件不用自己判断。
   */
  postFloatMessage: PluginScreenCaptureApi['postFloatMessage']
  /** 接收另一个插件窗口发来的消息；返回取消函数。需要 screen:capture。 */
  onFloatMessage: PluginScreenCaptureApi['onFloatMessage']
  /**
   * 阻止主窗口隐藏后的会话重置，让插件页留在内存里；**不需要权限**。
   *
   * 后台任务型插件（录制 / 导出 / 长轮询 / 批量处理）在窗口收起后会因会话重置被卸载，
   * 用它在任务期间持有、结束后释放。
   */
  holdSessionReset: PluginScreenCaptureApi['holdSessionReset']
  /**
   * 收起主窗口并保持插件页不被会话重置卸载；**不需要权限**。
   *
   * 等价于 `holdSessionReset(true)` + `hideMainWindow()`，`hold` 默认 true。
   */
  hideMainWindowKeepAlive: (hold?: boolean) => void
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
  /**
   * 读取当前插件实例所在的窗口形态：主窗体 `'main'`、独立窗口 `'detach'`、置顶悬浮窗 `'float'`。
   *
   * 悬浮窗里跑的是同一份插件代码，靠它认出自己那一侧只渲染控制条。不需要权限。
   */
  getWindowType: () => 'main' | 'detach' | 'float'
  /** 读取应用名称。 */
  getAppName: () => Promise<string>
  /** 读取应用版本。 */
  getAppVersion: () => Promise<string>
  /**
   * 读取宿主 API 级别。
   *
   * **不要用 getAppVersion() 判断能力**——版本号里既有修 bug 也有加能力，比较版本号迟早误判。
   *
   * 老宿主上这个方法不存在，探测请写成
   * `typeof api.getApiLevel === 'function' ? api.getApiLevel() : 1`，
   * 或用 hasCapability 的兜底写法（见文档「版本与兼容性」）。
   */
  getApiLevel: () => number
  /**
   * 宿主是否具备某个能力（名字与 permissions 一致，如 `screen:capture`）。
   *
   * 注意它回答的是「**宿主会不会**」，不代表「**你的插件有没有被授权**」——
   * 后者看 manifest 的 permissions。两者都要满足才能真正调用。
   *
   * 老宿主上这个方法不存在，直接调用会抛 TypeError，务必用 typeof 兜底。
   */
  hasCapability: (name: string) => boolean
  /** 宿主全部能力名（按首次出现的 apiLevel 排序）。同样受老宿主缺方法的影响。 */
  getCapabilities: () => string[]
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
