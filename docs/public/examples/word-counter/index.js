const VueRuntime = window.Vue
// 宿主注入的 Vue 运行时。

if (!VueRuntime) throw new Error('[word_counter_example] 未找到 window.Vue')

const { defineComponent, ref, computed, onMounted, onBeforeUnmount, h } = VueRuntime
// 插件使用的 Vue API。

const STYLE_ID = 'word-counter-example-style'
// 插件样式节点 ID。

const STYLE_TEXT = `
.plugin-word-counter {
  box-sizing: border-box;
  display: grid;
  grid-template-rows: minmax(180px, 1fr) auto auto;
  gap: 12px;
  width: 100%;
  height: 100%;
  padding: 20px;
  color: #18212f;
  background: #f6f7f9;
  font: 14px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
.plugin-word-counter.is-dark { color: #f2f4f8; background: #24262b; }
.plugin-word-counter__input {
  box-sizing: border-box;
  width: 100%;
  min-height: 180px;
  padding: 14px;
  color: inherit;
  font: inherit;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(24, 33, 47, 0.14);
  border-radius: 8px;
  outline: none;
  resize: none;
}
.plugin-word-counter.is-dark .plugin-word-counter__input {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.12);
}
.plugin-word-counter__stats,
.plugin-word-counter__actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.plugin-word-counter__stat { padding: 4px 9px; background: rgba(37, 99, 235, 0.1); border-radius: 6px; }
.plugin-word-counter__button {
  min-height: 34px;
  padding: 0 13px;
  color: inherit;
  font: inherit;
  background: transparent;
  border: 1px solid rgba(24, 33, 47, 0.18);
  border-radius: 7px;
  cursor: pointer;
}
.plugin-word-counter__button--primary { color: white; background: #2563eb; border-color: #2563eb; }
.plugin-word-counter__status { margin-left: auto; color: #2563eb; }
`
// 插件私有样式。

/** 挂载插件私有样式。 */
function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return
  const styleElement = document.createElement('style')
  // 新建的样式节点。
  styleElement.id = STYLE_ID
  styleElement.textContent = STYLE_TEXT
  document.head.appendChild(styleElement)
}

/** 从进入动作中读取文本载荷。 */
function readActionText(action) {
  if (!action || action.type === 'img') return null
  return typeof action.payload === 'string' ? action.payload : ''
}

export default defineComponent({
  name: 'WordCounterExample',
  props: {
    config: { type: Object, default: () => ({}) },
    initialText: { type: String, default: '' },
    enterAction: { type: Object, default: null },
    api: { type: Object, default: null }
  },
  setup(props) {
    const text = ref(String(props.initialText || ''))
    // 当前编辑文本。
    const status = ref('')
    // 最近一次操作状态。
    const isDark = ref(Boolean(props.api && props.api.isDarkColors && props.api.isDarkColors()))
    // 当前是否使用深色样式。
    const characterCount = computed(() => Array.from(text.value).length)
    // Unicode 字符数。
    const wordCount = computed(() => {
      const normalizedText = text.value.trim()
      // 去掉首尾空白的文本。
      return normalizedText ? normalizedText.split(/\s+/).length : 0
    })
    // 按空白切分的单词数。
    const lineCount = computed(() => text.value ? text.value.split(/\r?\n/).length : 0)
    // 当前文本行数。
    let removeEnterListener = null
    // 进入事件取消函数。

    /** 处理宿主再次进入插件时携带的内容。 */
    function handlePluginEnter(action) {
      const actionText = readActionText(action)
      // 当前进入动作中的文本载荷。
      if (actionText !== null) text.value = actionText
    }

    /** 复制当前文本。 */
    async function copyCurrentText() {
      if (!text.value || !props.api || !props.api.copyText) return
      const copied = await props.api.copyText(text.value)
      // 剪贴板写入是否成功。
      status.value = copied ? '已复制' : '复制失败'
    }

    /** 保存当前文本草稿。 */
    function saveDraft() {
      if (!props.api || !props.api.db) return
      const saved = props.api.db.put('draft', { text: text.value, savedAt: Date.now() })
      // 草稿是否保存成功。
      status.value = saved ? '草稿已保存' : '保存失败'
    }

    /** 恢复上一次保存的文本草稿。 */
    function restoreDraft() {
      const draft = props.api && props.api.db ? props.api.db.get('draft') : null
      // 当前插件保存的草稿。
      if (!draft || typeof draft.text !== 'string') {
        status.value = '暂无草稿'
        return
      }
      text.value = draft.text
      status.value = '草稿已恢复'
    }

    /** 发送当前统计结果通知。 */
    async function showStatisticsNotification() {
      if (!props.api || !props.api.showNotification) return
      const message = `字符 ${characterCount.value}，单词 ${wordCount.value}，行数 ${lineCount.value}`
      // 系统通知正文。
      await props.api.showNotification(message, '字数统计示例')
      status.value = '通知已发送'
    }

    onMounted(() => {
      ensureStyles()
      if (props.api && props.api.onPluginEnter) {
        removeEnterListener = props.api.onPluginEnter(handlePluginEnter)
      }
      if (props.api && props.api.setSubtitle) props.api.setSubtitle('文本统计')
      if (props.api && props.api.setDetachPayload) {
        props.api.setDetachPayload(() => ({ initialText: text.value, width: 720, height: 560 }))
      }
    })

    onBeforeUnmount(() => {
      if (removeEnterListener) removeEnterListener()
      removeEnterListener = null
      if (props.api && props.api.setDetachPayload) props.api.setDetachPayload(null)
    })

    return () => h('main', { class: ['plugin-word-counter', { 'is-dark': isDark.value }] }, [
      h('textarea', {
        class: 'plugin-word-counter__input',
        value: text.value,
        placeholder: String(props.config.placeholder || '输入文本'),
        onInput: (event) => {
          text.value = event.target.value
          status.value = ''
        }
      }),
      h('section', { class: 'plugin-word-counter__stats' }, [
        h('span', { class: 'plugin-word-counter__stat' }, `字符 ${characterCount.value}`),
        props.config.showWords === false ? null : h('span', { class: 'plugin-word-counter__stat' }, `单词 ${wordCount.value}`),
        h('span', { class: 'plugin-word-counter__stat' }, `行数 ${lineCount.value}`)
      ]),
      h('section', { class: 'plugin-word-counter__actions' }, [
        h('button', { class: 'plugin-word-counter__button plugin-word-counter__button--primary', type: 'button', onClick: copyCurrentText }, '复制'),
        h('button', { class: 'plugin-word-counter__button', type: 'button', onClick: saveDraft }, '保存草稿'),
        h('button', { class: 'plugin-word-counter__button', type: 'button', onClick: restoreDraft }, '恢复草稿'),
        h('button', { class: 'plugin-word-counter__button', type: 'button', onClick: showStatisticsNotification }, '发送通知'),
        h('span', { class: 'plugin-word-counter__status', role: 'status' }, status.value)
      ])
    ])
  }
})
