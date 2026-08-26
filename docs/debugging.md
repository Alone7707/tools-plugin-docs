# 本地调试

## 推荐目录与入口

将插件目录放入：

```text
server/public/plugins/my-plugin/
├── manifest.json
└── index.js
```

启动后端和桌面端：

```bash
pnpm dev:server
pnpm dev
```

开发者专区登记目录后，桌面端会启动静态插件服务并生成 `entryUrl`。在开发模式下入口会附加时间戳查询参数，修改 `index.js` 后点击“重新加载”即可看到最新代码。

## 调试检查表

- 使用桌面端 DevTools 控制台查看插件与宿主同一渲染进程中的日志。
- 首先检查 `window.Vue` 是否存在，再检查入口是否导出了 Vue 组件。
- 加载超时通常表示后端未启动、入口 URL 不可达或 CORS 配置错误。
- `api` 为空属于受支持场景，浏览器预览应提供标准 Web API 兜底。
- 进入动作变化时检查 `enterAction` prop 和 `api.onPluginEnter` 是否同步处理。
- 热重载时确认取消函数已执行，避免旧监听器重复响应。

## 常见错误

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| `window.Vue` 未找到 | 直接在浏览器打开，或插件把 Vue 打包方式写错 | 从宿主加载；改为 `window.Vue` |
| 入口规范错误 | 缺少 `export default` 或导出对象不是组件 | 导出 Vue 组件 |
| 点击复制失败 | 使用了 `navigator.clipboard` 且窗口失焦 | 优先 `api.copyText` |
| 改代码但页面不变 | 生产模式命中版本缓存 | 调试时重新加载；发布时递增 `version` |
| 标题栏按钮失效 | 插件自绘标题栏或声明 `-webkit-app-region: drag` | 删除自绘标题栏和拖动 CSS |

## 参考实现

- `plugin-example/index.js`：包含进入动作、隔离存储、通知、复制、副标题和分离载荷。
- `plugins/_template/index.js`：最小远程 Vue 插件模板。
- `server/public/plugins/demo-json-toolbox/`：多文件与剪贴板规则示例。
- `server/public/plugins/demo-color-picker/`：打开即执行、完成后退出的工具示例。
