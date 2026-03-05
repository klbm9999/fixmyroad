'use client';

import { IconBack } from '@/components/Icons';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/report';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message ?? 'Login failed');
        setLoading(false);
        return;
      }
      if (data.tokens?.accessToken) {
        localStorage.setItem('accessToken', data.tokens.accessToken);
        if (data.tokens.refreshToken) {
          localStorage.setItem('refreshToken', data.tokens.refreshToken);
        }
      }
      router.push(redirect);
    } catch {
      setError('Something went wrong. Try again.');
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 400, margin: '0 auto', padding: '1.5rem' }}>
      <h1 style={{ margin: '0 0 1rem' }}>Log in</h1>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
        Log in to report road issues and track complaints.
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
          />
        </label>
        {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', margin: 0 }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ padding: '0.75rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
        Don&apos;t have an account? <Link href={`/register?redirect=${encodeURIComponent(redirect)}`}>Register</Link>
      </p>
      <p style={{ marginTop: '0.5rem' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <IconBack size={18} />
          Back to map
        </Link>
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main style={{ maxWidth: 400, margin: '0 auto', padding: '1.5rem' }}><p>Loading…</p></main>}>
      <LoginForm />
    </Suspense>
  );
}
