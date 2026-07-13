import { getCollection, type CollectionEntry } from 'astro:content';
import { localePrefix, type Locale } from '../i18n';

export interface Episode {
  title: string;
  order: number;
  href: string;
  current: boolean;
}

export interface SeriesNav {
  episodes: Episode[];
  prev?: Episode;
  next?: Episode;
}

/**
 * Build the ordered episode list for the series a post belongs to, plus the
 * previous/next neighbours relative to the given post. Returns an empty list
 * when the post is not part of a series.
 */
export async function getSeriesNav(
  post: CollectionEntry<'posts'>,
  locale: Locale
): Promise<SeriesNav> {
  const series = post.data.series;
  if (!series) return { episodes: [] };

  const prefixId = `${locale}/`;
  const siblings = await getCollection(
    'posts',
    ({ id, data }) =>
      id.startsWith(prefixId) &&
      !data.draft &&
      !data.archived &&
      data.series === series
  );

  const episodes: Episode[] = siblings
    .sort((a, b) => (a.data.seriesOrder ?? 0) - (b.data.seriesOrder ?? 0))
    .map((p) => ({
      title: p.data.title,
      order: p.data.seriesOrder ?? 0,
      href: `${localePrefix(locale)}/posts/${p.id
        .replace(prefixId, '')
        .replace(/\.md$/, '')}/`,
      current: p.id === post.id,
    }));

  const idx = episodes.findIndex((e) => e.current);
  return {
    episodes,
    prev: idx > 0 ? episodes[idx - 1] : undefined,
    next: idx >= 0 && idx < episodes.length - 1 ? episodes[idx + 1] : undefined,
  };
}
