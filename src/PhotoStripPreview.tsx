import { useEffect, useRef, useState } from 'react'

type PhotoStripPreviewProps = {
  photos: string[]
  initialColour: string
  onBack: () => void
}

const frameColours = [
  { name: 'Butter', value: '#f5dfa0' },
  { name: 'Cherry', value: '#efb8c5' },
  { name: 'Paper', value: '#f8f4eb' },
  { name: 'Sage', value: '#c6d3ba' },
  { name: 'Lavender', value: '#cec2e5' },
]

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
  initialColour,
  onBack,
}: PhotoStripPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [colour, setColour] = useState(initialColour)
  const [caption, setCaption] = useState('little moments ♡')
  const [includeDate, setIncludeDate] = useState(true)
  const [sessionDate] = useState(() =>
    new Date().toLocaleDateString('en-GB'),
  )

  const [order, setOrder] = useState(() =>
    photos.map((_, index) => index),
  )

  const [downloadUrl, setDownloadUrl] = useState('')
  const [isRendering, setIsRendering] = useState(true)
  const [error, setError] = useState('')

  const width = 1600
  const padding = 72
  const gap = 32
  const photoWidth = width - padding * 2
  const photoHeight = photoWidth * (3 / 4)

  const height =
    padding * 2 +
    photos.length * photoHeight +
    (photos.length - 1) * gap +
    220

  useEffect(() => {
    let cancelled = false
    let objectUrl = ''

    async function drawStrip() {
      setIsRendering(true)
      setDownloadUrl('')
      setError('')

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

        canvas.width = width
        canvas.height = height

        context.fillStyle = colour
        context.fillRect(0, 0, width, height)
        context.imageSmoothingEnabled = true
        context.imageSmoothingQuality = 'high'

        images.forEach((image, index) => {
          const y = padding + index * (photoHeight + gap)

          context.drawImage(
            image,
            padding,
            y,
            photoWidth,
            photoHeight,
          )
        })

        const lastPhotoBottom =
          padding +
          images.length * photoHeight +
          (images.length - 1) * gap

        context.fillStyle = '#342e2b'
        context.textAlign = 'center'

        // Shrink long captions so they stay inside the frame.
        let fontSize = 62
        context.font = `${fontSize}px Georgia`

        while (
          context.measureText(caption).width > photoWidth &&
          fontSize > 20
        ) {
          fontSize -= 2
          context.font = `${fontSize}px Georgia`
        }

        context.fillText(
          caption,
          width / 2,
          lastPhotoBottom + 100,
        )

        context.font = '24px Arial'
        context.fillText(
          includeDate
            ? `POCKET BOOTH  ·  ${sessionDate}`
            : 'POCKET BOOTH',
          width / 2,
          lastPhotoBottom + 165,
        )

        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((result) => {
            if (result) resolve(result)
            else reject(new Error('Could not create the PNG.'))
          }, 'image/png')
        })

        if (cancelled) return

        objectUrl = URL.createObjectURL(blob)
        setDownloadUrl(objectUrl)
      } catch {
        if (!cancelled) {
          setError('Could not prepare your strip. Try changing a colour.')
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
    colour,
    caption,
    includeDate,
    sessionDate,
    width,
    height,
    photoWidth,
    photoHeight,
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

  return (
    <section className="theme-screen">
      <button className="back-button" onClick={onBack}>
        ← Back to favourites
      </button>

      <span className="eyebrow">05 / MAKE IT YOURS</span>
      <h2>Your little memories, together.</h2>

      <p className="description">
        A little colour. A few words. A moment to keep.
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
          <fieldset className="editor-field">
            <legend>Frame colour</legend>

            <div className="colour-options">
              {frameColours.map((frame) => (
                <button
                  key={frame.value}
                  className={`colour-button ${
                    colour === frame.value ? 'selected' : ''
                  }`}
                  style={{ backgroundColor: frame.value }}
                  onClick={() => setColour(frame.value)}
                  aria-label={frame.name}
                  aria-pressed={colour === frame.value}
                />
              ))}
            </div>
          </fieldset>

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

          <button
            className="primary-button download-button"
            onClick={downloadStrip}
            disabled={isRendering || !downloadUrl}
          >
            {isRendering ? 'Preparing your strip…' : 'Download photo strip ↓'}
          </button>

          <p className="small-note">
            {width} × {height} pixels · PNG
            <br />
            Save your strip before closing this tab.
          </p>
        </div>
      </div>
    </section>
  )
}