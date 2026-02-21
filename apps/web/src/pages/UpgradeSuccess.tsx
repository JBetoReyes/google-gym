import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function UpgradeSuccess() {
  const { plan, refreshPlan } = useAuth();
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Wait 2s for the webhook to process, then refresh plan and redirect
    const timer = setTimeout(async () => {
      await refreshPlan();
      setChecked(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [refreshPlan]);

  useEffect(() => {
    if (checked && plan === 'premium') {
      navigate('/dashboard', { replace: true });
    }
  }, [checked, plan, navigate]);

  return (
    <div className="fixed inset-0 bg-[var(--bg-page)] flex items-center justify-center p-6">
      <div className="text-center max-w-sm animate-in fade-in">
        <div className="text-5xl mb-4">✦</div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
          Welcome to Pro!
        </h1>
        {!checked ? (
          <p className="text-[var(--text-muted)] text-sm">
            Your account has been upgraded. Redirecting to dashboard…
          </p>
        ) : (
          <div>
            <p className="text-[var(--text-muted)] text-sm mb-4">
              Your upgrade is processing — check back in a moment.
            </p>
            <button
              onClick={() => navigate('/dashboard', { replace: true })}
              className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
