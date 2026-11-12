"use client"

import { useRef, useState, useEffect } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { PerformanceMonitor } from "@react-three/drei"
import * as THREE from "three"
import type { Group as GroupType, Mesh as MeshType, Points as PointsType } from "three"

/* ═══════════════════════════════════════════════
   1. CAMERA PARALLAX RIG
   ═══════════════════════════════════════════════ */
function CameraRig({ isMobile = false }: { isMobile?: boolean }) {
  const { pointer } = useThree()

  // Mutate camera through useFrame's state parameter, not the frozen ref
  // returned by useThree() — satisfies react-hooks/immutability rule.
  useFrame(({ camera }) => {
    // Target camera coordinates with subtle pointer parallax lerp
    const targetX = isMobile ? 0 : (pointer.x * 0.6)
    const targetY = isMobile ? 0 : (pointer.y * 0.4)

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.05)
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.05)
    camera.lookAt(isMobile ? 0 : 1.2, 0, 0)
  })

  return null
}

interface KeyItem {
  pos: [number, number, number]
  size: [number, number, number]
  color: string
}

function buildStaticKeys(): KeyItem[] {
  const keyList: KeyItem[] = []
  const rows = 5
  const cols = 14
  const keyW = 0.16
  const keyH = 0.04
  const keyD = 0.15
  const startX = -1.15
  const startZ = -0.45

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Spacebar on bottom row
      if (r === 4 && c >= 4 && c <= 9) {
        if (c === 4) {
          keyList.push({
            pos: [startX + 6.5 * (keyW + 0.02), 0.06, startZ + r * (keyD + 0.03)],
            size: [6 * keyW + 5 * 0.02, keyH, keyD],
            color: "#1e293b",
          })
        }
        continue
      }
      keyList.push({
        pos: [startX + c * (keyW + 0.02), 0.06, startZ + r * (keyD + 0.03)],
        size: [keyW, keyH, keyD],
        color: r === 0 ? "#0f172a" : "#1e293b",
      })
    }
  }
  return keyList
}

const STATIC_KEYS: KeyItem[] = buildStaticKeys()

interface CodeLineItem {
  width: number
  color: string
  indent: number
}

const STATIC_CODE_LINES: CodeLineItem[] = [
  { width: 1.2, color: "#c084fc", indent: 0 },
  { width: 1.8, color: "#60a5fa", indent: 0.2 },
  { width: 1.4, color: "#38bdf8", indent: 0.4 },
  { width: 2.1, color: "#34d399", indent: 0.6 },
  { width: 1.1, color: "#fde047", indent: 0.6 },
  { width: 1.6, color: "#818cf8", indent: 0.4 },
  { width: 0.8, color: "#38bdf8", indent: 0.2 },
  { width: 1.9, color: "#c084fc", indent: 0.4 },
  { width: 1.3, color: "#34d399", indent: 0.6 },
  { width: 0.9, color: "#f472b6", indent: 0.2 },
]

/* ═══════════════════════════════════════════════
   2. PROCEDURAL 3D LAPTOP WORKSPACE
   ═══════════════════════════════════════════════ */
function ProceduralLaptop({ lowQuality = false }: { lowQuality?: boolean }) {
  const laptopGroupRef = useRef<GroupType>(null!)
  const cursorRef = useRef<MeshType>(null!)
  const screenGlowRef = useRef<MeshType>(null!)

  const keys = STATIC_KEYS
  const codeLines = STATIC_CODE_LINES

  useFrame((state) => {
    const t = state.clock.elapsedTime

    // Gentle float and tilt animation
    if (laptopGroupRef.current) {
      laptopGroupRef.current.position.y = Math.sin(t * 1.2) * 0.12
      laptopGroupRef.current.rotation.y = Math.sin(t * 0.6) * 0.08 + 0.3
      laptopGroupRef.current.rotation.x = Math.cos(t * 0.8) * 0.03 + 0.15
    }

    // Cursor blink effect
    if (cursorRef.current) {
      cursorRef.current.visible = Math.floor(t * 3) % 2 === 0
    }

    // Screen ambient pulse
    if (screenGlowRef.current) {
      const mat = screenGlowRef.current.material as THREE.MeshStandardMaterial
      if (mat) mat.emissiveIntensity = 0.25 + Math.sin(t * 2) * 0.08
    }
  })

  return (
    <group ref={laptopGroupRef} position={[3.4, -0.2, -0.3]} scale={[1.15, 1.15, 1.15]}>
      
      {/* ── LAPTOP BASE (CHASSIS) ── */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[3.2, 0.12, 2.2]} />
        <meshStandardMaterial color="#0b1329" metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Front edge glowing power strip */}
      <mesh position={[0, -0.01, 1.11]}>
        <boxGeometry args={[3.21, 0.03, 0.02]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={1.5} />
      </mesh>

      {/* Keyboard Tray Recess */}
      <mesh position={[0, 0.065, -0.15]}>
        <boxGeometry args={[2.7, 0.01, 1.1]} />
        <meshStandardMaterial color="#050914" roughness={0.6} />
      </mesh>

      {/* Keyboard Keys */}
      {keys.map((k, i) => (
        <mesh key={i} position={k.pos}>
          <boxGeometry args={k.size} />
          <meshStandardMaterial color={k.color} roughness={0.4} />
        </mesh>
      ))}

      {/* Trackpad */}
      <mesh position={[0, 0.065, 0.65]}>
        <boxGeometry args={[0.9, 0.005, 0.6]} />
        <meshStandardMaterial color="#0f172a" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Trackpad Border Accent */}
      <mesh position={[0, 0.066, 0.65]}>
        <boxGeometry args={[0.92, 0.002, 0.62]} />
        <meshStandardMaterial color="#3b82f6" transparent opacity={0.3} />
      </mesh>

      {/* Hinge Cylinders */}
      <mesh position={[-1.1, 0.07, -1.05]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 0.4, 16]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} />
      </mesh>
      <mesh position={[1.1, 0.07, -1.05]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 0.4, 16]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} />
      </mesh>

      {/* ── LAPTOP DISPLAY (OPENED SCREEN AT ~105°) ── */}
      <group position={[0, 0.06, -1.05]} rotation={[-0.28, 0, 0]}>
        
        {/* Screen Outer Back Shell */}
        <mesh position={[0, 1.05, -0.04]}>
          <boxGeometry args={[3.2, 2.1, 0.08]} />
          <meshStandardMaterial color="#090d1a" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Apple/Logo Emblem Glow on back */}
        <mesh position={[0, 1.05, -0.082]} rotation={[0, Math.PI, 0]}>
          <circleGeometry args={[0.18, 24]} />
          <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={1.2} />
        </mesh>

        {/* Screen Bezel (Front) */}
        <mesh position={[0, 1.05, 0.001]}>
          <boxGeometry args={[3.16, 2.06, 0.01]} />
          <meshStandardMaterial color="#040711" roughness={0.8} />
        </mesh>

        {/* Web Camera Dot */}
        <mesh position={[0, 2.02, 0.01]}>
          <circleGeometry args={[0.015, 12]} />
          <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={2} />
        </mesh>

        {/* ── ACTIVE CODE EDITOR DISPLAY SURFACE ── */}
        <mesh ref={screenGlowRef} position={[0, 1.05, 0.008]}>
          <planeGeometry args={[2.95, 1.85]} />
          <meshStandardMaterial
            color="#070c1b"
            emissive="#1e3a8a"
            emissiveIntensity={0.25}
            roughness={0.1}
          />
        </mesh>

        {/* IDE Header Bar */}
        <mesh position={[0, 1.88, 0.01]}>
          <planeGeometry args={[2.95, 0.16]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        {/* Window control dots (Red, Yellow, Green) */}
        <mesh position={[-1.32, 1.88, 0.012]}>
          <circleGeometry args={[0.02, 12]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        <mesh position={[-1.24, 1.88, 0.012]}>
          <circleGeometry args={[0.02, 12]} />
          <meshBasicMaterial color="#eab308" />
        </mesh>
        <mesh position={[-1.16, 1.88, 0.012]}>
          <circleGeometry args={[0.02, 12]} />
          <meshBasicMaterial color="#22c55e" />
        </mesh>

        {/* Simulated Code Lines */}
        {codeLines.map((line, idx) => (
          <mesh
            key={idx}
            position={[-1.3 + line.indent + line.width / 2, 1.68 - idx * 0.14, 0.011]}
          >
            <planeGeometry args={[line.width, 0.05]} />
            <meshBasicMaterial color={line.color} transparent opacity={0.9} />
          </mesh>
        ))}

        {/* Blinking Cursor */}
        <mesh ref={cursorRef} position={[-0.3, 0.42, 0.012]}>
          <planeGeometry args={[0.04, 0.09]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>

        {/* Screen Glass Reflection Shimmer Overlay */}
        <mesh position={[0, 1.05, 0.015]} rotation={[0, 0, -Math.PI / 6]}>
          <planeGeometry args={[3.2, 0.4]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.03} />
        </mesh>
      </group>
    </group>
  )
}

/* ═══════════════════════════════════════════════
   3. FLOATING DEVELOPER UI ELEMENTS & BADGES
   ═══════════════════════════════════════════════ */
function FloatingTerminalBadge() {
  const groupRef = useRef<GroupType>(null!)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (groupRef.current) {
      groupRef.current.position.y = 1.4 + Math.sin(t * 1.5 + 1) * 0.1
      groupRef.current.rotation.z = Math.sin(t * 0.8) * 0.03
    }
  })

  return (
    <group ref={groupRef} position={[-0.8, 1.4, 0.8]}>
      {/* Glass card panel */}
      <mesh>
        <planeGeometry args={[1.7, 0.9]} />
        <meshStandardMaterial
          color="#0b1329"
          emissive="#1d4ed8"
          emissiveIntensity={0.2}
          transparent
          opacity={0.85}
          roughness={0.2}
        />
      </mesh>

      {/* Header bar */}
      <mesh position={[0, 0.35, 0.005]}>
        <planeGeometry args={[1.7, 0.18]} />
        <meshBasicMaterial color="#1e293b" transparent opacity={0.9} />
      </mesh>
      {/* Dots */}
      <mesh position={[-0.7, 0.35, 0.01]}>
        <circleGeometry args={[0.025, 12]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <mesh position={[-0.6, 0.35, 0.01]}>
        <circleGeometry args={[0.025, 12]} />
        <meshBasicMaterial color="#eab308" />
      </mesh>
      <mesh position={[-0.5, 0.35, 0.01]}>
        <circleGeometry args={[0.025, 12]} />
        <meshBasicMaterial color="#22c55e" />
      </mesh>

      {/* Terminal prompt lines */}
      <mesh position={[-0.2, 0.1, 0.008]}>
        <planeGeometry args={[1.1, 0.05]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
      <mesh position={[-0.1, -0.08, 0.008]}>
        <planeGeometry args={[1.3, 0.05]} />
        <meshBasicMaterial color="#34d399" />
      </mesh>
      <mesh position={[-0.35, -0.26, 0.008]}>
        <planeGeometry args={[0.8, 0.05]} />
        <meshBasicMaterial color="#c084fc" />
      </mesh>
    </group>
  )
}

function FloatingCodeBadge() {
  const meshRef = useRef<MeshType>(null!)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (meshRef.current) {
      meshRef.current.position.y = 2.1 + Math.sin(t * 1.8 + 2) * 0.12
      meshRef.current.rotation.y = t * 0.5
    }
  })

  return (
    <mesh ref={meshRef} position={[4.6, 2.1, 0.5]}>
      <octahedronGeometry args={[0.32, 0]} />
      <meshStandardMaterial
        color="#38bdf8"
        emissive="#3b82f6"
        emissiveIntensity={1.8}
        wireframe
      />
    </mesh>
  )
}

function FloatingStatusBadge() {
  const groupRef = useRef<GroupType>(null!)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (groupRef.current) {
      groupRef.current.position.y = -1.5 + Math.sin(t * 1.3 + 0.5) * 0.08
    }
  })

  return (
    <group ref={groupRef} position={[0.2, -1.5, 0.5]}>
      <mesh>
        <planeGeometry args={[1.6, 0.45]} />
        <meshStandardMaterial color="#090d1a" transparent opacity={0.8} roughness={0.3} />
      </mesh>
      {/* Green indicator light */}
      <mesh position={[-0.6, 0, 0.01]}>
        <circleGeometry args={[0.04, 16]} />
        <meshBasicMaterial color="#34d399" />
      </mesh>
      <mesh position={[0.1, 0, 0.01]}>
        <planeGeometry args={[0.9, 0.06]} />
        <meshBasicMaterial color="#60a5fa" />
      </mesh>
    </group>
  )
}

/* ═══════════════════════════════════════════════
   4. AMBIENT PARTICLES & SCENE CONTENT
   ═══════════════════════════════════════════════ */

// Pre-compute stable particle arrays outside of component to satisfy
// react-hooks/purity (Math.random is an impure function and must not
// be called inside render or useMemo that can re-run during render).
function _buildParticlePositions(count: number): Float32Array {
  const pos = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 16
    pos[i * 3 + 1] = (Math.random() - 0.5) * 10
    pos[i * 3 + 2] = (Math.random() - 0.5) * 8
  }
  return pos
}
const _PARTICLES_NORMAL = _buildParticlePositions(220)
const _PARTICLES_LOW = _buildParticlePositions(80)

function AmbientParticles({ lowQuality = false }: { lowQuality?: boolean }) {
  const pointsRef = useRef<PointsType>(null!)

  const particles = lowQuality ? _PARTICLES_LOW : _PARTICLES_NORMAL

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[particles, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#38bdf8"
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

function SceneContent({ lowQuality = false }: { lowQuality?: boolean }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={1.4} color="#60a5fa" />
      <pointLight position={[3, 2, 3]} intensity={2.5} color="#38bdf8" distance={10} />
      <pointLight position={[-2, 3, 2]} intensity={1.2} color="#8b5cf6" distance={8} />

      <ProceduralLaptop lowQuality={lowQuality} />
      <FloatingTerminalBadge />
      <FloatingCodeBadge />
      <FloatingStatusBadge />
      <AmbientParticles lowQuality={lowQuality} />

      <CameraRig />
    </>
  )
}

/* ═══════════════════════════════════════════════
   5. REDUCED MOTION & VISUAL FALLBACK COMPONENT
   ═══════════════════════════════════════════════ */
function StaticVisualFallback() {
  return (
    <div className="absolute inset-0 bg-[#050811] overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 right-[10%] w-[550px] h-[550px] rounded-full bg-blue-600/20 blur-[150px]" />
      <div className="absolute bottom-1/3 right-[5%] w-[450px] h-[450px] rounded-full bg-cyan-500/15 blur-[130px]" />

      {/* CSS Laptop Fallback Silhouette */}
      <div className="absolute top-1/2 right-[12%] -translate-y-1/2 w-[420px] max-w-[90vw] hidden md:block">
        <div className="relative rounded-2xl border border-blue-500/30 bg-[#0b1329]/90 p-3 shadow-[0_25px_80px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
          {/* Screen Top Bar */}
          <div className="flex items-center gap-1.5 mb-3 pb-2 border-b border-white/10">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            <span className="ml-2 text-[10px] font-mono text-blue-400">app/courses/page.tsx</span>
          </div>

          {/* Screen Code Lines Silhouette */}
          <div className="space-y-2 p-2 font-mono text-xs">
            <div className="h-2.5 w-1/3 rounded bg-purple-400/80 animate-pulse" />
            <div className="h-2.5 w-2/3 rounded bg-blue-400/70 ml-4" />
            <div className="h-2.5 w-1/2 rounded bg-cyan-400/80 ml-8" />
            <div className="h-2.5 w-3/4 rounded bg-emerald-400/80 ml-8" />
            <div className="h-2.5 w-2/5 rounded bg-indigo-400/70 ml-4" />
          </div>
        </div>

        {/* Laptop Base Lip */}
        <div className="h-3 w-[108%] -ml-[4%] rounded-b-xl bg-slate-900 border-t border-blue-400/40 shadow-lg" />
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   6. MAIN SCENE ENTRYPOINT
   ═══════════════════════════════════════════════ */
export default function Scene() {
  const [dpr, setDpr] = useState<number>(1.5)
  const [lowQuality, setLowQuality] = useState<boolean>(false)
  // Initialise from matchMedia so there's no layout flash; update via listener.
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  )

  useEffect(() => {
    if (typeof window === "undefined") return
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")

    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  if (prefersReducedMotion) {
    return <StaticVisualFallback />
  }

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 8.5], fov: 50 }}
        dpr={dpr}
        gl={{ antialias: !lowQuality, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
      >
        <PerformanceMonitor
          bounds={() => [30, 60]}
          onDecline={() => {
            setDpr(1.0)
            setLowQuality(true)
          }}
          onIncline={() => {
            setDpr(1.5)
            setLowQuality(false)
          }}
          onChange={({ factor }) => {
            setDpr(Math.max(1.0, 1 + factor * 0.5))
          }}
        >
          <SceneContent lowQuality={lowQuality} />
        </PerformanceMonitor>
      </Canvas>
    </div>
  )
}
