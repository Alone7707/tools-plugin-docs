# 动态指令

ToolZen 的搜索入口有两种来源：**静态声明**（`manifest.json` 里的 `features[].cmds`）与**运行期动态增删**（`api.setFeature()` / `api.getFeatures()` / `api.removeFeature()`，需要 `feature:dynamic` 权限，apiLevel 7 起）。

两种方式共用同一套 `Feature` 结构，宿主搜索时会同时看这两份。

## 什么时候用哪种

| | 静态声明 | 动态增删 |
| --- | --- | --- |
| 写在哪 | `manifest.json` | 运行期调 API |
| 适合 | 功能入口固定（「JSON 美化」「取色」） | 入口由用户配置决定（网页快开、自定义快捷方式） |
| 需要权限 | 不需要 | `feature:dynamic` |
| 用户可见性 | 安装时即在商店页展示 | 运行期出现，用户在启动器里能看到 |

**入口固定就用静态声明**——它会在商店详情页展示，用户装之前就知道有哪些功能。动态增删是给「装的时候还不知道有哪些入口」这类插件准备的。

## 运行期增删（`feature:dynamic`）

```js
// 新增或覆盖一条入口（同 code 即覆盖）
await api.setFeature({
  name: '打开内网 Wiki',
  description: '跳转到公司内部文档站',
  code: 'wiki',
  cmds: ['wiki', '内网文档']
})

// 列出本插件已登记的动态入口；传 codes 就只取这几条
const all = await api.getFeatures()
const some = await api.getFeatures(['wiki'])

// 移除一条
await api.removeFeature('wiki')
```

要点：

- **`code` 必填**（静态声明里可以省，动态入口不行）——它是 `removeFeature` 的唯一凭据，没有 code 就删不掉。
- **动态入口与静态入口分开存**：`manifest.json` 里的 `features` 在每次同步插件表时会被整体重写，动态入口是本地状态，不受影响。搜索时两份都会参与匹配。
- 单个插件最多 **50 条**动态入口。
- 入口名要**如实描述它打开什么**——它会出现在用户的启动器里，伪装成别的插件或系统功能是误导。

## 静态声明：字符串指令

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
