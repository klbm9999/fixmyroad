import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';
import type {
    KnowledgeArticle,
    KnowledgeManifest,
    KnowledgeManifestEntry,
    KnowledgeSection,
} from './knowledgeTypes';

export { filterKnowledgeArticles } from './knowledgeTypes';
export type { KnowledgeArticle, KnowledgeArticleMeta, KnowledgeManifest, KnowledgeManifestEntry, KnowledgeSection } from './knowledgeTypes';

const SECTIONS: KnowledgeSection[] = [
  'checklist',
  'irc',
  'ghmc',
  'rto',
  'responsibility',
  'repair',
];

function getContentDir(): string {
  const fromCwd = path.resolve(process.cwd(), 'content', 'knowledge');
  if (fs.existsSync(fromCwd)) return fromCwd;
  const fromModule = path.resolve(__dirname, '..', '..', 'content', 'knowledge');
  if (fs.existsSync(fromModule)) return fromModule;
  return fromCwd;
}

export function getKnowledgeManifest(): KnowledgeManifest {
  const base = getContentDir();
  const articles: KnowledgeManifestEntry[] = [];
  const bySection: Record<KnowledgeSection, KnowledgeManifestEntry[]> = {
    checklist: [],
    irc: [],
    ghmc: [],
    rto: [],
    responsibility: [],
    repair: [],
  };

  for (const section of SECTIONS) {
    const sectionPath = path.join(base, section);
    if (!fs.existsSync(sectionPath) || !fs.statSync(sectionPath).isDirectory()) continue;
    const files = fs.readdirSync(sectionPath).filter((f) => f.endsWith('.md'));
    for (const file of files) {
      const slug = file.replace(/\.md$/, '');
      const fullPath = path.join(sectionPath, file);
      const raw = fs.readFileSync(fullPath, 'utf-8');
      const { data } = matter(raw);
      const meta = data as Record<string, unknown>;
      const title = (meta.title as string) || slug;
      const lastUpdated = (meta.lastUpdated as string) || '';
      const entry: KnowledgeManifestEntry = {
        title,
        section,
        slug,
        lastUpdated,
        summary: meta.summary as string | undefined,
        image: meta.image as string | undefined,
        source: meta.source as string | undefined,
        sourceUrl: meta.sourceUrl as string | undefined,
        reportTo: meta.reportTo as string | undefined,
        href: `/knowledge/${section}/${slug}`,
      };
      articles.push(entry);
      bySection[section].push(entry);
    }
  }

  return { articles, bySection };
}

export function getArticle(section: string, slug: string): KnowledgeArticle | null {
  const base = getContentDir();
  const sectionPath = path.join(base, section, `${slug}.md`);
  if (!fs.existsSync(sectionPath)) return null;
  const raw = fs.readFileSync(sectionPath, 'utf-8');
  const { data, content } = matter(raw);
  const meta = data as Record<string, unknown>;
  return {
    title: (meta.title as string) || slug,
    section: section as KnowledgeSection,
    slug,
    lastUpdated: (meta.lastUpdated as string) || '',
    summary: meta.summary as string | undefined,
    image: meta.image as string | undefined,
    source: meta.source as string | undefined,
    sourceUrl: meta.sourceUrl as string | undefined,
    reportTo: meta.reportTo as string | undefined,
    body: content.trim(),
  };
}

export function getAllSlugs(): { section: KnowledgeSection; slug: string }[] {
  const manifest = getKnowledgeManifest();
  return manifest.articles.map((a) => ({ section: a.section, slug: a.slug }));
}
