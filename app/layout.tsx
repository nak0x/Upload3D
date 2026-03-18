import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Asset Bridge 3D',
  description: 'Interface de dépôt sécurisé pour fichiers 3D (.glb, .gltf, .fbx)',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
