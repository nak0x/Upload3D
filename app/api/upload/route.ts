import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, mkdirSync } from 'fs'
import { join, extname, basename } from 'path'
import { execSync } from 'child_process'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MODEL_EXTENSIONS = new Set(['.glb', '.gltf', '.fbx'])
const TEXTURE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.ktx2'])
const ALL_ALLOWED_EXTENSIONS = new Set([...MODEL_EXTENSIONS, ...TEXTURE_EXTENSIONS])
const COMPRESSIBLE_TEXTURE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg'])
const COMPRESSIBLE_MODEL_EXTENSIONS = new Set(['.glb', '.gltf'])

const STAGING_DIR = join(process.cwd(), 'public', 'staging')

function sanitizeFilename(name: string): string {
  return basename(name)
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase()
}

async function parseUpload(req: NextRequest): Promise<{
  filename: string
  buffer: Buffer
  ext: string
  isTexture: boolean
}> {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const assetName = (formData.get('assetName') as string | null)?.trim()

  if (!file || file.size === 0) {
    throw new Error('Aucun fichier reçu dans la requête')
  }

  const originalSafe = sanitizeFilename(file.name)
  const ext = extname(originalSafe).toLowerCase()

  if (!ALL_ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error(
      `Extension non autorisée : "${ext}". Formats acceptés : .glb, .gltf, .fbx, .png, .jpg, .jpeg, .webp, .ktx2`
    )
  }

  const baseName = assetName
    ? sanitizeFilename(assetName).replace(/\.[^.]+$/, '')
    : originalSafe.replace(/\.[^.]+$/, '')
  const filename = `${baseName}${ext}`
  const isTexture = TEXTURE_EXTENSIONS.has(ext)
  const buffer = Buffer.from(await file.arrayBuffer())

  return { filename, buffer, ext, isTexture }
}

// ─────────────────────────────────────────────
// Sauvegarde dans le dossier staging (aucune op git)
// ─────────────────────────────────────────────
async function stageFile(
  stagingId: string,
  filename: string,
  buffer: Buffer,
  ext: string,
  isTexture: boolean
): Promise<{ compressedFilename: string | null; compressionWarning?: string }> {
  const stagingBase = join(STAGING_DIR, stagingId)
  mkdirSync(stagingBase, { recursive: true })

  const originalPath = join(stagingBase, filename)
  writeFileSync(originalPath, buffer)

  let compressedFilename: string | null = null
  let compressionWarning: string | undefined

  if (isTexture && COMPRESSIBLE_TEXTURE_EXTENSIONS.has(ext)) {
    try {
      const compressedDir = join(stagingBase, 'compressed')
      mkdirSync(compressedDir, { recursive: true })
      compressedFilename = filename.replace(/\.[^.]+$/, '.webp')
      execSync(
        `cwebp -q 85 "${originalPath}" -o "${join(compressedDir, compressedFilename)}"`,
        { encoding: 'utf-8', timeout: 30_000 }
      )
    } catch (err) {
      compressionWarning = `Compression WebP échouée : ${err instanceof Error ? err.message : err}`
      compressedFilename = null
    }
  }

  if (!isTexture && COMPRESSIBLE_MODEL_EXTENSIONS.has(ext)) {
    try {
      const compressedDir = join(stagingBase, 'compressed')
      mkdirSync(compressedDir, { recursive: true })
      compressedFilename = filename
      execSync(
        `python3 /opt/cli-draco-compression/blender_draco.py -i "${originalPath}" -o "${join(compressedDir, compressedFilename)}" --draco-level 7 --no-resize`,
        { encoding: 'utf-8', timeout: 120_000 }
      )
    } catch (err) {
      compressionWarning = `Compression Draco (Blender) échouée : ${err instanceof Error ? err.message : String(err)}`
      compressedFilename = null
    }
  }

  return { compressedFilename, compressionWarning }
}

// ─────────────────────────────────────────────
// POST /api/upload — stage uniquement
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-upload-secret')
  const expectedSecret = process.env.UPLOAD_SECRET_KEY

  if (!expectedSecret) {
    console.error('[upload] UPLOAD_SECRET_KEY non configurée')
    return NextResponse.json(
      { success: false, error: 'Configuration serveur incomplète' },
      { status: 500 }
    )
  }

  if (!secret || secret !== expectedSecret) {
    return NextResponse.json(
      { success: false, error: "Clé d'authentification invalide" },
      { status: 401 }
    )
  }

  let filename: string
  let buffer: Buffer
  let ext: string
  let isTexture: boolean

  try {
    ;({ filename, buffer, ext, isTexture } = await parseUpload(req))
    console.log(`[upload] Fichier reçu : ${filename}`)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue lors de l'upload"
    console.error('[upload] Erreur parsing :', message)
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }

  try {
    const stagingId = randomUUID()
    const { compressedFilename, compressionWarning } = await stageFile(
      stagingId,
      filename,
      buffer,
      ext,
      isTexture
    )
    console.log(`[upload] Fichier stagé : ${filename} (id: ${stagingId})`)

    return NextResponse.json({
      success: true,
      stagingId,
      filename,
      compressedFilename: compressedFilename ?? null,
      compressionWarning: compressionWarning ?? null,
      isTexture,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[upload] Erreur staging :', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
