
import { getTheme } from './themes'
import type { ThemeId } from './themes'

type FrameOptions = {
  context: CanvasRenderingContext2D
  themeId: ThemeId
  width: number
  height: number
  padding: number
  photoHeight: number
  photoCount: number
  gap: number
}

export function drawThemeBackground({
  context,
  themeId,
  width,
  height,
}: FrameOptions) {
  const theme = getTheme(themeId)

  context.fillStyle = theme.colour
  context.fillRect(0, 0, width, height)

  context.save()
  context.strokeStyle = theme.accent
  context.lineWidth = 8
  context.strokeRect(20, 20, width - 40, height - 40)

  context.lineWidth = 3
  context.strokeRect(35, 35, width - 70, height - 70)
  context.restore()
}

export function drawThemeDetails({
  context,
  themeId,
  width,
  padding,
  photoHeight,
  photoCount,
  gap,
}: FrameOptions) {
  const theme = getTheme(themeId)

  context.save()
  context.fillStyle = theme.ink
  context.textAlign = 'center'

  // Decorative header
  context.font = 'bold 40px Georgia'
  context.fillText(
    theme.name.toUpperCase(),
    width / 2,
    112,
  )

  context.fillStyle = theme.accent
  context.font = '46px Georgia'
  context.fillText(
    theme.motifs.join('  '),
    width / 2,
    174,
  )

  // Decorations between the photos
  for (let index = 0; index < photoCount - 1; index++) {
    const y =
      padding +
      (index + 1) * photoHeight +
      index * gap +
      gap / 2

    context.font = '30px Georgia'
    context.fillText(
      theme.motifs[index % theme.motifs.length],
      width / 2,
      y + 10,
    )
  }

  const bottom =
    padding +
    photoCount * photoHeight +
    (photoCount - 1) * gap

  context.font = 'italic 34px Georgia'
  context.fillText(
    theme.tagline,
    width / 2,
    bottom + 58,
  )

  context.restore()
}
