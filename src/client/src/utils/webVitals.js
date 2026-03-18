const vitalsBuffer = {}
let flushTimer = null
let sendCount = 0
const MAX_SENDS_PER_PAGE = 2

function queueMetric(name, value, meta = {}) {
  vitalsBuffer[name] = {
    value,
    meta,
    ts: Date.now(),
  }

  if (import.meta.env.DEV) {
    console.log(`[WebVitals] ${name}:`, value, meta)
  }
}

function flushMetrics() {
  if (!import.meta.env.PROD || !navigator.sendBeacon) return
  if (sendCount >= MAX_SENDS_PER_PAGE) return
  if (Object.keys(vitalsBuffer).length === 0) return

  const payload = JSON.stringify({
    path: window.location.pathname,
    ts: Date.now(),
    metrics: vitalsBuffer,
  })

  navigator.sendBeacon('/api/perf/vitals', payload)
  sendCount += 1
}

function scheduleFlush(delayMs = 6500) {
  if (flushTimer) return
  flushTimer = window.setTimeout(() => {
    flushTimer = null
    flushMetrics()
  }, delayMs)
}

function observePaintMetrics() {
  if (!('PerformanceObserver' in window)) return

  try {
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      const lastEntry = entries[entries.length - 1]
      if (lastEntry) {
        queueMetric('LCP', Math.round(lastEntry.startTime))
        scheduleFlush()
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
      queueMetric('CLS', Number(clsState.value.toFixed(4)))
      scheduleFlush()
    })
    clsObserver.observe({ type: 'layout-shift', buffered: true })

    const inpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      if (entries.length > 0) {
        const maxInp = Math.max(...entries.map((entry) => entry.duration || 0))
        queueMetric('INP', Math.round(maxInp))
        scheduleFlush()
      }
    })
    inpObserver.observe({ type: 'event', buffered: true, durationThreshold: 40 })
  } catch (error) {
    console.warn('Web vitals observer setup failed:', error)
  }
}

export function startWebVitalsTracking() {
  if (typeof window === 'undefined') return

  // Flush a final batched payload when the tab is backgrounded or closed.
  const flushOnHide = () => {
    if (document.visibilityState === 'hidden') {
      flushMetrics()
    }
  }
  window.addEventListener('pagehide', flushMetrics)
  document.addEventListener('visibilitychange', flushOnHide)

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(observePaintMetrics, { timeout: 2000 })
    return
  }

  window.setTimeout(observePaintMetrics, 1200)
}
