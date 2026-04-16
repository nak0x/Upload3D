import UploadZone from '@/components/UploadZone'
import ThemeToggle from '@/components/ThemeToggle'

export default function Home() {
  return (
    <main className="min-h-screen bg-surface-soft dark:bg-night-bg flex flex-col items-center justify-center p-6 transition-colors duration-300">
      {/* Toggle dark mode */}
      <div className="fixed top-4 right-4 z-40">
        <ThemeToggle />
      </div>

      {/* Header */}
      <div className="w-full max-w-2xl mb-10 text-center">
        <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full
                        bg-brand-100 dark:bg-night-muted
                        border border-brand-200 dark:border-night-border
                        text-brand-600 dark:text-brand-300
                        text-xs font-medium uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
          Git LFS · Déploiement continu
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          <span className="text-gradient">Asset Bridge 3D</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed">
          Déposez vos fichiers 3D — ils seront automatiquement versionnés
          <br />et poussés sur le dépôt GitHub via Git LFS.
        </p>
      </div>

      {/* Upload Zone */}
      <UploadZone />

      {/* Footer */}
      <footer className="mt-10 text-gray-400 dark:text-gray-600 text-xs text-center">
        Modèles : <span className="font-mono text-gray-500 dark:text-gray-500">.glb · .gltf · .fbx</span>
        <span className="mx-2">·</span>
        Textures : <span className="font-mono text-gray-500 dark:text-gray-500">.png · .jpg · .webp · .ktx2</span>
        <span className="mx-2">·</span>
        Taille max : <span className="font-mono text-gray-500 dark:text-gray-500">2 GB</span>
      </footer>
    </main>
  )
}
