import { useEffect, useRef, useState } from 'react'
import PhotoStripPreview from './PhotoStripPreview'
import ThemeFrame from './ThemeFrame'
import { themes, getTheme } from './themes'
import type { ThemeId } from './themes'

function App() {
  const [screen, setScreen] = useState<
  'home' | 'themes' | 'frames' | 'camera' | 'selection' | 'preview'>('home')

  const [selectedTheme, setSelectedTheme] = useState<ThemeId>('collectible')
  const [frameCount, setFrameCount] = useState<2 | 4>(4)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraLoading, setCameraLoading] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [selectedPhotos, setSelectedPhotos] = useState<number[]>([])
  const [isCapturing, setIsCapturing] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [shotNumber, setShotNumber] = useState(0)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(
  'user',
  )
  const [isMirrored, setIsMirrored] = useState(true)
  const [cameraResolution, setCameraResolution] = useState('')

  const captureRunningRef = useRef(false)
  const captureIdRef = useRef(0)
  const capturedPhotosRef = useRef<string[]>([])

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const cameraRequestRef = useRef(0)
  const [stripCaption, setStripCaption] = useState('little moments ♡')
  const [stripIncludeDate, setStripIncludeDate] = useState(true)
  const [sessionDate, setSessionDate] = useState('')

  const activeTheme = getTheme(selectedTheme)

  useEffect(() => {
    if (screen !== 'camera') return

    return () => {
      captureIdRef.current += 1
      captureRunningRef.current = false
      cameraRequestRef.current += 1

      // Release the camera so its indicator turns off.
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [screen])

  useEffect(() => {
    const hasSession = isCapturing || photos.length > 0

    if (!hasSession) return

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isCapturing, photos.length])

  function openCameraScreen() {
    setCameraReady(false)
    setCameraLoading(false)
    setCameraError('')
    setScreen('camera')
  }

  async function enableCamera(
    requestedFacing: 'user' | 'environment' = facingMode,
  ) {
    if (
      cameraLoading ||
      captureRunningRef.current ||
      capturedPhotosRef.current.length >= frameCount + 2
    ) {
      return
    }

    const requestId = ++cameraRequestRef.current

    setCameraLoading(true)
    setCameraReady(false)
    setCameraError('')
    setCameraResolution('')

    // Release the current camera before opening the other one.
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    let openedStream: MediaStream | null = null

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access is unavailable.')
      }

      openedStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: requestedFacing },
          width: { ideal: 3840 },
          height: { ideal: 2880 },
          aspectRatio: { ideal: 4 / 3 },
        },
        audio: false,
      })

      const video = videoRef.current

      if (requestId !== cameraRequestRef.current || !video) {
        openedStream.getTracks().forEach((track) => track.stop())
        return
      }

      streamRef.current = openedStream
      video.srcObject = openedStream

      await video.play()

      if (requestId !== cameraRequestRef.current) {
        openedStream.getTracks().forEach((track) => track.stop())
        return
      }

      const track = openedStream.getVideoTracks()[0]
      const actualFacing = track.getSettings().facingMode

      const resolvedFacing =
        actualFacing === 'environment'
          ? 'environment'
          : actualFacing === 'user'
            ? 'user'
            : requestedFacing

      setFacingMode(resolvedFacing)
      setIsMirrored(resolvedFacing === 'user')

      const cropWidth = Math.min(
        video.videoWidth,
        video.videoHeight * (4 / 3),
      )
      const cropHeight = cropWidth * (3 / 4)

      setCameraResolution(
        `Camera: ${video.videoWidth} × ${video.videoHeight} · ` +
        `Photo: ${Math.round(cropWidth)} × ${Math.round(cropHeight)}`,
      )

      setCameraReady(true)
    } catch (error) {
      openedStream?.getTracks().forEach((track) => track.stop())

      if (requestId !== cameraRequestRef.current) return

      streamRef.current = null

      const name = error instanceof Error ? error.name : ''

      setCameraError(
        name === 'NotAllowedError'
          ? 'Camera permission was blocked. Allow access in your browser settings, then try again.'
          : name === 'NotFoundError'
            ? 'No camera was found on this device.'
            : 'Could not open the camera. Close other apps using it, then try again.',
      )
    } finally {
      if (requestId === cameraRequestRef.current) {
        setCameraLoading(false)
      }
    }
  }

  function wait(milliseconds: number) {
    return new Promise<void>((resolve) => {
      window.setTimeout(resolve, milliseconds)
    })
  }

  function capturePhoto(): string {
    const video = videoRef.current
    const track = streamRef.current?.getVideoTracks()[0]

    if (
      !video ||
      video.readyState < 2 ||
      !video.videoWidth ||
      !track ||
      track.readyState !== 'live' ||
      track.muted
    ) {
      throw new Error('Camera is not ready.')
    }

    const canvas = document.createElement('canvas')

    // Crop the source to match our 4:3 camera preview.
    const cropWidth = Math.min(
      video.videoWidth,
      video.videoHeight * (4 / 3),
    )
    const cropHeight = cropWidth * (3 / 4)

    canvas.width = Math.round(cropWidth)
    canvas.height = Math.round(cropHeight)

    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('Could not prepare the photo.')
    }

    // Mirror selfies, but keep rear-camera photos unmirrored.
    if (isMirrored) {
      context.translate(canvas.width, 0)
      context.scale(-1, 1)
    }

    context.drawImage(
      video,
      (video.videoWidth - cropWidth) / 2,
      (video.videoHeight - cropHeight) / 2,
      cropWidth,
      cropHeight,
      0,
      0,
      canvas.width,
      canvas.height,
    )

    return canvas.toDataURL('image/jpeg', 0.97)
  }

  async function startSession() {
    if (!cameraReady || captureRunningRef.current) return

    const captureId = ++captureIdRef.current
    const totalShots = frameCount + 2

    captureRunningRef.current = true
    setIsCapturing(true)
    setCameraError('')

    if (capturedPhotosRef.current.length === 0) {
      setSessionDate(new Date().toLocaleDateString('en-GB'))
    }

    try {
      // If the camera was interrupted, continue only the missing shots.
      for (
        let index = capturedPhotosRef.current.length;
        index < totalShots;
        index++
      ) {
        setShotNumber(index + 1)

        for (let seconds = 5; seconds >= 1; seconds--) {
          if (captureId !== captureIdRef.current) return

          if (document.hidden) {
            throw new Error('Keep the camera tab visible.')
          }

          setCountdown(seconds)
          await wait(1000)
        }

        if (captureId !== captureIdRef.current) return

        if (document.hidden) {
          throw new Error('Keep the camera tab visible.')
        }

        const photo = capturePhoto()

        capturedPhotosRef.current.push(photo)
        setPhotos([...capturedPhotosRef.current])
        setCountdown(null)

        // A short "captured" beat before the next countdown.
        await wait(350)
      }

      if (captureId === captureIdRef.current) {
        setSelectedPhotos([])
        setScreen('selection')
      }
    } catch {
      if (captureId !== captureIdRef.current) return

      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null

      setCameraReady(false)
      setCameraError(
        'The camera session was interrupted. Your captured photos are kept. Enable the camera again to finish the remaining shots.',
      )
    } finally {
      if (captureId === captureIdRef.current) {
        captureRunningRef.current = false
        setIsCapturing(false)
        setCountdown(null)
      }
    }
  }

  function togglePhoto(index: number) {
    setSelectedPhotos((current) => {
      if (current.includes(index)) {
        return current.filter((photoIndex) => photoIndex !== index)
      }

      if (current.length >= frameCount) {
        return current
      }

      return [...current, index]
    })
  }

  return (
    <div className="app">
      <header className="header">
        <span className="logo">✿ pocket booth</span>
        <span className="edition">VOL. 01</span>
      </header>

      <main>
        {screen === 'home' && (
          <section className="home">
            <span className="eyebrow">YOUR BOOTH. ANYWHERE.</span>

            <h1>
              A little chaos.
              <br />
              <em>A little memory.</em>
            </h1>

            <p className="description">
              Your people, your place, and five seconds to pose.
              Turn wherever you are into a photobooth.
            </p>

            <button
              className="primary-button"
              onClick={() => setScreen('themes')}
            >
              Step into the booth ↗
            </button>

            <p className="small-note">
              No retakes. Just you, as you are.
            </p>
          </section>
        )}
        
        {screen === 'themes' && (
          <section className="theme-screen">
            <button
              className="back-button"
              onClick={() => setScreen('home')}
            >
              ← Back
            </button>

            <span className="eyebrow">01 / PICK YOUR WORLD</span>
            <h2>Every memory has a mood.</h2>
            <p className="description">
              Explore five little worlds. Each one has a
              2-photo and a 4-photo frame.
            </p>

            <div className="theme-grid">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  className={`theme-card ${
                    selectedTheme === theme.id ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedTheme(theme.id)}
                  aria-pressed={selectedTheme === theme.id}
                >
                  <div className="theme-dual-preview">
                    <ThemeFrame themeId={theme.id} count={2} />
                    <ThemeFrame themeId={theme.id} count={4} />
                  </div>

                  <div className="theme-title">
                    <h3>{theme.name}</h3>
                    <span>
                      {selectedTheme === theme.id ? '●' : '○'}
                    </span>
                  </div>

                  <p>{theme.description}</p>
                </button>
              ))}
            </div>

            <button
              className="primary-button"
              onClick={() => setScreen('frames')}
            >
              Preview {activeTheme.name} →
            </button>
          </section>
        )}

        {screen === 'frames' && (
          <section className="theme-screen">
            <button
              className="back-button"
              onClick={() => setScreen('themes')}
            >
              ← Back to themes
            </button>

            <span className="eyebrow">
              02 / PREVIEW YOUR FRAME
            </span>

            <h2>{activeTheme.name}</h2>

            <p className="description">
              Choose the layout you love.
              We'll capture two extra shots so you can
              pick your favourite moments.
            </p>

            <div className="frame-grid frame-grid-themed">
              {([2, 4] as const).map((count) => (
                <button
                  key={count}
                  className={`frame-card ${
                    frameCount === count ? 'selected' : ''
                  }`}
                  onClick={() => setFrameCount(count)}
                  aria-pressed={frameCount === count}
                >
                  <ThemeFrame
                    themeId={selectedTheme}
                    count={count}
                  />

                  <h3>{count} little moments</h3>

                  <p>
                    Take {count + 2} photos · keep {count}
                  </p>
                </button>
              ))}
            </div>

            <p className="small-note">
              Five seconds before every shot.
              No individual retakes.
            </p>

            <button
              className="primary-button"
              onClick={openCameraScreen}
            >
              Use {frameCount}-photo frame →
            </button>
          </section>
        )}

        {screen === 'camera' && (
          <section className="theme-screen">
            <button
              className="back-button"
              onClick={() => setScreen('frames')}
              disabled={isCapturing || photos.length > 0}
            >
              ← Back
            </button>

            <span className="eyebrow">03 / YOUR LITTLE MOMENT</span>
            <h2>Find your spot.</h2>

            <p className="description">
              {activeTheme.name} · We’ll take {frameCount + 2} photos,
              and you’ll keep your favourite {frameCount}.
            </p>

            <div className="camera-preview">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={[
                  'camera-video',
                  !cameraReady ? 'hidden' : '',
                  isMirrored ? 'mirrored' : '',
                ].join(' ')}
              />

              {!cameraReady && (
                <div className="camera-placeholder">
                  <span>◎</span>
                  <p>Your moment goes here.</p>
                </div>
              )}

              {cameraReady && (
                <span className="camera-status" role="status">
                  {isCapturing
                    ? `● PHOTO ${shotNumber} OF ${frameCount + 2}`
                    : '● CAMERA READY'}
                </span>
              )}

              {isCapturing && (
                <div className="countdown-overlay" aria-hidden="true">
                  {countdown ?? '✓'}
                </div>
              )}
            </div>

            {cameraReady && (
              <div className="camera-tools">
                <button
                  className="camera-switch"
                  onClick={() =>
                    void enableCamera(
                      facingMode === 'user' ? 'environment' : 'user',
                    )
                  }
                  disabled={
                    cameraLoading ||
                    isCapturing ||
                    photos.length > 0
                  }
                >
                  ↻ Use {facingMode === 'user' ? 'rear' : 'front'} camera
                </button>

                <p className="camera-quality">
                  {cameraResolution}
                </p>
              </div>
            )}

            {cameraError && (
              <p className="camera-error" role="alert">
                {cameraError}
              </p>
            )}

            {!cameraReady ? (
              <button
                className="primary-button"
                onClick={() => void enableCamera()}
                disabled={cameraLoading || isCapturing || photos.length > 0}
              >
                {cameraLoading ? 'Opening camera…' : 'Enable camera ↗'}
              </button>
            ) : (
              <button
                className="primary-button"
                onClick={startSession}
                disabled={isCapturing}
              >
                {isCapturing
                  ? 'Let the moment happen…'
                  : photos.length > 0
                    ? 'Continue remaining shots →'
                    : 'Start our moment →'}
              </button>
            )}

            <p className="small-note">
              {isCapturing
                ? 'Stay in this tab. The next photo happens automatically.'
                : 'Get everyone in position. Your first shot starts after 5 seconds.'}
            </p>
          </section>
        )}
        {screen === 'selection' && (
          <section className="theme-screen">
            <span className="eyebrow">04 / PICK YOUR FAVOURITES</span>
            <h2>Which moments feel like you?</h2>

            <p className="description">
              Choose {frameCount} from your {photos.length} photos.
              The order you tap is the order on your strip.
            </p>

            <p className="selection-count" role="status">
              {selectedPhotos.length} / {frameCount} selected
            </p>

            <div className="photo-grid">
              {photos.map((photo, index) => {
                const position = selectedPhotos.indexOf(index)
                const isSelected = position !== -1

                return (
                  <button
                    key={index}
                    className={`photo-option ${
                      isSelected ? 'selected' : ''
                    }`}
                    onClick={() => togglePhoto(index)}
                    aria-pressed={isSelected}
                    aria-label={`Photo ${index + 1}${
                      isSelected ? `, selected position ${position + 1}` : ''
                    }`}
                  >
                    <img
                      src={photo}
                      alt={`Your captured moment ${index + 1}`}
                    />

                    <span className="photo-badge">
                      {isSelected ? position + 1 : '+'}
                    </span>
                  </button>
                )
              })}
            </div>

            <p className="small-note">
              {selectedPhotos.length === frameCount
                ? 'Your favourites are picked. To swap one, unselect it first.'
                : 'Tap a photo to select it. Tap again to unselect.'}
            </p>
            <p className="small-note">
              Your photos stay in this tab. Save your strip before refreshing
              or closing the page.
            </p>
            <button
              className="primary-button"
              onClick={() => setScreen('preview')}
              disabled={selectedPhotos.length !== frameCount}
            >
              Make my photo strip →
            </button>
          </section>
        )}
        {screen === 'preview' && (
          <PhotoStripPreview
            photos={photos}
            order={selectedPhotos}
            setOrder={setSelectedPhotos}
            themeId={selectedTheme}
            caption={stripCaption}
            setCaption={setStripCaption}
            includeDate={stripIncludeDate}
            setIncludeDate={setStripIncludeDate}
            sessionDate={sessionDate}
            onBack={() => setScreen('selection')}
          />
        )}
      </main>

      <footer>A LITTLE BOOTH. A LOT OF FEELING.</footer>
    </div>
  )
}

export default App