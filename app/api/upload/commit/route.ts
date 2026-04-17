import { NextRequest, NextResponse } from 'next/server'
import { copyFileSync, mkdirSync, rmSync, existsSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const STAGING_DIR = join(process.cwd(), 'public', 'staging')
const MODELS_DIR = join(process.cwd(), 'public', 'models')
const TEXTURES_DIR = join(process.cwd(), 'public', 'textures')

interface StagedFileInput {
  stagingId: string
  filename: string
  compressedFilename: string | null
  isTexture: boolean
}

interface ProcessedFile {
  filename: string
  relPaths: string[]
  compressionWarning?: string | null
}

function copyFromStaging(
  staged: StagedFileInput
): { relPaths: string[]; error?: string } {
  const { stagingId, filename, compressedFilename, isTexture } = staged
  const stagingBase = join(STAGING_DIR, stagingId)
  const finalDir = isTexture ? TEXTURES_DIR : MODELS_DIR
  const relDir = join('public', isTexture ? 'textures' : 'models')
  const relPaths: string[] = []

  // Copier l'original
  const srcOriginal = join(stagingBase, filename)
  if (!existsSync(srcOriginal)) {
    return { relPaths: [], error: `Fichier staging introuvable : ${filename}` }
  }
  mkdirSync(finalDir, { recursive: true })
  copyFileSync(srcOriginal, join(finalDir, filename))
  relPaths.push(join(relDir, filename))

  // Copier la version compressée si elle existe
  if (compressedFilename) {
    const srcCompressed = join(stagingBase, 'compressed', compressedFilename)
    if (existsSync(srcCompressed)) {
      const compressedFinalDir = join(finalDir, 'compressed')
      mkdirSync(compressedFinalDir, { recursive: true })
      copyFileSync(srcCompressed, join(compressedFinalDir, compressedFilename))
      relPaths.push(join(relDir, 'compressed', compressedFilename))
    }
  }

  return { relPaths }
}

function cleanupStaging(stagingIds: string[]) {
  for (const id of stagingIds) {
    try {
      rmSync(join(STAGING_DIR, id), { recursive: true, force: true })
    } catch {
      // non-bloquant
    }
  }
}

// ─────────────────────────────────────────────
// POST /api/upload/commit
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-upload-secret')
  const expectedSecret = process.env.UPLOAD_SECRET_KEY

  if (!expectedSecret) {
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

  let stagedFiles: StagedFileInput[]
  try {
    const body = await req.json()
    stagedFiles = body.files
    if (!Array.isArray(stagedFiles) || stagedFiles.length === 0) {
      throw new Error('Aucun fichier à committer')
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Corps de requête invalide'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }

  const branch = process.env.GIT_BRANCH ?? 'main'
  const repoUrl = process.env.GIT_REPO_URL

  const execOpts = {
    cwd: process.cwd(),
    encoding: 'utf-8' as const,
    timeout: 60_000,
    env: {
      ...process.env,
      GIT_SSH_COMMAND:
        'ssh -i /root/.ssh/id_rsa -o StrictHostKeyChecking=no -o UserKnownHostsFile=/root/.ssh/known_hosts',
      GIT_AUTHOR_NAME: 'Asset Bridge 3D',
      GIT_AUTHOR_EMAIL: 'deploy@assetbridge.local',
      GIT_COMMITTER_NAME: 'Asset Bridge 3D',
      GIT_COMMITTER_EMAIL: 'deploy@assetbridge.local',
    },
  }

  // Initialisation git si nécessaire
  try {
    execSync('git rev-parse --git-dir', { cwd: process.cwd(), stdio: 'ignore' })
  } catch {
    execSync('git init && git lfs install', { ...execOpts, stdio: 'pipe' })
    if (repoUrl) {
      execSync(`git remote add origin "${repoUrl}"`, { ...execOpts, stdio: 'pipe' })
    }
    try {
      execSync(`git fetch origin ${branch}`, { ...execOpts, stdio: 'pipe', timeout: 30_000 })
      execSync(`git checkout -b ${branch} --track origin/${branch}`, { ...execOpts, stdio: 'pipe' })
    } catch {
      execSync(`git checkout -b ${branch}`, { ...execOpts, stdio: 'pipe' })
    }
  }

  if (repoUrl) {
    execSync(`git remote set-url origin "${repoUrl}"`, { ...execOpts, stdio: 'pipe' })
  }

  let gitOutput = ''

  try {
    gitOutput += execSync(`git fetch origin ${branch}`, execOpts)
    gitOutput += execSync(`git reset --hard origin/${branch}`, execOpts)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur git fetch/reset'
    cleanupStaging(stagedFiles.map((f) => f.stagingId))
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }

  // Copier les fichiers depuis staging vers leurs emplacements finaux
  const committed: ProcessedFile[] = []
  const failed: { filename: string; error: string }[] = []

  for (const staged of stagedFiles) {
    const { relPaths, error } = copyFromStaging(staged)
    if (error) {
      failed.push({ filename: staged.filename, error })
    } else {
      committed.push({ filename: staged.filename, relPaths })
    }
  }

  if (committed.length === 0) {
    cleanupStaging(stagedFiles.map((f) => f.stagingId))
    return NextResponse.json({
      success: false,
      committed: [],
      failed,
      error: 'Aucun fichier valide à committer',
    })
  }

  // git add pour tous les fichiers copiés
  const allRelPaths = committed.flatMap((f) => f.relPaths)
  for (const relPath of allRelPaths) {
    try {
      gitOutput += execSync(`git add "${relPath}"`, execOpts)
    } catch (err) {
      console.error(`[commit] git add échoué pour ${relPath}:`, err)
    }
  }

  // git commit avec tous les noms de fichiers
  const filenames = committed.map((f) => f.filename).join(', ')
  const timestamp = new Date().toISOString()
  try {
    gitOutput += execSync(
      `git commit -m "Design Update: ${filenames} [${timestamp}]"`,
      execOpts
    )
  } catch (err) {
    const msg = [
      err instanceof Error ? err.message : '',
      (err as NodeJS.ErrnoException & { stdout?: string })?.stdout ?? '',
      (err as NodeJS.ErrnoException & { stderr?: string })?.stderr ?? '',
    ].join(' ')
    if (!msg.includes('nothing to commit') && !msg.includes('nothing added to commit')) {
      cleanupStaging(stagedFiles.map((f) => f.stagingId))
      return NextResponse.json({
        success: false,
        committed: committed.map((f) => f.filename),
        failed,
        error: `Git commit échoué : ${msg}`,
        gitOutput,
      }, { status: 500 })
    }
    gitOutput += '[rien à committer — fichiers identiques]\n'
  }

  // git push
  try {
    gitOutput += execSync(`git push origin ${branch}`, execOpts)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur git push'
    const stderr = (err as NodeJS.ErrnoException & { stderr?: string })?.stderr ?? ''
    cleanupStaging(stagedFiles.map((f) => f.stagingId))
    return NextResponse.json({
      success: false,
      committed: committed.map((f) => f.filename),
      failed,
      error: `Git push échoué : ${message}`,
      gitError: stderr,
      gitOutput,
    }, { status: 500 })
  }

  cleanupStaging(stagedFiles.map((f) => f.stagingId))
  console.log(`[commit] Poussé : ${filenames}`)

  const successCount = committed.length
  const failCount = failed.length
  const message = failCount > 0
    ? `${successCount} fichier(s) poussé(s) sur Git. ${failCount} fichier(s) ignoré(s).`
    : successCount === 1
    ? `"${committed[0].filename}" poussé sur Git avec succès.`
    : `${successCount} fichiers poussés sur Git avec succès.`

  return NextResponse.json({
    success: true,
    committed: committed.map((f) => f.filename),
    failed,
    message,
    gitOutput,
  })
}
