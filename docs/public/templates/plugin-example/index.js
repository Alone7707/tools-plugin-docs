/**
 * AToolBox 插件开发示例模板。
 *
 * 这是一个可以直接拿去改的最小可运行插件：一个文本工作台，顺带把宿主提供的
 * 大部分能力都演示了一遍（进入动作、剪贴板、隔离存储、系统通知、顶栏副标题与分离载荷）。
 *
 * 注意这里**没有**标题栏：插件在主窗体里跑的时候，顶上那条 48px 的标题栏
 * （插件图标 / 插件名 / 功能副标题 / 返回启动器 / 按住拖窗口 / 双击分离成独立窗口）
 * 由宿主渲染，插件不用也不该自绘。插件能往那条顶栏里塞的只有两样东西，本文件都演示了：
 *   api.setSubtitle('文本工作台')       —— 写「·」后面那个当前功能名
 *   api.setDetachPayload(() => ({…}))  —— 交出「双击分离时要带走什么」
 *
 * 三条硬约束，改这个文件时别破坏：
 * 1. 必须是原生 ESM，且**不能有任何 TypeScript 语法**。宿主用 import() 直接加载
 *    这个文件，浏览器不做任何转译——一个 `: string` 就会让整个插件加载失败。
 * 2. Vue 运行时从 window.Vue 取，不要自己打包 Vue。宿主和插件共用同一个运行时
 *    实例，各带一份会让响应式系统在两套 reactive 之间失联。
 * 3. 不能碰 Node / Electron API。这里就是个浏览器环境，没有 require、没有 fs。
 */

const VueRuntime = window.Vue
// 宿主注入的 Vue 运行时。

if (!VueRuntime) {
  // 直接用浏览器打开这个文件会走到这里。抛错比解构报 undefined 更容易看懂。
  throw new Error('[plugin_example] 未找到 window.Vue：本插件需要由 AToolBox 宿主加载运行')
}

const { defineComponent, ref, computed, watch, onMounted, onBeforeUnmount, h } = VueRuntime

const STYLE_ID = 'atoolbox-plugin-example-style'
// 样式节点 ID。同一插件可能被开成多个实例（主窗体一个、独立窗口一个），样式只挂一份。

const STYLE_TEXT = `
.plugin-example {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  height: 100%;
  padding: 20px 22px;
  overflow: auto;
  color: #17202a;
  background: #f7f8fa;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 13px;
}
.plugin-example.is-dark {
  color: #f2f3f5;
  background: #292a2f;
}

/* 这只是插件内容的第一行（一句提示 + 进入动作卡片），不是标题栏——标题栏归宿主。
   千万别在这里写 -webkit-app-region: drag：那片区域在 Windows 上会被系统当成原生标题栏，
   按下之后鼠标消息不再进 DOM，里面的按钮点不动、文字划不动、双击也收不到。
   要拖窗口直接按住宿主那条顶栏就行，插件一行 CSS 都不用写。 */
.plugin-example__header {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}
.plugin-example__subtitle {
  flex: 1 1 180px;
  min-width: 0;
  margin: 0;
  color: #7b7e86;
  font-size: 12px;
  line-height: 1.6;
}
.plugin-example.is-dark .plugin-example__subtitle { color: #adb0b8; }

/* 进入动作是调试时最需要盯着的信息，做成可复制的小卡片。 */
.plugin-example__enter {
  max-width: 260px;
  padding: 8px 10px;
  color: #45474e;
  font-family: Consolas, "Cascadia Code", monospace;
  font-size: 11px;
  line-height: 1.5;
  word-break: break-all;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(74, 77, 85, 0.12);
  border-radius: 8px;
  /* 宿主给 .app-shell 设了 user-select: none，插件内的文字会继承。
     要让哪块内容能划选复制，就在那块上显式写回 text。 */
  user-select: text;
}
.plugin-example.is-dark .plugin-example__enter {
  color: #e4e5e8;
  background: rgba(66, 68, 75, 0.72);
  border-color: rgba(255, 255, 255, 0.1);
}

.plugin-example__editor {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
}
.plugin-example__textarea {
  box-sizing: border-box;
  flex: 1 1 auto;
  min-height: 180px;
  padding: 12px 14px;
  color: inherit;
  font: inherit;
  font-family: Consolas, "Cascadia Code", "Microsoft YaHei", monospace;
  line-height: 1.7;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(74, 77, 85, 0.12);
  border-radius: 10px;
  outline: none;
  resize: none;
}
.plugin-example__textarea:focus {
  border-color: rgba(79, 142, 232, 0.6);
  box-shadow: 0 0 0 3px rgba(79, 142, 232, 0.15);
}
.plugin-example.is-dark .plugin-example__textarea {
  background: rgba(68, 70, 78, 0.92);
  border-color: rgba(255, 255, 255, 0.1);
}

.plugin-example__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  color: #7b7e86;
  font-size: 12px;
}
.plugin-example__stat {
  padding: 4px 9px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 6px;
  user-select: text;
}
.plugin-example.is-dark .plugin-example__stats { color: #adb0b8; }
.plugin-example.is-dark .plugin-example__stat { background: rgba(66, 68, 75, 0.72); }

.plugin-example__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.plugin-example__button {
  min-height: 32px;
  padding: 0 13px;
  color: inherit;
  font: inherit;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(74, 77, 85, 0.12);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 140ms ease, background-color 140ms ease;
}
.plugin-example__button:hover:not(:disabled) { border-color: rgba(79, 142, 232, 0.6); }
.plugin-example__button:disabled { cursor: not-allowed; opacity: 0.45; }
.plugin-example__button--primary {
  color: #fff;
  background: #4f8ee8;
  border-color: #4f8ee8;
}
.plugin-example__button--primary:hover:not(:disabled) { background: #397bd8; }
.plugin-example.is-dark .plugin-example__button {
  background: rgba(66, 68, 75, 0.72);
  border-color: rgba(255, 255, 255, 0.1);
}
.plugin-example.is-dark .plugin-example__button--primary {
  background: #6aa4ee;
  border-color: #6aa4ee;
}

.plugin-example__status {
  min-height: 18px;
  margin: 0;
  color: #397bd8;
  font-size: 12px;
}
.plugin-example.is-dark .plugin-example__status { color: #82b4f3; }
.plugin-example__status--warn { color: #d9534f; }
.plugin-example.is-dark .plugin-example__status--warn { color: #ff8a80; }
`
// 插件自带样式。所有选择器都带 plugin-example 前缀，不碰宿主任何全局类名。

/**
 * 把插件样式挂进页面。重复调用无副作用。
 */
function ensureStyles() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  // 样式节点。
  style.id = STYLE_ID
  style.textContent = STYLE_TEXT
  document.head.appendChild(style)
}

/**
 * 把进入动作渲染成一行可读文本，调试时一眼能看出是怎么被拉起来的。
 */
function formatEnterAction(action) {
  if (!action || !action.code) return 'code=main type=open'
  const payload = typeof action.payload === 'string' ? action.payload : ''
  // 携带内容。
  const brief = payload.length > 40 ? payload.slice(0, 40) + '…' : payload
  // 截断后的载荷预览，避免一张图片的 dataUrl 撑爆卡片。
  return `code=${action.code} type=${action.type || 'open'}` + (brief ? `\npayload=${brief}` : '')
}

/**
 * 取出进入动作里可以回填编辑区的文本。
 * img 类型的 payload 是图片 dataUrl，塞进文本框只会是一长串乱码，这里挡掉。
 */
function readActionText(action) {
  if (!action || typeof action.payload !== 'string') return null
  if (action.type === 'img') return null
  return action.payload
}

export default defineComponent({
  name: 'PluginExample',
  props: {
    /** manifest.config 的默认值合并用户覆盖后的结果。 */
    config: { type: Object, default: () => ({}) },
    /** 打开插件时带入的文本（搜索词 / 剪贴板内容）。 */
    initialText: { type: String, default: '' },
    /** 本次进入动作。 */
    enterAction: { type: Object, default: null },
    /** 宿主 API。浏览器直开预览时可能为 null，每次用都要判空。 */
    api: { type: Object, default: null }
  },
  setup(props) {
    const text = ref(String(props.initialText || ''))
    // 编辑区内容。
    const status = ref('')
    // 底部操作反馈。
    const statusIsWarning = ref(false)
    // 当前反馈是否为失败提示，决定文字颜色。
    const enterInfo = ref(formatEnterAction(props.enterAction))
    // 最近一次进入动作的描述。
    const isDark = ref(Boolean(props.api && props.api.isDarkColors && props.api.isDarkColors()))
    // 宿主当前是否深色主题。进入时读一次即可，宿主换主题会重建插件实例。
    let stopEnterListener = null
    // onPluginEnter 的取消函数。

    const characterCount = computed(() => Array.from(text.value).length)
    // 字符数。用 Array.from 而不是 .length，否则 emoji 和生僻字会被算成两个。
    const wordCount = computed(() => {
      const normalized = text.value.trim()
      // 去掉首尾空白的文本。
      return normalized ? normalized.split(/\s+/).length : 0
    })
    // 按空白切分的词数。
    const lineCount = computed(() => (text.value ? text.value.split(/\r?\n/).length : 0))
    // 行数。
    const showStats = computed(() => props.config.showStats !== false)
    // 是否显示统计条，对应 manifest.config.showStats。

    /**
     * 统一写操作反馈。
     */
    function setStatus(message, isWarning) {
      status.value = message
      statusIsWarning.value = Boolean(isWarning)
    }

    /**
     * 宿主再次以新动作进入本插件时刷新面板。
     * 插件常驻不卸载，用户在搜索框里第二次触发时走的是这里而不是重新挂载。
     */
    function handlePluginEnter(action) {
      enterInfo.value = formatEnterAction(action)
      const actionText = readActionText(action)
      // 本次动作携带的文本。
      if (actionText !== null) text.value = actionText
    }

    /**
     * 复制当前内容。走宿主 API，主窗体失焦时也能写进剪贴板。
     */
    async function copyText() {
      if (!text.value) {
        setStatus('没有可复制的内容', true)
        return
      }
      if (!props.api || !props.api.copyText) {
        setStatus('当前环境没有宿主剪贴板能力', true)
        return
      }
      const copied = await props.api.copyText(text.value)
      // 是否写入成功。
      setStatus(copied ? '已复制到剪贴板' : '复制失败', !copied)
    }

    /**
     * 把草稿写进插件隔离存储。数据落在 atoolbox-plugin-db:<code>: 命名空间下，别的插件读不到。
     */
    function saveDraft() {
      if (!props.api || !props.api.db) {
        setStatus('当前环境没有宿主存储', true)
        return
      }
      const saved = props.api.db.put('draft', { text: text.value, savedAt: Date.now() })
      // 是否写入成功。
      setStatus(saved === false ? '草稿保存失败' : '草稿已保存', saved === false)
    }

    /**
     * 读回上次保存的草稿。
     */
    function restoreDraft() {
      const draft = props.api && props.api.db ? props.api.db.get('draft') : null
      // 已保存的草稿。
      if (!draft || typeof draft.text !== 'string') {
        setStatus('还没有保存过草稿', true)
        return
      }
      text.value = draft.text
      setStatus('已恢复草稿')
    }

    /**
     * 发一条系统通知。
     */
    async function notifyHost() {
      if (!props.api || !props.api.showNotification) {
        setStatus('当前环境没有系统通知能力', true)
        return
      }
      await props.api.showNotification(`当前共 ${characterCount.value} 个字符`, '插件开发示例')
      setStatus('通知已发送')
    }

    /**
     * 清空编辑区。
     */
    function clearText() {
      text.value = ''
      setStatus('已清空')
    }

    // 宿主可能在插件常驻期间换一份 initialText 进来，跟着同步。
    watch(
      () => props.initialText,
      (next) => {
        if (next == null) return
        text.value = String(next)
      }
    )

    onMounted(() => {
      ensureStyles()
      if (props.api && props.api.onPluginEnter) {
        stopEnterListener = props.api.onPluginEnter(handlePluginEnter)
      }
      // 顶栏是宿主的，插件只往里塞两样东西。
      // 1. 副标题：显示在插件名后面那个「·」的右边，一般就写当前功能名。
      if (props.api && props.api.setSubtitle) props.api.setSubtitle('文本工作台')
      // 2. 分离载荷：用户双击顶栏分离成独立窗口时，宿主回头问这个函数「现在要带走什么」。
      //    注册的是函数而不是值，所以取到的永远是此刻的编辑区内容；不注册的话新窗口只会
      //    拿到本次进入动作里的那份 payload（对本插件来说就是个空编辑区）。
      if (props.api && props.api.setDetachPayload) {
        props.api.setDetachPayload(() => ({ initialText: text.value, width: 720, height: 560 }))
      }
    })

    onBeforeUnmount(() => {
      // 宿主在卸载时会清空自己那份回调集合，但插件自己注册的照样要自己撤，
      // 否则热重载反复挂载会攒下一堆失效闭包。
      if (stopEnterListener) stopEnterListener()
      stopEnterListener = null
    })

    return () => h('main', { class: ['plugin-example', { 'is-dark': isDark.value }] }, [
      h('header', { class: 'plugin-example__header' }, [
        h('p', { class: 'plugin-example__subtitle' }, '改完 index.js 回开发者专区点「重新加载」即可看到新代码'),
        h('pre', { class: 'plugin-example__enter' }, enterInfo.value)
      ]),

      h('section', { class: 'plugin-example__editor' }, [
        h('textarea', {
          class: 'plugin-example__textarea',
          value: text.value,
          spellcheck: 'false',
          placeholder: String(props.config.placeholder || '在这里输入文本，或从主搜索框带内容进来'),
          onInput: (event) => {
            text.value = event.target.value
            setStatus('')
          }
        }),

        showStats.value
          ? h('div', { class: 'plugin-example__stats' }, [
              h('span', { class: 'plugin-example__stat' }, `字符 ${characterCount.value}`),
              h('span', { class: 'plugin-example__stat' }, `单词 ${wordCount.value}`),
              h('span', { class: 'plugin-example__stat' }, `行数 ${lineCount.value}`)
            ])
          : null,

        h('div', { class: 'plugin-example__actions' }, [
          h('button', {
            class: 'plugin-example__button plugin-example__button--primary',
            type: 'button',
            disabled: !text.value,
            onClick: copyText
          }, '复制'),
          h('button', { class: 'plugin-example__button', type: 'button', onClick: saveDraft }, '保存草稿'),
          h('button', { class: 'plugin-example__button', type: 'button', onClick: restoreDraft }, '恢复草稿'),
          h('button', { class: 'plugin-example__button', type: 'button', disabled: !text.value, onClick: clearText }, '清空'),
          h('button', { class: 'plugin-example__button', type: 'button', onClick: notifyHost }, '系统通知')
          // 这里不用摆「返回启动器」和「分离为独立窗口」：宿主顶栏右边就是返回，双击顶栏就是分离。
        ]),

        h('p', {
          class: ['plugin-example__status', { 'plugin-example__status--warn': statusIsWarning.value }],
          role: 'status'
        }, status.value)
      ])
    ])
  }
})
