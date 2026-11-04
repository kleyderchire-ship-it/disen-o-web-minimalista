'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Center, Environment, Float, RoundedBox, Sparkles, Text3D } from '@react-three/drei'
import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Group, PerspectiveCamera } from 'three'
import { MathUtils } from 'three'

const SERIF = '/fonts/gentilis_bold.typeface.json'
const SANS = '/fonts/helvetiker_bold.typeface.json'

const IVORY = '#efe4d6'
const ROSE = '#c4475f'
const WINE = '#6e1f33'

const FOV = 35
const CAMERA_Z = 14

function worldUnitsPerPixel(viewportHeight: number) {
  const worldHeight = 2 * CAMERA_Z * Math.tan(MathUtils.degToRad(FOV / 2))
  return worldHeight / viewportHeight
}

function ScrollCamera() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const size = useThree((s) => s.size)

  useFrame((state) => {
    const k = worldUnitsPerPixel(size.height)
    camera.position.y = -(window.scrollY + size.height / 2) * k
    camera.position.x = MathUtils.lerp(camera.position.x, state.pointer.x * 0.4, 0.05)
    camera.lookAt(0, camera.position.y, 0)
  })

  return null
}

type Box = { w: number; h: number }

function Anchored({
  id,
  z = 0,
  children,
}: {
  id: string
  z?: number
  children: (box: Box) => ReactNode
}) {
  const group = useRef<Group>(null)
  const size = useThree((s) => s.size)
  const [box, setBox] = useState<Box | null>(null)
  const center = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const el = document.getElementById(id)
    if (!el) return
    const measure = () => {
      const k = worldUnitsPerPixel(window.innerHeight)
      const rect = el.getBoundingClientRect()
      center.current = {
        x: rect.left + window.scrollX + rect.width / 2,
        y: rect.top + window.scrollY + rect.height / 2,
      }
      setBox({ w: rect.width * k, h: rect.height * k })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(document.body)
    observer.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [id])

  useFrame(() => {
    if (!group.current) return
    const k = worldUnitsPerPixel(size.height)
    group.current.position.set(
      (center.current.x - size.width / 2) * k,
      -center.current.y * k,
      z,
    )
  })

  return <group ref={group}>{box && children(box)}</group>
}

function FitText({
  text,
  box,
  font = SERIF,
  depth = 0.35,
  children,
}: {
  text: string
  box: Box
  font?: string
  depth?: number
  children: ReactNode
}) {
  const [dims, setDims] = useState<Box | null>(null)
  const scale = dims ? Math.min(box.w / dims.w, box.h / dims.h) : 0.0001

  return (
    <group scale={scale}>
      <Center
        cacheKey={text}
        onCentered={({ width, height }) =>
          setDims((prev) =>
            prev && Math.abs(prev.w - width) < 1e-3 && Math.abs(prev.h - height) < 1e-3
              ? prev
              : { w: width, h: height },
          )
        }
      >
        <Text3D
          font={font}
          size={1}
          height={depth}
          curveSegments={24}
          bevelEnabled
          bevelThickness={0.03}
          bevelSize={0.02}
          bevelSegments={8}
          letterSpacing={0.02}
        >
          {text}
          {children}
        </Text3D>
      </Center>
    </group>
  )
}

function Tilt({ children, strength = 0.25 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<Group>(null)
  useFrame((state, delta) => {
    if (!ref.current) return
    const t = Math.min(1, delta * 3)
    ref.current.rotation.y = MathUtils.lerp(ref.current.rotation.y, state.pointer.x * strength, t)
    ref.current.rotation.x = MathUtils.lerp(ref.current.rotation.x, -state.pointer.y * strength * 0.5, t)
  })
  return <group ref={ref}>{children}</group>
}

function Spin({ children, speed = 0.3 }: { children: ReactNode; speed?: number }) {
  const ref = useRef<Group>(null)
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * speed
  })
  return <group ref={ref}>{children}</group>
}

const ivoryMetal = (
  <meshPhysicalMaterial color={IVORY} metalness={1} roughness={0.16} clearcoat={1} clearcoatRoughness={0.1} />
)
const roseLacquer = (
  <meshPhysicalMaterial color={ROSE} metalness={0.55} roughness={0.18} clearcoat={1} clearcoatRoughness={0.05} />
)
const glass = (
  <meshPhysicalMaterial
    color="#ffffff"
    transmission={1}
    thickness={1.2}
    roughness={0.04}
    ior={1.45}
    metalness={0}
    clearcoat={1}
    attenuationColor={ROSE}
    attenuationDistance={2.5}
  />
)

function HeroPieces() {
  return (
    <>
      <Anchored id="a-hero-title">
        {(box) => (
          <Tilt>
            <FitText text="MAISON" box={box}>
              {ivoryMetal}
            </FitText>
          </Tilt>
        )}
      </Anchored>
      <Anchored id="a-hero-title" z={-2}>
        {(box) => (
          <>
            <Float speed={1.6} rotationIntensity={0.8} floatIntensity={1.2}>
              <mesh position={[box.w * 0.46, box.h * 0.75, 0]}>
                <sphereGeometry args={[box.h * 0.32, 128, 128]} />
                {glass}
              </mesh>
            </Float>
            <Float speed={2} rotationIntensity={1.2} floatIntensity={1.4}>
              <mesh position={[-box.w * 0.44, -box.h * 0.85, 1]} rotation={[0.8, 0.3, 0]}>
                <torusGeometry args={[box.h * 0.22, box.h * 0.06, 64, 160]} />
                {roseLacquer}
              </mesh>
            </Float>
            <Float speed={1.3} rotationIntensity={0.6} floatIntensity={1}>
              <mesh position={[box.w * 0.3, -box.h * 1.1, -1]}>
                <torusKnotGeometry args={[box.h * 0.14, box.h * 0.045, 300, 48]} />
                {ivoryMetal}
              </mesh>
            </Float>
          </>
        )}
      </Anchored>
    </>
  )
}

function ServicesPieces() {
  return (
    <Anchored id="a-services">
      {(box) => {
        const r = Math.min(box.w, box.h) * 0.28
        return (
          <Tilt strength={0.4}>
            <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.6}>
              <mesh>
                <sphereGeometry args={[r, 128, 128]} />
                {glass}
              </mesh>
              <mesh scale={0.42}>
                <icosahedronGeometry args={[r, 0]} />
                {roseLacquer}
              </mesh>
              <Spin speed={0.4}>
                <mesh rotation={[Math.PI / 2.4, 0, 0]}>
                  <torusGeometry args={[r * 1.45, r * 0.035, 32, 200]} />
                  {ivoryMetal}
                </mesh>
              </Spin>
              <Spin speed={-0.25}>
                <mesh rotation={[Math.PI / 1.8, 0.6, 0]}>
                  <torusGeometry args={[r * 1.75, r * 0.025, 32, 200]} />
                  {roseLacquer}
                </mesh>
                <mesh position={[r * 1.75, 0, 0]}>
                  <sphereGeometry args={[r * 0.12, 64, 64]} />
                  {ivoryMetal}
                </mesh>
              </Spin>
            </Float>
          </Tilt>
        )
      }}
    </Anchored>
  )
}

const STATS = ['+40', '3,2x', '24/7', '48 h']

function ResultsPieces() {
  return (
    <>
      {STATS.map((value, i) => (
        <Anchored key={value} id={`a-stat-${i}`}>
          {(box) => (
            <Tilt strength={0.35}>
              <Float speed={1.4 + i * 0.2} rotationIntensity={0.15} floatIntensity={0.4}>
                <FitText text={value} box={box} font={SANS} depth={0.45}>
                  {i % 2 === 0 ? roseLacquer : ivoryMetal}
                </FitText>
              </Float>
            </Tilt>
          )}
        </Anchored>
      ))}
    </>
  )
}

function ProcessPieces() {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <Anchored key={i} id={`a-step-${i}`}>
          {(box) => {
            const w = Math.min(box.w * 0.55, box.h * 0.9)
            const h = box.h * (0.3 + i * 0.22)
            return (
              <Tilt strength={0.5}>
                <group position={[0, -box.h / 2 + h / 2, 0]} rotation={[0.18, -0.5, 0]}>
                  <RoundedBox args={[w, h, w]} radius={w * 0.08} smoothness={6}>
                    {i === 3 ? roseLacquer : <meshPhysicalMaterial color="#2a2326" metalness={0.8} roughness={0.25} clearcoat={1} />}
                  </RoundedBox>
                  <group position={[0, h / 2 + w * 0.22, 0]}>
                    <FitText
                      text={`0${i + 1}`}
                      box={{ w: w * 0.8, h: w * 0.34 }}
                      font={SANS}
                      depth={0.3}
                    >
                      {ivoryMetal}
                    </FitText>
                  </group>
                </group>
              </Tilt>
            )
          }}
        </Anchored>
      ))}
    </>
  )
}

function FaqPieces() {
  return (
    <Anchored id="a-faq" z={-1}>
      {(box) => {
        const r = Math.min(box.w, box.h) * 0.22
        return (
          <Float speed={1.5} rotationIntensity={1} floatIntensity={1}>
            <Spin speed={0.2}>
              <mesh>
                <torusKnotGeometry args={[r, r * 0.3, 400, 64, 2, 3]} />
                {roseLacquer}
              </mesh>
            </Spin>
          </Float>
        )
      }}
    </Anchored>
  )
}

function FinalePieces() {
  return (
    <>
      <Anchored id="a-finale">
        {(box) => (
          <Tilt strength={0.4}>
            <Float speed={1.2} rotationIntensity={0.25} floatIntensity={0.6}>
              <FitText text="M" box={{ w: box.w, h: box.h * 0.8 }} depth={0.6}>
                {glass}
              </FitText>
            </Float>
          </Tilt>
        )}
      </Anchored>
      <Anchored id="a-finale" z={-1.5}>
        {(box) => (
          <Spin speed={0.15}>
            <mesh rotation={[Math.PI / 2.2, 0, 0]}>
              <torusGeometry args={[box.h * 0.62, box.h * 0.025, 32, 240]} />
              {ivoryMetal}
            </mesh>
            <mesh rotation={[Math.PI / 2.6, 0.5, 0]}>
              <torusGeometry args={[box.h * 0.78, box.h * 0.012, 32, 240]} />
              {roseLacquer}
            </mesh>
          </Spin>
        )}
      </Anchored>
      <Anchored id="a-footer-word" z={-0.5}>
        {(box) => (
          <FitText text="MAISON" box={box} depth={0.5}>
            <meshPhysicalMaterial color={WINE} metalness={0.7} roughness={0.3} clearcoat={1} />
          </FitText>
        )}
      </Anchored>
    </>
  )
}

function Atmosphere() {
  const ref = useRef<Group>(null)
  const camera = useThree((s) => s.camera)
  useFrame(() => {
    if (ref.current) ref.current.position.y = camera.position.y
  })
  return (
    <group ref={ref}>
      <Sparkles count={120} scale={[24, 14, 10]} size={2.2} speed={0.25} color={IVORY} opacity={0.5} />
      <Sparkles count={50} scale={[24, 14, 10]} size={3.5} speed={0.2} color={ROSE} opacity={0.6} />
    </group>
  )
}

export function WorldScene() {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, CAMERA_Z], fov: FOV, near: 0.1, far: 60 }}
    >
      <ambientLight intensity={0.25} />
      <ScrollCamera />
      <Suspense fallback={null}>
        <Environment preset="studio" environmentIntensity={0.9} />
        <HeroPieces />
        <ServicesPieces />
        <ResultsPieces />
        <ProcessPieces />
        <FaqPieces />
        <FinalePieces />
      </Suspense>
      <Atmosphere />
    </Canvas>
  )
}
