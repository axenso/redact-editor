import { useEffect, useRef, useState } from 'react'
import {
  DEFAULT_IMAGE_ATTRS,
  imageAttrsToForm,
  normalizeCssSize,
  type ImageBlockAttrs,
} from '../extensions/ImageBlock'

interface ImageEditorModalProps {
  isOpen: boolean
  mode: 'insert' | 'edit'
  initialAttrs?: ImageBlockAttrs | null
  onClose: () => void
  onSave: (attrs: ImageBlockAttrs) => void
}

export function ImageEditorModal({
  isOpen,
  mode,
  initialAttrs,
  onClose,
  onSave,
}: ImageEditorModalProps) {
  const [url, setUrl] = useState('')
  const [alt, setAlt] = useState('')
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [error, setError] = useState<string | null>(null)
  const urlRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const form = imageAttrsToForm(initialAttrs ?? DEFAULT_IMAGE_ATTRS)
    setUrl(form.src)
    setAlt(form.alt)
    setWidth(form.width)
    setHeight(form.height)
    setError(null)
    setTimeout(() => urlRef.current?.focus(), 50)
  }, [isOpen, initialAttrs])

  if (!isOpen) return null

  const handleFile = (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Seleziona un file immagine valido.')
      return
    }
    if (file.size > 4 * 1024 * 1024) {
      setError('Immagine troppo grande (max 4 MB).')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUrl(reader.result)
        setAlt((prev) => prev || file.name.replace(/\.[^.]+$/, ''))
        setError(null)
      }
    }
    reader.onerror = () => setError('Impossibile leggere il file.')
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const src = url.trim()
    if (!src) {
      setError('Inserisci un URL o carica un file.')
      return
    }

    onSave({
      src,
      alt: alt.trim(),
      width: width.trim(),
      height: height.trim(),
    })
    onClose()
  }

  const heading = mode === 'edit' ? 'Modifica immagine' : 'Inserisci immagine'
  const submitLabel = mode === 'edit' ? 'Salva' : 'Inserisci'

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-labelledby="image-modal-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="image-modal-title">{heading}</h2>

        <form onSubmit={handleSubmit}>
          <label htmlFor="image-url" className="modal-label">
            URL immagine
          </label>
          <input
            id="image-url"
            ref={urlRef}
            type="url"
            className="modal-input"
            placeholder="https://…"
            value={url.startsWith('data:') ? '' : url}
            onChange={(e) => {
              setUrl(e.target.value)
              setError(null)
            }}
          />

          <p className="modal-hint">oppure carica dal computer</p>
          <input
            type="file"
            accept="image/*"
            className="modal-file"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />

          {url.startsWith('data:') && (
            <p className="modal-file-loaded">✓ Immagine caricata</p>
          )}

          {url && (
            <div className="image-modal-preview">
              <img
                src={url}
                alt={alt || 'Anteprima'}
                style={{
                  width: width ? normalizeCssSize(width) : 'auto',
                  height: height ? normalizeCssSize(height) : 'auto',
                  maxWidth: '100%',
                }}
              />
            </div>
          )}

          <label htmlFor="image-alt" className="modal-label">
            Testo alternativo (opzionale)
          </label>
          <input
            id="image-alt"
            type="text"
            className="modal-input"
            placeholder="Descrizione dell'immagine"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
          />

          <div className="image-modal-dimensions">
            <label htmlFor="image-width" className="modal-label">
              Larghezza
            </label>
            <input
              id="image-width"
              type="text"
              className="modal-input"
              placeholder="auto (es. 480, 50%)"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
            />

            <label htmlFor="image-height" className="modal-label">
              Altezza
            </label>
            <input
              id="image-height"
              type="text"
              className="modal-input"
              placeholder="auto"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </div>

          {error && <p className="modal-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Annulla
            </button>
            <button type="submit" className="btn-primary">
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
