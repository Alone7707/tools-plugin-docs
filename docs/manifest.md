# Manifest 规范

## 必填字段

| 字段 | 规则 |
| --- | --- |
| `code` | 2-50 位 snake_case，小写字母开头；全商店唯一，发布后不可修改 |
| `name` | 1-50 个字符 |
| `version` | 三段式 semver，例如 `1.0.0` |
| `description` | 1-500 个字符 |
| `author` | 1-50 个字符 |
| `entry` | 包内 `.js` / `.mjs` 相对路径，必须真实存在 |
| `runtime` | 固定为 `vue` |
| `category` | `开发工具`、`效率办公`、`媒体处理`、`系统工具` 四选一 |

## 可选字段

| 字段 | 规则 |
| --- | --- |
| `keywords` | 最多 10 项，单项最多 30 字符，用于搜索 |
| `tags` | 最多 10 项，单项最多 30 字符，用于展示 |
| `icon` | 最多 8 字符的字符/emoji，或最多 300 字符的 http(s) URL |
| `permissions` | 只能使用 `clipboard:read`、`clipboard:write`、`network:fetch`、`file:dialog` |
| `features` | 最多 12 个功能点，每项可声明 `code` 和 `cmds` |
| `clipboardRules` | 最多 8 条剪贴板识别规则 |
| `config` | 最多 20 个键，值只能是字符串、数字或布尔值 |
| `homepage` | http(s) 主页或仓库地址 |
| `screenshots` | 最多 6 张图片，支持包内路径、站内路径或外链 |
| `changelog` | 最多 30 条版本记录，按新版本到旧版本排列 |

## 功能触发

```json
{
  "features": [
    { "name": "JSON 美化", "description": "格式化 JSON", "code": "pretty", "cmds": ["json"] },
    { "name": "颜色转换", "description": "识别十六进制颜色", "code": "color", "cmds": [{ "type": "regex", "match": "^#[0-9a-f]{6}$", "flags": "i" }] },
    { "name": "长文本", "description": "处理长文本", "code": "long", "cmds": [{ "type": "over", "minLength": 20 }] },
    { "name": "图片处理", "description": "处理剪贴板图片", "code": "image", "cmds": [{ "type": "img" }] }
  ]
}
```

命中后 `enterAction.type` 分别为 `text`、`regex`、`over`、`img`，主入口打开时为 `open`。`payload` 是命中文本或图片 data URL。

## 剪贴板规则

`clipboardRules` 用于全局快捷键唤出时识别剪贴板内容。支持 `json`、`regex`、`url`、`timestamp`、`color`、`image`。正则必须可编译且范围克制，避免灾难性回溯和抢占其他插件。
