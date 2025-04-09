import FetchWrapper from '../request/fetch'

// mock fetch API
globalThis.fetch = jest.fn()

describe('FetchWrapper', () => {
  const baseUrl = 'https://api.example.com'
  let wrapper: FetchWrapper

  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = new FetchWrapper(baseUrl, 'initial-token')
  })

  it('发送 GET 请求并返回 JSON 数据', async () => {
    const mockResponse = { foo: 'bar' }

    // 模拟 fetch 返回数据
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      status: 200,
      statusText: 'OK',
      json: async () => mockResponse,
    })

    const result = await wrapper.get<{ foo: string }>('/test')

    expect(fetch).toHaveBeenCalledWith(
      `${baseUrl}/test`,
      expect.objectContaining({
        method: 'GET',
      }),
    )

    expect(result).toEqual({
      data: mockResponse,
      code: 200,
      msg: 'OK',
    })
  })

  it('支持 POST 请求并包含请求体', async () => {
    const mockData = { success: true }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      status: 201,
      statusText: 'Created',
      json: async () => mockData,
    })

    const result = await wrapper.post<{ success: boolean }>('/submit', {
      name: 'Tom',
    })

    expect(fetch).toHaveBeenCalledWith(
      `${baseUrl}/submit`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Tom' }),
        headers: expect.objectContaining({
          Authorization: 'Bearer initial-token',
          'Content-Type': 'application/json',
        }),
      }),
    )

    expect(result.data.success).toBe(true)
  })

  it('在 token 失效时调用 handleUnauthorized', async () => {
    const mockUnauthorized = jest.fn()

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({}),
    })

    await wrapper.get('/unauth', {
      handleUnauthorized: mockUnauthorized,
    })

    expect(mockUnauthorized).toHaveBeenCalled()
  })

  it('支持请求错误时调用 handleError', async () => {
    const mockErrorHandler = jest.fn()

    ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    await expect(
      wrapper.get('/error', {
        handleError: mockErrorHandler,
      }),
    ).rejects.toThrow('Network error')

    expect(mockErrorHandler).toHaveBeenCalled()
  })

  it('请求失败后可自动重试指定次数', async () => {
    const successResponse = {
      status: 200,
      statusText: 'OK',
      json: async () => ({ ok: true }),
    }

    // 前两次失败，第三次成功
    ;(fetch as jest.Mock)
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValueOnce(successResponse)

    const res = await wrapper.get<{ ok: boolean }>('/retry', {
      retryOnError: true,
      maxRetries: 3,
    })

    expect(fetch).toHaveBeenCalledTimes(3)
    expect(res.data.ok).toBe(true)
  })

  it('支持 showLoading 和 hideLoading 钩子', async () => {
    const show = jest.fn()
    const hide = jest.fn()

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      status: 200,
      statusText: 'OK',
      json: async () => ({ ok: 1 }),
    })

    await wrapper.get('/loading', {
      showLoading: show,
      hideLoading: hide,
    })

    expect(show).toHaveBeenCalled()
    expect(hide).toHaveBeenCalled()
  })

  it('可以记录请求日志', async () => {
    const log = jest.fn()

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      status: 200,
      statusText: 'OK',
      json: async () => ({ ok: 1 }),
    })

    await wrapper.get('/log', {
      logRequest: log,
    })

    expect(log).toHaveBeenCalledWith('/log', expect.any(Object))
  })

  it('支持取消请求（AbortController）', async () => {
    const handleCancel = jest.fn()

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      status: 200,
      statusText: 'OK',
      json: async () => ({ ok: 1 }),
    })

    await wrapper.get('/cancel', {
      supportCancel: true,
      handleCancel,
    })

    expect(handleCancel).toHaveBeenCalledWith(expect.any(AbortController))
  })

  it('支持 PATCH 请求', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      status: 200,
      statusText: 'OK',
      json: async () => ({ patched: true }),
    })

    const res = await wrapper.patch<{ patched: boolean }>('/patch', {
      name: 'X',
    })

    expect(res.data.patched).toBe(true)
  })

  it('支持 DELETE 请求', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      status: 204,
      statusText: 'No Content',
      json: async () => ({}),
    })

    const res = await wrapper.delete<{}>('/delete')

    expect(res.code).toBe(204)
  })
})
