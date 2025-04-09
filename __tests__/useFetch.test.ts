import useFetchWrapper from '../request/useFetch'

const mockBaseUrl = 'https://jsonplaceholder.typicode.com'

// forbidding console logs
console.error = () => {}
console.log = () => {}
console.warn = () => {}

describe('useFetchWrapper 测试', () => {
  let fetchWrapper: ReturnType<typeof useFetchWrapper>
  beforeEach(() => {
    fetchWrapper = useFetchWrapper(mockBaseUrl)
    globalThis.fetch = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('发送 GET 请求并返回数据', async () => {
    const mockResponse = { data: '测试数据' }
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    })

    const response = await fetchWrapper.get('/posts/1')

    expect(fetch).toHaveBeenCalledWith(`${mockBaseUrl}/posts/1`, {
      method: 'GET',
      headers: {},
    })
    expect(response).toEqual({ data: mockResponse, code: 200, msg: undefined })
  })

  test('发送 POST 请求并携带 body 和 headers', async () => {
    const mockResponse = { id: 1 }
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => mockResponse,
    })

    const response = await fetchWrapper.post('/posts', {
      title: '标题',
      body: '内容',
      userId: 1,
    })

    expect(fetch).toHaveBeenCalledWith(`${mockBaseUrl}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '标题', body: '内容', userId: 1 }),
    })
    expect(response).toEqual({ data: mockResponse, code: 201, msg: undefined })
  })

  test('支持进度更新的请求', async () => {
    const mockOnProgress = jest.fn()
    const mockResponse = {
      body: {
        getReader: () => ({
          read: jest
            .fn()
            .mockResolvedValueOnce({
              done: false,
              value: new Uint8Array([1, 2, 3]),
            })
            .mockResolvedValueOnce({ done: true }),
        }),
      },
      headers: { get: () => '3' },
      ok: true,
      status: 200,
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

    const response = await fetchWrapper.get('/progress', {
      onProgress: mockOnProgress,
    })

    expect(mockOnProgress).toHaveBeenCalledWith(100)
    expect(response).toEqual({
      data: new TextDecoder('utf-8').decode(new Uint8Array([1, 2, 3])),
      code: 200,
      msg: undefined,
    })
  })

  test('处理流式数据的请求', async () => {
    const mockResponse = {
      body: {
        getReader: () => ({
          read: jest
            .fn()
            .mockResolvedValueOnce({
              done: false,
              value: new Uint8Array([1, 2, 3]),
            })
            .mockResolvedValueOnce({ done: true }),
        }),
      },
      ok: true,
      status: 200,
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

    const response = await fetchWrapper.get('/stream', { isStream: true })

    expect(response).toEqual({
      data: new TextDecoder('utf-8').decode(new Uint8Array([1, 2, 3])),
      code: 200,
      msg: undefined,
    })
  })

  test('在请求失败时重试', async () => {
    ;(fetch as jest.Mock)
      .mockRejectedValueOnce(new Error('网络错误'))
      .mockRejectedValueOnce(new Error('网络错误'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: '测试数据' }),
      })

    const response = await fetchWrapper.get('/retry', {
      retryOnError: true,
      maxRetries: 3,
    })

    expect(fetch).toHaveBeenCalledTimes(3)
    expect(response).toEqual({
      data: { data: '测试数据' },
      code: 200,
      msg: undefined,
    })
  })

  test('支持请求取消功能', async () => {
    const mockHandleCancel = jest.fn()

    const mockAbortError = new DOMException('用户取消了请求', 'AbortError')
    ;(fetch as jest.Mock).mockImplementationOnce(() => {
      return new Promise((_, reject) => {
        reject(mockAbortError)
      })
    })

    await expect(
      fetchWrapper.get('/cancel', {
        supportCancel: true,
        handleCancel: (controller) => {
          mockHandleCancel(controller)
          controller.abort() // 模拟取消请求
        },
      }),
    ).rejects.toThrow(mockAbortError)

    expect(mockHandleCancel).toHaveBeenCalledTimes(1)
    expect(mockHandleCancel.mock.calls[0][0]).toBeInstanceOf(AbortController) // 验证传入的是 abortController
    expect(mockHandleCancel.mock.calls[0][0].signal.aborted).toBe(true) // 验证信号已中止
  })

  test('记录请求日志', async () => {
    const mockLogRequest = jest.fn()
    const mockResponse = { data: '测试日志' }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    })

    await fetchWrapper.get('/log', { logRequest: mockLogRequest })

    expect(mockLogRequest).toHaveBeenCalledWith('/log', {
      method: 'GET',
      headers: {},
    })
  })

  test('处理未授权错误', async () => {
    const mockUnauthorizedHandler = jest.fn()
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    })

    await expect(
      fetchWrapper.get('/protected', {
        handleUnauthorized: mockUnauthorizedHandler,
      }),
    ).rejects.toThrow()

    expect(mockUnauthorizedHandler).toHaveBeenCalled()
  })
})
