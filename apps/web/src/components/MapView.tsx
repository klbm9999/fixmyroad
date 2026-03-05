'use client';

import { useCallback, useEffect, useRef } from 'react';

const DEFAULT_ZOOM = 16;

declare global {
  interface Window {
    maplibregl: typeof import('maplibre-gl');
  }
}

interface MapViewProps {
  center: { lat: number; lng: number };
  apiBase: string;
  onReady?: () => void;
}

interface ComplaintSummary {
  complaintType: string;
  externalId: string | null;
  filedAt: string;
  status: string;
}

interface SegmentDetails {
  details: {
    segment: { id: string; osmRoadName: string | null };
    issues: Array<{
      id: string;
      issueType: string;
      severity: string;
      status: string;
      firstReportedAt: string;
      complaints: ComplaintSummary[];
    }>;
    claimsSummary: { totalClaimed: number; totalFixed: number; latestFixAt: string | null };
  } | null;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
  } catch {
    return iso;
  }
}

const POPUP_ICONS = {
  road:
    '<svg class="road-popup__icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 18h16M4 14h6m4 0h6M4 10h3m4 0h6m-6 0h3"/></svg>',
  location:
    '<svg class="road-popup__icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  issues:
    '<svg class="road-popup__icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  claims:
    '<svg class="road-popup__icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  ghmc:
    '<svg class="road-popup__icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  raise:
    '<svg class="road-popup__icon road-popup__icon--cta" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
};

function updateHighlightFilter(map: import('maplibre-gl').Map, hoveredId: string | null, selectedId: string | null) {
  if (!map.getLayer('roads-fill-highlight')) return;
  const ids = [hoveredId, selectedId].filter(Boolean) as string[];
  if (ids.length === 0) {
    map.setFilter('roads-fill-highlight', ['==', ['get', 'id'], '']);
  } else {
    map.setFilter('roads-fill-highlight', ['in', ['get', 'id'], ['literal', ids]]);
  }
}

export default function MapView({ center, apiBase, onReady }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const popupRef = useRef<{ remove: () => void } | null>(null);
  const userMarkerRef = useRef<import('maplibre-gl').Marker | null>(null);
  const hoveredIdRef = useRef<string | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const onReadyRef = useRef(onReady);
  const centerRef = useRef(center);
  const initialCenterRef = useRef(center);
  centerRef.current = center;
  initialCenterRef.current = center;
  onReadyRef.current = onReady;

  const showPopupForSegment = useCallback(
    async (map: any, segmentId: string, lng: number, lat: number) => {
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
      selectedIdRef.current = segmentId;
      updateHighlightFilter(map, hoveredIdRef.current, segmentId);
      let detailsRes: SegmentDetails;
      try {
        const r = await fetch(`${apiBase}/roads/${segmentId}/details`);
        detailsRes = await r.json();
      } catch {
        detailsRes = { details: null };
      }
      const MapLibre = (await import('maplibre-gl')) as typeof import('maplibre-gl');
      const popup = new MapLibre.Popup({
        closeButton: true,
        closeOnClick: false,
        className: 'road-popup-container',
      }).setLngLat([lng, lat]);
      const seg = detailsRes.details?.segment;
      const issues = detailsRes.details?.issues ?? [];
      const claimsSummary = detailsRes.details?.claimsSummary ?? { totalClaimed: 0, totalFixed: 0, latestFixAt: null };
      const name = seg?.osmRoadName ?? 'Road';

      const latestIssueDate =
        issues.length > 0
          ? issues.reduce((max, i) => {
              const d = i.firstReportedAt ? new Date(i.firstReportedAt).getTime() : 0;
              return d > max ? d : max;
            }, 0)
          : null;
      const uniqueTypes = [...new Set(issues.map((i) => i.issueType))];
      const ghmcComplaints = issues.flatMap((i) => (i.complaints ?? []).filter((c) => c.complaintType === 'ghmc'));
      const ghmc = ghmcComplaints[0];
      const hasIssues = issues.length > 0;
      const hasFixes = claimsSummary.totalFixed > 0;
      const ghmcResolved = ghmc && (ghmc.status === 'resolved' || ghmc.status === 'closed');

      let html = '<div class="road-popup">';

      html += '<div class="road-popup__section road-popup__section--road">';
      html += `<div class="road-popup__label">${POPUP_ICONS.road} Road</div>`;
      html += `<div class="road-popup__value road-popup__value--name">${escapeHtml(name)}</div>`;
      html += '</div>';

      html += '<div class="road-popup__section road-popup__section--location">';
      html += `<div class="road-popup__label">${POPUP_ICONS.location} Location</div>`;
      html += `<div class="road-popup__value road-popup__value--coords">${escapeHtml(Number(lat).toFixed(5))}, ${escapeHtml(Number(lng).toFixed(5))}</div>`;
      html += '</div>';

      html += '<div class="road-popup__section road-popup__section--issues">';
      html += `<div class="road-popup__label">${POPUP_ICONS.issues} Issues</div>`;
      html += `<div class="road-popup__value road-popup__value--count road-popup__value--count--${hasIssues ? 'has' : 'none'}">${issues.length} raised</div>`;
      html += latestIssueDate != null
        ? `<div class="road-popup__meta">Latest: ${escapeHtml(formatDate(new Date(latestIssueDate).toISOString()))}</div>`
        : '';
      if (uniqueTypes.length > 0) {
        html += '<ul class="road-popup__tags">';
        for (const t of uniqueTypes) {
          html += `<li class="road-popup__tag">${escapeHtml(t)}</li>`;
        }
        html += '</ul>';
      }
      html += '</div>';

      html += '<div class="road-popup__section road-popup__section--claims">';
      html += `<div class="road-popup__label">${POPUP_ICONS.claims} Claims / fixes</div>`;
      html += `<div class="road-popup__value">${claimsSummary.totalClaimed} claimed, <span class="road-popup__highlight road-popup__highlight--${hasFixes ? 'fixed' : 'pending'}">${claimsSummary.totalFixed} fixed</span></div>`;
      if (claimsSummary.latestFixAt) {
        html += `<div class="road-popup__meta road-popup__meta--success">Latest fix: ${escapeHtml(formatDate(claimsSummary.latestFixAt))}</div>`;
      } else if (claimsSummary.totalClaimed === 0) {
        html += '<div class="road-popup__meta">None claimed yet</div>';
      }
      html += '</div>';

      html += '<div class="road-popup__section road-popup__section--ghmc">';
      html += `<div class="road-popup__label">${POPUP_ICONS.ghmc} GHMC complaint</div>`;
      if (ghmc) {
        html += `<div class="road-popup__value"><span class="road-popup__badge road-popup__badge--yes">Raised</span></div>`;
        html += `<div class="road-popup__meta">${escapeHtml(formatDate(ghmc.filedAt))}</div>`;
        if (ghmc.externalId) html += `<div class="road-popup__meta">ID: ${escapeHtml(ghmc.externalId)}</div>`;
        html += `<div class="road-popup__meta"><span class="road-popup__status road-popup__status--${ghmcResolved ? 'resolved' : 'pending'}">${escapeHtml(ghmc.status)}</span></div>`;
      } else {
        html += '<div class="road-popup__value"><span class="road-popup__badge road-popup__badge--no">Not raised</span></div>';
      }
      html += '</div>';

      html += `<a class="road-popup__cta" href="/report?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}">${POPUP_ICONS.raise} Raise issue</a>`;
      html += '</div>';

      popup.on('close', () => {
        selectedIdRef.current = null;
        if (mapRef.current) updateHighlightFilter(mapRef.current as import('maplibre-gl').Map, hoveredIdRef.current, null);
      });
      popup.setHTML(html).addTo(map);
      popupRef.current = popup;
    },
    [apiBase],
  );

  const loadGeoJson = useCallback(
    async (map: any) => {
      const bounds = map.getBounds();
      const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
      try {
        const res = await fetch(`${apiBase}/map/geojson?bbox=${encodeURIComponent(bbox)}`);
        const geojson = await res.json();
        if (map.getSource('roads')) {
          map.getSource('roads').setData(geojson);
          updateHighlightFilter(map, hoveredIdRef.current, selectedIdRef.current);
        } else {
          map.addSource('roads', {
            type: 'geojson',
            data: geojson,
            promoteId: 'id',
          });
          map.addLayer({
            id: 'roads-fill',
            type: 'line',
            source: 'roads',
            paint: {
              'line-color': [
                'case',
                [
                  'all',
                  ['has', 'qualityScore'],
                  ['!=', ['get', 'qualityScore'], null],
                  ['!=', ['get', 'qualityScore'], 0],
                ],
                [
                  'interpolate',
                  ['linear'],
                  ['get', 'qualityScore'],
                  0.01, '#22c55e',
                  0.5, '#eab308',
                  1, '#ef4444',
                ],
                '#9ca3af',
              ],
              'line-width': 5,
            },
          });
          map.addLayer({
            id: 'roads-fill-highlight',
            type: 'line',
            source: 'roads',
            filter: ['==', ['get', 'id'], ''],
            paint: {
              'line-color': '#0ea5e9',
              'line-width': 8,
            },
          });
          map.on('click', (e: { point: [number, number]; lngLat: { lng: number; lat: number } }) => {
            const features = map.queryRenderedFeatures(e.point, { layers: ['roads-fill'] });
            if (features.length > 0) {
              const segmentId = features[0].properties?.id as string | undefined;
              if (segmentId) showPopupForSegment(map, segmentId, e.lngLat.lng, e.lngLat.lat);
            }
          });
          map.on('mouseenter', 'roads-fill', (e: { features?: Array<{ properties?: { id?: string } }> }) => {
            map.getCanvas().style.cursor = 'pointer';
            const fid = e.features?.[0]?.properties?.id;
            if (fid) {
              hoveredIdRef.current = fid;
              updateHighlightFilter(map, fid, selectedIdRef.current);
            }
          });
          map.on('mouseleave', 'roads-fill', () => {
            map.getCanvas().style.cursor = '';
            hoveredIdRef.current = null;
            updateHighlightFilter(map, null, selectedIdRef.current);
          });
        }
      } catch (_) {
        // no roads data yet
      }
    },
    [apiBase, showPopupForSegment],
  );

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;
    const initial = initialCenterRef.current;

    import('maplibre-gl').then((maplibregl) => {
      const map = new maplibregl.Map({
        container: containerRef.current!,
        style: {
          version: 8,
          sources: {
            osm: {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
            },
          },
          layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
        },
        center: [initial.lng, initial.lat],
        zoom: DEFAULT_ZOOM,
      });

      map.addControl(new maplibregl.NavigationControl(), 'top-right');
      map.on('load', () => {
        loadGeoJson(map);
        const c = centerRef.current;
        map.flyTo({ center: [c.lng, c.lat], zoom: DEFAULT_ZOOM });
        const userMarker = new maplibregl.Marker({ color: '#0ea5e9' })
          .setLngLat([c.lng, c.lat])
          .addTo(map);
        userMarkerRef.current = userMarker;
        onReadyRef.current?.();
      });
      map.on('moveend', () => loadGeoJson(map));

      mapRef.current = map;
      return () => {
        if (popupRef.current) popupRef.current.remove();
        userMarkerRef.current?.remove();
        userMarkerRef.current = null;
        map.remove();
        mapRef.current = null;
      };
    });
  }, [loadGeoJson]);

  useEffect(() => {
    const map = mapRef.current as import('maplibre-gl').Map | null;
    if (!map) return;
    map.flyTo({ center: [center.lng, center.lat], zoom: DEFAULT_ZOOM });
    userMarkerRef.current?.setLngLat([center.lng, center.lat]);
  }, [center.lat, center.lng]);

  return <div id="map" ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
function escapeHtml(s: string): string {
  const div = typeof document !== 'undefined' ? document.createElement('div') : null;
  if (div) {
    div.textContent = s;
    return div.innerHTML;
  }
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

