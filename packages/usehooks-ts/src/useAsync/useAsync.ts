import { useCallback, useEffect, useRef, useState } from 'react'

/** The status of the async operation. */
type Status = 'idle' | 'loading' | 'success' | 'error'

/** The useAsync return type. */
type UseAsyncReturn<T> = {
  /** The data returned from the async function. */
  data: T | null
  /** The error that occurred during the async function execution. */
  error: Error | null
  /** The current status of the async operation. */
  status: Status
  /** Whether the async operation is currently loading. */
  loading: boolean
  /** Function to execute the async operation. */
  execute: () => Promise<void>
  /** Function to reset the state to initial values. */
  reset: () => void
}

/** The useAsync options type. */
type UseAsyncOptions = {
  /** Whether to execute the async function immediately on mount. */
  immediate?: boolean
}

/**
 * Custom hook that handles asynchronous operations with loading, error, and data states.
 * @template T - The type of data returned by the async function.
 * @param {() => Promise<T>} asyncFunction - The async function to execute.
 * @param {UseAsyncOptions} [options] - Configuration options for the hook.
 * @param {boolean} [options.immediate=true] - Whether to execute the async function immediately on mount.
 * @returns {UseAsyncReturn<T>} An object containing the async operation state and control functions.
 * @public
 * @see [Documentation](https://usehooks-ts.com/react-hook/use-async)
 * @example
 * ```tsx
 * const { data, loading, error, execute } = useAsync(() => fetchUser(id));
 * ```
 */
export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  options: UseAsyncOptions = {},
): UseAsyncReturn<T> {
  const { immediate = true } = options

  const [status, setStatus] = useState<Status>('idle')
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true)

  // Store the latest async function to avoid stale closures
  const asyncFunctionRef = useRef(asyncFunction)
  asyncFunctionRef.current = asyncFunction

  const execute = useCallback(async () => {
    setStatus('loading')
    setData(null)
    setError(null)

    try {
      const response = await asyncFunctionRef.current()

      if (isMountedRef.current) {
        setData(response)
        setStatus('success')
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)))
        setStatus('error')
      }
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setData(null)
    setError(null)
  }, [])

  useEffect(() => {
    isMountedRef.current = true

    if (immediate) {
      execute()
    }

    return () => {
      isMountedRef.current = false
    }
  }, [execute, immediate])

  return {
    data,
    error,
    status,
    loading: status === 'loading',
    execute,
    reset,
  }
}
