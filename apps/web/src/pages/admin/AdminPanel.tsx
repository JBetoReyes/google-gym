/**
 * Admin Panel — protected route (/admin).
 * Only profiles with is_admin = true can access it.
 * Shows: ad frequency config, free tier limits, user stats.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Users, Zap, ShieldAlert } from 'lucide-react';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

interface UserStats {
  total_users: number;
  free_users: number;
  premium_users: number;
  sessions_today: number;
}

interface ConfigEntry {
  key: string;
  value: Record<string, unknown>;
}

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<UserStats | null>(null);
  const [configs, setConfigs] = useState<ConfigEntry[]>([]);
  const [adFrequency, setAdFrequency] = useState(5);
  const [freeLimit, setFreeLimit] = useState(3);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) { navigate('/dashboard'); return; }

    Promise.all([
      api.get<UserStats>('/admin/users'),
      api.get<ConfigEntry[]>('/admin/config'),
    ]).then(([s, c]) => {
      setStats(s);
      setConfigs(c);
      const adCfg = c.find(x => x.key === 'ad_frequency');
      if (adCfg) setAdFrequency((adCfg.value['clicks_between_ads'] as number) ?? 5);
      const limitCfg = c.find(x => x.key === 'free_routine_limit');
      if (limitCfg) setFreeLimit((limitCfg.value['max_routines'] as number) ?? 3);
    }).catch(() => navigate('/dashboard'));
  }, [user, navigate]);

  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      await Promise.all([
        api.put('/admin/config/ad_frequency', { value: { clicks_between_ads: adFrequency } }),
        api.put('/admin/config/free_routine_limit', { value: { max_routines: freeLimit } }),
      ]);
      setMessage('Saved successfully');
    } catch (e) {
      setMessage('Error saving config');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)] p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[var(--text-primary)]">Admin Panel</h1>
            <p className="text-sm text-[var(--text-muted)]">GymTracker v2 configuration</p>
          </div>
        </div>

        {/* User Stats */}
        {stats && (
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users size={18} className="text-[var(--accent)]" />
              <h2 className="font-semibold text-[var(--text-primary)]">User Stats</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Total Users', value: stats.total_users },
                { label: 'Free',        value: stats.free_users },
                { label: 'Premium',     value: stats.premium_users },
                { label: 'Sessions Today', value: stats.sessions_today },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[var(--bg-input)] rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-[var(--text-primary)]">{value}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Config */}
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5 space-y-5">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-[var(--accent)]" />
            <h2 className="font-semibold text-[var(--text-primary)]">App Config</h2>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="text-sm text-[var(--text-secondary)] flex items-center gap-1 mb-1">
                <Zap size={14} /> Ad Frequency (clicks between ads)
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={adFrequency}
                  onChange={e => setAdFrequency(parseInt(e.target.value, 10))}
                  className="w-24 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-center"
                />
                <span className="text-xs text-[var(--text-muted)]">
                  Show an ad every N qualifying button clicks
                </span>
              </div>
            </label>

            <label className="block">
              <span className="text-sm text-[var(--text-secondary)] mb-1 block">
                Free Tier Routine Limit
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={freeLimit}
                  onChange={e => setFreeLimit(parseInt(e.target.value, 10))}
                  className="w-24 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-center"
                />
                <span className="text-xs text-[var(--text-muted)]">
                  Max routines for free users
                </span>
              </div>
            </label>
          </div>

          {message && (
            <p className={`text-sm font-medium ${message.includes('Error') ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>
              {message}
            </p>
          )}

          <button
            onClick={save}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Config'}
          </button>
        </div>
      </div>
    </div>
  );
}
