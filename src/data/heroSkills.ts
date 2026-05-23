export type HeroSkill = {
  key:
    | 'kubernetes'
    | 'docker'
    | 'terraform'
    | 'ansible'
    | 'githubActions'
    | 'python';
  level: number;
};

export const HERO_SKILLS: HeroSkill[] = [
  { key: 'kubernetes',    level: 90 },
  { key: 'docker',        level: 90 },
  { key: 'terraform',     level: 85 },
  { key: 'ansible',       level: 85 },
  { key: 'githubActions', level: 85 },
  { key: 'python',        level: 75 },
];
