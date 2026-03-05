'use client';

import HelpGuide from '@/components/HelpGuide';
import NavBar from '@/components/NavBar';
import Tooltip from '@/components/Tooltip';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

const HYDERABAD_CENTER = { lat: 17.385, lng: 78.4867 };
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const NEW_USER_KEY = 'fixmyroad-help-seen';

export default function HomePage() {
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(HYDERABAD_CENTER);
  const [mapReady, setMapReady] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [showNewUserBanner, setShowNewUserBanner] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && !sessionStorage.getItem(NEW_USER_KEY)) {
        setShowNewUserBanner(true);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
    );
  }, []);

  const openHelp = (forNewUser?: boolean) => {
    setHelpOpen(true);
    if (forNewUser) {
      try { sessionStorage.setItem(NEW_USER_KEY, '1'); } catch (_) {}
      setShowNewUserBanner(false);
    }
  };

  return (
    <main style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <NavBar onHelpClick={() => setHelpOpen(true)} />
      {showNewUserBanner && (
        <div className="new-user-banner">
          <span>New here? Learn how to report issues and read the map.</span>
          <button type="button" onClick={() => openHelp(true)} className="new-user-banner-cta">See guide</button>
        </div>
      )}
      <div style={{ flex: 1, position: 'relative', minHeight: 0, overflow: 'hidden' }}>
        <MapView
          center={mapCenter}
          apiBase={API_BASE}
          onReady={() => setMapReady(true)}
        />
        <div className="map-legend">
          <div className="map-legend-title">
            <Tooltip content="Grey = no report data; green = no issues; yellow = minor; red = severe.">
              <span className="tooltip-trigger">Road quality</span>
            </Tooltip>
          </div>
          <div className="map-legend-row"><span className="map-legend-swatch" style={{ background: '#9ca3af' }} /> No data</div>
          <div className="map-legend-row"><span className="map-legend-swatch" style={{ background: '#22c55e' }} /> No issues</div>
          <div className="map-legend-row"><span className="map-legend-swatch" style={{ background: '#eab308' }} /> Minor issues</div>
          <div className="map-legend-row"><span className="map-legend-swatch" style={{ background: '#ef4444' }} /> Severe issues</div>
        </div>
      </div>
      {helpOpen && <HelpGuide onClose={() => setHelpOpen(false)} showForNewUser={showNewUserBanner} />}
    </main>
  );
}
