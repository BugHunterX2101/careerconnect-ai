import React, { useCallback, useMemo } from 'react'
import Particles from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'

/**
 * ParticleBackground – renders a subtle constellation / data-flow
 * particle field behind content.
 *
 * Props:
 *   id        – unique DOM id (default "tsparticles-bg")
 *   variant   – "hero" | "cta"  (adjusts density / speed)
 *   style     – forwarded to container
 */
export default function ParticleBackground({
  id = 'tsparticles-bg',
  variant = 'hero',
  style = {},
}) {
  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine)
  }, [])

  const isHero = variant === 'hero'

  const options = useMemo(
    () => ({
      fullScreen: false,
      fpsLimit: 60,
      particles: {
        number: {
          value: isHero ? 70 : 50,
          density: { enable: true, width: 1200, height: 800 },
        },
        color: {
          value: ['#14B8A6', '#3A5A8C', '#0D9488', '#2DD4BF'],
        },
        shape: { type: 'circle' },
        opacity: {
          value: { min: 0.15, max: 0.5 },
          animation: { enable: true, speed: 0.6, sync: false },
        },
        size: {
          value: { min: 1.2, max: 3 },
          animation: { enable: true, speed: 1.5, sync: false },
        },
        move: {
          enable: true,
          speed: isHero ? 0.6 : 0.4,
          direction: 'right',
          random: true,
          straight: false,
          outModes: { default: 'out' },
        },
        links: {
          enable: true,
          distance: 140,
          color: '#14B8A6',
          opacity: 0.15,
          width: 1,
        },
      },
      interactivity: {
        events: {
          onHover: { enable: true, mode: 'grab' },
          resize: { enable: true },
        },
        modes: {
          grab: { distance: 160, links: { opacity: 0.35 } },
        },
      },
      detectRetina: true,
    }),
    [isHero],
  )

  return (
    <Particles
      id={id}
      init={particlesInit}
      options={options}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'auto',
        ...style,
      }}
    />
  )
}
