
export const themes = [
  {
    id: 'collectible',
    name: 'Collectible Cuties',
    description: 'Tiny treasures and adorable memories.',
    colour: '#f9d8cb',
    accent: '#b86f8c',
    ink: '#683c50',
    motifs: ['✿', '♡', '☆'],
    tagline: 'a pocket full of cute',
    frames: {
        2: '/frames/collectible-2.png',
        4: '/frames/collectible-4.png',
    },
    },
  {
    id: 'retro',
    name: 'Retro Music',
    description: 'Mixtapes, vinyl records and nostalgia.',
    colour: '#dbc3a2',
    accent: '#86533d',
    ink: '#53372c',
    motifs: ['♫', '♪', '✦'],
    tagline: 'our little mixtape',
    frames: {
        2: '/frames/retro-2.png',
        4: '/frames/retro-4.png',
    },
  },
  {
    id: 'y2k',
    name: 'Y2K',
    description: 'Dreamy pink, purple and digital nostalgia.',
    colour: '#edcff7',
    accent: '#9160d5',
    ink: '#643a94',
    motifs: ['♡', '✧', '✦'],
    tagline: 'forever in our digital era',
    frames: {
        2: '/frames/y2k-2.png',
        4: '/frames/y2k-4.png',
    },
  },
  {
    id: 'nightout',
    name: 'Night Out',
    description: 'Neon lights and unforgettable nights.',
    colour: '#281e35',
    accent: '#ff9a62',
    ink: '#fff0dc',
    motifs: ['✦', '★', '♫'],
    tagline: 'after dark memories',
    frames: {
        2: '/frames/nightout-2.png',
        4: '/frames/nightout-4.png',
    },
  },
  {
    id: 'travel',
    name: 'Travel',
    description: 'Postcards, adventures and memories abroad.',
    colour: '#e4e9dc',
    accent: '#568d94',
    ink: '#385f63',
    motifs: ['✈', '✦', '♡'],
    tagline: 'collect moments, not miles',
    frames: {
        2: '/frames/travel-2.png',
        4: '/frames/travel-4.png',
    },
  },
] as const

export type ThemeId = (typeof themes)[number]['id']

export function getTheme(id: ThemeId) {
  return themes.find((theme) => theme.id === id) ?? themes[0]
}
