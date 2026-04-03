'use client'

import { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGLTF, OrbitControls, Environment } from '@react-three/drei'
import { EffectComposer } from '@react-three/postprocessing'
import { useControls } from 'leva'
import { Box3, Vector3 } from 'three'
import { KuwaharaPass } from '@/lib/shaders/KuwaharaEffect'
import { OutlinePass } from '@/lib/shaders/OutlineEffect'
import { BoilingPass } from '@/lib/shaders/BoilingEffect'
import { PaperOverlayPass } from '@/lib/shaders/PaperOverlayEffect'

// ── Charge et centre le modèle GLTF ──
function GltfScene({ src }: { src: string }) {
  const { scene } = useGLTF(src)

  const centered = useMemo(() => {
    const box = new Box3().setFromObject(scene)
    const center = box.getCenter(new Vector3())
    scene.position.sub(center)
    return scene
  }, [scene])

  return <primitive object={centered} />
}

// ── Pipeline watercolor ──
function WatercolorEffects() {
  const { kuwahara, outline, boiling, paper } = useControls('Watercolor', {
    kuwahara: true,
    outline:  true,
    boiling:  true,
    paper:    true,
  })

  return (
    <EffectComposer key={`${kuwahara}-${outline}-${boiling}-${paper}`}>
      {kuwahara ? <KuwaharaPass radius={2} /> : <></>}
      {outline  ? <OutlinePass edgeStrength={3.0} edgeColor="#2d1a0e" noiseFrequency={8.0} /> : <></>}
      {boiling  ? <BoilingPass speed={1.0} strength={0.002} /> : <></>}
      {paper    ? <PaperOverlayPass opacity={0.15} /> : <></>}
    </EffectComposer>
  )
}

// ── Composant public ──
export default function WatercolorViewer({ src }: { src: string }) {
  return (
    <div style={{ width: '100%', height: '60vh' }}>
      <Canvas camera={{ position: [0, 1, 3], fov: 45 }} gl={{ antialias: true }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={1.2} />
        <Suspense fallback={null}>
          <GltfScene src={src} />
          <Environment preset="sunset" />
        </Suspense>
        <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} />
        <WatercolorEffects />
      </Canvas>
    </div>
  )
}
