/**
 * Shared UI primitives — themed via CSS custom properties.
 * All color references use var(--...) tokens so premium themes work automatically.
 */
export { UpgradeModal } from './UpgradeModal';
import React from 'react';
import { AlertCircle } from 'lucide-react';
import type { MuscleGroup } from '@shared/types/exercise';

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] shadow-xl ${className}`}
    >
      {children}
    </div>
  );
}

// ── Button ────────────────────────────────────────────────────────────────────
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: React.ElementType;
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  icon: Icon,
  ...props
}: ButtonProps) {
  const base =
    'flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100';

  const variants: Record<ButtonVariant, string> = {
    primary:   'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white shadow-lg',
    secondary: 'bg-[var(--bg-input)] hover:brightness-110 text-[var(--text-primary)]',
    danger:    'bg-[var(--danger)]/10 hover:bg-[var(--danger)]/20 text-[var(--danger)]',
    success:   'bg-[var(--success)] hover:brightness-110 text-white',
    ghost:     'bg-transparent hover:bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
    icon:      'p-2 aspect-square rounded-lg bg-[var(--bg-input)] hover:brightness-110 text-[var(--text-primary)]',
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {Icon && <Icon size={20} />}
      {children}
    </button>
  );
}

// ── ConfirmationModal ─────────────────────────────────────────────────────────
interface ConfirmProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <Card className="w-full max-w-sm p-6 bg-slate-900 border border-[var(--border)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-[var(--danger)]/10 rounded-full text-[var(--danger)]">
            <AlertCircle size={24} />
          </div>
          <h3 className="text-xl font-bold text-[var(--text-primary)]">{title}</h3>
        </div>
        <p className="text-[var(--text-secondary)] mb-6">{message}</p>
        <div className="flex gap-3">
          <Button onClick={onCancel} variant="secondary" className="flex-1">
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm} variant="danger" className="flex-1">
            {confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ── MuscleIcon ────────────────────────────────────────────────────────────────
const MUSCLE_PATHS: Record<MuscleGroup, React.ReactElement> = {
  Chest:       <path d="M4 7c0-1.1.9-2 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7zm3 6h10v4H7v-4z" />,
  Back:        <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.8l5 3.1v6.2l-5 3.1-5-3.1V7.9l5-3.1z" />,
  Legs:        <path d="M7 2v10l-2 10h3l2-10 2 10h3l-2-10V2H7z" />,
  Shoulders:   <path d="M2 8a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v3h-4V8H6v3H2V8z" />,
  Arms:        <path d="M18 10a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4v4h3v4h6v-4h3v-4z" />,
  Abs:         <path d="M7 4h10v3H7V4zm0 5h10v3H7V9zm0 5h10v3H7v-3z" />,
  Cardio:      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
  Flexibility: <path d="M12 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm-1 8v5l-3 5h2l2-3 2 3h2l-3-5v-5h-2z" />,
};

const MUSCLE_COLOR_CLASSES: Record<MuscleGroup, string> = {
  Chest:       'text-blue-400',
  Back:        'text-emerald-400',
  Legs:        'text-amber-400',
  Shoulders:   'text-purple-400',
  Arms:        'text-red-400',
  Abs:         'text-cyan-400',
  Cardio:      'text-orange-400',
  Flexibility: 'text-pink-400',
};

export function MuscleIcon({
  muscle,
  className = 'w-5 h-5',
}: {
  muscle: MuscleGroup;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`${className} ${MUSCLE_COLOR_CLASSES[muscle] ?? 'text-[var(--text-muted)]'}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {MUSCLE_PATHS[muscle] ?? <circle cx="12" cy="12" r="10" />}
    </svg>
  );
}
