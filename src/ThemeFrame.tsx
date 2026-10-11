
import { getTheme } from './themes'
import type { ThemeId } from './themes'
import type { PhotoCount } from './frameLayouts'

type ThemeFrameProps = {
  themeId: ThemeId
  count: PhotoCount
}

export default function ThemeFrame({
  themeId,
  count,
}: ThemeFrameProps) {
  const theme = getTheme(themeId)

  return (
    <div className="artwork-frame">
      <img
        src={theme.frames[count]}
        alt={`${theme.name} ${count}-photo frame`}
        className="artwork-frame-image"
        draggable={false}
      />
    </div>
  )
}
