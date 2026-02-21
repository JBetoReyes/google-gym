/**
 * CelebrationModal — shown on workout completion when the user hits their
 * weekly goal or sets a new PR.
 */
import React from 'react';
import { Target, TrendingUp, Trophy } from 'lucide-react';
import { Button } from '@/components/ui';

export interface Achievement {
  type: 'goal' | 'pr';
  title: string;
  desc: string;
}

interface Props {
  achievements: Achievement[];
  onClose: () => void;
}

export default function CelebrationModal({ achievements, onClose }: Props) {
  if (!achievements || achievements.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-sm w-full text-center relative overflow-hidden shadow-2xl shadow-purple-500/20">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

        <div className="mb-6 flex justify-center">
          <Trophy size={64} className="text-yellow-400 animate-bounce" />
        </div>

        <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-wide">
          {achievements[0]?.title ?? ''}
        </h2>

        <div className="space-y-3 mb-8">
          {achievements.map((ach, i) => (
            <div
              key={i}
              className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom fade-in duration-500"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div
                className={`p-2 rounded-full ${
                  ach.type === 'goal'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}
              >
                {ach.type === 'goal' ? <Target size={20} /> : <TrendingUp size={20} />}
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-500">{ach.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <Button onClick={onClose} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 border-none">
          OK
        </Button>
      </div>
    </div>
  );
}
