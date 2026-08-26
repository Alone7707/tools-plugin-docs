# 系统

系统 API 用于发送通知和打开外部链接。

## showNotification

发送系统通知，标题缺省使用插件名称。

```ts
api.showNotification(body: string, title?: string): Promise<boolean>
```

```js
const shown = api && api.showNotification
  ? await api.showNotification('处理完成', '文本工作台')
  : false
```

通知应对应用户能够理解的操作结果，不要用于高频日志输出。

## shellOpenExternal

使用系统默认浏览器打开 HTTP(S) 链接。

```ts
api.shellOpenExternal(url: string): void
```

```js
if (api && api.shellOpenExternal) {
  api.shellOpenExternal('https://tools.770733914.xyz/')
}
```

宿主只接受 `http://` 和 `https://` 地址。通过 `fetch` 请求网络时，需要声明 `network:fetch` 权限并满足 CORS。
