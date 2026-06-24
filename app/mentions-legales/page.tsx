import type { Metadata } from 'next'
import { LegalShell, LegalH2, LegalP } from '@/components/landing/legal-shell'

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Mentions légales de la plateforme MedenPoche.',
  alternates: { canonical: '/mentions-legales' },
}

export default function MentionsLegales() {
  return (
    <LegalShell title="Mentions légales" updated="12 juin 2026">
      <LegalP>
        Les présentes mentions légales s&apos;appliquent au site et à l&apos;application MedenPoche
        (ci-après « la Plateforme »).
      </LegalP>

      <LegalH2>Éditeur</LegalH2>
      <LegalP>
        La Plateforme est éditée et exploitée par <strong>MedenPoche</strong> (ci-après
        « l&apos;Éditeur »), accessible depuis le présent site.
      </LegalP>
      <LegalP>
        Contact : directement via WhatsApp, depuis les boutons de contact de la Plateforme.
      </LegalP>

      <LegalH2>Hébergement</LegalH2>
      <LegalP>
        La Plateforme est hébergée par <strong>Vercel Inc.</strong> (340 S Lemon Ave #4133, Walnut,
        CA 91789, États-Unis — vercel.com). Elle s&apos;appuie également sur les services de
        Supabase (base de données, authentification, stockage de fichiers) et sur les modèles
        d&apos;intelligence artificielle de Google (Gemini) pour l&apos;assistant IA.
      </LegalP>

      <LegalH2>Propriété intellectuelle</LegalH2>
      <LegalP>
        L&apos;ensemble des contenus de la Plateforme (QCM, corrections, cours, résumés, fiches,
        textes, logos, interface) est protégé par le droit de la propriété intellectuelle et reste
        la propriété exclusive de l&apos;Éditeur ou de ses partenaires. Toute reproduction,
        représentation, diffusion ou exploitation, totale ou partielle, sans autorisation écrite
        préalable, est interdite.
      </LegalP>

      <LegalH2>Responsabilité</LegalH2>
      <LegalP>
        L&apos;Éditeur s&apos;efforce d&apos;assurer l&apos;exactitude des informations diffusées,
        sans pouvoir en garantir l&apos;exhaustivité. Les réponses de l&apos;assistant IA sont
        fournies à titre indicatif et pédagogique et peuvent comporter des erreurs : elles ne
        remplacent pas l&apos;enseignement d&apos;un professeur et doivent être vérifiées.
      </LegalP>

      <LegalH2>Contact</LegalH2>
      <LegalP>
        Pour toute question relative à la Plateforme, contactez-nous via WhatsApp depuis les
        boutons de contact de la Plateforme.
      </LegalP>
    </LegalShell>
  )
}
