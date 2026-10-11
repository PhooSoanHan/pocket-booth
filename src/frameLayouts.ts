
import type { ThemeId } from './themes'

export type PhotoCount = 2 | 4

export type PhotoWindow = {
  x: number
  y: number
  width: number
  height: number
}

export type FrameLayout = {
  windows: PhotoWindow[]
}

// Coordinates are relative to the PNG dimensions (0 to 1).
// Photo windows are ordered from top to bottom.

export const frameLayouts: Record<
  ThemeId,
  Record<PhotoCount, FrameLayout>
> = {
  collectible: {
    2: {
      windows: [
        { x: 0.263, y: 0.191, width: 0.471, height: 0.326 },
        { x: 0.307, y: 0.541, width: 0.439, height: 0.260 },
      ],
    },
    4: {
      windows: [
        { x: 0.276, y: 0.154, width: 0.433, height: 0.158 },
        { x: 0.281, y: 0.339, width: 0.436, height: 0.157 },
        { x: 0.282, y: 0.527, width: 0.457, height: 0.148 },
        { x: 0.283, y: 0.702, width: 0.452, height: 0.128 },
      ],
    },
  },

  retro: {
    2: {
      windows: [
        { x: 0.254, y: 0.188, width: 0.526, height: 0.275 },
        { x: 0.253, y: 0.518, width: 0.512, height: 0.247 },
      ],
    },
    4: {
      windows: [
        { x: 0.294, y: 0.141, width: 0.422, height: 0.129 },
        { x: 0.295, y: 0.300, width: 0.420, height: 0.142 },
        { x: 0.293, y: 0.472, width: 0.423, height: 0.140 },
        { x: 0.294, y: 0.644, width: 0.420, height: 0.139 },
      ],
    },
  },

  y2k: {
    2: {
      windows: [
        { x: 0.265, y: 0.145, width: 0.467, height: 0.313 },
        { x: 0.266, y: 0.497, width: 0.469, height: 0.252 },
      ],
    },
    4: {
      windows: [
        { x: 0.289, y: 0.133, width: 0.441, height: 0.138 },
        { x: 0.289, y: 0.296, width: 0.441, height: 0.156 },
        { x: 0.290, y: 0.482, width: 0.439, height: 0.156 },
        { x: 0.290, y: 0.666, width: 0.440, height: 0.161 },
      ],
    },
  },

  nightout: {
    2: {
      windows: [
        { x: 0.245, y: 0.173, width: 0.500, height: 0.301 },
        { x: 0.250, y: 0.510, width: 0.498, height: 0.276 },
      ],
    },
    4: {
      windows: [
        { x: 0.295, y: 0.141, width: 0.422, height: 0.131 },
        { x: 0.299, y: 0.297, width: 0.419, height: 0.138 },
        { x: 0.299, y: 0.460, width: 0.418, height: 0.145 },
        { x: 0.299, y: 0.631, width: 0.418, height: 0.158 },
      ],
    },
  },

  travel: {
    2: {
      windows: [
        { x: 0.271, y: 0.176, width: 0.463, height: 0.284 },
        { x: 0.256, y: 0.520, width: 0.483, height: 0.301 },
      ],
    },
    4: {
      windows: [
        { x: 0.274, y: 0.125, width: 0.449, height: 0.138 },
        { x: 0.277, y: 0.298, width: 0.450, height: 0.152 },
        { x: 0.278, y: 0.486, width: 0.448, height: 0.152 },
        { x: 0.279, y: 0.674, width: 0.445, height: 0.155 },
      ],
    },
  },
}
