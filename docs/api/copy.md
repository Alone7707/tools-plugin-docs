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
