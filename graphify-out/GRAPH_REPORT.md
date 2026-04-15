# Graph Report - .  (2026-04-15)

## Corpus Check
- Corpus is ~5,158 words - fits in a single context window. You may not need a graph.

## Summary
- 69 nodes · 56 edges · 21 communities detected
- Extraction: 84% EXTRACTED · 16% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Upload API & Config|Upload API & Config]]
- [[_COMMUNITY_Upload Flow & Types|Upload Flow & Types]]
- [[_COMMUNITY_Backend Route Handler|Backend Route Handler]]
- [[_COMMUNITY_Upload Zone UI|Upload Zone UI]]
- [[_COMMUNITY_Upload Utilities|Upload Utilities]]
- [[_COMMUNITY_Boiling Effect|Boiling Effect]]
- [[_COMMUNITY_Outline Effect|Outline Effect]]
- [[_COMMUNITY_Docker Deployment|Docker Deployment]]
- [[_COMMUNITY_Project Architecture|Project Architecture]]
- [[_COMMUNITY_Kuwahara Effect|Kuwahara Effect]]
- [[_COMMUNITY_Paper Overlay Effect|Paper Overlay Effect]]
- [[_COMMUNITY_App Layout|App Layout]]
- [[_COMMUNITY_Home Page|Home Page]]
- [[_COMMUNITY_Watercolor Viewer|Watercolor Viewer]]
- [[_COMMUNITY_Preview Modal|Preview Modal]]
- [[_COMMUNITY_Next.js Types|Next.js Types]]
- [[_COMMUNITY_Tailwind Config|Tailwind Config]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_3D Model Types|3D Model Types]]
- [[_COMMUNITY_File Row Component|File Row Component]]

## God Nodes (most connected - your core abstractions)
1. `runGitPush()` - 6 edges
2. `app/api/upload/route.ts` - 5 edges
3. `lib/upload.ts` - 4 edges
4. `components/UploadZone.tsx` - 4 edges
5. `Sequential Upload Queue` - 4 edges
6. `parseUpload()` - 3 edges
7. `POST()` - 3 edges
8. `BoilingEffectImpl` - 3 edges
9. `OutlineEffectImpl` - 3 edges
10. `Upload Flow` - 3 edges

## Surprising Connections (you probably didn't know these)
- `runGitPush()` --references--> `SSH_PRIVATE_KEY`  [INFERRED]
  CLAUDE.md → CLAUDE.md  _Bridges community 0 → community 7_
- `Sequential Upload Queue` --semantically_similar_to--> `Git as Storage Layer`  [INFERRED] [semantically similar]
  CLAUDE.md → CLAUDE.md  _Bridges community 1 → community 8_
- `Upload Flow` --references--> `app/api/upload/route.ts`  [EXTRACTED]
  CLAUDE.md → CLAUDE.md  _Bridges community 0 → community 1_

## Hyperedges (group relationships)
- **Upload Pipeline: UploadZone → API Route → Git Push** — claudemd_uploadzone_tsx, claudemd_api_upload_route, claudemd_rungitpush [EXTRACTED 0.95]
- **Git Storage Constraints: LFS + Sequential Queue + execSync** — claudemd_git_lfs, claudemd_sequential_upload_queue, claudemd_execsync [INFERRED 0.80]
- **Docker Deployment Stack: Dockerfile + Entrypoint + Coolify** — claudemd_dockerfile, claudemd_docker_entrypoint, claudemd_coolify [EXTRACTED 0.90]

## Communities

### Community 0 - "Upload API & Config"
Cohesion: 0.22
Nodes (10): app/api/upload/route.ts, GIT_BRANCH, GIT_REPO_URL, UPLOAD_SECRET_KEY, execSync (60s timeout), Git LFS, .gitattributes, parseUpload() (+2 more)

### Community 1 - "Upload Flow & Types"
Cohesion: 0.25
Nodes (9): FileEntry, components/FileRow.tsx, lib/upload.ts, Rationale: Sequential Queue Prevents Git Conflicts, Sequential Upload Queue, Upload Flow, UploadResult, uploadSingleFile (+1 more)

### Community 2 - "Backend Route Handler"
Cohesion: 0.7
Nodes (4): parseUpload(), POST(), runGitPush(), sanitizeFilename()

### Community 3 - "Upload Zone UI"
Cohesion: 0.4
Nodes (0): 

### Community 4 - "Upload Utilities"
Cohesion: 0.5
Nodes (0): 

### Community 5 - "Boiling Effect"
Cohesion: 0.5
Nodes (1): BoilingEffectImpl

### Community 6 - "Outline Effect"
Cohesion: 0.5
Nodes (1): OutlineEffectImpl

### Community 7 - "Docker Deployment"
Cohesion: 0.5
Nodes (4): Coolify Deployment, docker-entrypoint.sh, Multi-stage Dockerfile, SSH_PRIVATE_KEY

### Community 8 - "Project Architecture"
Cohesion: 0.5
Nodes (4): Asset Bridge 3D, Git as Storage Layer, Next.js App Router, Rationale: Git as Stateless Storage (No DB)

### Community 9 - "Kuwahara Effect"
Cohesion: 0.67
Nodes (1): KuwaharaEffectImpl

### Community 10 - "Paper Overlay Effect"
Cohesion: 0.67
Nodes (1): PaperOverlayEffectImpl

### Community 11 - "App Layout"
Cohesion: 1.0
Nodes (0): 

### Community 12 - "Home Page"
Cohesion: 1.0
Nodes (0): 

### Community 13 - "Watercolor Viewer"
Cohesion: 1.0
Nodes (0): 

### Community 14 - "Preview Modal"
Cohesion: 1.0
Nodes (0): 

### Community 15 - "Next.js Types"
Cohesion: 1.0
Nodes (0): 

### Community 16 - "Tailwind Config"
Cohesion: 1.0
Nodes (0): 

### Community 17 - "PostCSS Config"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "Next.js Config"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "3D Model Types"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "File Row Component"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **13 isolated node(s):** `FileEntry`, `UploadResult`, `uploadSingleFile`, `components/FileRow.tsx`, `UPLOAD_SECRET_KEY` (+8 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `App Layout`** (2 nodes): `layout.tsx`, `RootLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Home Page`** (2 nodes): `page.tsx`, `Home()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Watercolor Viewer`** (2 nodes): `WatercolorViewer.tsx`, `WatercolorViewer()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Preview Modal`** (2 nodes): `PreviewModal.tsx`, `handler()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next.js Types`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Tailwind Config`** (1 nodes): `tailwind.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `PostCSS Config`** (1 nodes): `postcss.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next.js Config`** (1 nodes): `next.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `3D Model Types`** (1 nodes): `model-viewer.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `File Row Component`** (1 nodes): `FileRow.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `app/api/upload/route.ts` connect `Upload API & Config` to `Upload Flow & Types`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Why does `Upload Flow` connect `Upload Flow & Types` to `Upload API & Config`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Why does `runGitPush()` connect `Upload API & Config` to `Docker Deployment`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `runGitPush()` (e.g. with `Git LFS` and `SSH_PRIVATE_KEY`) actually correct?**
  _`runGitPush()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `components/UploadZone.tsx` (e.g. with `lib/upload.ts` and `components/FileRow.tsx`) actually correct?**
  _`components/UploadZone.tsx` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `FileEntry`, `UploadResult`, `uploadSingleFile` to the rest of the system?**
  _13 weakly-connected nodes found - possible documentation gaps or missing edges._