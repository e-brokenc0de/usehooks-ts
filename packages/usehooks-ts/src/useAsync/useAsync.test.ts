import { act, renderHook, waitFor } from '@testing-library/react'

import { useAsync } from './useAsync'

describe('useAsync()', () => {
  it('should initialize with idle state', () => {
    const asyncFunction = vi.fn().mockResolvedValue('data')
    const { result } = renderHook(() =>
      useAsync(asyncFunction, { immediate: false }),
    )

    expect(result.current.status).toBe('idle')
    expect(result.current.data).toBe(null)
    expect(result.current.error).toBe(null)
    expect(result.current.loading).toBe(false)
    expect(typeof result.current.execute).toBe('function')
    expect(typeof result.current.reset).toBe('function')
  })

  it('should execute async function immediately by default', async () => {
    const asyncFunction = vi.fn().mockResolvedValue('test data')
    const { result } = renderHook(() => useAsync(asyncFunction))

    expect(result.current.loading).toBe(true)
    expect(result.current.status).toBe('loading')

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.status).toBe('success')
    expect(result.current.data).toBe('test data')
    expect(result.current.error).toBe(null)
    expect(asyncFunction).toHaveBeenCalledTimes(1)
  })

  it('should not execute immediately when immediate is false', () => {
    const asyncFunction = vi.fn().mockResolvedValue('data')
    const { result } = renderHook(() =>
      useAsync(asyncFunction, { immediate: false }),
    )

    expect(result.current.status).toBe('idle')
    expect(result.current.loading).toBe(false)
    expect(asyncFunction).not.toHaveBeenCalled()
  })

  it('should handle successful async execution', async () => {
    const testData = { id: 1, name: 'Test' }
    const asyncFunction = vi.fn().mockResolvedValue(testData)
    const { result } = renderHook(() =>
      useAsync(asyncFunction, { immediate: false }),
    )

    await act(async () => {
      await result.current.execute()
    })

    expect(result.current.status).toBe('success')
    expect(result.current.data).toEqual(testData)
    expect(result.current.error).toBe(null)
    expect(result.current.loading).toBe(false)
  })

  it('should handle async errors', async () => {
    const testError = new Error('Test error')
    const asyncFunction = vi.fn().mockRejectedValue(testError)
    const { result } = renderHook(() =>
      useAsync(asyncFunction, { immediate: false }),
    )

    await act(async () => {
      await result.current.execute()
    })

    expect(result.current.status).toBe('error')
    expect(result.current.error).toEqual(testError)
    expect(result.current.data).toBe(null)
    expect(result.current.loading).toBe(false)
  })

  it('should handle non-Error thrown values', async () => {
    const asyncFunction = vi.fn().mockRejectedValue('string error')
    const { result } = renderHook(() =>
      useAsync(asyncFunction, { immediate: false }),
    )

    await act(async () => {
      await result.current.execute()
    })

    expect(result.current.status).toBe('error')
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('string error')
  })

  it('should set loading state during execution', async () => {
    let resolvePromise: (value: string) => void
    const asyncFunction = vi.fn(
      () =>
        new Promise<string>(resolve => {
          resolvePromise = resolve
        }),
    )

    const { result } = renderHook(() =>
      useAsync(asyncFunction, { immediate: false }),
    )

    act(() => {
      result.current.execute()
    })

    expect(result.current.status).toBe('loading')
    expect(result.current.loading).toBe(true)

    await act(async () => {
      resolvePromise('data')
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.loading).toBe(false)
  })

  it('should reset state', async () => {
    const asyncFunction = vi.fn().mockResolvedValue('test data')
    const { result } = renderHook(() => useAsync(asyncFunction))

    await waitFor(() => {
      expect(result.current.status).toBe('success')
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.status).toBe('idle')
    expect(result.current.data).toBe(null)
    expect(result.current.error).toBe(null)
    expect(result.current.loading).toBe(false)
  })

  it('should execute multiple times', async () => {
    const asyncFunction = vi
      .fn()
      .mockResolvedValueOnce('first')
      .mockResolvedValueOnce('second')

    const { result } = renderHook(() =>
      useAsync(asyncFunction, { immediate: false }),
    )

    await act(async () => {
      await result.current.execute()
    })

    expect(result.current.data).toBe('first')

    await act(async () => {
      await result.current.execute()
    })

    expect(result.current.data).toBe('second')
    expect(asyncFunction).toHaveBeenCalledTimes(2)
  })

  it('should clear previous data on new execution', async () => {
    const asyncFunction = vi
      .fn()
      .mockResolvedValueOnce('first')
      .mockImplementationOnce(
        () =>
          new Promise(resolve => {
            setTimeout(() => resolve('second'), 100)
          }),
      )

    const { result } = renderHook(() =>
      useAsync(asyncFunction, { immediate: false }),
    )

    await act(async () => {
      await result.current.execute()
    })

    expect(result.current.data).toBe('first')

    act(() => {
      result.current.execute()
    })

    expect(result.current.data).toBe(null)
    expect(result.current.loading).toBe(true)
  })

  it('should not update state after unmount', async () => {
    let resolvePromise: (value: string) => void
    const asyncFunction = vi.fn(
      () =>
        new Promise<string>(resolve => {
          resolvePromise = resolve
        }),
    )

    const { result, unmount } = renderHook(() =>
      useAsync(asyncFunction, { immediate: false }),
    )

    act(() => {
      result.current.execute()
    })

    unmount()

    // Resolve after unmount
    await act(async () => {
      resolvePromise('data')
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    // State should remain as it was before unmount
    expect(result.current.status).toBe('loading')
  })

  it('should use the latest async function', async () => {
    const firstFunction = vi.fn().mockResolvedValue('first')
    const secondFunction = vi.fn().mockResolvedValue('second')

    const { result, rerender } = renderHook(
      ({ fn }) => useAsync(fn, { immediate: false }),
      {
        initialProps: { fn: firstFunction },
      },
    )

    rerender({ fn: secondFunction })

    await act(async () => {
      await result.current.execute()
    })

    expect(firstFunction).not.toHaveBeenCalled()
    expect(secondFunction).toHaveBeenCalledTimes(1)
    expect(result.current.data).toBe('second')
  })
})
