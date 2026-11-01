'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import {
  ContactShadows,
  Environment,
  Float,
  MeshTransmissionMaterial,
  RoundedBox,
} from '@react-three/drei'
import { useRef } from 'react'
import type { Group } from 'three'

const ACCENT = '#a8384c'
const INK = '#1c1f26'

function Composition() {
  const group = useRef<Group>(null)

  useFrame((state, delta) => {
    if (!group.current) return
    const targetY = state.pointer.x * 0.35
    const targetX = -state.pointer.y * 0.2
    group.current.rotation.y += (targetY - group.current.rotation.y) * delta * 2
    group.current.rotation.x += (targetX - group.current.rotation.x) * delta * 2
  })

  return (
    <group ref={group}>
      <Float speed={1.4} rotationIntensity={0.4} floatIntensity={0.8}>
        <mesh position={[0, 0.15, 0]} castShadow>
          <torusKnotGeometry args={[0.8, 0.28, 400, 64]} />
          <meshPhysicalMaterial
            color={ACCENT}
            metalness={0.6}
            roughness={0.15}
            clearcoat={1}
            clearcoatRoughness={0.05}
          />
        </mesh>
      </Float>

      <Float speed={2} rotationIntensity={0.6} floatIntensity={1.2}>
        <mesh position={[1.75, 1.1, -0.6]}>
          <sphereGeometry args={[0.42, 128, 128]} />
          <MeshTransmissionMaterial
            thickness={0.6}
            roughness={0.05}
            transmission={1}
            ior={1.4}
            chromaticAberration={0.04}
            backside
          />
        </mesh>
      </Float>

      <Float speed={1.6} rotationIntensity={0.8} floatIntensity={1}>
        <RoundedBox
          args={[0.75, 0.75, 0.75]}
          radius={0.14}
          smoothness={8}
          position={[-1.8, -0.75, 0.3]}
          rotation={[0.5, 0.6, 0]}
        >
          <meshPhysicalMaterial color={INK} metalness={0.9} roughness={0.2} clearcoat={1} />
        </RoundedBox>
      </Float>

      <Float speed={2.4} rotationIntensity={1} floatIntensity={1.4}>
        <mesh position={[-1.4, 1.35, -0.8]}>
          <torusGeometry args={[0.3, 0.1, 64, 128]} />
          <meshPhysicalMaterial color="#e9e6e3" metalness={1} roughness={0.12} />
        </mesh>
      </Float>
    </group>
  )
}

export function HeroScene() {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, 6.2], fov: 42 }}
      shadows
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 6, 4]} intensity={1.6} castShadow />
      <Composition />
      <ContactShadows position={[0, -1.7, 0]} opacity={0.35} scale={9} blur={2.6} far={3} />
      <Environment preset="studio" />
    </Canvas>
  )
}
