# 数据存储

每个插件按 `pluginCode` 获得独立存储命名空间。相同 key 在不同插件之间互不冲突。

## db

`db` 用于保存 JSON 可序列化的数据。

### db.put

```ts
api.db.put(key: string, value: unknown): boolean
```

```js
const saved = api && api.db
  ? api.db.put('draft', { text: text.value, savedAt: Date.now() })
  : false
```

### db.get

```ts
api.db.get<T>(key: string): T | null
```

```js
const draft = api && api.db ? api.db.get('draft') : null
const draftText = draft && typeof draft.text === 'string' ? draft.text : ''
```

### db.remove

```ts
api.db.remove(key: string): boolean
```

```js
if (api && api.db) api.db.remove('draft')
```

## dbStorage

`dbStorage` 保存字符串，语义与浏览器 `localStorage` 相同。

### dbStorage.setItem

```ts
api.dbStorage.setItem(key: string, value: string): void
```

```js
if (api && api.dbStorage) api.dbStorage.setItem('theme', 'dark')
```

### dbStorage.getItem

```ts
api.dbStorage.getItem(key: string): string | null
```

```js
const theme = api && api.dbStorage ? api.dbStorage.getItem('theme') : null
```

### dbStorage.removeItem

```ts
api.dbStorage.removeItem(key: string): void
```

```js
if (api && api.dbStorage) api.dbStorage.removeItem('theme')
```

不要在插件存储中保存密码、访问令牌或其他不必要的敏感信息。
