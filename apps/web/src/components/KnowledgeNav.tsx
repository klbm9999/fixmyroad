'use client';

import {
    filterKnowledgeArticles,
    type KnowledgeManifest,
    type KnowledgeSection,
} from '@/lib/knowledgeTypes';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

const SECTION_LABELS: Record<KnowledgeSection, string> = {
  checklist: 'What to check',
  irc: 'Standards (IRC)',
  ghmc: 'GHMC',
  rto: 'RTO / Transport',
  responsibility: 'Responsibility',
  repair: 'Repair reference',
};

export default function KnowledgeNav({ manifest }: { manifest: KnowledgeManifest }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState('');

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const filteredArticles = useMemo(
    () => filterKnowledgeArticles(manifest.articles, query),
    [manifest.articles, query]
  );

  const bySection = useMemo(() => {
    const map: Record<KnowledgeSection, typeof manifest.articles> = {
      checklist: [],
      irc: [],
      ghmc: [],
      rto: [],
      responsibility: [],
      repair: [],
    };
    for (const a of filteredArticles) {
      map[a.section].push(a);
    }
    return map;
  }, [filteredArticles]);

  const navContent = (
    <>
      <div className="knowledge-search">
        <input
          type="search"
          placeholder="Search articles…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search knowledge base"
        />
      </div>
      {(Object.keys(SECTION_LABELS) as KnowledgeSection[]).map((section) => {
        const list = bySection[section];
        if (list.length === 0) return null;
        return (
          <div key={section} className="knowledge-sidebar-section">
            <div className="knowledge-sidebar-section-title">
              {SECTION_LABELS[section]}
            </div>
            <ul className="knowledge-sidebar-list">
              {list.map((entry) => (
                <li key={entry.href}>
                  <Link
                    href={entry.href}
                    onClick={closeDrawer}
                    className={pathname === entry.href ? 'active' : undefined}
                  >
                    {entry.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </>
  );

  return (
    <>
      <button
        type="button"
        className="knowledge-nav-toggle"
        onClick={() => setDrawerOpen((o) => !o)}
        aria-label="Open menu"
        aria-expanded={drawerOpen}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>
      <div
        className={`knowledge-drawer-overlay ${drawerOpen ? 'open' : ''}`}
        onClick={closeDrawer}
        aria-hidden
      />
      <aside className={`knowledge-drawer ${drawerOpen ? 'open' : ''}`}>{navContent}</aside>
      <aside className="knowledge-sidebar">{navContent}</aside>
    </>
  );
}
