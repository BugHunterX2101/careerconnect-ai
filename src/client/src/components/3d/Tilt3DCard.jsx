import React, { useRef, useState, useCallback } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

/**
 * Tilt3DCard – wraps children in a 3D-tiltable card that follows the cursor.
 *
 * Props:
 *   maxTilt   – max tilt angle in deg (default 12)
 *   scale     – hover scale           (default 1.04)
 *   glareOn   – show glare overlay    (default true)
 *   children  – the actual card JSX
 *   style     – forwarded to wrapper
 */
export default function Tilt3DCard({
  children,
  maxTilt = 12,
  scale = 1.04,
  glareOn = true,
  style = {},
  ...rest
}) {
  const ref = useRef(null)
  const [hovering, setHovering] = useState(false)

  // Raw motion values driven by pointer
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Smooth spring interpolation
  const springConfig = { damping: 20, stiffness: 200 }
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [maxTilt, -maxTilt]), springConfig)
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-maxTilt, maxTilt]), springConfig)

  // Glare position mapped from pointer
  const glareX = useTransform(x, [-0.5, 0.5], [0, 100])
  const glareY = useTransform(y, [-0.5, 0.5], [0, 100])

  const handleMove = useCallback(
    (e) => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const px = (e.clientX - rect.left) / rect.width - 0.5
      const py = (e.clientY - rect.top) / rect.height - 0.5
      x.set(px)
      y.set(py)
    },
    [x, y],
  )

  const handleEnter = useCallback(() => setHovering(true), [])
  const handleLeave = useCallback(() => {
    setHovering(false)
    x.set(0)
    y.set(0)
  }, [x, y])

  return (
    <div
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
        ...style,
      }}
      {...rest}
    >
      <motion.div
        ref={ref}
        onMouseMove={handleMove}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          position: 'relative',
          width: '100%',
          height: '100%',
        }}
        whileHover={{ scale }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      >
        {children}

        {/* Glare overlay */}
        {glareOn && (
          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              pointerEvents: 'none',
              zIndex: 2,
              background: useTransform(
                [glareX, glareY],
                ([gx, gy]) =>
                  `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.22) 0%, transparent 60%)`,
              ),
              opacity: hovering ? 1 : 0,
              transition: 'opacity 0.35s ease',
            }}
          />
        )}
      </motion.div>
    </div>
  )
}
