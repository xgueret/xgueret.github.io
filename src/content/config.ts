import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('Xavier GUERET'),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
    categories: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    archived: z.boolean().default(false),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    toc: z.boolean().default(false),
    series: z.string().optional(),
    seriesOrder: z.number().optional(),
  }),
});

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(['github', 'websites']),
    tags: z.array(z.string()).default([]),
    github: z.string().url().optional(),
    url: z.string().url().optional(),
    order: z.number().default(0),
    // Home-page 3D plates: only featured entries are rendered anywhere.
    featured: z.boolean().default(false),
    motif: z.enum(['rings', 'rack', 'graph', 'columns', 'terminal', 'wireframe']).optional(),
    plateTag: z.string().optional(),
  }),
});

export const collections = { posts, projects };
