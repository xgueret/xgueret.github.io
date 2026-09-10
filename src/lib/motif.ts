/** The six drawn plate identities, in the order the home page shows them. */
export const MOTIFS = ['rings', 'rack', 'graph', 'columns', 'terminal', 'wireframe'] as const;
export type Motif = (typeof MOTIFS)[number];
