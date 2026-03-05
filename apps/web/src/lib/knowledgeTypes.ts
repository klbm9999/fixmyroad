/**
 * Types and client-safe helpers for the Knowledge Center.
 * Import this from client components (e.g. KnowledgeNav). For server-only loader, use knowledge.ts.
 */

export type KnowledgeSection =
  | 'checklist'
  | 'irc'
  | 'ghmc'
  | 'rto'
  | 'responsibility'
  | 'repair';

export interface KnowledgeArticleMeta {
  title: string;
  section: KnowledgeSection;
  slug: string;
  lastUpdated: string;
  summary?: string;
  image?: string;
  source?: string;
  sourceUrl?: string;
  reportTo?: string;
}

export interface KnowledgeArticle extends KnowledgeArticleMeta {
  body: string;
}

export interface KnowledgeManifestEntry extends KnowledgeArticleMeta {
  href: string;
}

export interface KnowledgeManifest {
  articles: KnowledgeManifestEntry[];
  bySection: Record<KnowledgeSection, KnowledgeManifestEntry[]>;
}

export function filterKnowledgeArticles(
  articles: KnowledgeManifestEntry[],
  query: string
): KnowledgeManifestEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return articles;
  return articles.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      (a.summary?.toLowerCase().includes(q)) ||
      a.slug.toLowerCase().includes(q)
  );
}
