# 权限与能力矩阵

权限写在 `manifest.json` 的 `permissions` 数组中，并展示给用户。声明应与插件实际行为一致；未声明的能力不能通过绕过 `api` 或动态脚本加载来获得。

## 权限清单

| 权限 | 允许的行为 | 推荐接口 | 风险提示 |
| --- | --- | --- | --- |
| `clipboard:read` | 读取剪贴板内容或声明剪贴板识别规则 | `api.readClipboardText()`、`api.readClipboardImage()`、`initialText` / `enterAction` | 只处理插件必要的数据，不要长期保存 |
| `clipboard:write` | 将结果写入系统剪贴板或清空剪贴板 | `api.copyText(text)`、`api.copyClipboardImage(dataUrl)`、`api.clearClipboard()` | 不要覆盖用户剪贴板而不提示 |
| `network:fetch` | 通过浏览器 `fetch` 请求网络 | 标准 `fetch` | 目标服务必须支持 CORS，应披露数据去向 |
| `file:dialog` | 打开系统文件选择或保存对话框 | `api.showOpenDialog()`、`api.showSaveDialog()` | 只读取用户主动选择的路径；宿主不替插件读写文件 |

## 能力分层

| 层级 | 入口 | 第三方插件是否依赖 |
| --- | --- | --- |
| 稳定插件 API | 组件 `api` prop | 是，推荐 |
| 浏览器标准能力 | DOM、`fetch`、`localStorage`、`window.Vue` | 可用，遵守权限和兼容性；源码由 Vite 编译后运行 |
| Electron preload bridge | `window.toolzen` | 仅使用本文明确标为公开的能力；默认不依赖 |
| 主进程 IPC | `ipcRenderer.invoke/send` 对应通道 | 禁止 |

## 审核关注点

- 权限声明与实现行为是否匹配。
- 网络请求是否指向插件说明中披露的服务。
- 是否存在混淆代码、远程脚本执行器或隐藏的数据采集。
- 剪贴板识别正则是否可编译、范围是否克制。
- 通知、复制和外链操作是否给用户明确反馈。
