'use client';

import Tooltip from '@/components/Tooltip';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function BuilderDashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(`${API_BASE}/builders/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main style={{ padding: '1.5rem' }}><p>Loading…</p></main>;
  if (!profile) {
    return (
      <main style={{ maxWidth: 600, margin: '0 auto', padding: '1.5rem' }}>
        <h1 style={{ marginTop: 0 }}>Builder dashboard</h1>
        <p>
          <Tooltip content="Builders register, post a bond, claim issues from the Issues list, fix them, and submit before/after proof. Rewards are released after verification.">
            <span className="tooltip-trigger">Log in and register as a builder</span>
          </Tooltip>
          {' '}to see your claims and bond balance.
        </p>
        <p><Link href="/">Back to map</Link></p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '1.5rem' }}>
      <h1 style={{ marginTop: 0 }}>Builder dashboard</h1>
      <p>
        <Tooltip content="Bond is debited when you claim an issue and returned when you cancel or complete. Rating is from verified fixes.">Bond balance: {profile.bondBalance ?? 0} — Rating: {profile.ratingAvg ?? 0}</Tooltip>
      </p>
      <h2>My claims</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {(profile.claims ?? []).map((c: any) => (
          <li key={c.id} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '0.5rem' }}>
            Issue {c.issueId} — {c.status} — claimed {new Date(c.claimedAt).toLocaleDateString()}
            <br />
            <Link href={`/issues/${c.issue?.id ?? c.issueId}`}>View issue</Link>
          </li>
        ))}
      </ul>
      <p style={{ marginTop: '1.5rem' }}><Link href="/">Back to map</Link></p>
    </main>
  );
}
