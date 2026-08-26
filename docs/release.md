# 上传、审核与发布

## 一键上传

```bash
node scripts/create-plugin.mjs my_tool --name "我的工具"
node scripts/publish-plugin.mjs server/public/plugins/my_tool \
  --api http://localhost:3000 \
  --username dev1 \
  --password secret \
  --submit
```

上传脚本会读取 `manifest.json`，登录开发者账号，上传包；指定 `--submit` 时继续把版本送审。

## 状态流转

```text
draft ── submit ──> submitted ── 管理员 publish ──> published
  ↑                      │
  └────── 新版本上传 <── reject
```

发布后的版本目录不可覆盖。修改任意代码、清单或静态资源都必须递增 `manifest.version`，重新上传并送审。旧的已发布版本在新版本发布前仍保持可见。

## 手动 HTTP API

开发者接口需要 JWT：先调用登录接口获得 token，再携带 `Authorization: Bearer <token>`。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/store/plugins?keyword=&category=&sort=` | 公开商店目录 |
| `GET` | `/api/store/plugins/:code` | 公开插件详情 |
| `POST` | `/api/store/plugins/:code/download` | 上报下载计数 |
| `GET` | `/api/dev/plugins` | 当前开发者的提交 |
| `POST` | `/api/dev/plugins` | 创建/更新元数据草稿 |
| `POST` | `/api/dev/plugins/:code/package` | 上传插件包 |
| `POST` | `/api/dev/plugins/:code/submit` | 送审 |
| `DELETE` | `/api/dev/plugins/:code` | 删除插件记录和包 |

上传包载荷：

```json
{
  "files": [
    { "path": "manifest.json", "content": "{...}" },
    { "path": "index.js", "content": "..." },
    { "path": "assets/logo.png", "content": "<base64>", "encoding": "base64" }
  ]
}
```

包内必须存在 `manifest.json`，其 `code` 必须与 URL 中的 `:code` 一致，`entry` 必须指向上传文件。也可以登记自托管 `entryUrl`，但生产环境应使用 HTTPS 并正确配置 CORS。

## 审核基线

- 清单描述、功能和截图一致。
- `permissions` 与代码实际访问剪贴板或网络的行为一致。
- 不使用混淆代码、任意远程脚本执行器或未说明的数据采集。
- 剪贴板规则的正则可编译、匹配范围克制，不造成灾难性回溯。
- 发布包遵守文件数量、大小、路径深度和扩展名限制。
