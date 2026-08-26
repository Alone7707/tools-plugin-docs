# AToolBox 插件开发示例

一个可以直接跑起来的插件模板，配合客户端「个人中心 → 开发者专区 → 本地插件调试」使用。
复制这个目录、改掉 `manifest.json` 里的 `code` 和 `name`，就是你自己的插件起点。

## 快速开始

1. 打开客户端 → 头像 → **开发者专区**（会另开一个独立窗口，不会随主窗体失焦隐藏）。
2. 把本目录从资源管理器**拖进这个窗口**（拖目录，或拖目录下的 `manifest.json` 都行）；
   也可以点 **选择插件目录**，选中本目录（必须是含 `manifest.json` 的那一层）。
3. 登记成功后，面板上会显示本地动态托管端口，列表里出现这条插件。
4. 点 **打开调试**：主窗体会被唤出来并在里面打开这个插件（主窗体失焦即隐藏，切回编辑器它就收起来了，再点一次即可唤回）；也可以回到主搜索框输入 `示例` / `example` 打开它。
5. 改完 `index.js`，回开发者专区点 **重新加载**，再打开就是新代码。

## 目录结构

```text
plugin-example/
  manifest.json    # 插件清单，必需
  index.js         # ESM 入口，default 导出 Vue 组件，必需
  README.md        # 可选
```

要拆多个文件时，在入口里用相对路径 `import('./helper.mjs')`，静态服务会按本目录解析。
可托管的扩展名：`.js` `.mjs` `.json` `.css` `.html` `.svg` `.png` `.jpg` `.jpeg` `.gif` `.webp` `.ico` `.woff` `.woff2` `.txt` `.md`。

## 三条硬约束

1. **入口是原生 ESM，不能有任何 TypeScript 语法。** 宿主用 `import()` 直接加载 `index.js`，
   中间没有任何转译步骤。一个 `function f(): void` 就会让整个插件以 `SyntaxError` 加载失败。
2. **Vue 运行时从 `window.Vue` 取，不要自己打包 Vue。** 宿主和插件必须共用同一个运行时实例。
3. **不能用 Node / Electron API。** 这里是纯浏览器环境，没有 `require`、没有 `fs`。

## manifest.json 字段

本地调试与上传商店读的字段范围**不一样**。下表是本地调试时的实际情况：

| 字段 | 本地调试 | 说明 |
|------|:--------:|------|
| `code` | ✅ | 必须匹配 `^[a-z][a-z0-9_]{1,49}$`，且不能撞内置/官方插件的编码 |
| `name` | ✅ | 列表与启动器磁贴上的显示名 |
| `entry` | ✅ | 必须是包内存在的 `.js` / `.mjs`，缺省 `index.js` |
| `version` | ✅ | 缺省 `1.0.0` |
| `description` | ✅ | 参与主搜索匹配 |
| `keywords` | ✅ | **本地调试唯一的搜索触发方式**，缺省为 `[code]` |
| `icon` | ✅ | ≤ 8 字符的字符/emoji，或 http(s) 图片地址 |
| `permissions` | ✅ | 登记后可在面板查看；运行时暂不强制拦截 |
| `config` | ⚠️ | 只在**首次登记**时写入，见下方「调试期的已知行为」 |
| `author` | ❌ | 本地调试一律显示为 `Local Debug` |
| `features[].cmds` | ❌ | 本地调试不读 features，`cmds` 指令触发**不生效** |
| `clipboardRules` | ❌ | 本地调试不读，剪贴板自动识别**不生效** |
| `runtime` `category` `tags` `changelog` | ❌ | 本地调试不读，上传商店时才校验 |

标 ❌ 的字段模板里依然保留 —— 它们在上传商店后会生效，提前写好可以避免提交审核时被打回。
本地想验证 `cmds` 或剪贴板识别，只能走商店安装那条路径。

## 运行时契约

宿主传给组件的 props：

| prop | 类型 | 说明 |
|------|------|------|
| `config` | object | `manifest.config` 合并用户覆盖后的结果 |
| `initialText` | string | 打开时带入的文本，无则 `''` |
| `enterAction` | `{ code, type, payload }` | 本次进入动作。本地调试下 `code` 只会是 `main`，`type` 为 `open` 或 `text` |
| `api` | object \| null | 宿主 API，**可能为 null**，每次用都要判空 |

`api` 常用方法（完整列表见 [插件开发规格](../docs/plugin-spec.md) §3）：

| 方法 | 说明 |
|------|------|
| `copyText(text)` | 走主进程复制，主窗体失焦也能用；需声明 `clipboard:write` |
| `db.put/get/remove(key)` | JSON 文档存储，按插件 code 隔离在 `atoolbox-plugin-db:<code>:` 下 |
| `dbStorage.*` | 同上，localStorage 语义 |
| `showNotification(body, title?)` | 系统通知 |
| `onPluginEnter(cb)` / `onPluginOut(cb)` | 进入 / 退出回调，返回取消函数 |
| `setSubtitle(text)` | 写宿主标题栏上的副标题（当前功能名），≤ 40 字；传 `''` 清掉 |
| `setDetachPayload(fn)` | 注册「双击标题栏分离时带走什么」，返回 `{ title?, featureCode?, initialText?, width?, height? }`；传 `null` 取消 |
| `detachWindow(options?)` | 主动分离为独立窗口（顶栏双击已经能做这件事，一般不用自己调） |
| `isDetachedWindow()` | 当前是否已在独立窗口中 |
| `outPlugin()` | 主窗体内返回搜索页，独立窗口内关闭窗口 |
| `isDarkColors()` | 宿主当前是否深色主题 |
| `screenColorPick()` | 全屏取色，取消返回 `null` |
| `redirect(code, payload?)` | 跳到另一个已安装插件 |
| `shellOpenExternal(url)` | 系统浏览器打开 http(s) 链接 |

### 标题栏归宿主，插件别自绘

插件在主窗体里跑的时候，顶上那条 48px 的标题栏是宿主画的，和主窗体连成一片：

```text
┌────────────────────────────────────────────────┐
│ [icon] 插件开发示例 · 文本工作台   ← 返回启动器 │ ← 宿主的，插件一行代码都不用写
├────────────────────────────────────────────────┤
│                插件自己的界面                    │
└────────────────────────────────────────────────┘
```

插件图标、插件名、返回启动器、按住拖窗口、双击分离成独立窗口，全部由宿主负责。
插件能往那条顶栏里塞的只有两样东西，本模板的 `onMounted` 里都演示了：

```js
// 「·」右边那个当前功能名。
if (props.api && props.api.setSubtitle) props.api.setSubtitle('文本工作台')

// 用户双击顶栏分离时，宿主回头问这个函数「现在要带走什么」。
// 注册的是函数而不是值，所以取到的永远是此刻的内容；不注册就落回本次进入动作里的 payload。
if (props.api && props.api.setDetachPayload) {
  props.api.setDetachPayload(() => ({ initialText: text.value, width: 720, height: 560 }))
}
```

所以**不要**在插件里自己摆「返回启动器」/「分离为独立窗口」按钮，也**不要**声明
`-webkit-app-region: drag`：那片区域在 Windows 上会被系统当成原生标题栏，按下之后鼠标消息
不再进 DOM，里面的按钮点不动、文字划不动、双击也收不到——现在这些活全在宿主顶栏上，插件多画
一条只会得到两条标题栏。独立窗口里也一样：那边有外壳自己的标题栏。

## 调试期的已知行为

- **改完代码必须点「重新加载」。** 宿主按 URL 缓存 ESM 模块，「重新加载」会递增内部
  `revision` 并换掉入口地址上的 `?r=` 参数，这是让新代码生效的唯一途径。不点的话，
  哪怕文件已经改了，打开的仍是旧模块。
- **改 `manifest.json` 里的 `config` 默认值，「重新加载」不会生效。** 已登记插件的 `config`
  以现存值优先，需要**先「移除」再重新「选择插件目录」**才会重新读取。改其他字段
  （`name`、`entry`、`version`、`keywords` 等）点「重新加载」即可。
- **托管端口每次启动客户端都变**，入口地址由宿主现拼，不用管也不要写死。
- **目录被移动或删除后**，列表里会标「目录已丢失」，该插件不会挂进启动器；重新选目录即可恢复。
- **插件内的文字默认不可选中。** 宿主给整个界面设了 `user-select: none`，
  只有 `input` `textarea` `pre` `code` 例外。需要让某块内容可以划选复制，
  在自己的样式里显式写 `user-select: text`（本模板的进入动作卡片和统计条就是这么做的）。
- **样式请全部加 `plugin-` 前缀**，不要覆盖宿主全局样式。

## 发布到商店

本地调试通过后，打包上传到插件开发者后台送审。上传包的硬性限制（文件数、体积、路径深度）
和完整的清单校验规则见：

- [插件开发规格](../docs/plugin-spec.md) —— manifest 字段校验、运行时契约、权限白名单
- [插件开发指南](../docs/plugin-dev-guide.md) —— 从零开发到上架的完整流程
