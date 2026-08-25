/**
 * Crawl the built site and assert that every language-switcher link resolves
 * to a page that actually exists. Guards against locale-dependent route
 * segments (category slugs) being carried across locales verbatim.
 *
 * Usage: node scripts/check-language-switcher.mjs   (after `pnpm build`)
 */
import { readdir, readFile, access } from 'node:fs/promises';
import { join, relative } from 'node:path';

const DIST = 'dist';

async function htmlFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await htmlFiles(full)));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const exists = async (p) => access(p).then(() => true, () => false);

const pages = await htmlFiles(DIST);
const failures = [];

for (const page of pages) {
  const html = await readFile(page, 'utf8');
  // The switcher links carry aria-label="..." from switchToEn / switchToFr
  const links = [...html.matchAll(/<a href="([^"]*)"[^>]*aria-label="(?:Switch to|Passer en|Voir en|Read in)[^"]*"/gi)]
    .map((m) => m[1]);

  for (const href of links) {
    const clean = decodeURIComponent(href.split('#')[0].split('?')[0]);
    const target = clean.endsWith('/') || !clean.includes('.')
      ? join(DIST, clean, 'index.html')
      : join(DIST, clean);
    if (!(await exists(target))) {
      failures.push({ from: '/' + relative(DIST, page).replace(/index\.html$/, ''), to: href });
    }
  }
}

if (failures.length) {
  console.error(`\n✗ ${failures.length} language-switcher link(s) lead to a 404:\n`);
  for (const f of failures) console.error(`  ${f.from}\n      -> ${f.to}\n`);
  process.exit(1);
}
console.log(`✓ every language-switcher link resolves (${pages.length} pages crawled)`);
