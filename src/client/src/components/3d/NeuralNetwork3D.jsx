import React, { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

/* ─── helper: generate brain-shaped node positions ─── */
function generateNodes(count = 55) {
  const positions = []
  for (let i = 0; i < count; i++) {
    // spherical distribution with brain-like flattening
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const r = 2.2 + Math.random() * 0.8
    const x = r * Math.sin(phi) * Math.cos(theta) * 1.3 // wider
    const y = r * Math.sin(phi) * Math.sin(theta) * 0.9 // flatter
    const z = r * Math.cos(phi) * 1.1
    positions.push(new THREE.Vector3(x, y, z))
  }
  return positions
}

/* ─── helper: generate connections between nearby nodes ─── */
function generateEdges(nodes, maxDist = 2.2) {
  const edges = []
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const d = nodes[i].distanceTo(nodes[j])
      if (d < maxDist) {
        edges.push([nodes[i], nodes[j], d])
      }
    }
  }
  return edges
}

/* ─── Glowing Node ─── */
function Node({ position, color, scale = 1 }) {
  const ref = useRef()
  const baseScale = 0.08 * scale
  const speed = 0.5 + Math.random() * 1.5

  useFrame(({ clock }) => {
    if (ref.current) {
      const pulse = 1 + Math.sin(clock.getElapsedTime() * speed) * 0.35
      ref.current.scale.setScalar(baseScale * pulse)
    }
  })

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1.4}
        toneMapped={false}
      />
    </mesh>
  )
}

/* ─── Edge Lines ─── */
function Edges({ edges }) {
  const ref = useRef()

  const { positions, colors } = useMemo(() => {
    const pos = []
    const col = []
    const c1 = new THREE.Color('#14B8A6')
    const c2 = new THREE.Color('#3A5A8C')

    edges.forEach(([a, b, d]) => {
      pos.push(a.x, a.y, a.z, b.x, b.y, b.z)
      const t = d / 2.2
      const mixed = c1.clone().lerp(c2, t)
      col.push(mixed.r, mixed.g, mixed.b, mixed.r, mixed.g, mixed.b)
    })

    return {
      positions: new Float32Array(pos),
      colors: new Float32Array(col),
    }
  }, [edges])

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.material.opacity = 0.25 + Math.sin(clock.getElapsedTime() * 0.4) * 0.1
    }
  })

  return (
    <lineSegments ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <lineBasicMaterial vertexColors transparent opacity={0.3} />
    </lineSegments>
  )
}

/* ─── Rotating Network Group ─── */
function NeuralNetworkScene() {
  const groupRef = useRef()
  const nodes = useMemo(() => generateNodes(55), [])
  const edges = useMemo(() => generateEdges(nodes), [nodes])

  const colorTeal = '#14B8A6'
  const colorBlue = '#3A5A8C'
  const colorMint = '#0D9488'

  const nodeColors = useMemo(() => {
    const palette = [colorTeal, colorBlue, colorMint]
    return nodes.map(() => palette[Math.floor(Math.random() * palette.length)])
  }, [nodes])

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.08
      groupRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.05) * 0.1
    }
  })

  return (
    <group ref={groupRef}>
      <Edges edges={edges} />
      {nodes.map((pos, i) => (
        <Node
          key={i}
          position={[pos.x, pos.y, pos.z]}
          color={nodeColors[i]}
          scale={0.7 + Math.random() * 0.8}
        />
      ))}
    </group>
  )
}

/* ─── Canvas Wrapper ─── */
export default function NeuralNetwork3D() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'auto',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 7], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[5, 5, 5]} intensity={1.2} color="#14B8A6" />
        <pointLight position={[-5, -3, 3]} intensity={0.8} color="#3A5A8C" />

        <Float speed={1.4} rotationIntensity={0.2} floatIntensity={0.5}>
          <NeuralNetworkScene />
        </Float>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 1.5}
          minPolarAngle={Math.PI / 3}
        />
      </Canvas>
    </div>
  )
}
