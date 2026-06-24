import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://medenpoche.ma'

// Bump when public marketing/legal content meaningfully changes — a stable,
// honest date is a better crawl signal than `new Date()` on every request.
const CONTENT_UPDATED = new Date('2026-06-24')
const LEGAL_UPDATED = new Date('2026-06-01')

/**
 * Only public, indexable routes belong here. The app itself (/student, /admin)
 * is auth-gated and must NOT be advertised to crawlers.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, lastModified: CONTENT_UPDATED, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/auth/register`, lastModified: CONTENT_UPDATED, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/auth/login`, lastModified: CONTENT_UPDATED, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/mentions-legales`, lastModified: LEGAL_UPDATED, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/confidentialite`, lastModified: LEGAL_UPDATED, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/conditions`, lastModified: LEGAL_UPDATED, changeFrequency: 'yearly', priority: 0.2 },
  ]
}
