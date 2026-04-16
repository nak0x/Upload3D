# Asset Bridge 3D

Interface d'upload sécurisée pour déposer des assets 3D et des textures directement sur un dépôt GitHub via Git LFS. Conçue pour les designers de l'école Gobelins — aucune connaissance de Git requise.

---

## Ce que ça fait

Les designers glissent leurs fichiers dans l'interface, saisissent une clé d'accès, et cliquent sur "Uploader". Chaque fichier est automatiquement :

1. **Compressé** — les modèles 3D (GLB/GLTF) sont compressés avec Draco via Blender, les textures (PNG/JPG) sont converties en WebP via `cwebp`
2. **Versionné** — commité sur le dépôt GitHub cible avec un message horodaté
3. **Poussé** — le push SSH est effectué côté serveur, sans que le designer ait besoin d'un compte GitHub

Le dépôt GitHub reçoit donc deux versions de chaque fichier : l'original et la version compressée dans un sous-dossier `compressed/`.

---

## Formats supportés

| Type | Formats | Compression |
|------|---------|-------------|
| Modèles 3D | `.glb`, `.gltf`, `.fbx` | Draco (via Blender headless) |
| Textures | `.png`, `.jpg`, `.jpeg` | WebP qualité 85 (via cwebp) |
| Textures (pass-through) | `.webp`, `.ktx2` | — |

Les modèles `.glb` et `.gltf` sont trackés par **Git LFS**.

---

## Architecture

```
app/
├── api/upload/route.ts   # Route POST — auth, compression, git push
├── page.tsx              # Page principale
└── globals.css           # Styles globaux

components/
├── UploadZone.tsx        # Dropzone, état upload, file queue
├── FileRow.tsx           # Ligne fichier (statut, progress, badge)
├── PreviewModal.tsx      # Prévisualisation image / modèle 3D
├── WatercolorViewer.tsx  # Viewer Three.js avec effets post-processing
└── ThemeToggle.tsx       # Bascule dark mode

lib/
└── upload.ts             # Types, constantes, wrapper XHR
```

### Flux d'un upload

```
Navigateur                        Serveur (Next.js API)
─────────                         ─────────────────────
Sélection fichier
  → XHR POST /api/upload    →     Vérif. clé secrète (header x-upload-secret)
                                  ↓
                                  Écriture fichier sur disque (/public/models/ ou /public/textures/)
                                  ↓
                                  Compression :
                                    · GLB/GLTF → python3 blender_draco.py → /compressed/
                                    · PNG/JPG  → cwebp                    → /compressed/
                                  ↓
                                  git fetch origin + reset --hard  (sync)
                                  git add original + compressé
                                  git commit -m "Design Update: [fichier] [timestamp]"
                                  git push origin [branche]
  ← JSON { success, filename }  ←
```

Les uploads sont **séquentiels** (un fichier à la fois) pour éviter les conflits Git.

### Pas de base de données

Git est la couche de stockage et de versioning. L'API est stateless — chaque requête fait un `fetch/reset/commit/push` complet.

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js 16 (App Router, standalone output) |
| UI | React 19, Tailwind CSS 3, dark mode |
| Upload | react-dropzone, XHR avec progression |
| Compression modèles | Blender 3.x headless + [cli-draco-compression](https://github.com/La-Fabrik-Durable/cli-draco-compression) |
| Compression textures | cwebp (Google WebP encoder) |
| Versioning | Git + Git LFS via SSH |
| Déploiement | Docker multi-stage, Coolify |
| Runtime | Node 20 Slim (Debian) |

---

## Variables d'environnement

| Variable | Description |
|----------|-------------|
| `UPLOAD_SECRET_KEY` | Clé partagée avec les designers, saisie dans l'UI |
| `SSH_PRIVATE_KEY` | Clé SSH privée complète pour le push GitHub |
| `GIT_REPO_URL` | URL SSH du dépôt cible : `git@github.com:org/repo.git` |
| `GIT_BRANCH` | Branche cible (défaut : `main`) |

Copier `.env.example` en `.env.local` pour le développement local.

---

## Lancer en local

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build      # Build production (output standalone)
npm start          # Serveur production
```

---

## Déploiement (Docker / Coolify)

Le Dockerfile utilise 3 stages :

- **deps** — installation des dépendances Node
- **builder** — build Next.js
- **runner** — image finale avec Git, Git LFS, Blender, cwebp

Le script `docker-entrypoint.sh` s'exécute au démarrage du container pour :
- Configurer l'identité Git
- Injecter la clé SSH depuis la variable d'environnement
- Ajouter `github.com` aux known hosts
- Initialiser le dépôt Git local si nécessaire

Le dossier `public/models/` doit être configuré comme **volume persistant** dans Coolify pour survivre aux redéploiements.
