'use client';

import HelpGuide from '@/components/HelpGuide';
import Tooltip from '@/components/Tooltip';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function IssuesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/issues?claimable=true&limit=20`)
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <h1 style={{ margin: 0 }}>Claimable issues</h1>
        <button type="button" onClick={() => setHelpOpen(true)} style={{ fontSize: '0.875rem', color: '#0ea5e9', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Help &amp; guide</button>
      </div>
      <p>
        <Tooltip content="Issues that are not yet claimed. As a builder, you can claim one, post a bond, fix the road, and submit proof to get verified and receive reward.">
          <span className="tooltip-trigger">Builders can discover and claim issues to fix.</span>
        </Tooltip>
      </p>
      {loading ? <p>Loading…</p> : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {items.map((i) => (
            <li key={i.id} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '0.5rem' }}>
              <strong>{i.issueType}</strong> — {i.severity} — {i.status}
              <br />
              <Link href={`/issues/${i.id}`}>View</Link>
            </li>
          ))}
        </ul>
      )}
      <p style={{ marginTop: '1.5rem' }}>
        <Link href="/">Back to map</Link>
      </p>
      {helpOpen && <HelpGuide onClose={() => setHelpOpen(false)} />}
    </main>
  );
}
