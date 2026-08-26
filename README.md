# AToolBox Electron 插件文档

基于 Rspress 的 AToolBox 第三方插件开发文档站点。该目录已从桌面端仓库独立，可以单独安装依赖、启动和构建。

```bash
# 在 C:/Work/tools-plugin-docs 目录执行
pnpm install
pnpm dev # http://localhost:3001
pnpm build
pnpm preview
```

站点内容位于 `docs/`，线上 API 基地址为 [https://tools.770733914.xyz](https://tools.770733914.xyz)，插件后台为 [https://tools.770733914.xyz/admin](https://tools.770733914.xyz/admin)。

本地调试由 AToolBox 客户端动态托管；线上发布和后台接口使用 `https://tools.770733914.xyz`。

## 页面范围

- `example.md`：1. 下载插件模板。
- `getting-started.md`：2. 开发。
- `select-plugin.md`：3. 选择插件。
- `debugging.md`：4. 调试。
- `release.md`：5. 到开发者后台上传插件。
- `api/plugin-api.md`：API 分类总览。
- `api/events.md`、`window.md`、`copy.md`、`input.md`：事件、窗口、复制和输入 API。
- `api/system.md`、`screen.md`、`user.md`：系统、屏幕和用户 API。
- `api/db.md`、`features.md`：数据存储和动态指令 API。
- `api/types.md`、`contracts.md`：类型提示、事件结构和错误行为。
- `runtime.md`、`manifest.md`、`permissions.md`、`compatibility.md`：开发参考。

文档中的接口以 AToolBox 当前客户端实现为快照；发生 API 变更时，应同步更新开放 API 和兼容性页面。
"# tools-plugin-docs" 
