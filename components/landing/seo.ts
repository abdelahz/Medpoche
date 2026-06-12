/**
 * Shared FAQ content — rendered in the FAQ section AND emitted as FAQPage
 * structured data, so the two never drift.
 */
export const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: 'MedenPoche, c’est gratuit ?',
    a: "Oui. Tu peux créer un compte et t'entraîner gratuitement, sans carte bancaire. Le plan Gratuit te donne 20 QCM par jour avec leurs corrections expliquées. Les plans Basic et Premium débloquent plus de QCM, les examens blancs, la bibliothèque et le tuteur IA.",
  },
  {
    q: 'À qui s’adresse la plateforme ?',
    a: 'Aux bacheliers marocains des filières scientifiques qui préparent le concours d’entrée aux facultés de médecine et de pharmacie. Le contenu couvre les mathématiques, la physique, la chimie et les SVT au niveau du concours.',
  },
  {
    q: 'Comment fonctionne le tuteur IA ?',
    a: "Tu poses ta question en texte ou en photo, et le tuteur IA t'explique la notion, te corrige et te donne des astuces, en s'appuyant sur le programme du concours. C'est comme avoir un prof disponible 24h/24.",
  },
  {
    q: 'Y a-t-il de vrais examens blancs ?',
    a: 'Oui. Tu peux t’entraîner sur des examens blancs chronométrés dans les conditions du concours, matière par matière ou sur les 4 matières, et revoir tes erreurs ensuite.',
  },
  {
    q: 'Je peux réviser sur mon téléphone ?',
    a: 'Absolument. MedenPoche est pensé mobile d’abord : tu révises où tu veux, quand tu veux, et tu gardes ta série (streak) en répondant chaque jour.',
  },
  {
    q: 'Comment passer à un plan supérieur ?',
    a: 'Depuis ton profil ou n’importe quel bouton « Améliorer », tu nous contactes directement sur WhatsApp et on active ton plan. Simple et rapide.',
  },
]

/** JSON-LD graph: Organization + Course + FAQPage. */
export function landingJsonLd(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: 'MedenPoche',
        url: siteUrl,
        logo: `${siteUrl}/brand/logo-full.png`,
        description:
          'Plateforme de préparation au concours de médecine au Maroc : QCM, examens blancs et tuteur IA.',
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: 'MedenPoche',
        inLanguage: 'fr',
        publisher: { '@id': `${siteUrl}/#organization` },
      },
      {
        '@type': 'Course',
        name: 'Préparation au concours de médecine',
        description:
          'Entraînement aux QCM (mathématiques, physique, chimie, SVT), examens blancs et tuteur IA pour réussir le concours d’entrée en médecine au Maroc.',
        provider: { '@id': `${siteUrl}/#organization` },
        inLanguage: 'fr',
        offers: {
          '@type': 'Offer',
          category: 'Free',
          price: '0',
          priceCurrency: 'MAD',
          availability: 'https://schema.org/InStock',
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQ_ITEMS.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  }
}
