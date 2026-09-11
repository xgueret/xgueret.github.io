/**
 * Where a project's link goes. A website is shown live and an open-source
 * project at its repository; whichever other address exists is the fallback.
 * The plain `github ?? url` this replaces sent a website to its repository the
 * moment one was declared — which is exactly what a landing page with a repo
 * does. Every place that renders a project link resolves it here.
 */
export function projectHref(data: {
  category: 'github' | 'websites';
  github?: string;
  url?: string;
}): string | undefined {
  const [first, second] = data.category === 'websites' ? [data.url, data.github] : [data.github, data.url];
  return first ?? second;
}
