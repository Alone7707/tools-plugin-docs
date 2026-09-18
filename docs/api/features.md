# 动态指令

ToolZen 的动态指令由 `manifest.json` 中的 `features[].cmds` 声明。插件运行时不提供修改指令的 API；需要调整指令时，修改 Manifest、递增版本并重新发布。

## 字符串指令

```json
{
  "features": [
    {
      "name": "JSON 美化",
      "description": "格式化 JSON 文本",
      "code": "pretty",
      "cmds": ["json", "格式化"]
    }
  ]
}
```

## 正则指令

```json
{
  "cmds": [
    { "type": "regex", "match": "^#[0-9a-f]{6}$", "flags": "i" }
  ]
}
```

## 长文本指令

```json
{
  "cmds": [
    { "type": "over", "minLength": 20, "maxLength": 5000 }
  ]
}
```

## 图片指令

```json
{
  "cmds": [
    { "type": "img" }
  ]
}
```

## 文件指令

```json
{
  "cmds": [
    { "type": "file" }
  ]
}
```

用户复制文件后唤出客户端时，声明了文件指令的插件会作为「快捷识别」候选出现。命中后 `enterAction.type` 为 `'file'`：`payload` 是绝对路径用 `\n` 连接的结果，绝对路径数组在 `enterAction.files` 中。`clipboardRules` 里的 `matchType: "file"` 是等效的另一种声明方式；插件也可以进入后主动调用 `api.readClipboardFiles()` 拉取路径。

## 读取命中结果

指令命中后，通过 `enterAction` 或 `onPluginEnter` 获取功能编码和载荷：

```js
const removeEnter = api && api.onPluginEnter
  ? api.onPluginEnter((action) => {
      if (action.code === 'pretty' && action.type !== 'img') {
        source.value = action.payload || ''
      }
    })
  : null
```

剪贴板自动识别规则使用 `clipboardRules`，配置写在插件的 `manifest.json` 中。
