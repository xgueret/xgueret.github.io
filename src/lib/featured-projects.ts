import { getCollection } from 'astro:content';
import { t, type Locale } from '../i18n';
import type { Motif } from './motif';
export type { Motif } from './motif';

export interface FeaturedProject {
  index: number;
  title: string;
  plateTag: string;
  year: string;
  description: string;
  url: string;
  motif: Motif;
}

/**
 * The projects drawn as 3D plates on the home page, in plate order.
 * `year` is the mockup's second caption line ("Open source" / "Site web").
 */
export async function getFeaturedProjects(locale: Locale): Promise<FeaturedProject[]> {
  const entries = await getCollection(
    'projects',
    ({ id, data }) => id.startsWith(`${locale}/`) && data.featured
  );

  return entries
    .sort((a, b) => a.data.order - b.data.order)
    .map((entry, i) => ({
      index: i + 1,
      title: entry.data.title,
      plateTag: entry.data.plateTag ?? entry.data.tags.slice(0, 2).join(' / '),
      year: t(locale, entry.data.category === 'github' ? 'projectOpenSource' : 'projectWebsite'),
      description: entry.data.description,
      url: entry.data.github ?? entry.data.url ?? '',
      motif: entry.data.motif ?? 'rings',
    }));
}
