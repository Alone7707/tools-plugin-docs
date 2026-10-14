# 复制

ToolZen 提供文本和图片剪贴板能力。图片使用 Data URL，所有读写能力都必须在 Manifest 中声明对应权限。

## copyText

通过宿主把文本写入系统剪贴板。窗口失焦时也比浏览器剪贴板接口更可靠。

```ts
api.copyText(text: string): Promise<boolean>
```

使用前在 `manifest.json` 声明：

```json
{
  "permissions": ["clipboard:write"]
}
```

```js
const copied = api && api.copyText
  ? await api.copyText(text.value)
  : false

if (copied && api.showNotification) {
  await api.showNotification('已复制', '文本工作台')
}
```

空字符串会返回 `false`。复制完成后应向用户提供明确反馈。

## readClipboardText

读取系统剪贴板纯文本。未声明 `clipboard:read` 或没有文本时返回空字符串。

```ts
api.readClipboardText(): Promise<string>
```

## readClipboardImage

读取系统剪贴板图片并返回 `data:image/...;base64,...`。未声明 `clipboard:read` 或没有图片时返回空字符串。

```ts
api.readClipboardImage(): Promise<string>
```

## clearClipboard

清空系统剪贴板，会覆盖用户当前剪贴板内容。需要 `clipboard:write`，成功返回 `true`。

```ts
api.clearClipboard(): Promise<boolean>
```

## copyClipboardImage

将图片 Data URL 写入系统剪贴板，需要 `clipboard:write`。非图片 Data URL 或无效图片返回 `false`。

```ts
api.copyClipboardImage(dataUrl: string): Promise<boolean>
```

```js
const ok = await api.copyClipboardImage(canvas.toDataURL('image/png'))
```

## copyFile

把一组文件或文件夹的路径写入剪贴板，让用户粘到别的应用里。需要 **`clipboard:write-files`**。

```ts
api.copyFile(paths: string[]): Promise<boolean>
```

```js
const ok = await api.copyFile(['D:\\报告\\a.xlsx', 'D:\\报告\\b.xlsx'])
if (ok) api.toast('已复制，去目标文件夹粘贴即可')
```

- **与 `copyText` 是两项不同的权限**：`clipboard:write` 是「写文本」，`clipboard:write-files` 是「写文件」。用户粘到资源管理器或邮件附件区时，会**真的产生文件副本**——这是两项能力，不是一个。
- 只受理**存在且不重复的绝对路径**；一条有效的都没有时回 `false`，**并且不会动用户当前的剪贴板**（不会用空内容覆盖掉他原来的东西）。
- 与 `copyText` 一样是**延迟语义**：这一步只是把路径放进剪贴板，真正落盘发生在用户粘贴时，由目标应用决定怎么处理（复制、移动还是建快捷方式）。
- 反过来读剪贴板里的文件用 `api.readClipboardFiles()`（需要 `clipboard:read`）。
