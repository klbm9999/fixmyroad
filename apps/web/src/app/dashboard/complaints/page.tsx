'use client';

import Tooltip from '@/components/Tooltip';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function ComplaintsDashboardPage() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/complaints`)
      .then((r) => r.json())
      .then(setList)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem' }}>
      <h1 style={{ marginTop: 0 }}>Complaint dashboard</h1>
      <p>
        <Tooltip content="Complaints are generated periodically from reported issues. Track status and external reference IDs (e.g. from GHMC/RTO) here.">
          <span className="tooltip-trigger">GHMC/RTO complaints and status.</span>
        </Tooltip>
      </p>
      {loading ? <p>Loading…</p> : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {list.map((c) => (
            <li key={c.id} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '0.5rem' }}>
              <strong>{c.complaintType}</strong> — {c.status} — filed {new Date(c.filedAt).toLocaleDateString()}
              {c.externalId && ` — Ref: ${c.externalId}`}
            </li>
          ))}
        </ul>
      )}
      <p style={{ marginTop: '1.5rem' }}><Link href="/">Back to map</Link></p>
    </main>
  );
}
