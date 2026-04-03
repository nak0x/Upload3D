import type { CSSProperties, HTMLAttributes, DetailedHTMLProps } from 'react'

type ModelViewerElement = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  src?: string
  alt?: string
  'camera-controls'?: boolean | ''
  'auto-rotate'?: boolean | ''
  'shadow-intensity'?: string
  style?: CSSProperties
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerElement
    }
  }
}
