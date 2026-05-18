import React, { useMemo } from 'react'

const NODE_COUNT = 28
const WIDTH = 520
const HEIGHT = 460
const SEED_BASE = 137

function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function buildGraph() {
  const rand = seededRandom(SEED_BASE)
  const nodes = Array.from({ length: NODE_COUNT }, (_, i) => {
    const angle = (i / NODE_COUNT) * Math.PI * 2 + rand() * 0.6
    const radius = 80 + rand() * 140
    const cx = WIDTH / 2 + Math.cos(angle) * radius * 1.2
    const cy = HEIGHT / 2 + Math.sin(angle) * radius * 0.85
    const r = 5 + rand() * 8
    return { id: i, cx, cy, r }
  })

  const edges = []
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].cx - nodes[j].cx
      const dy = nodes[i].cy - nodes[j].cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 140) edges.push({ id: `${i}-${j}`, x1: nodes[i].cx, y1: nodes[i].cy, x2: nodes[j].cx, y2: nodes[j].cy })
    }
  }
  return { nodes, edges }
}

const COLORS = ['#14B8A6', '#3A5A8C', '#0D9488', '#2DD4BF', '#2F4A73']

export default function NeuralNetwork3D() {
  const { nodes, edges } = useMemo(buildGraph, [])
  const rand = useMemo(() => seededRandom(SEED_BASE + 7), [])

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, overflow: 'hidden' }}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{ width: '100%', height: '100%', opacity: 0.85 }}
        aria-hidden="true"
      >
        <defs>
          {COLORS.map((c, i) => (
            <radialGradient key={i} id={`ng${i}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={c} stopOpacity="1" />
              <stop offset="100%" stopColor={c} stopOpacity="0.3" />
            </radialGradient>
          ))}
        </defs>

        {/* Edges */}
        {edges.map((e) => (
          <line
            key={e.id}
            x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
            stroke="#14B8A6"
            strokeWidth="1"
            strokeOpacity="0.25"
            style={{
              animation: `edgePulse ${2 + rand() * 2}s ease-in-out ${rand()}s infinite alternate`,
            }}
          />
        ))}

        {/* Nodes */}
        {nodes.map((n) => {
          const colorIdx = Math.floor(rand() * COLORS.length)
          const dur = `${1.5 + rand() * 2.5}s`
          const delay = `${rand() * 2}s`
          return (
            <circle
              key={n.id}
              cx={n.cx}
              cy={n.cy}
              r={n.r}
              fill={`url(#ng${colorIdx})`}
              style={{
                animation: `nodePulse ${dur} ease-in-out ${delay} infinite alternate`,
                filter: `drop-shadow(0 0 ${n.r * 0.8}px ${COLORS[colorIdx]})`,
              }}
            />
          )
        })}

        <style>{`
          @keyframes nodePulse {
            from { opacity: 0.55; transform: scale(0.88); }
            to   { opacity: 1;    transform: scale(1.12); }
          }
          @keyframes edgePulse {
            from { stroke-opacity: 0.12; }
            to   { stroke-opacity: 0.45; }
          }
          @media (prefers-reduced-motion: reduce) {
            circle, line { animation: none !important; }
          }
        `}</style>
      </svg>
    </div>
  )
}
