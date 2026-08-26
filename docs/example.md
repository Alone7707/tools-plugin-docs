# 插件模板下载

下载并运行一个完整的 AToolBox 插件模板，再按开发教程修改。

## 下载文件

- [manifest.json](/examples/word-counter/manifest.json)
- [index.js](/examples/word-counter/index.js)

目录结构：

```text
word_counter/
├── manifest.json
└── index.js
```

## 示例覆盖的契约

| 能力 | 实现位置 |
| --- | --- |
| Vue 运行时 | 从 `window.Vue` 获取 |
| 初始内容 | `initialText` prop |
| 再次进入 | `api.onPluginEnter` |
| 隔离存储 | `api.db.put/get` |
| 系统剪贴板 | `api.copyText` |
| 系统通知 | `api.showNotification` |
| 深色模式 | `api.isDarkColors` |
| 标题栏副标题 | `api.setSubtitle` |
| 双击分离载荷 | `api.setDetachPayload` |
| 资源清理 | `onBeforeUnmount` 中取消监听和分离载荷 |

## 使用方式

1. 下载两个文件并放到同一目录。
2. 在 AToolBox 开发者专区登记该目录。
3. 修改 `index.js` 后点击“重新加载”。
4. 准备发布时修改 `code`、名称、作者信息，并递增 `version`。

示例只使用稳定插件 API，不依赖 `window.atoolbox` 内部窗口协议。
