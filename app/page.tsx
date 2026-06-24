import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getPrelaunchMode } from '@/app/actions/settings'
import { LandingPage } from '@/components/landing/landing-page'
import { landingJsonLd } from '@/components/landing/seo'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://medenpoche.ma'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { absolute: 'MedenPoche — Réussis ton concours de médecine au Maroc' },
  description:
    "La plateforme tout-en-un pour préparer le concours de médecine au Maroc : QCM par matière et examens blancs, tuteur IA qui t'explique tout (même en photo), cours et suivi de progression. Commence gratuitement.",
  keywords: [
    'concours médecine Maroc',
    'préparation concours médecine',
    'QCM médecine',
    'réviser concours médecine',
    'concours faculté de médecine',
    'bac sciences Maroc médecine',
    'examen blanc médecine',
    'tuteur IA médecine',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: SITE_URL,
    siteName: 'MedenPoche',
    title: 'MedenPoche — Réussis ton concours de médecine',
    description:
      "QCM, examens blancs et un tuteur IA qui t'explique tout. La prépa au concours de médecine, dans ta poche. Commence gratuitement.",
    // Share card comes from app/opengraph-image.tsx (real 1200×630).
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MedenPoche — Réussis ton concours de médecine',
    description:
      "QCM, examens blancs et un tuteur IA qui t'explique tout. Commence gratuitement.",
  },
  robots: { index: true, follow: true },
}

/**
 * Root route. Logged-out visitors get the public marketing landing page (best
 * SEO at the apex URL). Authenticated users are routed to their dashboard — the
 * landing is never shown to someone already inside the app.
 */
export default async function RootPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, plan')
      .eq('id', user.id)
      .single()
    if (profile?.is_admin) redirect('/admin/dashboard')

    // Pre-launch: free-plan students wait on /bientot (paid plans pass through).
    if ((profile?.plan ?? 'gratuit') === 'gratuit' && (await getPrelaunchMode())) {
      redirect('/bientot')
    }
    redirect('/student/accueil')
  }

  return (
    <>
      <script
        type="application/ld+json"
        // Structured data for rich results (Organization + Course + FAQ).
        dangerouslySetInnerHTML={{ __html: JSON.stringify(landingJsonLd(SITE_URL)) }}
      />
      <LandingPage />
    </>
  )
}
