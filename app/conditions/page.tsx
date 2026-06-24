import type { Metadata } from 'next'
import { LegalShell, LegalH2, LegalP, LegalUl } from '@/components/landing/legal-shell'

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation",
  description: "Conditions générales d'utilisation de la plateforme MedenPoche.",
  alternates: { canonical: '/conditions' },
}

export default function Conditions() {
  return (
    <LegalShell title="Conditions générales d'utilisation" updated="12 juin 2026">
      <LegalP>
        Les présentes conditions générales d&apos;utilisation (« CGU ») encadrent l&apos;accès et
        l&apos;usage de la plateforme MedenPoche. En créant un compte ou en utilisant le service, tu
        acceptes ces CGU.
      </LegalP>

      <LegalH2>1. Objet</LegalH2>
      <LegalP>
        MedenPoche est une plateforme d&apos;entraînement en ligne destinée à préparer le concours
        d&apos;entrée aux facultés de médecine : QCM, examens blancs, bibliothèque de cours et
        assistant IA.
      </LegalP>

      <LegalH2>2. Compte</LegalH2>
      <LegalUl
        items={[
          "L'inscription requiert une adresse email valide et des informations exactes.",
          'Tu es responsable de la confidentialité de ton mot de passe et de l’activité de ton compte.',
          'Un compte est strictement personnel et ne peut être partagé.',
        ]}
      />

      <LegalH2>3. Abonnements</LegalH2>
      <LegalP>
        La Plateforme propose un plan Gratuit et des plans payants (Basic, Premium) débloquant
        davantage de fonctionnalités. L&apos;activation des plans payants s&apos;effectue par contact
        direct (WhatsApp) ; les conditions tarifaires sont communiquées à ce moment-là. Les sommes
        versées ne sont pas remboursables, sauf disposition légale impérative ou accord écrit de
        l&apos;éditeur.
      </LegalP>

      <LegalH2>4. Usage acceptable</LegalH2>
      <LegalUl
        items={[
          'Ne pas copier, revendre ou redistribuer les contenus de la Plateforme.',
          'Ne pas tenter de contourner les limites d’usage, les contrôles d’accès ou la sécurité.',
          'Ne pas utiliser le service à des fins illégales ou portant atteinte aux droits de tiers.',
        ]}
      />

      <LegalH2>5. Assistant IA</LegalH2>
      <LegalP>
        L&apos;assistant IA fournit des explications à visée pédagogique. Ses réponses peuvent
        contenir des inexactitudes ; elles ne constituent pas un avis officiel et ne remplacent pas
        l&apos;enseignement d&apos;un professeur. Tu dois vérifier les informations importantes.
      </LegalP>

      <LegalH2>6. Propriété intellectuelle</LegalH2>
      <LegalP>
        Les contenus (QCM, corrections, cours, interface) sont protégés et restent la propriété de
        l&apos;éditeur. Une licence d&apos;usage personnel, non exclusive et non transférable, t&apos;est
        accordée le temps de ton abonnement.
      </LegalP>

      <LegalH2>7. Disponibilité et responsabilité</LegalH2>
      <LegalP>
        L&apos;éditeur s&apos;efforce d&apos;assurer la disponibilité du service mais ne garantit pas
        une absence totale d&apos;interruption. Sa responsabilité ne saurait être engagée pour les
        résultats obtenus au concours, l&apos;usage qui est fait des contenus, ou des dommages
        indirects.
      </LegalP>

      <LegalH2>8. Résiliation</LegalH2>
      <LegalP>
        Tu peux supprimer ton compte à tout moment. L&apos;éditeur peut suspendre ou clôturer un
        compte en cas de manquement aux présentes CGU.
      </LegalP>

      <LegalH2>9. Modification des CGU</LegalH2>
      <LegalP>
        Les présentes CGU peuvent être mises à jour. La version en vigueur est celle publiée sur la
        Plateforme.
      </LegalP>

      <LegalH2>10. Droit applicable</LegalH2>
      <LegalP>
        Les présentes CGU sont régies par le droit marocain. Tout litige relève des tribunaux
        marocains compétents, à défaut de résolution amiable.
      </LegalP>

      <LegalH2>Contact</LegalH2>
      <LegalP>
        Pour toute question, contactez-nous via WhatsApp depuis les boutons de contact de la
        Plateforme.
      </LegalP>
    </LegalShell>
  )
}
