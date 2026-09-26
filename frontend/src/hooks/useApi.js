import { useEffect, useRef, useState } from 'react'

// One hook for every data-loading page: { data, loading, error, reload }.
//
//   const { data, loading, error, reload } = useApi(fetcher, deps)
//   if (loading) return <Spinner />
//   if (error) return <Alert>{error}</Alert>
//   if (!data.length) return <EmptyState />
//   return data.map(...)
//
// The fetcher is a service call like `() => rideService.getMyRides()`. The deps
// array works like useEffect's: when one of those values changes, the hook
// fetches again. `reload` re-fetches on demand, which is what a cancel, an
// accept or a status change calls so the screen reflects the server.
export default function useApi(fetcher, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [version, setVersion] = useState(0)

  // The effect deliberately does not depend on `fetcher` itself. A caller writes
  // `() => service.getX()`, a brand new function on every render, so depending
  // on it would re-fetch on every render. A ref keeps the latest fetcher
  // reachable while the caller's `deps` array stays the real trigger. The ref is
  // synced in an effect (not during render) to satisfy react-hooks/refs, and
  // declared before the fetch effect so the fetch always reads a fresh value.
  const fetcherRef = useRef(fetcher)

  useEffect(() => {
    fetcherRef.current = fetcher
  })

  useEffect(() => {
    let active = true

    // State is only ever set from the promise callbacks below - never
    // synchronously in the effect body - which is what
    // react-hooks/set-state-in-effect wants. The cost: a dependency-driven
    // refetch does not flip `loading` back on. This app never depends on that;
    // pages refetch through `reload`, which resets loading itself.
    fetcherRef
      .current()
      .then((result) => {
        if (active) {
          setData(result)
          setError(null)
        }
      })
      .catch((err) => {
        if (active) setError(err)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, ...deps])

  const reload = () => {
    setLoading(true)
    setError(null)
    setVersion((current) => current + 1)
  }

  return { data, loading, error, reload }
}