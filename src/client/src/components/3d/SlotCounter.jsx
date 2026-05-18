import React, { useEffect, useState, useRef, useMemo } from 'react'
import { useInView } from 'react-intersection-observer'

/**
 * SlotCounter – shows a stat value with a 3D digit-rolling animation.
 *
 * Props:
 *   value    – display string, e.g. "50K+" or "95%"
 *   duration – total animation ms (default 1800)
 *   style    – forwarded to container
 */
export default function SlotCounter({ value, duration = 1800, style = {} }) {
  const [triggered, setTriggered] = useState(false)
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

  useEffect(() => {
    if (inView) setTriggered(true)
  }, [inView])

  // Fallback: trigger after 2.5 s if the element never enters the viewport
  useEffect(() => {
    const id = setTimeout(() => setTriggered(true), 2500)
    return () => clearTimeout(id)
  }, [])

  const chars = useMemo(() => value.split(''), [value])

  return (
    <span
      ref={ref}
      style={{
        display: 'inline-flex',
        overflow: 'hidden',
        ...style,
      }}
    >
      {chars.map((ch, i) => (
        <SlotDigit
          key={`${i}-${ch}`}
          char={ch}
          triggered={triggered}
          delay={i * 100}
          duration={duration}
        />
      ))}
    </span>
  )
}

/* Individual character cell */
function SlotDigit({ char, triggered, delay, duration }) {
  const isDigit = /\d/.test(char)
  const num = isDigit ? parseInt(char, 10) : 0

  /* For digits, we roll through 0-9 multiple times then land on target */
  const totalSteps = isDigit ? 10 + num : 0
  const stepHeight = 1.15 // em per character cell

  return (
    <span
      style={{
        display: 'inline-block',
        height: `${stepHeight}em`,
        lineHeight: `${stepHeight}em`,
        overflow: 'hidden',
        perspective: '300px',
        position: 'relative',
        minWidth: isDigit ? '0.65em' : undefined,
        textAlign: 'center',
      }}
    >
      {isDigit ? (
        <span
          style={{
            display: 'block',
            transform: triggered
              ? `translateY(-${totalSteps * stepHeight}em) rotateX(0deg)`
              : `translateY(0) rotateX(90deg)`,
            transition: triggered
              ? `transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`
              : 'none',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Render 0-9 twice + final digit for looping effect */}
          {Array.from({ length: totalSteps + 1 }, (_, k) => (
            <span
              key={k}
              style={{
                display: 'block',
                height: `${stepHeight}em`,
                lineHeight: `${stepHeight}em`,
              }}
            >
              {k % 10}
            </span>
          ))}
        </span>
      ) : (
        <span
          style={{
            display: 'inline-block',
            opacity: triggered ? 1 : 0,
            transform: triggered ? 'translateY(0) rotateX(0deg)' : 'translateY(20px) rotateX(-90deg)',
            transition: `all ${duration * 0.6}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
            transformStyle: 'preserve-3d',
          }}
        >
          {char}
        </span>
      )}
    </span>
  )
}
