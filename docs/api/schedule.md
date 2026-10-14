# 定时任务

定时任务让插件在**指定时刻被宿主唤起**——包括用户当时并没有打开这个插件的情况。需要 `schedule:request` 权限（apiLevel 6 起）。

```ts
api.requestSchedule(schedule): Promise<PluginScheduleResult>
api.getSchedules(): Promise<PluginScheduleInfo[]>
api.removeSchedule(code): Promise<boolean>
api.onScheduleTrigger(callback): () => void
```

> **这是权限清单里最需要用户知情的一项**：它让插件在用户没打开它的时候被自动唤起。只在用户明确需要「定期自动做某事」时才申请，任务名要说清干什么。

## 申请一个任务

```js
const result = await api.requestSchedule({
  code: 'daily-report',                 // 任务标识，必填，同 code 视为更新
  title: '每天 9 点整理昨日数据',          // 给人看的名字，可省（省了就回落成 code）
  trigger: { cron: '0 9 * * *' }        // 触发规则
})

if (!result.ok) {
  api.toast(`创建定时任务失败：${result.message}`)
}
```

### trigger 的两种形态

| 形态 | 含义 | 例子 |
| --- | --- | --- |
| 毫秒时间戳（数字） | **只跑一次**，到点执行后任务自动删除 | `Date.now() + 60 * 60 * 1000` |
| `{ cron, startTime?, endTime? }` | 按 cron 周期重复 | `{ cron: '0 9 * * *' }` |

**cron 只支持标准 5 段式**，字段顺序是 `分 时 日 月 周`：

```
0 9 * * *      每天 09:00
*/30 * * * *   每 30 分钟
0 9-18 * * *   每天 09:00 到 18:00 之间、每小时整点
0 0 1 * *      每月 1 号 00:00
0 0 * * 1      每周一 00:00
```

每个字段支持 `*`、单值（`5`）、范围（`9-18`）、列表（`1,3,5`）、步长（`*/15`）、范围步长（`9-18/2`）。

`startTime` / `endTime` 是毫秒时间戳：`startTime` 之前不触发，越过 `endTime` 后任务自动清除。

> **日与周同时受限时按 OR 语义**（标准 cron 行为）：`0 0 1 * 1` 是「每月 1 号**或**每周一」，不是「既是 1 号又是周一」。只写其中一个时按那个来。

## 接收触发

```js
const removeTrigger = api.onScheduleTrigger((action) => {
  // action.code 就是申请时给的那个 code，靠它分发到不同任务的逻辑
  if (action.code === 'daily-report') {
    void runDailyReport()
  }
})

// 插件卸载时（或不再需要时）
// removeTrigger()
```

订阅跟着插件实例走：插件退出时宿主自动退订，不必在 `onPluginOut` 里额外收尾。

### 插件没运行时也会被触发

这是这个能力的关键语义，也是它需要单独授权的原因：

- 如果插件**正在运行**（页面还挂着），宿主直接把触发事件推给它；
- 如果插件**没在运行**，宿主会**先把插件拉起来**，等它挂载完成后再把这次触发补发过去。

所以插件的触发处理逻辑要写在**加载阶段就会执行**的地方（例如 `setup()` 里注册 `onScheduleTrigger`），而不是等某个用户操作之后。

> 就绪握手是自动的：宿主在插件挂载时会收到报到，据此决定「现在推」还是「等它起来再推」。插件不需要为此写任何代码。

## 查询与移除

```js
// 列出本插件申请过的任务（含执行统计）
const tasks = await api.getSchedules()
// [{ code, title, trigger, successCount, failCount, lastRunAt, lastStatus }]

// 移除一个任务；任务不存在也返回 false，不抛错
const removed = await api.removeSchedule('daily-report')
```

> **与 uTools 的差异**：uTools 的 `removeSchedule` 对不存在的 code 会**抛错**，ToolZen 只回 `false`。插件拿一个布尔值比接一个异常好用，而且「任务已经不在了」本来就是正常结果（可能刚被别的路径清掉）。

## 执行成败是怎么统计的

`successCount` / `failCount` / `lastStatus` 反映的是**插件回调的执行结果**，不是宿主有没有成功唤起插件。宿主在触发后会把结果记进任务记录，你在 `getSchedules()` 里能读到。

`lastRunAt` 是最近一次触发的毫秒时间戳，从未触发过时是 `null`。

## 使用边界

- **单个插件最多 20 个任务**。
- **插件被卸载或停用后，它的任务会被自动清掉**——留着一份「插件已经没了、任务还在」的记录，只会在调度器里空转。
- 任务表存在本地，**客户端重启后仍然生效**。
- **不要拿它做后台轮询**。这个能力的定位是「到点做一件明确的事」（每天整理数据、每周提醒），不是「每隔几秒检查一次状态」。轮询请用页面内的定时器配合 `api.holdSessionReset()`。

## 老客户端上的行为

`schedule:request` 是 apiLevel 6 引入的。老客户端上这四个方法都不存在，调用会拿到安全的空值：

```js
const supports = typeof api.hasCapability === 'function' && api.hasCapability('schedule:request')

if (!supports) {
  api.toast('定时任务需要升级 ToolZen 客户端')
}
```

也可以直接在 manifest 里声明 `requires: ["schedule:request"]`，让宿主在加载前就拦下并提示用户升级——详见[版本与兼容性](/compatibility)。
