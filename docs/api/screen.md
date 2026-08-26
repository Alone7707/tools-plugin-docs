# 屏幕

AToolBox 当前向第三方插件开放全屏取色能力。

## screenColorPick

调起全屏取色器。用户完成取色后返回十六进制颜色，取消时返回 `null`。

```ts
api.screenColorPick(): Promise<{ hex: string } | null>
```

```js
const color = api && api.screenColorPick
  ? await api.screenColorPick()
  : null

if (color) {
  text.value = color.hex
}
```

返回示例：

```json
{
  "hex": "#1677ff"
}
```

屏幕截图、显示器列表和坐标转换当前不属于第三方插件稳定 API。
