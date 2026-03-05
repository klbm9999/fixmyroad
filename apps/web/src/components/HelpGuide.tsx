'use client';

import { IconClose } from '@/components/Icons';
import { useEffect } from 'react';

interface HelpGuideProps {
  onClose: () => void;
  showForNewUser?: boolean;
}

const SECTIONS = [
  {
    title: 'How it works',
    body: 'FixMyRoad lets citizens report road issues in Hyderabad and tracks them until they are fixed. Builders can claim issues and earn rewards for verified fixes.',
  },
  {
    title: 'Map colours',
    body: 'Grey = no report data. Green = no issues, Yellow = minor issues, Red = severe or multiple issues. Tap a road to see existing reports, complaint status, and a Raise issue button that uses that location.',
  },
  {
    title: 'Report an issue',
    body: 'Use Report issue in the menu (uses your current location) or tap a road on the map and click Raise issue in the bubble (uses that road’s location). You never type coordinates. Choose issue type and severity, add a photo; you must be logged in.',
  },
  {
    title: 'For builders',
    body: 'Register as a builder, then open Issues to see claimable items. Claim an issue (bond required), complete the fix, and upload before/after proof. Rewards are released after verification.',
  },
  {
    title: 'Knowledge centre',
    body: 'Check IRC guidelines and repair guides for pothole standards, materials, and safety. Useful for both reporters and builders.',
  },
];

export default function HelpGuide({ onClose, showForNewUser }: HelpGuideProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      className="help-guide-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-guide-title"
    >
      <div className="help-guide-modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 id="help-guide-title" style={{ margin: 0 }}>Help &amp; guide</h2>
          <button type="button" onClick={onClose} aria-label="Close help" style={{ padding: '0.25rem 0.5rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
            <IconClose size={20} />
          </button>
        </div>
        {showForNewUser && (
          <p style={{ background: '#e0f2fe', padding: '0.75rem', borderRadius: 6, marginBottom: '1rem' }}>
            <strong>New here?</strong> This short guide will get you started.
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '70vh', overflowY: 'auto' }}>
          {SECTIONS.map((s, i) => (
            <section key={i}>
              <h3 style={{ margin: '0 0 0.35em', fontSize: '1rem' }}>{s.title}</h3>
              <p style={{ margin: 0, color: '#374151', lineHeight: 1.5 }}>{s.body}</p>
            </section>
          ))}
        </div>
        <p style={{ marginTop: '1rem', marginBottom: 0, fontSize: '0.875rem', color: '#6b7280' }}>
          Need more? Visit the <a href="/knowledge">Knowledge centre</a> for IRC standards and repair guides.
        </p>
      </div>
    </div>
  );
}
