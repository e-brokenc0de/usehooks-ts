import { useAsync } from './useAsync'

// Simulated API call
const fetchUser = async (userId: number): Promise<{ id: number; name: string; email: string }> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500))

  // Simulate occasional errors
  if (Math.random() > 0.8) {
    throw new Error('Failed to fetch user data')
  }

  return {
    id: userId,
    name: `User ${userId}`,
    email: `user${userId}@example.com`,
  }
}

export default function Component() {
  const { data, loading, error, execute, reset, status } = useAsync(
    () => fetchUser(1),
    { immediate: false },
  )

  return (
    <div>
      <h2>useAsync Demo</h2>

      <div style={{ marginBottom: '1rem' }}>
        <button onClick={execute} disabled={loading}>
          {loading ? 'Loading...' : 'Fetch User'}
        </button>
        <button onClick={reset} style={{ marginLeft: '0.5rem' }}>
          Reset
        </button>
      </div>

      <div>
        <p>
          <strong>Status:</strong> <code>{status}</code>
        </p>
        <p>
          <strong>Loading:</strong> <code>{loading.toString()}</code>
        </p>
      </div>

      {error && (
        <div style={{ color: 'red', marginTop: '1rem' }}>
          <strong>Error:</strong> {error.message}
        </div>
      )}

      {data && (
        <div style={{ marginTop: '1rem' }}>
          <strong>User Data:</strong>
          <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
