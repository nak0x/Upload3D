'use client'

import { useState } from 'react'
import { FileEntry, formatBytes, getFileType } from '@/lib/upload'
import PreviewModal from '@/components/PreviewModal'

interface FileRowProps {
  entry: FileEntry
  onRemove: () => void
}

export default function FileRow({ entry, onRemove }: FileRowProps) {
  const type = getFileType(entry.file.name)
  const [showPreview, setShowPreview] = useState(false)

  return (
    <>
    <div className="flex items-center gap-3 bg-white dark:bg-night-card border border-surface-border dark:border-night-border rounded-xl px-4 py-3 shadow-soft">

      {/* Icône statut */}
      <div className="shrink-0">
        {entry.status === 'success' ? (
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : entry.status === 'error' ? (
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        ) : entry.status === 'uploading' ? (
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-brand-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : entry.status === 'staged' ? (
          <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-surface-muted dark:bg-night-muted flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </div>

      {/* Infos fichier */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700 dark:text-gray-200 font-mono truncate">{entry.file.name}</span>
          {type && (
            <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded-full
              ${type === 'model'
                ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-300'
                : 'bg-brand-200 dark:bg-brand-900/60 text-brand-700 dark:text-brand-400'}`}>
              {type === 'model' ? '3D' : 'Texture'}
            </span>
          )}
          {type && (
            <button
              onClick={() => setShowPreview(true)}
              title="Prévisualiser"
              className="shrink-0 text-gray-300 hover:text-brand-500 transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-400 dark:text-gray-500">{formatBytes(entry.file.size)}</span>
          {entry.status === 'error' && entry.error && (
            <span className="text-xs text-red-400 truncate">{entry.error}</span>
          )}
          {entry.status === 'success' && entry.filename && (
            <span className="text-xs text-green-500 font-mono">{entry.filename}</span>
          )}
        </div>
        {entry.status === 'uploading' && (
          <div className="mt-1.5 w-full h-1 bg-brand-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-brand rounded-full transition-all duration-200"
              style={{ width: `${entry.progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Supprimer */}
      {entry.status !== 'uploading' && entry.status !== 'staged' && (
        <button
          onClick={onRemove}
          className="shrink-0 text-gray-300 hover:text-red-400 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>

    {showPreview && (
      <PreviewModal file={entry.file} onClose={() => setShowPreview(false)} />
    )}
    </>
  )
}
