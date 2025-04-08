type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

const INVAILD_TOKEN = 401

/**
 * FetchWrapper 请求选项
 */
interface IFetchWrapperOptions {
  /** HTTP 请求方法默认是 'GET' */
  method?: RequestMethod
  /** 请求中包含的头信息 */
  headers?: HeadersInit
  /** 请求体用于 'POST' 和 'PUT' 方法 */
  body?: any
  /** 请求是否是流式数据默认是 false */
  isStream?: boolean
  /** 是否在错误时重试请求默认是 false */
  retryOnError?: boolean
  /** 最大重试次数默认是 3 */
  maxRetries?: number
  /** token失效错误的状态码默认是 401 */
  tokenErrorCode?: number
  /** 授权令牌 */
  token?: string
  /** 是否支持请求取消默认是 false */
  supportCancel?: boolean
  /** 显示加载指示器 */
  showLoading?: () => void
  /** 隐藏加载指示器 */
  hideLoading?: () => void
  /** 监控请求进度的回调函数 */
  onProgress?: (progress: number) => void
  /** 记录请求日志的回调函数 */
  logRequest?: (endpoint: string, options: RequestInit) => void
  /** 处理请求取消的 AbortController 回调函数 */
  handleCancel?: (controller: AbortController) => void
  /** 处理请求过程中发生的错误的回调函数 */
  handleError?: (error: Error) => void
  /** 处理未授权错误的回调函数 */
  handleUnauthorized?: () => void
}

/**
 * 标准的 API 响应格式
 *
 */
interface IApiResponse<T> {
  data: T
  code: number
  msg: string
}

/**
 * 构造函数，初始化 FetchWrapper 实例
 * @param baseUrl 基础 URL
 * @param initialToken 授权令牌，也可以通过请求方法中进行传递
 */
class FetchWrapper {
  private baseUrl: string
  private token: string | null

  constructor(baseUrl: string, initialToken: string | null = null) {
    this.baseUrl = baseUrl
    this.token = initialToken
  }

  private async request<T>(
    endpoint: string,
    options: IFetchWrapperOptions = {},
  ): Promise<IApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      showLoading,
      hideLoading,
      logRequest,
      onProgress,
      token,
      supportCancel = false,
      handleCancel,
      handleError,
      handleUnauthorized,
      isStream = false,
      retryOnError = false,
      maxRetries = 3,
      tokenErrorCode = INVAILD_TOKEN,
    } = options

    // 处理加载指示器
    if (showLoading && typeof showLoading === 'function') {
      showLoading()
    }

    const reqHeaders: { [key: string]: any } = { ...headers }
    if (this.token || token) {
      reqHeaders['Authorization'] = `Bearer ${this.token || token}`
    }
    if (body && method !== 'GET') {
      reqHeaders['Content-Type'] = 'application/json'
    }

    const controller = supportCancel ? new AbortController() : undefined
    const signal = controller?.signal

    if (supportCancel && handleCancel) {
      handleCancel(controller!)
    }

    const reqOptions: RequestInit = {
      method,
      headers: reqHeaders,
      body: method !== 'GET' ? JSON.stringify(body) : undefined,
      signal,
    }

    let attempts = 0

    const executeRequest = async (): Promise<IApiResponse<T>> => {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, reqOptions)

        // 处理响应状态
        if (
          response.status === tokenErrorCode &&
          typeof handleUnauthorized === 'function'
        ) {
          handleUnauthorized()
        }

        let result
        if (isStream) {
          // 分开处理流式数据
          const reader = response.body?.getReader()
          const chunks: Uint8Array<ArrayBufferLike>[] = []
          while (true) {
            const { done, value } = await reader?.read()!
            if (done) break
            chunks.push(value)
          }
          const chunksAll = new Uint8Array(
            chunks.reduce((acc, chunk) => acc + chunk.length, 0),
          )
          let position = 0
          for (let chunk of chunks) {
            chunksAll.set(chunk, position)
            position += chunk.length
          }
          result = new TextDecoder('utf-8').decode(chunksAll)
        } else if (onProgress && response.body) {
          // 处理进度
          const reader = response.body.getReader()
          const contentLength = +response.headers.get('Content-Length')!
          let receivedLength = 0
          const chunks: Uint8Array<ArrayBufferLike>[] = []

          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            chunks.push(value)
            receivedLength += value.length
            onProgress((receivedLength / contentLength) * 100)
          }

          const chunksAll = new Uint8Array(receivedLength)
          let position = 0
          for (let chunk of chunks) {
            chunksAll.set(chunk, position)
            position += chunk.length
          }

          result = new TextDecoder('utf-8').decode(chunksAll)
        } else {
          result = await response.json()
        }

        return { data: result, code: response.status, msg: response.statusText }
      } catch (error) {
        if (retryOnError && attempts < maxRetries) {
          attempts++
          console.warn(`Retry attempt ${attempts} for ${endpoint}`)
          return executeRequest()
        } else {
          // 处理错误
          if (handleError) {
            handleError(error as Error)
          } else {
            this.handleError(error as Error)
          }
          throw error
        }
      } finally {
        // 隐藏加载指示器
        if (hideLoading && typeof hideLoading === 'function') {
          hideLoading()
        }
        // 记录请求日志
        if (logRequest && typeof logRequest === 'function') {
          logRequest(endpoint, reqOptions)
        } else if (this._logRequest) {
          this._logRequest(endpoint, reqOptions)
        }
      }
    }

    return executeRequest()
  }

  private handleError(error: Error) {
    console.error('An error occurred:', error)
  }

  private _logRequest(endpoint: string, options: RequestInit) {
    console.log('Request made to:', endpoint, 'with options:', options)
  }

  /**
   * 发送 GET 请求
   * @param endpoint 请求的端点（URL）
   * @param options 请求选项
   * @returns 返回一个包含响应数据的 Promise 对象
   */
  public get<T>(
    endpoint: string,
    options?: IFetchWrapperOptions,
  ): Promise<IApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  /**
   * 发送 POST 请求
   * @param endpoint 请求的端点（URL）
   * @param body 请求体
   * @param options 请求选项
   * @returns 返回一个包含响应数据的 Promise 对象
   */
  public post<T>(
    endpoint: string,
    body?: any,
    options?: IFetchWrapperOptions,
  ): Promise<IApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body })
  }

  /**
   * 发送 PUT 请求
   * @param endpoint 请求的端点（URL）
   * @param body 请求体
   * @param options 请求选项
   * @returns 返回一个包含响应数据的 Promise 对象
   */
  public put<T>(
    endpoint: string,
    body?: any,
    options?: IFetchWrapperOptions,
  ): Promise<IApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body })
  }

  /**
   * 发送 DELETE 请求
   * @param endpoint 请求的端点（URL）
   * @param options 请求选项
   * @returns 返回一个包含响应数据的 Promise 对象
   */
  public delete<T>(
    endpoint: string,
    options?: IFetchWrapperOptions,
  ): Promise<IApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }

  /**
   * 发送 PATCH 请求
   * @param endpoint 请求的端点（URL）
   * @param body 请求体
   * @param options 请求选项
   * @returns 返回一个包含响应数据的 Promise 对象
   */
  public patch<T>(
    endpoint: string,
    body?: any,
    options?: IFetchWrapperOptions,
  ): Promise<IApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body })
  }
}

export default FetchWrapper
