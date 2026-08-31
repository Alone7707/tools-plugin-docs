# 4. 调试

## 打开插件

在「个人中心 → 开发者专区」中确认插件已登记，点击「打开调试」。客户端会在主窗口加载插件，插件运行时会收到 `config`、`initialText`、`enterAction` 和 `api`。

![开发者专区](/images/developer-zone.png)

开发者专区显示的本地托管地址由客户端动态分配，仅用于当前电脑调试，不要写入 `manifest.json`，也不要把端口固定到文档或代码中。

## 修改后生效

修改 `src/App.vue`、`src/*.js` 或样式后，Vite watch 会重建 `dist/index.js`。回到开发者专区点击「重新加载」，再打开插件即可获取最新代码。重新加载会更新本地调试版本指纹，正式版本号不需要因每次调试修改。

如果修改了 `manifest.json` 的 `config` 默认值，先在开发者专区移除登记，再回到[3. 选择插件](/select-plugin)重新登记，才能重新读取配置。

## 调试检查

- `dist/index.js` 必须由 Vite 构建生成，并包含 `export default` 组件。
- 源码可从 `vue` 导入 Composition API，构建时自动复用宿主 `window.Vue`。
- 不要使用 `require`、`fs`、`electron`、`ipcRenderer` 或其他 Node.js 内置模块。
- `api` 和具体 API 方法都要做存在性判断，浏览器预览或异常恢复页中 `api` 可能为空。
- 所有事件监听、定时器和 `api.onPluginEnter` 返回的取消函数都要在卸载时清理。
- 自定义 CSS 使用 `plugin-` 前缀，避免覆盖宿主样式。

## 常见问题

| 现象 | 处理 |
| --- | --- |
| 找不到 `window.Vue` | 通过 ToolZen 宿主打开 `dist`，不要直接在浏览器运行源码 |
| 入口加载失败 | 检查 `entry` 路径、`export default` 和是否误写 TypeScript 语法 |
| 修改后页面不变 | 确认 Vite watch 正在运行，再回开发者专区点击「重新加载」 |
| 复制失败 | 优先使用 `api.copyText`，不要只依赖浏览器剪贴板 |
| 顶栏按钮无法点击 | 删除插件自绘标题栏和 `-webkit-app-region: drag` |

调试完成后，进入[5. 构建插件包](/build-plugin)。上传前必须重新执行正式构建，不能直接上传源码目录或调试前的旧产物。
