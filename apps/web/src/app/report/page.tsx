'use client';

import HelpGuide from '@/components/HelpGuide';
import { IconBack, IconHelp, IconSubmit } from '@/components/Icons';
import Tooltip from '@/components/Tooltip';
import { getInitialLocationFromSearchParams } from '@/lib/reportLocation';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function ReportPageContent() {
  const searchParams = useSearchParams();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(() =>
    getInitialLocationFromSearchParams({
      lat: searchParams.get('lat') ?? undefined,
      lng: searchParams.get('lng') ?? undefined,
    }),
  );
  const [locationError, setLocationError] = useState<string | null>(null);
  const [issueType, setIssueType] = useState('pothole');
  const [severity, setSeverity] = useState('moderate');
  const [photoUrl, setPhotoUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);
  const [hasToken, setHasToken] = useState(true);
  useEffect(() => {
    setHasToken(typeof window !== 'undefined' && !!localStorage.getItem('accessToken'));
  }, []);

  useEffect(() => {
    if (location != null) return;
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationError('Location not available. Tap a road on the map and use "Raise issue" there.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocationError('Unable to get your location. Tap a road on the map and use "Raise issue" there.'),
    );
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) {
      setMessage('Please wait for location or open this page from the map by tapping a road.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setMessage('');
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      setMessage('Please log in or register to submit a report.');
      setStatus('error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          lat: location.lat,
          lng: location.lng,
          issueType,
          severity,
          photoUrl: photoUrl || 'https://placeholder.example.com/report.jpg',
          photoHash: 'placeholder-hash-' + Date.now(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || res.statusText);
      }
      const data = await res.json();
      setMessage(`Report created. Report ID: ${data.reportId}${data.issueId ? ` — linked to issue ${data.issueId}` : ''}`);
      setStatus('done');
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Failed to submit report');
      setStatus('error');
    }
  };

  const showLocationInputs = false;
  const canSubmit = location != null;

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <h1 style={{ margin: 0 }}>Report an issue</h1>
        <button type="button" onClick={() => setHelpOpen(true)} style={{ fontSize: '0.875rem', color: '#0ea5e9', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <IconHelp size={18} />
          Help &amp; guide
        </button>
      </div>
      <p>Describe the road issue (e.g. missing lane markings, pothole). Location is set from the map or your device.</p>
      {!hasToken && (
        <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 6, padding: '0.75rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
          Please <Link href="/login?redirect=/report">log in</Link> or <Link href="/register?redirect=/report">register</Link> to submit a report.
        </div>
      )}
      {location && (
        <p style={{ fontSize: '0.875rem', color: '#059669' }}>Location: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}</p>
      )}
      {locationError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '0.75rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
          {locationError} <Link href="/">Open map</Link> to tap a road and use &quot;Raise issue&quot; there.
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {showLocationInputs && (
          <>
            <label>
              <Tooltip content="Decimal degrees. Pre-filled from map or GPS.">Latitude</Tooltip>
              <input type="number" step="any" value={location?.lat ?? ''} readOnly style={{ display: 'block', width: '100%', padding: '0.5rem' }} />
            </label>
            <label>
              <Tooltip content="Decimal degrees. Pre-filled from map or GPS.">Longitude</Tooltip>
              <input type="number" step="any" value={location?.lng ?? ''} readOnly style={{ display: 'block', width: '100%', padding: '0.5rem' }} />
            </label>
          </>
        )}
        <label>
          <Tooltip content="What kind of road problem you are reporting. Choose the closest match.">Issue type</Tooltip>
          <select value={issueType} onChange={(e) => setIssueType(e.target.value)} style={{ display: 'block', width: '100%', padding: '0.5rem' }}>
            <option value="pothole">Pothole</option>
            <option value="crack">Crack</option>
            <option value="lane_markings_missing">Lane markings (missing or faded)</option>
            <option value="crossings">Crossings (pedestrian or other)</option>
            <option value="road_signage">Road signage (missing or damaged)</option>
            <option value="speed_limits">Speed limits (missing or illegible)</option>
            <option value="margins_shoulders">Margins and shoulders</option>
            <option value="sidewalks">Sidewalks (missing, broken, encroached)</option>
            <option value="drainage">Drainage (blocked or missing)</option>
            <option value="street_lighting">Street lighting (non-working or missing)</option>
            <option value="traffic_lighting">Traffic lighting (signals not working)</option>
            <option value="flooding">Flooding</option>
            <option value="shoulder_damage">Shoulder damage</option>
            <option value="bad_attempted_repair">Bad attempted repair</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label>
          <Tooltip content="How serious the issue is. Severe = safety risk or large area affected.">Severity</Tooltip>
          <select value={severity} onChange={(e) => setSeverity(e.target.value)} style={{ display: 'block', width: '100%', padding: '0.5rem' }}>
            <option value="minor">Minor</option>
            <option value="moderate">Moderate</option>
            <option value="severe">Severe</option>
          </select>
        </label>
        <label>
          <Tooltip content="After uploading your photo (use presigned URL from API if available), paste the image URL here.">Photo URL (after uploading via presigned URL)</Tooltip>
          <input type="url" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://..." style={{ display: 'block', width: '100%', padding: '0.5rem' }} />
        </label>
        <button type="submit" disabled={status === 'loading' || !canSubmit} style={{ padding: '0.75rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
          <IconSubmit size={18} />
          {status === 'loading' ? 'Submitting…' : 'Submit report'}
        </button>
      </form>
      {message && (
        <p style={{ color: status === 'error' ? '#ef4444' : '#22c55e', marginTop: '1rem' }}>
          {message}
          {status === 'error' && message.includes('log in') && (
            <span style={{ display: 'block', marginTop: '0.5rem' }}>
              <Link href="/login?redirect=/report">Log in</Link>
              {' or '}
              <Link href="/register?redirect=/report">Register</Link>
            </span>
          )}
        </p>
      )}
      <p style={{ marginTop: '1.5rem' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <IconBack size={18} />
          Back to map
        </Link>
      </p>
      {helpOpen && <HelpGuide onClose={() => setHelpOpen(false)} />}
    </main>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<main style={{ maxWidth: 600, margin: '0 auto', padding: '1.5rem' }}><p>Loading…</p></main>}>
      <ReportPageContent />
    </Suspense>
  );
}
