// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export type FileStatus = 'pending' | 'uploading' | 'success' | 'error'

export interface FileEntry {
  file: File
  status: FileStatus
  progress: number
  error?: string
  filename?: string
}

export interface UploadResult {
  success: boolean
  filename?: string
  compressedFilename?: string | null
  compressionWarning?: string | null
  message?: string
  error?: string
  gitOutput?: string
  gitError?: string
}

// ─────────────────────────────────────────────
// Formats acceptés
// ─────────────────────────────────────────────
export const ACCEPTED_FORMATS = {
  'model/gltf-binary': ['.glb'],
  'model/gltf+json': ['.gltf'],
  'application/octet-stream': ['.fbx'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp'],
  'image/ktx2': ['.ktx2'],
}

export const MODEL_EXTENSIONS = ['.glb', '.gltf', '.fbx']
export const TEXTURE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.ktx2']
export const ALL_EXTENSIONS = [...MODEL_EXTENSIONS, ...TEXTURE_EXTENSIONS]

// ─────────────────────────────────────────────
// Utilitaires
// ─────────────────────────────────────────────
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function getFileType(filename: string): 'model' | 'texture' | null {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase()
  if (MODEL_EXTENSIONS.includes(ext)) return 'model'
  if (TEXTURE_EXTENSIONS.includes(ext)) return 'texture'
  return null
}

// ─────────────────────────────────────────────
// Upload XHR
// ─────────────────────────────────────────────
export function uploadSingleFile(
  file: File,
  secret: string,
  assetName: string,
  onProgress: (pct: number) => void,
  xhrRef: { current: XMLHttpRequest | null }
): Promise<UploadResult> {
  return new Promise((resolve) => {
    const formData = new FormData()
    formData.append('file', file)
    if (assetName.trim()) formData.append('assetName', assetName.trim())

    const xhr = new XMLHttpRequest()
    xhrRef.current = xhr

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }

    xhr.onload = () => {
      try {
        resolve(JSON.parse(xhr.responseText))
      } catch {
        resolve({ success: false, error: `Réponse inattendue (HTTP ${xhr.status})` })
      }
    }

    xhr.onerror = () => resolve({ success: false, error: 'Erreur réseau.' })
    xhr.onabort = () => resolve({ success: false, error: 'Annulé.' })

    xhr.open('POST', '/api/upload')
    xhr.setRequestHeader('x-upload-secret', secret.trim())
    xhr.send(formData)
  })
}
