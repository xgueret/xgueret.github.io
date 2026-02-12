export interface KnowledgeEntry {
  title: string;
  content: string;
}

export const knowledge: Record<string, KnowledgeEntry> = {
  devops: {
    title: 'DevOps',
    content:
      "Je suis passionné par le DevOps et l'automatisation. Je travaille avec des outils comme Kubernetes, Docker, Ansible, Terraform, et Python pour créer des infrastructures robustes et automatisées.",
  },
  kubernetes: {
    title: 'Kubernetes',
    content:
      "Kubernetes (K8s) est une plateforme open-source d'orchestration de conteneurs. J'ai de l'expérience dans le déploiement et la gestion d'applications conteneurisées sur Kubernetes.",
  },
  k8s: {
    title: 'Kubernetes',
    content:
      "Kubernetes (K8s) est une plateforme open-source d'orchestration de conteneurs. J'ai de l'expérience dans le déploiement et la gestion d'applications conteneurisées sur Kubernetes.",
  },
  docker: {
    title: 'Docker',
    content:
      "Docker est une plateforme de conteneurisation qui permet d'empaqueter des applications et leurs dépendances dans des conteneurs. Je l'utilise régulièrement pour le développement et le déploiement d'applications.",
  },
  ansible: {
    title: 'Ansible',
    content:
      "Ansible est un outil d'automatisation open-source pour la gestion de configuration, le déploiement d'applications et l'orchestration. Je l'utilise pour automatiser les tâches répétitives et gérer les infrastructures.",
  },
  terraform: {
    title: 'Terraform',
    content:
      "Terraform est un outil d'Infrastructure as Code (IaC) qui permet de définir et de provisionner des infrastructures cloud de manière déclarative. Je l'utilise pour gérer des infrastructures sur différents cloud providers.",
  },
  python: {
    title: 'Python',
    content:
      "Python est un langage de programmation polyvalent que j'utilise pour l'automatisation, le scripting, et le développement d'outils DevOps.",
  },
  proxmox: {
    title: 'Proxmox',
    content:
      "Proxmox VE est une plateforme de virtualisation open-source. J'ai de l'expérience dans la gestion de machines virtuelles et de conteneurs avec Proxmox.",
  },
  bash: {
    title: 'Bash',
    content:
      "Bash est un shell Unix et un langage de script que j'utilise quotidiennement pour l'automatisation de tâches et l'administration système.",
  },
  about: {
    title: 'À propos de moi',
    content:
      "Je suis Xavier GUERET, ingénieur DevOps passionné par l'automatisation et l'amélioration continue. Mon objectif : automatiser tout ce qui bouge et garder l'esprit zen !",
  },
  qui: {
    title: 'À propos de moi',
    content:
      "Je suis Xavier GUERET, ingénieur DevOps passionné par l'automatisation et l'amélioration continue. Mon objectif : automatiser tout ce qui bouge et garder l'esprit zen !",
  },
  projets: {
    title: 'Mes projets',
    content:
      'Je travaille sur divers projets liés au DevOps, à l\'automatisation et à l\'infrastructure as code.',
  },
  blog: {
    title: 'Blog',
    content:
      'Je partage mes expériences et mes connaissances sur mon blog. Vous y trouverez des articles sur le DevOps, Kubernetes, l\'automatisation et bien plus.',
  },
  contact: {
    title: 'Me contacter',
    content:
      'Vous pouvez me retrouver sur GitHub, GitLab, LinkedIn ou X (Twitter).',
  },
  cv: {
    title: 'CV / Resume',
    content: 'Consultez mon parcours professionnel et mes compétences sur ma page CV.',
  },
  automatisation: {
    title: 'Automatisation',
    content:
      "L'automatisation est au cœur de ma démarche DevOps. J'utilise des outils comme Ansible, Terraform, Python et Bash pour automatiser les tâches répétitives.",
  },
  infrastructure: {
    title: 'Infrastructure as Code',
    content:
      "L'Infrastructure as Code (IaC) permet de gérer et provisionner des infrastructures via du code. J'utilise principalement Terraform et Ansible pour cette approche.",
  },
};

export const keywordMap: Record<string, string> = {
  conteneur: 'docker',
  virtualisation: 'proxmox',
  orchestration: 'kubernetes',
  iac: 'terraform',
  script: 'bash',
  automation: 'automatisation',
  'qui es-tu': 'about',
  'qui est': 'about',
  presentation: 'about',
  projet: 'projets',
  articles: 'blog',
  posts: 'blog',
  ecrire: 'contact',
  contacter: 'contact',
  email: 'contact',
  linkedin: 'contact',
  github: 'contact',
  gitlab: 'contact',
  twitter: 'contact',
  social: 'contact',
  parcours: 'cv',
  competence: 'cv',
  experience: 'cv',
  resume: 'cv',
};

export function findAnswer(question: string): string | null {
  const normalized = question
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  for (const [key, value] of Object.entries(knowledge)) {
    const normalizedKey = key
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    if (normalized.includes(normalizedKey)) {
      return `<strong>${value.title}</strong><br>${value.content}`;
    }
  }

  for (const [keyword, knowledgeKey] of Object.entries(keywordMap)) {
    if (normalized.includes(keyword)) {
      const value = knowledge[knowledgeKey];
      if (value) {
        return `<strong>${value.title}</strong><br>${value.content}`;
      }
    }
  }

  return null;
}
