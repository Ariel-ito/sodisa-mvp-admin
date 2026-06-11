'use client';

import { useState } from 'react';

type BannerVariant = 'error' | 'warning' | 'info';

interface BannerProps {
  variant: BannerVariant;
  title?: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const styles: Record<BannerVariant, { container: string; icon: string }> = {
  error:   { container: 'bg-red-50 border border-red-200 text-red-800',     icon: '✕' },
  warning: { container: 'bg-amber-50 border border-amber-200 text-amber-800', icon: '⚠' },
  info:    { container: 'bg-blue-50 border border-blue-200 text-blue-800',   icon: 'ℹ' },
};

export function Banner({ variant, title, message, dismissible = true, onDismiss }: BannerProps) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const { container, icon } = styles[variant];

  function dismiss() {
    setVisible(false);
    onDismiss?.();
  }

  return (
    <div className={`rounded-lg px-4 py-3 flex gap-3 items-start text-sm ${container}`} role="alert">
      <span className="text-base leading-5 shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <p className="leading-snug">{message}</p>
      </div>
      {dismissible && (
        <button
          onClick={dismiss}
          aria-label="Cerrar"
          className="shrink-0 opacity-60 hover:opacity-100 transition-opacity leading-none text-base"
        >
          ✕
        </button>
      )}
    </div>
  );
}
