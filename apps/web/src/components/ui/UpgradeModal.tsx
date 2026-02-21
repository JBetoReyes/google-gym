/**
 * UpgradeModal — shown when a free user hits a plan limit (e.g. routine cap).
 */
import React, { useState } from 'react';
import { Lock, Sparkles, X } from 'lucide-react';
import { Card, Button } from './index';
import { api } from '@/services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: Props) {
  const [isRedirecting, setIsRedirecting] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setIsRedirecting(true);
    try {
      const { url } = await api.post<{ url: string }>('/stripe/checkout', {
        success_url: `${window.location.origin}/upgrade/success`,
        cancel_url: window.location.href,
      });
      window.location.href = url;
    } catch {
      setIsRedirecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <Card className="w-full max-w-sm relative bg-[var(--bg-card)] border border-[var(--border)]">
        <div className="p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X size={20} />
          </button>

          {/* Icon */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center mb-5">
            <Lock size={28} className="text-white" />
          </div>

          {/* Copy */}
          <h2 className="text-xl font-bold text-[var(--text-primary)] text-center mb-2">
            Routine limit reached
          </h2>
          <p className="text-[var(--text-muted)] text-sm text-center leading-relaxed mb-6">
            Free plan includes up to <span className="font-semibold text-[var(--text-primary)]">3 routines</span>.
            Upgrade to Pro for unlimited routines, all analytics charts, and no ads.
          </p>

          {/* Perks */}
          <ul className="space-y-2 mb-6">
            {[
              'Unlimited routines',
              'All 5 analytics charts',
              'No ads, ever',
              'Cloud sync across devices',
            ].map((perk) => (
              <li key={perk} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <Sparkles size={14} className="text-purple-400 shrink-0" />
                {perk}
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              variant="primary"
              className="w-full justify-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
              onClick={handleUpgrade}
              disabled={isRedirecting}
            >
              {isRedirecting ? 'Redirecting…' : 'Upgrade to Pro ✦'}
            </Button>
            <Button variant="ghost" className="w-full justify-center" onClick={onClose}>
              Maybe later
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
