# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Asset Bridge 3D** — A secure file upload interface for Gobelins (French design school) that lets designers upload 3D assets (.glb, .gltf, .fbx) and textures (.png, .jpg, .webp, .ktx2), which are automatically committed and pushed to a GitHub repository via Git LFS.

## Commands

```bash
npm run dev      # Start Next.js development server
npm run build    # Build for production (standalone output)
npm start        # Start production server
npm run lint     # Run ESLint
```

No test suite is configured.

## Architecture

The app is a Next.js App Router project with the following structure:

**Shared logic**
- **`lib/upload.ts`** — Types (`FileEntry`, `UploadResult`), constants (accepted formats, extensions), utilities (`formatBytes`, `getFileType`), and `uploadSingleFile` (XHR wrapper).

**Frontend**
- **`components/UploadZone.tsx`** — Main client component. Owns all upload state (file list, secret key, asset name, progress), runs the sequential upload queue, and orchestrates the dropzone.
- **`components/FileRow.tsx`** — Renders a single file item in the queue (status icon, filename, type badge, progress bar, remove button).

**Backend**
- **`app/api/upload/route.ts`** — POST handler. Auth check → `parseUpload()` (save file to disk) → `runGitPush()` (fetch/reset/commit/push). Git operations run synchronously via `execSync`.

**Upload flow:** User selects files → provides secret key → files upload one at a time (sequential to prevent Git conflicts) → server saves + git-commits each file → JSON response updates UI status.

**No database** — Git is the storage/versioning layer. State is stateless between requests.

## Environment Variables

Required (see `.env.example`):

```
UPLOAD_SECRET_KEY    # Auth token checked via x-upload-secret header
SSH_PRIVATE_KEY      # Full SSH private key for GitHub auth
GIT_REPO_URL         # SSH URL: git@github.com:org/repo.git
GIT_BRANCH           # Target branch (default: main)
```

## Docker / Deployment

Multi-stage Dockerfile: `deps` → `builder` → `runner` (Node 20 Alpine with git, git-lfs, openssh-client).

`docker-entrypoint.sh` runs on container start to configure SSH keys and Git identity before launching the Next.js server.

Deployed via Coolify. The `public/models/` directory should be a persistent volume.

## Git Commits

Messages courts et concis, toujours préfixés :

- `feat:` — nouvelle fonctionnalité
- `fix:` — correction de bug
- `style:` — changements UI/CSS sans impact logique
- `refactor:` — restructuration sans changement de comportement
- `chore:` — maintenance, dépendances, config

## Key Design Constraints

- Git operations in `route.ts` use `execSync` with a 60s timeout — keep operations atomic.
- Sequential upload queue is intentional: parallel uploads would cause Git conflicts.
- Git LFS tracks `.glb`, `.gltf`, `.fbx` (configured in `.gitattributes`).
- The UI is in French.
