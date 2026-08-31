# ToolZen Electron 插件文档

基于 Rspress 的 ToolZen 第三方插件开发文档站点。该目录已从桌面端仓库独立，可以单独安装依赖、启动和构建。

```bash
# 在 C:/Work/tools-plugin-docs 目录执行
pnpm install
pnpm dev # http://localhost:3001
pnpm build
pnpm preview
```

站点内容位于 `docs/`，线上 API 基地址为 [https://toolzen.top](https://toolzen.top)，插件后台为 [https://toolzen.top/admin](https://toolzen.top/admin)。

本地调试由 ToolZen 客户端动态托管；发布前必须执行 `pnpm build`，后台只上传构建后的 `dist` 目录。

## 页面范围

- `example.md`：1. 下载插件模板。
- `getting-started.md`：2. 开发。
- `manifest.md`：插件 `manifest.json` 全字段参考。
- `select-plugin.md`：3. 选择插件。
- `debugging.md`：4. 调试。
- `build-plugin.md`：5. 构建插件包。
- `release.md`：6. 到开发者后台上传插件。
- `api/plugin-api.md`：API 分类总览。
- `api/events.md`、`window.md`、`copy.md`、`input.md`：事件、窗口、复制和输入 API。
- `api/system.md`、`screen.md`、`user.md`：系统、屏幕和用户 API。
- `api/db.md`、`features.md`：数据存储和动态指令 API。

文档中的接口以 ToolZen 当前客户端实现为快照；发生 API 变更时，应同步更新 API 参考页面。
"# tools-plugin-docs" 
