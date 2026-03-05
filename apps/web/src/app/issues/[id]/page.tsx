'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function IssueDetailPage({ params }: { params: { id: string } }) {
  const [issue, setIssue] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/issues/${params.id}`)
      .then((r) => r.json())
      .then(setIssue)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <main style={{ padding: '1.5rem' }}><p>Loading…</p></main>;
  if (!issue) return <main style={{ padding: '1.5rem' }}><p>Issue not found.</p><Link href="/issues">Back to issues</Link></main>;

  return (
    <main style={{ maxWidth: 700, margin: '0 auto', padding: '1.5rem' }}>
      <h1 style={{ marginTop: 0 }}>Issue: {issue.issueType} — {issue.severity}</h1>
      <p>Status: <strong>{issue.status}</strong> — <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>reported → claimed → fix submitted → verified/closed</span></p>
      <p>First reported: {new Date(issue.firstReportedAt).toLocaleString()}</p>
      {issue.roadSegment && <p>Road: {issue.roadSegment.osmRoadName ?? 'Unknown'}</p>}
      <h2>Reports</h2>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '-0.5rem' }}>Citizen reports grouped into this issue (same segment, type, within 14 days).</p>
      <ul>
        {(issue.reports ?? []).map((r: any) => (
          <li key={r.id}>{r.issueType} — {new Date(r.reportedAt).toLocaleDateString()}</li>
        ))}
      </ul>
      <p><Link href="/issues">Back to issues</Link> — <Link href="/">Map</Link></p>
    </main>
  );
}
