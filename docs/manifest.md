# manifest.json 字段参考

`manifest.json` 是插件包根目录中的清单文件。它同时用于插件身份识别、商店展示、入口加载、权限声明、搜索触发和版本更新记录。

上传时，服务端会读取并校验清单；校验失败会一次性返回全部问题。字段名区分大小写，必须使用下面的驼峰写法，例如 `clipboardRules`，不能写成 `clipboard_rules`。

## 完整示例

下面示例包含当前支持的全部可声明字段：

```json
{
  "code": "word_counter",
  "name": "字数统计",
  "version": "1.0.0",
  "description": "统计文本的字符数、词数和行数",
  "author": "Developer",
  "entry": "index.js",
  "runtime": "vue",
  "category": "效率办公",
  "icon": "🔢",
  "keywords": ["count", "word", "字数"],
  "tags": ["文本", "效率"],
  "permissions": ["clipboard:write"],
  "features": [
    {
      "name": "字数统计",
      "description": "统计字符、词和行",
      "code": "count",
      "cmds": ["字数", "count", { "type": "over", "minLength": 1, "maxLength": 5000 }]
    }
  ],
  "clipboardRules": [
    {
      "name": "长文本",
      "pattern": "长度在 1 到 5000 个字符之间",
      "example": "一段需要统计的文本",
      "action": "打开字数统计",
      "matchType": "regex",
      "regex": "^[\\s\\S]{1,5000}$",
      "regexFlags": ""
    }
  ],
  "config": {
    "trimWhitespace": true,
    "defaultMode": "all"
  },
  "homepage": "https://github.com/example/word-counter",
  "screenshots": ["assets/screenshot.png"],
  "changelog": [
    { "version": "1.0.0", "date": "2026-08-28", "notes": "首个版本" }
  ]
}
```

必须提供的字段为 `code`、`name`、`version`、`description` 和 `author`。`entry`、`runtime`、`category` 虽然包含在模板中，但服务端分别默认为 `index.js`、`vue`、`开发工具`；建议始终显式填写，避免清单含义不清。其余字段可以省略；省略时按各字段说明中的默认值处理。

## 顶层字段

| 字段 | 类型 | 必填 | 默认值 | 说明与限制 |
| --- | --- | :---: | --- | --- |
| `code` | `string` | 是 | — | 插件唯一编码。必须是 2–50 位、以小写字母开头的 `snake_case`，匹配 `/^[a-z][a-z0-9_]{1,49}$/`。发布后不可修改，且不能与其他插件重复。 |
| `name` | `string` | 是 | — | 插件显示名称，1–50 个字符。用于商店卡片、标题栏和搜索结果。 |
| `version` | `string` | 是 | — | 三段式版本号，如 `1.0.0`。已发布版本不可覆盖；代码、资源或清单发生变化时必须递增版本号。 |
| `description` | `string` | 是 | — | 插件简介，1–500 个字符。应说明主要用途，不要放 HTML 或脚本。 |
| `author` | `string` | 是 | — | 作者或组织名称，1–50 个字符。 |
| `entry` | `string` | 否 | `index.js` | 构建包内的入口文件相对路径，只允许 `.js` 或 `.mjs`，不能包含 `..` 或绝对路径；该文件必须实际存在于上传包中。 |
| `runtime` | `string` | 否 | `vue` | 当前仅支持 `"vue"`。插件使用 Vue 3 组件运行，Vue 由宿主提供，不要重复打包。 |
| `category` | `string` | 否 | `开发工具` | 商店分类，只能是 `开发工具`、`效率办公`、`媒体处理`、`系统工具` 之一。 |
| `icon` | `string` | 否 | `◆` | 字符或 emoji 图标最多 8 个字符；也可以填写最多 300 个字符的 `http(s)` 图片地址。 |
| `keywords` | `string[]` | 否 | `[]` | 搜索关键词，最多 10 项，每项最多 30 个字符。建议包含中英文同义词。 |
| `tags` | `string[]` | 否 | `[]` | 商店详情页展示标签，最多 10 项，每项最多 30 个字符。 |
| `permissions` | `string[]` | 否 | `[]` | 插件需要的受控能力，必须使用权限白名单：`clipboard:read`、`clipboard:write`、`network:fetch`、`file:dialog`。详见[权限与能力矩阵](/permissions)。 |
| `features` | `Feature[]` | 否 | `[]` | 插件功能点及其主搜索触发方式，最多 12 项。字段见下文。 |
| `clipboardRules` | `ClipboardRule[]` | 否 | `[]` | 全局快捷键唤出时的剪贴板识别规则，最多 8 条。字段见下文。 |
| `config` | `object` | 否 | `{}` | 插件默认配置。最多 20 个键，值只能是 `string`、`number` 或 `boolean`；运行时通过 `config` prop 读取。 |
| `homepage` | `string` | 否 | — | 插件主页、文档或代码仓库地址，必须是 `http://` 或 `https://`，最多 300 个字符。 |
| `screenshots` | `string[]` | 否 | `[]` | 商店详情页截图，最多 6 张，每项最多 500 个字符。支持包内相对图片路径、以 `/` 开头的站内路径或 `http(s)` 外链。 |
| `changelog` | `ChangelogEntry[]` | 否 | `[]` | 版本更新记录，最多 30 条，按新版本到旧版本排列。字段见下文。 |

### `entry` 与构建目录

`entry` 是上传产物中的路径，不是源码入口。标准 Vue + Vite 模板通常使用：

```text
src/main.js  →  pnpm build  →  dist/index.js
```

因此清单一般写 `"entry": "index.js"`，上传或调试时选择包含 `manifest.json` 和 `index.js` 的 `dist` 目录。

### `icon` 的两种写法

```json
{
  "icon": "🧩"
}
```

```json
{
  "icon": "https://example.com/assets/icon.png"
}
```

外链图标必须可被客户端直接访问。包内相对图片路径不作为 `icon` 的清单图标格式；需要随包提供图片时，请放入 `screenshots` 或使用字符/外链图标。

## `features` 功能点

`features` 描述插件能做什么，并可声明主搜索框的触发指令。每个功能对象包含以下字段：

| 字段 | 类型 | 必填 | 限制 | 作用 |
| --- | --- | :---: | --- | --- |
| `name` | `string` | 是 | 1–30 个字符 | 功能名称，显示在商店详情和搜索结果中。 |
| `description` | `string` | 否 | 最多 100 个字符 | 功能说明。 |
| `code` | `string` | 否 | 1–30 位，字母开头，可含字母、数字、`_`、`-` | 功能编码。命中后通过 `enterAction.code` 传给插件；省略时使用 `main`。 |
| `cmds` | `FeatureCmd[]` | 否 | 最多 12 条 | 主搜索触发指令。可以混合字符串和对象指令。 |

### `features[].cmds` 指令类型

| 写法 | 字段 | 匹配行为 | 进入动作类型 |
| --- | --- | --- | --- |
| 字符串 | `"json"` | 搜索输入与关键词匹配 | `text` |
| 正则 | `{ "type": "regex", "match": "^#[0-9a-f]{6}$", "flags": "i" }` | 搜索输入整体匹配正则；`match` 最多 300 个字符且必须可编译 | `regex` |
| 长文本 | `{ "type": "over", "minLength": 20, "maxLength": 5000 }` | 输入长度在区间内；两个边界都可省略，默认最小 1、最大 10000 | `over` |
| 图片 | `{ "type": "img" }` | 搜索框出现剪贴板或粘贴图片候选 | `img` |

字符串指令最多 30 个字符。`over` 的 `minLength`、`maxLength` 会转为正整数；不填或不是正数时使用运行时默认边界。主入口直接打开插件时，`enterAction.type` 为 `open`。

```json
{
  "features": [
    {
      "name": "JSON 美化",
      "description": "缩进格式化 JSON",
      "code": "pretty",
      "cmds": [
        "json",
        "格式化",
        { "type": "regex", "match": "^[\\[{]", "flags": "" }
      ]
    },
    {
      "name": "图片处理",
      "description": "处理剪贴板图片",
      "code": "image",
      "cmds": [{ "type": "img" }]
    }
  ]
}
```

插件通过 `api.getEnterAction()` 或 `api.onPluginEnter()` 读取进入动作。动作中的 `payload` 是命中的文本，图片指令时通常是图片 data URL。

## `clipboardRules` 剪贴板规则

当用户通过全局快捷键唤出客户端时，宿主会检查剪贴板内容。命中规则后，内容会被填入搜索框并显示插件入口。每条规则包含：

| 字段 | 类型 | 必填 | 限制 | 作用 |
| --- | --- | :---: | --- | --- |
| `name` | `string` | 否 | 最多 30 个字符，默认 `规则` | 规则名称。 |
| `pattern` | `string` | 否 | 最多 200 个字符 | 面向用户的匹配条件说明。 |
| `example` | `string` | 否 | 最多 200 个字符 | 商店详情中展示的示例。 |
| `action` | `string` | 否 | 最多 200 个字符 | 命中后执行的动作说明。 |
| `matchType` | `string` | 否 | `json` / `regex` / `url` / `timestamp` / `color` / `image` | 剪贴板匹配类型。 |
| `regex` | `string` | 条件必填 | `matchType` 为 `regex` 时必填，最多 300 个字符且必须可编译 | 自定义正则表达式。 |
| `regexFlags` | `string` | 否 | JavaScript 正则标志；未填写时使用 `i` | 自定义正则标志。 |

内置匹配类型如下：

| `matchType` | 判断规则 |
| --- | --- |
| `json` | 内容以 `{` 或 `[` 开头，并且可以解析为 JSON 对象或数组。 |
| `regex` | 使用 `regex` 和 `regexFlags` 匹配完整文本。 |
| `url` | 完整的 `http://` 或 `https://` URL。 |
| `timestamp` | 10 位或 13 位数字时间戳。 |
| `color` | `#RGB`、`#RRGGBB`、`#RRGGBBAA`，或 `rgb(a)` / `hsl(a)` 颜色值。 |
| `image` | `data:image/…` 图片 data URL。 |

正则应尽量短小、范围明确，避免灾难性回溯或匹配所有文本，防止抢占其他插件的剪贴板入口。

```json
{
  "clipboardRules": [
    {
      "name": "颜色值",
      "pattern": "HEX、RGB 或 HSL 颜色",
      "example": "#2f81f7",
      "action": "打开取色器",
      "matchType": "color"
    },
    {
      "name": "URL",
      "pattern": "完整 HTTP(S) 地址",
      "example": "https://toolzen.top",
      "action": "打开链接工具",
      "matchType": "url"
    }
  ]
}
```

## `config` 默认配置

`config` 是静态默认值对象，不是任意 JSON 数据。键名由插件自行定义，最多 20 个；值只能是字符串、数字或布尔值，不能放数组、对象、`null` 或函数。

```json
{
  "config": {
    "theme": "auto",
    "maxItems": 20,
    "showTips": true
  }
}
```

组件中通过 `config` prop 读取。用户在客户端修改后的配置会覆盖同名默认值；新增配置项或修改默认值后，应递增 `version` 并重新构建上传。

## `homepage` 与 `screenshots`

`homepage` 会在商店详情中显示为主页链接。它只能是 `http(s)` 地址。

`screenshots` 支持三种地址：

```json
{
  "screenshots": [
    "assets/main.png",
    "/store-assets/word-counter/intro.webp",
    "https://example.com/screenshots/settings.png"
  ]
}
```

- 包内相对路径必须指向上传包中真实存在的图片文件。
- 上传后，包内路径会自动转换为 `/store-packages/<code>/<version>/...` 形式的站内地址。
- 图片扩展名须在插件包白名单内，例如 `.png`、`.jpg`、`.jpeg`、`.webp`、`.gif`、`.svg`。
- 每个地址最多 500 个字符，最多 6 张图。

## `changelog` 更新记录

每条记录包含以下字段：

| 字段 | 类型 | 必填 | 限制 | 作用 |
| --- | --- | :---: | --- | --- |
| `version` | `string` | 是 | 三段式版本号，如 `1.2.0` | 对应本次更新的插件版本。 |
| `date` | `string` | 否 | 最多 30 个字符 | 更新日期或日期时间，仅用于展示，不强制固定格式。 |
| `notes` | `string` | 是 | 最多 500 个字符 | 面向用户的更新内容。 |

记录应按新版本到旧版本排列，并在每次发布新版本时新增一条：

```json
{
  "changelog": [
    { "version": "1.1.0", "date": "2026-08-28", "notes": "新增批量处理和快捷指令" },
    { "version": "1.0.0", "date": "2026-08-01", "notes": "首个版本" }
  ]
}
```

## 不是 `manifest.json` 的字段

以下字段会出现在商店接口返回或客户端内部数据中，但不能写入插件清单来控制：

| 字段 | 来源 | 说明 |
| --- | --- | --- |
| `rating`、`ratingCount` | 服务端 | 用户评分及评分人数。 |
| `downloadCount`、`downloads` | 服务端 | 数值下载量及格式化后的展示值。 |
| `updatedAt`、`publishedAt` | 服务端 | 上传和首次发布时间。 |
| `builtin`、`official`、`featured` | 平台 | 内置、官方和推荐标记，由平台维护。 |
| `entryUrl`、`publishedEntryUrl` | 服务端 | 上传或发布后生成的远程入口地址。 |
| `status`、`publishedVersion`、`reviewNote` | 服务端 | 草稿、送审、发布、驳回及审核信息。 |
| `tone`、`packageHint` | 客户端/服务端展示 | 商店卡片主题和包来源提示，不属于上传包 manifest 的公开字段。 |

不要把这些字段当作插件配置写入 `manifest.json`；它们会被忽略、覆盖或由服务端拒绝。

## 发布前检查

- `manifest.json` 位于构建后 `dist` 根目录。
- `entry` 指向 `dist` 内真实存在的 `.js` 或 `.mjs` 文件。
- `code` 没有复用其他插件，`version` 已递增。
- `permissions` 与实际调用的能力一致。
- `features` 和 `clipboardRules` 的正则可以编译，且匹配范围克制。
- `screenshots` 的包内路径真实存在，`changelog` 已补充本版本更新内容。
- 上传整个 `dist` 目录，不上传源码目录、`node_modules` 或旧的构建产物。

相关页面：[动态指令](/api/features)、[权限与能力矩阵](/permissions)、[构建插件包](/build-plugin)、[到开发者后台上传插件](/release)。
