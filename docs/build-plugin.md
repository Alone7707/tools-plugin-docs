# 5. 构建插件包

本地调试通过后，在插件工程根目录执行正式构建：

```bash
pnpm build
```

构建会清空旧的 `dist`，重新生成可上传的插件包：

```text
my_plugin/
└── dist/
    ├── manifest.json
    ├── README.md
    └── index.js
```

## 构建前检查

- 更新 `manifest.json` 中的 `version` 和 `changelog`。
- 确认 `manifest.entry` 为 `index.js`。
- 确认 `permissions` 只包含插件实际使用的能力。
- 保存全部 `.vue`、`.js`、清单和资源文件。

## 上传包范围

后台上传的插件包就是构建后的整个 `dist` 目录。不要上传插件工程根目录、`src`、`node_modules`，也不需要手动压缩成 ZIP。

构建完成后，进入[6. 到开发者后台上传插件](/release)。
