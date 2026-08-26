# AToolBox Electron 插件文档

基于 Rspress 的 AToolBox 第三方插件开发文档站点。该目录已从桌面端仓库独立，可以单独安装依赖、启动和构建。

```bash
# 在 C:/Work/tools-plugin-docs 目录执行
pnpm install
pnpm dev
pnpm build
pnpm preview
```

站点内容位于 `docs/`，线上 API 基地址为 [https://tools.770733914.xyz](https://tools.770733914.xyz)，插件后台为 [https://tools.770733914.xyz/admin](https://tools.770733914.xyz/admin)。

本地调试由 AToolBox 客户端动态托管；线上发布和后台接口使用 `https://tools.770733914.xyz`。

## 页面范围

- `example.md`：插件模板下载。
- `api/plugin-api.md`：开放 API。
- `getting-started.md`、`runtime.md`、`manifest.md`、`permissions.md`：开发教程。
- `debugging.md`、`compatibility.md`：调试教程。
- `release.md`：上传教程。

文档中的接口以 AToolBox 当前客户端实现为快照；发生 API 变更时，应同步更新开放 API 和兼容性页面。
"# tools-plugin-docs" 
