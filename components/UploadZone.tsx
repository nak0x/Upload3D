'use client'

import { useCallback, useRef, useState } from 'react'
import { useDropzone, FileRejection } from 'react-dropzone'
import {
  FileEntry,
  ACCEPTED_FORMATS,
  ALL_EXTENSIONS,
  uploadSingleFile,
} from '@/lib/upload'
import FileRow from '@/components/FileRow'

// ─────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────
export default function UploadZone() {
  const [files, setFiles] = useState<FileEntry[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [secret, setSecret] = useState('')
  const [secretVisible, setSecretVisible] = useState(false)
  const [assetName, setAssetName] = useState('')
  const [globalError, setGlobalError] = useState<string | null>(null)
  const xhrRef = useRef<XMLHttpRequest | null>(null)

  const updateFile = (index: number, patch: Partial<FileEntry>) => {
    setFiles((prev) => prev.map((f, i) => i === index ? { ...f, ...patch } : f))
  }

  // ── Upload séquentiel de tous les fichiers ──
  const handleUpload = useCallback(async () => {
    if (!secret.trim()) {
      setGlobalError('Veuillez saisir la clé d\'accès avant d\'uploader.')
      return
    }
    if (files.length === 0) return

    setIsUploading(true)
    setGlobalError(null)

    for (let i = 0; i < files.length; i++) {
      if (files[i].status === 'success') continue

      updateFile(i, { status: 'uploading', progress: 0, error: undefined })

      const result = await uploadSingleFile(
        files[i].file,
        secret,
        assetName,
        (pct) => updateFile(i, { progress: pct }),
        xhrRef
      )

      updateFile(i, {
        status: result.success ? 'success' : 'error',
        progress: result.success ? 100 : 0,
        error: result.success ? undefined : result.error,
        filename: result.filename,
      })
    }

    setIsUploading(false)
  }, [files, secret, assetName])

  const handleCancel = () => { xhrRef.current?.abort() }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleReset = () => {
    setFiles([])
    setGlobalError(null)
    setIsUploading(false)
  }

  // ── react-dropzone ──
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    if (rejectedFiles.length > 0) {
      const codes = rejectedFiles[0].errors.map((e) => e.code).join(', ')
      setGlobalError(
        codes.includes('file-invalid-type')
          ? `Format non supporté. Utilisez : ${ALL_EXTENSIONS.join(', ')}`
          : codes.includes('file-too-large')
          ? 'Fichier trop volumineux (max 2 GB)'
          : `Fichier rejeté : ${codes}`
      )
      return
    }

    setGlobalError(null)
    setFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.file.name))
      const newEntries: FileEntry[] = acceptedFiles
        .filter((f) => !existingNames.has(f.name))
        .map((file) => ({ file, status: 'pending', progress: 0 }))
      return [...prev, ...newEntries]
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_FORMATS,
    maxSize: 2 * 1024 * 1024 * 1024,
    disabled: isUploading,
    multiple: true,
  })

  const allDone = files.length > 0 && files.every((f) => f.status === 'success')
  const hasErrors = files.some((f) => f.status === 'error')

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div className="w-full max-w-2xl space-y-4">

      {/* Clé d'accès */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">Clé d&apos;accès</label>
        <div className="relative">
          <input
            type={secretVisible ? 'text' : 'password'}
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Saisir la clé secrète…"
            disabled={isUploading}
            className="w-full bg-white border border-surface-border rounded-xl px-4 py-2.5 pr-12
                       text-gray-800 placeholder-gray-300 text-sm shadow-soft
                       focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400
                       disabled:opacity-50 disabled:cursor-not-allowed transition"
          />
          <button
            type="button"
            onClick={() => setSecretVisible((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-500 transition"
            tabIndex={-1}
          >
            {secretVisible ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Nom de l'asset */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">
          Nom de l&apos;asset
          <span className="text-gray-400 font-normal ml-2">— nom commun pour le modèle et la texture</span>
        </label>
        <input
          type="text"
          value={assetName}
          onChange={(e) => setAssetName(e.target.value)}
          placeholder="ex : clocher, sol_pierre, mur_brique…"
          disabled={isUploading}
          className="w-full bg-white border border-surface-border rounded-xl px-4 py-2.5
                     text-gray-800 placeholder-gray-300 text-sm font-mono shadow-soft
                     focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400
                     disabled:opacity-50 disabled:cursor-not-allowed transition"
        />
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 bg-white shadow-soft
          ${isUploading ? 'cursor-not-allowed opacity-60 border-surface-border' : ''}
          ${isDragReject ? 'border-red-400 bg-red-50' : ''}
          ${isDragActive && !isDragReject ? 'border-brand-400 bg-brand-50 scale-[1.01]' : ''}
          ${!isDragActive && !isDragReject && !isUploading
            ? 'border-surface-border hover:border-brand-300 hover:bg-brand-50/40'
            : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex justify-center mb-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition
            ${isDragActive ? 'bg-brand-200' : 'bg-brand-100'}`}>
            <svg className={`w-6 h-6 transition ${isDragActive ? 'text-brand-600' : 'text-brand-500'}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
        </div>
        {isDragReject ? (
          <p className="text-sm font-medium text-red-500">Format non supporté</p>
        ) : isDragActive ? (
          <p className="text-sm font-medium text-brand-600">Relâchez pour ajouter</p>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-600">
              Glissez vos fichiers ici
              <span className="text-gray-400 font-normal"> ou cliquez pour parcourir</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Modèles : .glb, .gltf, .fbx · Textures : .png, .jpg, .webp, .ktx2
            </p>
          </>
        )}
      </div>

      {/* Erreur globale */}
      {globalError && (
        <p className="text-xs text-red-500 text-center">{globalError}</p>
      )}

      {/* Liste des fichiers */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((entry, i) => (
            <FileRow
              key={`${entry.file.name}-${i}`}
              entry={entry}
              onRemove={() => removeFile(i)}
            />
          ))}
        </div>
      )}

      {/* Boutons d'action */}
      <div className="flex gap-3">
        {!isUploading && files.some((f) => f.status === 'pending' || f.status === 'error') && (
          <button
            onClick={handleUpload}
            className="flex-1 bg-gradient-brand hover:opacity-90 text-white font-medium text-sm
                       py-2.5 px-6 rounded-xl shadow-soft transition-opacity duration-150
                       focus:outline-none focus:ring-2 focus:ring-brand-300"
          >
            Uploader {files.filter(f => f.status !== 'success').length > 1
              ? `${files.filter(f => f.status !== 'success').length} fichiers`
              : 'le fichier'} &amp; Pousser sur Git
          </button>
        )}

        {isUploading && (
          <button
            onClick={handleCancel}
            className="flex-1 bg-surface-muted hover:bg-brand-100 text-gray-600 font-medium text-sm
                       py-2.5 px-6 rounded-xl border border-surface-border transition-colors duration-150"
          >
            Annuler le fichier en cours
          </button>
        )}

        {(allDone || hasErrors) && !isUploading && (
          <button
            onClick={handleReset}
            className="flex-1 bg-surface-muted hover:bg-brand-100 text-gray-600 font-medium text-sm
                       py-2.5 px-6 rounded-xl border border-surface-border transition-colors duration-150"
          >
            {allDone ? 'Tout effacer' : 'Réessayer'}
          </button>
        )}
      </div>
    </div>
  )
}
