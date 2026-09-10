/**
 * The drawn plate identities: six project motifs in the order the home page
 * shows them, plus `all` for the catalogue plate that links to /projects/.
 */
export const MOTIFS = ['rings', 'rack', 'graph', 'columns', 'terminal', 'wireframe', 'all'] as const;
export type Motif = (typeof MOTIFS)[number];
