# AToolBox Electron 插件文档

基于 Rspress 的 AToolBox 第三方插件开发文档站点。该目录已从桌面端仓库独立，可以单独安装依赖、启动和构建。

```bash
# 在 C:/Work/tools-plugin-docs 目录执行
pnpm install
pnpm dev
pnpm build
pnpm preview
```

站点内容位于 `docs/`，Electron bridge 全量接口索引位于 `docs/api/electron-bridge.md`。

## 内容边界

- `api/plugin-api.md`：第三方插件应依赖的稳定 API。
- `api/electron-bridge.md`：preload 当前暴露的完整 `window.atoolbox` 清单，包含内部窗口协议。
- `reference.md`、`permissions.md`、`compatibility.md`：规范、权限和版本兼容参考。

文档中的接口以 AToolBox 当前客户端实现为快照；发生 API 变更时，应同步更新 bridge 清单、受控 API 和兼容性页面。
"# tools-plugin-docs" 
