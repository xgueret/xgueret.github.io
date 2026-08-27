import type { APIRoute } from 'astro';

/**
 * Generated rather than served from public/ so the sitemap URL follows the
 * domain the site is built for. The static file hardcoded the GitHub Pages
 * host and kept pointing at it after the move to the custom domain, sending
 * crawlers through a redirect and contradicting every other absolute URL.
 */
const robotsTxt = (sitemap: URL) => `User-agent: *
Allow: /

# LLM discovery — see https://llmstxt.org
Allow: /llms.txt
Allow: /llms-full.txt

Sitemap: ${sitemap.href}
`;

export const GET: APIRoute = ({ site }) =>
  new Response(robotsTxt(new URL('sitemap-index.xml', site)), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
