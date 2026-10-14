# 搜索框集成

这一页讲插件与主搜索框的三项交互能力，都在 apiLevel 7 引入：

| 能力 | 权限 | 做什么 |
| --- | --- | --- |
| `onMainPush` | `feature:mainpush` | 往搜索结果里推送条目 |
| `setFeature` / `getFeatures` / `removeFeature` | `feature:dynamic` | 运行期增删自己的搜索入口 |
| `onPluginReady` | 不需要 | 宿主告诉插件「代码已就绪」 |

动态增删搜索入口的完整说明见[动态指令](/api/features)，本页重点讲另外两项。

## 往搜索框推送结果（`onMainPush`）

用户在搜索框打字时，宿主会**同步**调用插件注册的回调，插件返回一组结果项，这些结果会混进搜索结果列表；用户选中某一条后，宿主再回调插件告知选了哪条。

```ts
api.onMainPush(
  callback: (query: string) => PluginMainPushItem[],
  onSelect?: (id: string) => void
): () => void
```

```js
const remove = api.onMainPush(
  (query) => {
    // 同步返回数组；返回空数组表示这一轮没有结果
    return recentFiles
      .filter((file) => file.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5)
      .map((file) => ({
        id: file.path,              // 稳定标识，选中后原样回传
        title: file.name,
        description: file.path,
        icon: '📄'                  // 可省：http(s) 地址、data URL，或单个字符
      }))
  },
  (id) => {
    // 用户选了 id 这一条
    void openFile(id)
  }
)
```

### 结果项结构

```ts
type PluginMainPushItem = {
  id: string           // 必填，稳定标识
  title: string        // 必填，主标题
  description?: string // 副标题 / 说明
  icon?: string        // http(s) 地址、data URL，或单个字符
}
```

`id` 或 `title` 为空的结果项会被**丢弃**——没有 `id` 就没法回传选中，没有标题用户在列表里看不到它。

### 必须声明的两件事

**1. 权限**：`manifest.permissions` 里要有 `feature:mainpush`。

**2. 功能上的开关**：任意一条功能声明 `mainPush: true`，宿主才会调用这个插件的推送回调。

```json
{
  "permissions": ["feature:mainpush"],
  "features": [
    {
      "name": "最近文件",
      "description": "在搜索框里直接找最近打开的文件",
      "code": "recent",
      "mainPush": true,
      "cmds": ["recent"]
    }
  ]
}
```

**为什么要有这个开关**：推送回调是**同步的、在每次按键时都会被调用**。让所有插件都参与会拖慢搜索框，所以要求插件显式声明「我愿意参与」。不声明就是不参与。

### 回调要快、要稳

这是**输入热路径**——用户每敲一个字符都会调一次。

- **必须同步返回数组**。返回 `Promise` 会被当作「这一轮没有结果」（宿主不等异步结果，否则打字时列表会闪）。
- **不要在里面做网络请求、读磁盘或大计算**。需要异步数据就提前缓存好，回调里只做内存里的过滤。
- **抛异常不会影响别的插件**（宿主隔离了），但你自己那批结果会全部丢掉。
- 单次最多返回 **8 条**，多的会被截断。

### 结果什么时候会被问

宿主**只在启动器首页**、且**输入非空**时询问插件。空输入不问——否则启动器一打开就会收到一堆「热门推荐」，把最近使用挤掉。

声明了 `mainPush` 的插件会被宿主**预挂载**：启动器可见时，宿主把插件代码跑起来（不触发 `onPluginEnter`、界面也不显示），这样打字时回调才在。离开启动器就整批卸掉。**同时最多预挂载 3 个插件**，按插件列表顺序取前 3 个。

> 这意味着插件被预挂载时**不要做重活**——它可能只是为了搜索被挂起来，用户并没有要用它。把初始化推迟到真正的 `onPluginEnter` 之后。

## 插件就绪回调（`onPluginReady`）

插件代码加载完成时触发，用来做一次性初始化。

```ts
api.onPluginReady(callback: () => void): () => void
```

```js
api.onPluginReady(() => {
  // 这里做「插件起来了」才能做的事：建立索引、预热缓存、注册搜索推送
  void warmUpIndex()
})
```

要点：

- **注册时若已经就绪，回调会立刻被调用一次**。所以不必担心「注册晚了错过事件」——插件的 `setup()` 与宿主的就绪信号谁先谁后都不影响。
- 它**不需要任何权限**：只是宿主通知插件「你已就绪」，不读也不改用户数据。
- 与 `onPluginEnter` 的分工：`onPluginReady` 是「代码跑起来了」（**预挂载时也会触发**），`onPluginEnter` 是「用户进入了这个插件」。做与用户操作无关的初始化用前者，读 `enterAction` 处理本次进入用后者。
- 订阅返回取消函数，组件卸载时应当调用。

## 老客户端上的行为

这三项能力都是 apiLevel 7 引入的。老客户端上：

- `onMainPush` / `onPluginReady` 不存在 → 注册方法返回一个**空的取消函数**，插件照常调用与清理都不会炸；
- `setFeature` 等返回 `false` / 空数组。

```js
function supports(api, name) {
  try {
    return typeof api.hasCapability === 'function' && api.hasCapability(name) === true
  } catch {
    return false
  }
}

if (supports(api, 'feature:mainpush')) {
  // 新路径：注册推送
} else {
  // 降级：退回只靠静态 cmds 声明
}
```

也可以直接在 manifest 里声明 `requires` / `optional`，让宿主替你判定——能用降级解决的写 `optional`，详见[版本与兼容性](/compatibility)。
