import { useEffect, useRef } from 'react'

// Poll only while visible and when mutations are not in progress.
export default function usePolling(reload, enabled = true, interval = 15000) {
  const latest = useRef(reload)
  useEffect(() => {
    latest.current = reload
  }, [reload])
  useEffect(() => {
    if (!enabled) return
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') latest.current({ background: true })
    }, interval)
    return () => clearInterval(timer)
  }, [enabled, interval])
}
