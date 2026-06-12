import type { Metadata } from 'next'
import { LegalShell, LegalH2, LegalP, LegalUl } from '@/components/landing/legal-shell'

export const metadata: Metadata = {
  title: 'Politique de confidentialité — MedenPoche',
  description:
    'Comment MedenPoche collecte, utilise et protège tes données personnelles.',
  alternates: { canonical: '/confidentialite' },
}

export default function Confidentialite() {
  return (
    <LegalShell title="Politique de confidentialité" updated="12 juin 2026">
      <LegalP>
        Ta vie privée compte. Cette politique explique quelles données nous collectons, pourquoi,
        comment elles sont protégées et quels sont tes droits. Elle s&apos;inscrit dans le respect
        de la loi marocaine n° 09-08 relative à la protection des personnes physiques à
        l&apos;égard du traitement des données à caractère personnel.
      </LegalP>

      <LegalH2>Responsable du traitement</LegalH2>
      <LegalP>
        Le responsable du traitement est <strong>MedenPoche</strong>, joignable via WhatsApp depuis
        les boutons de contact de la Plateforme.
      </LegalP>

      <LegalH2>Données que nous collectons</LegalH2>
      <LegalUl
        items={[
          'Données de compte : adresse email, prénom, nom, et le cas échéant filière et numéro de téléphone que tu renseignes.',
          "Données d'usage pédagogique : tes réponses aux QCM, tes résultats, ta progression, tes favoris et ton historique de conversation avec l'assistant IA.",
          'Données techniques : informations de connexion et de session nécessaires au fonctionnement et à la sécurité du service.',
        ]}
      />

      <LegalH2>Finalités et base légale</LegalH2>
      <LegalUl
        items={[
          'Fournir le service (compte, entraînement, suivi de progression, assistant IA) — exécution du contrat.',
          'Sécuriser les comptes et prévenir les abus — intérêt légitime.',
          'Gérer les abonnements et la relation client — exécution du contrat.',
          'Améliorer la qualité pédagogique de la plateforme — intérêt légitime.',
        ]}
      />

      <LegalH2>Sous-traitants et partage</LegalH2>
      <LegalP>
        Nous ne vendons pas tes données. Nous faisons appel à des prestataires techniques qui les
        traitent pour notre compte :
      </LegalP>
      <LegalUl
        items={[
          'Supabase — hébergement de la base de données, authentification et stockage des fichiers.',
          "Google (Gemini) — traitement des questions envoyées à l'assistant IA afin de générer les réponses.",
          'Vercel — hébergement et diffusion de l’application.',
        ]}
      />
      <LegalP>
        Certains prestataires peuvent être situés hors du Maroc ; des garanties appropriées
        encadrent ces transferts.
      </LegalP>

      <LegalH2>Durée de conservation</LegalH2>
      <LegalP>
        Tes données sont conservées tant que ton compte est actif. Tu peux demander la suppression
        de ton compte à tout moment ; tes données sont alors supprimées, sauf obligation légale de
        conservation.
      </LegalP>

      <LegalH2>Tes droits</LegalH2>
      <LegalP>
        Conformément à la loi 09-08, tu disposes d&apos;un droit d&apos;accès, de rectification,
        d&apos;opposition et de suppression de tes données. Pour les exercer, contacte-nous via
        WhatsApp depuis la Plateforme. Tu peux également saisir la Commission Nationale de contrôle
        de la protection des Données à caractère Personnel (CNDP).
      </LegalP>

      <LegalH2>Sécurité</LegalH2>
      <LegalP>
        Nous mettons en œuvre des mesures techniques et organisationnelles (contrôle d&apos;accès,
        chiffrement des échanges, cloisonnement des données par utilisateur) pour protéger tes
        données contre tout accès non autorisé.
      </LegalP>

      <LegalH2>Mineurs</LegalH2>
      <LegalP>
        La Plateforme s&apos;adresse à des lycéens. Si tu es mineur, l&apos;utilisation du service
        suppose l&apos;accord de ton représentant légal.
      </LegalP>

      <LegalH2>Contact</LegalH2>
      <LegalP>
        Pour toute question sur tes données, contacte-nous via WhatsApp depuis les boutons de
        contact de la Plateforme.
      </LegalP>
    </LegalShell>
  )
}
