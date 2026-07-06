import type { ComponentType } from 'react';

export interface StatCardProps {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'red' | 'orange';
}

const COLOR_MAP = {
  blue:   { bg: 'bg-blue-50',   icon: 'text-blue-500',   border: 'border-blue-100' },
  green:  { bg: 'bg-green-50',  icon: 'text-green-500',  border: 'border-green-100' },
  red:    { bg: 'bg-red-50',    icon: 'text-red-500',    border: 'border-red-100' },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-500', border: 'border-orange-100' },
};

export function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  const c = COLOR_MAP[color];
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-4 flex items-center gap-3`}>
      <Icon className={`size-5 shrink-0 ${c.icon}`} />
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}
