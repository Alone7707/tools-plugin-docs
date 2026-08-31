# 运行模型与目录结构

## 加载流程

```text
安装插件
  ↓ 保存 manifest 元数据与 entryUrl
打开插件
  ↓ import(entryUrl + '?v=' + version)
取 mod.default
  ↓ defineAsyncComponent
挂载 Vue 组件
  ↓ props: config / initialText / enterAction / api
```

用户安装远程插件时，客户端主要保存元数据与入口地址。入口模块在打开插件时按版本加载并缓存；生产环境同一 `entryUrl + version` 会复用模块缓存，因此发布新代码必须递增版本号。

## 入口组件契约

| prop | 类型 | 说明 |
| --- | --- | --- |
| `config` | `Record<string, string \| number \| boolean>` | manifest 默认配置与用户覆盖值合并后的结果 |
| `initialText` | `string` | 搜索词、剪贴板识别文本或跳转载荷；没有时为空串 |
| `enterAction` | `PluginEnterAction \| null` | 最近一次进入动作；包含 `code`、`type`、`payload` |
| `api` | `ToolZenPluginApi \| null` | 当前插件实例的受控宿主 API；浏览器直开预览时可能为空 |

`api.getWindowType()` 可区分主窗口和独立窗口，返回 `'main'` 或 `'detach'`。`api.isDev()` 可判断当前是否通过开发者专区本地调试。

## 开发目录与交付目录

```text
my_plugin/
├── manifest.json
├── package.json
├── vite.config.js
├── src/                # .vue 与 .js 开发源码
└── dist/               # 客户端选择与后台上传目录
    ├── manifest.json   # 必需：元数据和运行配置
    └── index.js        # 必需：构建后的 ESM Vue 入口
```

上传包限制由服务端强制执行：最多 20 个文件，单文件不超过 512 KB，总大小不超过 2 MB，路径最多 3 层。扩展名必须属于 `.js`、`.mjs`、`.json`、`.css`、`.md`、`.svg`、`.txt`、`.png`、`.jpg`、`.jpeg`、`.webp`、`.gif`。

## 宿主标题栏

主窗体顶部标题栏由宿主负责，包含插件图标、插件名、返回启动器、拖动和双击分离。插件只通过 `api.setSubtitle()` 设置副标题，通过 `api.setDetachPayload()` 提供分离时的载荷。不要自绘标题栏，也不要写 `-webkit-app-region: drag`。

## 安全边界

远程插件和宿主处于同一渲染进程，不是 iframe 沙箱。不要将插件代码视为可信主进程代码，也不要把用户数据发送到未在说明中披露的服务。权限声明支持 `clipboard:read`、`clipboard:write`、`network:fetch`、`file:dialog`，声明应与实际行为一致。
