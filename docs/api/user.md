# 用户

AToolBox 不向第三方插件开放用户账号、令牌或个人资料 API。插件只能读取当前插件自身的稳定编码。

## pluginCode

当前插件的 `manifest.code`，由宿主绑定，并用于插件身份和存储空间隔离。

```ts
api.pluginCode: string
```

```js
const pluginCode = api ? api.pluginCode : ''
```

插件不能修改 `pluginCode`，也不能通过窗口或跳转 API 冒充其他插件。

## getPluginInfo

读取当前插件身份和运行类型。

```ts
type PluginInfo = {
  code: string
  name: string
  version: string
  type: 'builtin' | 'local' | 'remote'
}

api.getPluginInfo(): PluginInfo
```

## getPluginConfig

读取安装时保存的插件配置副本。返回新对象，修改返回值不会写回宿主配置。

```ts
api.getPluginConfig<T extends Record<string, unknown>>(): T
```

配置默认值来自 `manifest.config`，用户在客户端修改后的值会覆盖默认值。

需要用户配置时，应使用插件自己的界面，并存入隔离的 [数据存储](/api/db)。不要要求或保存 AToolBox 账号密码、访问令牌等敏感信息。
