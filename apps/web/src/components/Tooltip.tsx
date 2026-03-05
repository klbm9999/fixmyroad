'use client';

import { useEffect, useRef, useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export default function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);

  const updatePosition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const margin = 6;
    if (side === 'top') setCoords({ x: rect.left + rect.width / 2, y: rect.top - margin });
    else if (side === 'bottom') setCoords({ x: rect.left + rect.width / 2, y: rect.bottom + margin });
    else if (side === 'left') setCoords({ x: rect.left - margin, y: rect.top + rect.height / 2 });
    else setCoords({ x: rect.right + margin, y: rect.top + rect.height / 2 });
  };

  const show = () => {
    setVisible(true);
    requestAnimationFrame(updatePosition);
  };
  const hide = () => setVisible(false);

  useEffect(() => {
    if (!visible) return;
    const onScroll = () => updatePosition();
    window.addEventListener('scroll', onScroll, true);
    return () => window.removeEventListener('scroll', onScroll, true);
  }, [visible]);

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        style={{ display: 'inline-flex', alignItems: 'center', cursor: 'help' }}
        tabIndex={0}
        aria-label={content}
      >
        {children}
      </span>
      {visible && (
        <span
          className="tooltip-bubble"
          style={{
            position: 'fixed',
            left: coords.x,
            top: coords.y,
            transform: side === 'top' ? 'translate(-50%, -100%)' : side === 'bottom' ? 'translate(-50%, 0)' : side === 'left' ? 'translate(-100%, -50%)' : 'translate(0, -50%)',
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        >
          {content}
        </span>
      )}
    </>
  );
}
