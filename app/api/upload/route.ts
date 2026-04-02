import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, mkdirSync } from 'fs'
import { join, extname, basename } from 'path'
import { execSync } from 'child_process'

// Forcer le runtime Node.js (nécessaire pour fs, child_process)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Formats autorisés par type
const MODEL_EXTENSIONS = new Set(['.glb', '.gltf', '.fbx'])
const TEXTURE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.ktx2'])
const ALL_ALLOWED_EXTENSIONS = new Set([...MODEL_EXTENSIONS, ...TEXTURE_EXTENSIONS])

const MODELS_DIR = join(process.cwd(), 'public', 'models')
const TEXTURES_DIR = join(process.cwd(), 'public', 'textures')

// ─────────────────────────────────────────────
// Utilitaire : sanitiser le nom de fichier
// ─────────────────────────────────────────────
function sanitizeFilename(name: string): string {
  return basename(name)
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase()
}

// ─────────────────────────────────────────────
// Utilitaire : parser le multipart via req.formData()
// Retourne { filename, savedPath } ou throw
// ─────────────────────────────────────────────
async function parseUpload(req: NextRequest): Promise<{ filename: string; savedPath: string; relPath: string }> {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const assetName = (formData.get('assetName') as string | null)?.trim()

  if (!file || file.size === 0) {
    throw new Error('Aucun fichier reçu dans la requête')
  }

  const originalSafe = sanitizeFilename(file.name)
  const ext = extname(originalSafe).toLowerCase()

  if (!ALL_ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error(`Extension non autorisée : "${ext}". Formats acceptés : .glb, .gltf, .fbx, .png, .jpg, .jpeg, .webp, .ktx2`)
  }

  // Renommer avec le nom fourni par le designer si disponible
  const baseName = assetName
    ? sanitizeFilename(assetName).replace(/\.[^.]+$/, '') // retirer extension si présente
    : originalSafe.replace(/\.[^.]+$/, '')
  const filename = `${baseName}${ext}`

  const isTexture = TEXTURE_EXTENSIONS.has(ext)
  const destDir = isTexture ? TEXTURES_DIR : MODELS_DIR
  const relPath = join('public', isTexture ? 'textures' : 'models', filename)

  mkdirSync(destDir, { recursive: true })

  const savedPath = join(destDir, filename)
  const buffer = Buffer.from(await file.arrayBuffer())
  writeFileSync(savedPath, buffer)

  return { filename, savedPath, relPath }
}

// ─────────────────────────────────────────────
// Utilitaire : exécuter la séquence git
// ─────────────────────────────────────────────
function runGitPush(filename: string, relPath: string): { output: string } {
  const branch = process.env.GIT_BRANCH ?? 'main'
  const repoUrl = process.env.GIT_REPO_URL

  const execOpts = {
    cwd: process.cwd(),
    encoding: 'utf-8' as const,
    timeout: 60_000,
    env: {
      ...process.env,
      GIT_SSH_COMMAND: 'ssh -i /root/.ssh/id_rsa -o StrictHostKeyChecking=no -o UserKnownHostsFile=/root/.ssh/known_hosts',
      GIT_AUTHOR_NAME: 'Asset Bridge 3D',
      GIT_AUTHOR_EMAIL: 'deploy@assetbridge.local',
      GIT_COMMITTER_NAME: 'Asset Bridge 3D',
      GIT_COMMITTER_EMAIL: 'deploy@assetbridge.local',
    },
  }

  // S'assurer que le repo est initialisé et que le remote est configuré
  try {
    execSync('git rev-parse --git-dir', { cwd: process.cwd(), stdio: 'ignore' })
  } catch {
    // Pas encore de repo git — initialiser
    execSync('git init && git lfs install', { ...execOpts, stdio: 'pipe' })

    if (repoUrl) {
      execSync(`git remote add origin "${repoUrl}"`, { ...execOpts, stdio: 'pipe' })
    }

    // Récupérer l'historique distant si possible
    try {
      execSync(`git fetch origin ${branch}`, { ...execOpts, stdio: 'pipe', timeout: 30_000 })
      execSync(`git checkout -b ${branch} --track origin/${branch}`, { ...execOpts, stdio: 'pipe' })
    } catch {
      execSync(`git checkout -b ${branch}`, { ...execOpts, stdio: 'pipe' })
    }
  }

  // Mettre à jour l'URL du remote avec le token (au cas où elle aurait changé)
  if (repoUrl) {
    execSync(`git remote set-url origin "${repoUrl}"`, { ...execOpts, stdio: 'pipe' })
  }

  const timestamp = new Date().toISOString()

  let output = ''

  // Sync avec le remote avant de committer
  output += execSync(`git fetch origin ${branch}`, execOpts)
  output += execSync(`git reset --hard origin/${branch}`, execOpts)

  // git add
  output += execSync(`git add "${relPath}"`, execOpts)

  // git commit — ignoré si rien à committer (fichier identique)
  try {
    output += execSync(`git commit -m "Design Update: ${filename} [${timestamp}]"`, execOpts)
  } catch (err) {
    const msg = [
      err instanceof Error ? err.message : '',
      (err as NodeJS.ErrnoException & { stdout?: string })?.stdout ?? '',
      (err as NodeJS.ErrnoException & { stderr?: string })?.stderr ?? '',
    ].join(' ')
    if (!msg.includes('nothing to commit') && !msg.includes('nothing added to commit')) {
      throw err
    }
    output += '[rien à committer — fichier identique]\n'
  }

  // git push
  output += execSync(`git push origin ${branch}`, execOpts)

  return { output }
}

// ─────────────────────────────────────────────
// POST /api/upload
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 1. Authentification
  const secret = req.headers.get('x-upload-secret')
  const expectedSecret = process.env.UPLOAD_SECRET_KEY

  if (!expectedSecret) {
    console.error('[upload] UPLOAD_SECRET_KEY non configurée côté serveur')
    return NextResponse.json(
      { success: false, error: 'Configuration serveur incomplète' },
      { status: 500 }
    )
  }

  if (!secret || secret !== expectedSecret) {
    return NextResponse.json(
      { success: false, error: 'Clé d\'authentification invalide' },
      { status: 401 }
    )
  }

  // 2. Parse & écriture disque
  let filename: string
  let savedPath: string
  let relPath: string

  try {
    ;({ filename, savedPath, relPath } = await parseUpload(req))
    console.log(`[upload] Fichier reçu et sauvegardé : ${savedPath}`)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue lors de l\'upload'
    console.error('[upload] Erreur parsing :', message)
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    )
  }

  // 3. Séquence git push
  try {
    const { output } = runGitPush(filename, relPath)
    console.log(`[upload] Git push réussi pour ${filename}`)

    return NextResponse.json({
      success: true,
      filename,
      message: `"${filename}" sauvegardé et poussé sur Git avec succès.`,
      gitOutput: output,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur git inconnue'
    const stderr = (err as NodeJS.ErrnoException & { stderr?: string })?.stderr ?? ''
    console.error('[upload] Erreur git push :', message, stderr)

    return NextResponse.json(
      {
        success: false,
        filename,
        error: `Fichier sauvegardé mais git push a échoué : ${message}`,
        gitError: stderr,
      },
      { status: 500 }
    )
  }
}
