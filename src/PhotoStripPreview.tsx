import { useEffect, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { getTheme } from './themes'
import type { ThemeId } from './themes'
import { frameLayouts } from './frameLayouts'
import type { PhotoCount } from './frameLayouts'

type PhotoStripPreviewProps = {
  photos: string[]
  order: number[]
  setOrder: Dispatch<SetStateAction<number[]>>
  themeId: ThemeId
  caption: string
  setCaption: (value: string) => void
  includeDate: boolean
  setIncludeDate: (value: boolean) => void
  sessionDate: string
  onBack: () => void
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not load a photo.'))
    image.src = source
  })
}

export default function PhotoStripPreview({
  photos,
  order,
  setOrder,
  themeId,
  caption,
  setCaption,
  includeDate,
  setIncludeDate,
  sessionDate,
  onBack,
}: PhotoStripPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [downloadUrl, setDownloadUrl] = useState('')
  const [isRendering, setIsRendering] = useState(true)
  const [error, setError] = useState('')
  const [shareFile, setShareFile] = useState<File | null>(null)
  const [canShareFile, setCanShareFile] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [shareError, setShareError] = useState('')
  const [downloadWidth, setDownloadWidth] = useState(0)
  const [downloadHeight, setDownloadHeight] = useState(0)

  const count = order.length as PhotoCount

  useEffect(() => {
    let cancelled = false
    let objectUrl = ''

    async function drawStrip() {
      setIsRendering(true)
      setDownloadUrl('')
      setError('')
      setShareFile(null)
      setCanShareFile(false)
      setShareError('')

      try {
        const images = await Promise.all(
          order.map((index) => loadImage(photos[index])),
        )

        if (cancelled) return

        const canvas = canvasRef.current
        const context = canvas?.getContext('2d')

        if (!canvas || !context) {
          throw new Error('Could not prepare the strip.')
        }
        
        const theme = getTheme(themeId)
        const layout = frameLayouts[themeId][count]

        // Draw the illustrated artwork over the photos.
        const overlay = await loadImage(theme.frames[count])

        const width = 1600
        const height = Math.round(
          width * (overlay.naturalHeight / overlay.naturalWidth)
        )

        canvas.width = width
        canvas.height = height

        setDownloadWidth(width)
        setDownloadHeight(height)

        context.fillStyle = theme.colour
        context.fillRect(0, 0, width, height)

        context.imageSmoothingEnabled = true
        context.imageSmoothingQuality = 'high'

        // Draw the user's selected photos first.
        images.forEach((image, index) => {
          const window = layout.windows[index]

          if (!window) return

          // Convert relative coordinates into canvas pixels.
          const photoX = window.x * width
          const photoY = window.y * height
          const photoWidth = window.width * width
          const photoHeight = window.height * height

          const scale = Math.max(
            photoWidth / image.width,
            photoHeight / image.height,
          )

          const sourceWidth = photoWidth / scale
          const sourceHeight = photoHeight / scale

          const sourceX = (image.width - sourceWidth) / 2
          const sourceY = (image.height - sourceHeight) / 2

          context.drawImage(
            image,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            photoX,
            photoY,
            photoWidth,
            photoHeight,
          )
        })

        if (cancelled) return

        context.drawImage(
          overlay,
          0,
          0,
          width,
          height,
        )

        // Draw the user's editable message and optional date.
        context.textAlign = 'center'
        context.fillStyle = theme.ink

        let fontSize = 55
        context.font = `${fontSize}px Georgia`

        while (
          context.measureText(caption).width > width - 180 &&
          fontSize > 20
        ) {
          fontSize -= 2
          context.font = `${fontSize}px Georgia`
        }

        context.fillText(
          caption,
          width / 2,
          height - 190,
        )

        if (includeDate) {
          context.font = '28px Arial'
          context.fillText(
            sessionDate,
            width / 2,
            height - 110,
          )
        }

        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((result) => {
            if (result) resolve(result)
            else reject(new Error('Could not create the PNG.'))
          }, 'image/png')
        })

        if (cancelled) return

        objectUrl = URL.createObjectURL(blob)
        setDownloadUrl(objectUrl)
        const file = new File([blob], 'pocket-booth.png', {
            type: 'image/png',
            })

            setShareFile(file)

            setCanShareFile(
            typeof navigator.share === 'function' &&
            typeof navigator.canShare === 'function' &&
            navigator.canShare({ files: [file] }),
            )
      } catch {
        if (!cancelled) {
          setError('Could not prepare your strip. Please try again.')
        }
      } finally {
        if (!cancelled) {
          setIsRendering(false)
        }
      }
    }

    void drawStrip()

    return () => {
      cancelled = true

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [
      photos,
      order,
      themeId,
      caption,
      includeDate,
      sessionDate,
      count,
    ])

  function movePhoto(position: number, direction: -1 | 1) {
    const destination = position + direction

    if (destination < 0 || destination >= order.length) return

    setOrder((current) => {
      const updated = [...current]

      ;[updated[position], updated[destination]] = [
        updated[destination],
        updated[position],
      ]

      return updated
    })
  }

  function downloadStrip() {
    if (!downloadUrl || isRendering) return

    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = 'pocket-booth.png'

    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  async function shareStrip() {
    if (!shareFile || !canShareFile || isRendering || isSharing) {
        return
    }

    setShareError('')
    setIsSharing(true)

    try {
        await navigator.share({
        files: [shareFile],
        })
    } catch (error) {
        // Closing the share sheet is normal, not an error.
        const wasCancelled =
        error instanceof Error && error.name === 'AbortError'

        if (!wasCancelled) {
        setShareError(
            'Sharing could not open. You can still use Download photo strip.',
        )
        }
    } finally {
        setIsSharing(false)
    }
    }

  return (
    <section className="theme-screen">
      <button className="back-button" onClick={onBack}>
        ← Back to favourites
      </button>

      <span className="eyebrow">05 / MAKE IT YOURS</span>
      <h2>Your little memories, together.</h2>

      <p className="description">
        Your themed frame is ready.
        Add a message, choose your date, and save the memory.
      </p>

      <div className="strip-editor">
        <div className="strip-stage">
          <canvas
            ref={canvasRef}
            className="finished-strip"
            aria-label="Your chosen photos arranged in a vertical strip"
          />
        </div>

        <div className="strip-controls">
          <div className="editor-field">
            <label htmlFor="strip-caption">A little message</label>

            <input
              id="strip-caption"
              type="text"
              value={caption}
              maxLength={45}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="little moments ♡"
            />
          </div>

          <label className="date-option">
            <input
              type="checkbox"
              checked={includeDate}
              onChange={(event) => setIncludeDate(event.target.checked)}
            />
            Include the date
          </label>

          <div className="editor-field">
            <p className="field-label">Arrange your moments</p>

            <div className="order-list">
              {order.map((photoIndex, position) => (
                <div className="order-item" key={photoIndex}>
                  <img
                    src={photos[photoIndex]}
                    alt={`Strip position ${position + 1}`}
                  />

                  <div className="order-actions">
                    <button
                      onClick={() => movePhoto(position, -1)}
                      disabled={position === 0}
                      aria-label={`Move photo ${position + 1} earlier`}
                    >
                      ←
                    </button>

                    <span>{position + 1}</span>

                    <button
                      onClick={() => movePhoto(position, 1)}
                      disabled={position === order.length - 1}
                      aria-label={`Move photo ${position + 1} later`}
                    >
                      →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="camera-error" role="alert">
              {error}
            </p>
          )}

          {canShareFile && (
            <button
                className="primary-button share-button"
                onClick={() => void shareStrip()}
                disabled={isRendering || isSharing || !shareFile}
            >
                {isSharing ? 'Sharing…' : 'Save / Share image ↗'}
            </button>
            )}

            {shareError && (
            <p className="camera-error" role="alert">
                {shareError}
            </p>
            )}

          <button
            className="primary-button download-button"
            onClick={downloadStrip}
            disabled={isRendering || !downloadUrl}
          >
            {isRendering ? 'Preparing your strip…' : 'Download photo strip ↓'}
          </button>

          {canShareFile && (
            <p className="small-note">
                To save to Photos on iPhone, open Save / Share image
                and look for Save Image.
            </p>
            )}

          <p className="small-note">
            {downloadWidth} × {downloadHeight} pixels · PNG
            <br />
            Save your strip before closing this tab.
          </p>
        </div>
      </div>
    </section>
  )
}