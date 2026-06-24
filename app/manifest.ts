import type { MetadataRoute } from 'next'

/** Web app manifest — enables "add to home screen" + minor SEO/mobile signal. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MedenPoche — Concours de médecine',
    short_name: 'MedenPoche',
    description:
      'Prépare le concours de médecine au Maroc : QCM, examens blancs et tuteur IA.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#3B6BE8',
    lang: 'fr',
    icons: [
      { src: '/icon.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  }
}
