import type { KnowledgeSection } from '@/lib/knowledge';
import { getKnowledgeManifest } from '@/lib/knowledge';
import Link from 'next/link';

const SECTION_LABELS: Record<KnowledgeSection, string> = {
  checklist: 'What to check on a road',
  irc: 'Standards (IRC)',
  ghmc: 'GHMC',
  rto: 'RTO / Transport',
  responsibility: 'Who is responsible',
  repair: 'Repair reference',
};

export default function KnowledgePage() {
  const manifest = getKnowledgeManifest();
  return (
    <>
      <p className="knowledge-breadcrumb">
        <Link href="/">Map</Link>
        {' › '}
        <Link href="/knowledge">Knowledge Center</Link>
      </p>
      <h1 className="knowledge-hub-title">Knowledge Center</h1>
      <p className="knowledge-hub-intro">
        Use this guide to identify what might be wrong or missing on a road — lane
        markings, cracks, signage, speed limits, margins, drainage, lighting — and
        who to report to. Based on IRC standards and GHMC/RTO guidelines for
        Hyderabad.
      </p>

      <section className="knowledge-hub-section">
        <h2 className="knowledge-checklist-lead">
          What to check on a road
        </h2>
        <p style={{ marginBottom: '0.75rem', color: '#64748b', fontSize: '0.9rem' }}>
          Match what you see (or don’t see) to a topic below. Each page explains what’s
          required, what’s often missing, and who to report to.
        </p>
        <ul className="knowledge-hub-list">
          {manifest.bySection.checklist.map((entry) => (
            <li key={entry.href}>
              <Link href={entry.href}>{entry.title}</Link>
              {entry.reportTo && (
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: '0.35rem' }}>
                  → {entry.reportTo}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {(Object.keys(SECTION_LABELS) as KnowledgeSection[])
        .filter((s) => s !== 'checklist')
        .map((section) => {
          const list = manifest.bySection[section];
          if (list.length === 0) return null;
          return (
            <section key={section} className="knowledge-hub-section">
              <h2>{SECTION_LABELS[section]}</h2>
              <ul className="knowledge-hub-list">
                {list.map((entry) => (
                  <li key={entry.href}>
                    <Link href={entry.href}>{entry.title}</Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

      <p className="knowledge-back" style={{ marginTop: '1.5rem' }}>
        <Link href="/">Back to map</Link>
      </p>
    </>
  );
}
