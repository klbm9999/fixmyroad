import { getAllSlugs, getArticle, type KnowledgeSection } from '@/lib/knowledge';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const VALID_SECTIONS: KnowledgeSection[] = [
  'checklist',
  'irc',
  'ghmc',
  'rto',
  'responsibility',
  'repair',
];

const SECTION_LABELS: Record<KnowledgeSection, string> = {
  checklist: 'What to check',
  irc: 'Standards (IRC)',
  ghmc: 'GHMC',
  rto: 'RTO / Transport',
  responsibility: 'Responsibility',
  repair: 'Repair reference',
};

export function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map(({ section, slug }) => ({ section, slug }));
}

function formatLastUpdated(iso: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function KnowledgeArticlePage({
  params,
}: {
  params: { section: string; slug: string };
}) {
  const section = params.section as KnowledgeSection;
  if (!VALID_SECTIONS.includes(section)) notFound();
  const article = getArticle(section, params.slug);
  if (!article) notFound();

  const displayDate = formatLastUpdated(article.lastUpdated);

  return (
    <article className="knowledge-article">
      <p className="knowledge-breadcrumb">
        <Link href="/">Map</Link>
        {' › '}
        <Link href="/knowledge">Knowledge Center</Link>
        {' › '}
        <Link href="/knowledge">{SECTION_LABELS[section]}</Link>
        {' › '}
        <span>{article.title}</span>
      </p>
      <h1 className="knowledge-article-title">{article.title}</h1>
      {(article.source || article.sourceUrl || displayDate) && (
        <p className="knowledge-source-updated">
          {article.source && <span>Source: {article.source}</span>}
          {article.sourceUrl && (
            <>
              {(article.source && ' · ')}
              <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" className="knowledge-source-link">
                View original document
              </a>
            </>
          )}
          {(article.source || article.sourceUrl) && displayDate && ' · '}
          {displayDate && (
            <span>Guideline last updated: {displayDate}</span>
          )}
        </p>
      )}
      {article.reportTo && (
        <p className="knowledge-report-to">
          <strong>Report to:</strong> {article.reportTo}
        </p>
      )}
      {article.image && (
        <figure className="knowledge-article-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={article.image} alt="" className="knowledge-article-img" />
          <figcaption className="knowledge-article-image-caption">Example</figcaption>
        </figure>
      )}
      <div className="knowledge-prose">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.body}</ReactMarkdown>
      </div>
      <nav className="knowledge-back">
        <Link href="/knowledge">Back to Knowledge Center</Link>
      </nav>
    </article>
  );
}
