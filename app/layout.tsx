import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { Toaster } from 'sonner'
import { Providers } from '@/components/providers'
import 'katex/dist/katex.min.css'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://medenpoche.ma'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'MedenPoche — Réussis ton concours de médecine au Maroc',
    template: '%s · MedenPoche',
  },
  description:
    "La plateforme tout-en-un pour préparer le concours de médecine au Maroc : QCM, examens blancs et tuteur IA.",
  applicationName: 'MedenPoche',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'MedenPoche',
  },
  twitter: { card: 'summary_large_image' },
}

export const viewport: Viewport = {
  themeColor: '#3B6BE8',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={jakarta.variable} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  )
}
