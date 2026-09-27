import { useEffect, useRef, useState } from 'react'

export default function useApi(fetcher, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [version, setVersion] = useState(0)

  // Keep the latest fetcher in a ref so inline callbacks do not trigger repeated requests.
  const fetcherRef = useRef(fetcher)

  useEffect(() => {
    fetcherRef.current = fetcher
  })

  useEffect(() => {
    let active = true

    // Dependency changes fetch quietly; reload() controls the loading indicator.
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

  const reload = ({ background = false } = {}) => {
    if (!background) setLoading(true)
    setError(null)
    setVersion((current) => current + 1)
  }

  return { data, loading, error, reload }
}
