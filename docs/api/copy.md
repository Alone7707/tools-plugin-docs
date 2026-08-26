# 复制

AToolBox 当前开放文本复制能力。复制文件和图片不属于第三方插件稳定 API。

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
