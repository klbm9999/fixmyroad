'use client';

import {
    IconBuilder,
    IconComplaints,
    IconHelp,
    IconIssues,
    IconKnowledge,
    IconLogin,
    IconLogout,
    IconRegister,
    IconReport,
    IconUser,
} from '@/components/Icons';
import Tooltip from '@/components/Tooltip';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const NAV_LINKS = [
  { href: '/report', label: 'Report issue', tooltip: 'Submit a road issue with location and photo. Uses your current location.', Icon: IconReport },
  { href: '/issues', label: 'Issues', tooltip: 'Browse issues that builders can claim and fix.', Icon: IconIssues },
  { href: '/knowledge', label: 'Knowledge', tooltip: 'IRC standards and repair guides.', Icon: IconKnowledge },
  { href: '/dashboard/complaints', label: 'Complaints', tooltip: 'View and track GHMC/RTO complaints.', Icon: IconComplaints },
  { href: '/dashboard/builder', label: 'Builder', tooltip: 'Builder dashboard: claims and fix submissions.', Icon: IconBuilder },
];

export default function NavBar({ onHelpClick }: { onHelpClick?: () => void } = {}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [user, setUser] = useState<{ name?: string | null; email: string } | null>(null);
  const pathname = usePathname();
  const refreshAuth = useCallback(() => {
    const token = typeof window !== 'undefined' && !!localStorage.getItem('accessToken');
    setHasToken(!!token);
    if (!token) setUser(null);
  }, []);
  useEffect(() => {
    refreshAuth();
  }, [pathname, refreshAuth]);
  useEffect(() => {
    const handler = () => refreshAuth();
    window.addEventListener('auth-change', handler);
    return () => window.removeEventListener('auth-change', handler);
  }, [refreshAuth]);
  useEffect(() => {
    if (!hasToken) {
      setUser(null);
      return;
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) return;
    fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.dispatchEvent(new Event('auth-change'));
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.email) setUser({ name: data.name ?? null, email: data.email });
      })
      .catch(() => setUser(null));
  }, [hasToken]);

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link href="/" className="app-brand" onClick={() => setMobileMenuOpen(false)}>
          <span className="app-logo" aria-hidden>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M4 14h20M6 10l4 4-4 4M22 10l-4 4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="14" cy="14" r="2" fill="currentColor"/>
            </svg>
          </span>
          <span className="app-title">FixMyRoad</span>
          <span className="app-subtitle">Hyderabad</span>
        </Link>
        <button
          type="button"
          className="app-nav-toggle"
          onClick={() => setMobileMenuOpen((o) => !o)}
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle menu"
        >
          <span className="app-nav-toggle-bar" />
          <span className="app-nav-toggle-bar" />
          <span className="app-nav-toggle-bar" />
        </button>
        <nav className={`app-nav ${mobileMenuOpen ? 'app-nav-open' : ''}`}>
          {NAV_LINKS.map(({ href, label, tooltip, Icon }) => (
            <Tooltip key={href} content={tooltip}>
              <Link href={href} className="app-nav-link" onClick={() => setMobileMenuOpen(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Icon size={18} />
                {label}
              </Link>
            </Tooltip>
          ))}
          {hasToken ? (
            <>
              {user && (
                <span className="app-nav-user" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginRight: '0.25rem', fontSize: '0.875rem' }}>
                  <IconUser size={16} />
                  <span>{user.name?.trim() || user.email}</span>
                </span>
              )}
              <Link href="/" className="app-nav-link" onClick={() => { setMobileMenuOpen(false); localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); window.dispatchEvent(new Event('auth-change')); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <IconLogout size={18} />
                Log out
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="app-nav-link" onClick={() => setMobileMenuOpen(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <IconLogin size={18} />
                Log in
              </Link>
              <Link href="/register" className="app-nav-link" onClick={() => setMobileMenuOpen(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <IconRegister size={18} />
                Register
              </Link>
            </>
          )}
          <Tooltip content="How the map and reporting work." side="bottom">
            <button type="button" className="app-nav-link app-nav-button" onClick={() => { setMobileMenuOpen(false); onHelpClick?.(); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <IconHelp size={18} />
              Help
            </button>
          </Tooltip>
        </nav>
      </div>
    </header>
  );
}
