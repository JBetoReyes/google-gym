/**
 * AdModal — shown when the click counter fires.
 * Contains a Google AdSense unit. "Continue" appears after 3 seconds.
 */
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const AD_CLIENT = import.meta.env['VITE_ADSENSE_CLIENT'] as string | undefined;
const AD_SLOT   = import.meta.env['VITE_ADSENSE_SLOT']   as string | undefined;

export function AdModal({ isOpen, onClose }: Props) {
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    if (!isOpen) { setCanClose(false); return; }
    const t = setTimeout(() => setCanClose(true), 3000);
    return () => clearTimeout(t);
  }, [isOpen]);

  // Push AdSense ad once modal opens
  useEffect(() => {
    if (!isOpen || !AD_CLIENT) return;
    try {
      // @ts-expect-error — adsbygoogle is injected by the AdSense script
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {/* ignore */}
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-card border border-[var(--border)] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <span className="text-sm text-[var(--text-muted)]">Advertisement</span>
          {canClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-[var(--bg-input)] text-[var(--text-secondary)]"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Ad unit */}
        <div className="p-4 min-h-[250px] flex items-center justify-center">
          {AD_CLIENT && AD_SLOT ? (
            <ins
              className="adsbygoogle"
              style={{ display: 'block', width: '100%', minHeight: 250 }}
              data-ad-client={AD_CLIENT}
              data-ad-slot={AD_SLOT}
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
          ) : (
            // Dev placeholder
            <div className="w-full h-[250px] bg-[var(--bg-input)] rounded-xl flex items-center justify-center text-[var(--text-muted)] text-sm">
              Ad placeholder (configure VITE_ADSENSE_CLIENT + VITE_ADSENSE_SLOT)
            </div>
          )}
        </div>

        {/* Continue button */}
        <div className="p-4 pt-0">
          <button
            onClick={onClose}
            disabled={!canClose}
            className="w-full py-3 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {canClose ? 'Continue' : 'Please wait…'}
          </button>
        </div>
      </div>
    </div>
  );
}
