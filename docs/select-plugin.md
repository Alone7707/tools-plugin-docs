# 3. 选择插件

代码开发完成后，先运行 `pnpm dev` 或 `pnpm build` 生成 `dist`，再在 AToolBox 客户端选择该目录，让客户端登记本地插件并生成调试入口。

## 申请开发者资格

首次开发插件需要先在客户端打开「个人中心 → 申请插件开发者」，填写插件计划和联系方式，提交后等待管理员审核。申请通过后，侧栏入口会变为「开发者专区」。

![申请插件开发者](/images/developer-apply.png)

## 选择插件目录

打开「个人中心 → 开发者专区」，选择包含构建产物 `manifest.json` 的 `dist` 目录。也可以将 `dist` 目录或其中的 `manifest.json` 拖入窗口。

```text
my_plugin/
└── dist/
    ├── manifest.json
    └── index.js
```

选择的目录必须满足：

- `manifest.json` 位于所选 `dist` 目录根部。
- `manifest.entry` 指向 `dist` 内真实存在的 `.js` 或 `.mjs` 文件。
- 入口是原生 ESM，并默认导出 Vue 组件。
- 不依赖 Node.js、Electron 主进程或 `require`。

登记成功后，客户端会显示插件名称、编码、版本和本地托管状态。这里的本地入口仅供当前电脑调试，不要把本地地址写入发布清单。

## 进入下一步

插件登记成功后，进入[4. 调试](/debugging)，打开插件并验证修改后的代码。
