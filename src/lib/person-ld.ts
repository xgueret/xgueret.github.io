import { type Locale, localePrefix } from '../i18n';

const DESCRIPTION: Record<Locale, string> = {
  fr: "Ingénieur DevOps basé en Guadeloupe, spécialisé en Kubernetes, Terraform, Ansible et Python, avec un intérêt marqué pour l'IA appliquée (LLM, MCP).",
  en: 'DevOps Engineer based in Guadeloupe, specialized in Kubernetes, Terraform, Ansible and Python, with a strong interest in applied AI (LLM, MCP).',
};

/**
 * The single definition of the Person entity this site is about.
 *
 * This node used to be copy-pasted into every page carrying structured data,
 * and the copies drifted: knowsAbout existed in three lengths, sameAs in two,
 * and hasCredential was missing a certification on half of them. Search
 * engines reconcile these into one entity, so a field present on some pages
 * and absent on others is a contradiction about the same person. Everything
 * that describes the person belongs here and nowhere else.
 */
export function personLd(site: string, locale: Locale) {
  return {
    '@type': 'Person',
    name: 'Xavier GUERET',
    alternateName: 'Xavier Gueret',
    jobTitle: 'DevOps Engineer',
    url: `${site}${localePrefix(locale)}/`,
    image: `${site}/images/moi.png`,
    description: DESCRIPTION[locale],
    homeLocation: {
      '@type': 'Place',
      name: 'Guadeloupe',
      address: { '@type': 'PostalAddress', addressRegion: 'Guadeloupe', addressCountry: 'FR' },
    },
    knowsAbout: [
      'Kubernetes',
      'Terraform',
      'Ansible',
      'Docker',
      'Python',
      'Bash',
      'CI/CD',
      'Jenkins',
      'GitLab CI',
      'GitHub Actions',
      'DevOps',
      'Artificial Intelligence',
      'Large Language Models',
      'Model Context Protocol',
    ],
    hasCredential: [
      { '@type': 'EducationalOccupationalCredential', credentialCategory: 'certification', name: 'Certified Kubernetes Administrator (CKA)' },
      { '@type': 'EducationalOccupationalCredential', credentialCategory: 'certification', name: 'Certified Kubernetes Application Developer (CKAD)' },
      { '@type': 'EducationalOccupationalCredential', credentialCategory: 'certification', name: 'HashiCorp Certified: Terraform Associate (002)' },
    ],
    sameAs: [
      'https://github.com/xgueret',
      'https://gitlab.com/xgueret',
      'https://linkedin.com/in/xgueret',
      'https://x.com/hixmaster',
    ],
    // Personal brand, not a legal entity: modelled as a Brand on the Person
    // rather than a separate Organization. No `url` while tipunchlabs.fr
    // serves a parking page that is explicitly noindex.
    brand: {
      '@type': 'Brand',
      name: 'TiPunchLabs',
      sameAs: 'https://github.com/TiPunchLabs',
    },
  };
}
