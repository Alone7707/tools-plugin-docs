# 插件模板下载

这是与 AToolBox 完整项目同步的可运行插件模板，包含文本工作台、进入动作、剪贴板、隔离存储、系统通知、主题和宿主顶栏交互示例。

## 下载

- [下载插件模板 ZIP](/templates/plugin-example.zip)
- [manifest.json](/templates/plugin-example/manifest.json)
- [index.js](/templates/plugin-example/index.js)
- [README.md](/templates/plugin-example/README.md)

解压后目录结构如下：

```text
plugin-example/
├── manifest.json
├── index.js
└── README.md
```

## 使用

1. 解压 ZIP，并复制一份作为自己的插件目录。
2. 修改 `manifest.json` 中的 `code`、`name`、`description` 和 `author`。
3. 按[开发教程](/getting-started)在 AToolBox 客户端的开发者专区登记目录。
4. 按[调试教程](/debugging)修改代码并重新加载。
5. 调试完成后按[上传教程](/release)上传到后台送审。

模板入口是原生 ESM，使用宿主提供的 `window.Vue`，不需要安装 Vue，也不能使用 Node.js、Electron 或 `require`。
