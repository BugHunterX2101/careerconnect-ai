function reportMetric(name, value, meta = {}) {
  if (import.meta.env.DEV) {
    console.log(`[WebVitals] ${name}:`, value, meta)
  }

  // Keep this endpoint lightweight and optional for production telemetry.
  if (import.meta.env.PROD && navigator.sendBeacon) {
    const payload = JSON.stringify({
      name,
      value,
      meta,
      path: window.location.pathname,
      ts: Date.now(),
    })
    navigator.sendBeacon('/api/perf/vitals', payload)
  }
}

function observePaintMetrics() {
  if (!('PerformanceObserver' in window)) return

  try {
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      const lastEntry = entries[entries.length - 1]
      if (lastEntry) {
        reportMetric('LCP', Math.round(lastEntry.startTime))
      }
    })
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })

    const clsState = { value: 0 }
    const clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          clsState.value += entry.value
        }
      }
      reportMetric('CLS', Number(clsState.value.toFixed(4)))
    })
    clsObserver.observe({ type: 'layout-shift', buffered: true })

    const inpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      if (entries.length > 0) {
        const maxInp = Math.max(...entries.map((entry) => entry.duration || 0))
        reportMetric('INP', Math.round(maxInp))
      }
    })
    inpObserver.observe({ type: 'event', buffered: true, durationThreshold: 40 })
  } catch (error) {
    console.warn('Web vitals observer setup failed:', error)
  }
}

export function startWebVitalsTracking() {
  if (typeof window === 'undefined') return

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(observePaintMetrics, { timeout: 2000 })
    return
  }

  window.setTimeout(observePaintMetrics, 1200)
}
