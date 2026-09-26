import { useEffect, useRef } from 'react'

// Refresh quietly while this screen is visible; never poll during a mutation.
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
