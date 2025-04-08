# HTTP Request Utilities

## 功能与参数说明

本项目封装的 HTTP 请求工具支持以下功能和参数：

- **method**: HTTP 请求方法，支持 `'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'`，默认是 `'GET'`。
- **headers**: 请求头信息，可自定义。
- **body**: 请求体，适用于 `'POST'` 和 `'PUT'` 方法。
- **isStream**: 是否是流式数据请求，默认 `false`。
- **retryOnError**: 是否在错误时重试请求，默认 `false`。
- **maxRetries**: 最大重试次数，默认 `3`。
- **tokenErrorCode**: Token 失效错误的状态码，默认 `401`。
- **token**: 授权令牌，可通过初始化或请求参数传递。
- **supportCancel**: 是否支持请求取消，默认 `false`。
- **showLoading**: 显示加载指示器的回调函数，类型为 `() => void`，无参数，无返回值。
- **hideLoading**: 隐藏加载指示器的回调函数，类型为 `() => void`，无参数，无返回值。
- **onProgress**: 监控请求进度的回调函数，类型为 `(progress: number) => void`，参数为进度百分比（`number`），无返回值。
- **logRequest**: 记录请求日志的回调函数，类型为 `(endpoint: string, options: RequestInit) => void`，参数为请求的端点（`string`）和请求选项（`RequestInit`），无返回值。
- **handleCancel**: 处理请求取消的回调函数，类型为 `(controller: AbortController) => void`，参数为 `AbortController` 实例，无返回值。
- **handleError**: 处理请求过程中发生的错误的回调函数，类型为 `(error: Error) => void`，参数为错误对象（`Error`），无返回值。
- **handleUnauthorized**: 处理未授权错误的回调函数，类型为 `() => void`，无参数，无返回值。

---

# HTTP Request Utilities

本项目包含三个主要的 HTTP 请求工具文件：`fetch.ts`、`useFetch.ts` 和 `useReactFetch.ts`。以下是它们的使用文档和示例。

---

## `fetch.ts`

### 简介
`fetch.ts` 提供了一个基于类的封装，用于处理 HTTP 请求。它支持 GET、POST、PUT、DELETE 和 PATCH 请求，并提供了丰富的选项来定制请求行为。

### 使用方法

```typescript
import FetchWrapper from './request/fetch';

const api = new FetchWrapper('https://api.example.com', 'your-initial-token');

// 发送 GET 请求
api.get('/endpoint').then(response => {
  console.log(response.data);
});

// 发送 POST 请求
api.post('/endpoint', { key: 'value' }).then(response => {
  console.log(response.data);
});
```

---

## `useFetch.ts`

### 简介
`useFetch.ts` 提供了一个基于函数的封装，用于处理 HTTP 请求。它支持类似于 `fetch.ts` 的功能，但更适合函数式编程风格。

### 使用方法

```typescript
import useFetchWrapper from './request/useFetch';

const { get, post, put, del, patch } = useFetchWrapper('https://api.example.com', 'your-initial-token');

// 发送 GET 请求
get('/endpoint').then(response => {
  console.log(response.data);
});

// 发送 POST 请求
post('/endpoint', { key: 'value' }).then(response => {
  console.log(response.data);
});
```

---

## `useReactFetch.ts`

### 简介
`useReactFetch.ts` 提供了一个基于 React 的自定义 Hook，用于处理 HTTP 请求。它支持状态管理和 React 的生命周期。

### 使用方法

```typescript
import useFetchWrapper from './request/useReactFetch';

function App() {
  const { get, post, put, del, patch, setToken } = useFetchWrapper('https://api.example.com', 'your-initial-token');

  const fetchData = async () => {
    const response = await get('/endpoint');
    console.log(response.data);
  };

  return (
    <div>
      <button onClick={fetchData}>Fetch Data</button>
    </div>
  );
}

export default App;
```
