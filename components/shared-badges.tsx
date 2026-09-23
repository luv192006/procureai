'use client';

import { cn } from '@/lib/utils';
import type { RiskLevel, Priority, StockStatus } from '@/lib/types';

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  const styles: Record<RiskLevel, string> = {
    HIGH: 'bg-destructive/15 text-destructive border-destructive/30',
    MEDIUM: 'bg-warning/15 text-warning border-warning/30',
    LOW: 'bg-success/15 text-success border-success/30',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        styles[level],
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', {
        'bg-destructive': level === 'HIGH',
        'bg-warning': level === 'MEDIUM',
        'bg-success': level === 'LOW',
      })} />
      {level}
    </span>
  );
}

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  const styles: Record<Priority, string> = {
    HIGH: 'bg-destructive/15 text-destructive border-destructive/30',
    MEDIUM: 'bg-warning/15 text-warning border-warning/30',
    LOW: 'bg-success/15 text-success border-success/30',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        styles[priority],
        className
      )}
    >
      {priority}
    </span>
  );
}

export function StockBadge({ status, className }: { status: StockStatus; className?: string }) {
  const styles: Record<StockStatus, string> = {
    Healthy: 'bg-success/15 text-success border-success/30',
    'Low Stock': 'bg-warning/15 text-warning border-warning/30',
    Critical: 'bg-destructive/15 text-destructive border-destructive/30',
    Overstocked: 'bg-chart-4/15 text-chart-4 border-chart-4/30',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        styles[status],
        className
      )}
    >
      {status}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const normalized = status.toLowerCase();
  let style = 'bg-secondary/50 text-muted-foreground border-border';

  if (normalized.includes('open') || normalized.includes('active') || normalized.includes('approved') || normalized.includes('delivered')) {
    style = 'bg-success/15 text-success border-success/30';
  } else if (normalized.includes('pending') || normalized.includes('draft') || normalized.includes('shipped')) {
    style = 'bg-primary/15 text-primary border-primary/30';
  } else if (normalized.includes('closed') || normalized.includes('cancelled')) {
    style = 'bg-muted text-muted-foreground border-border';
  } else if (normalized.includes('review')) {
    style = 'bg-warning/15 text-warning border-warning/30';
  } else if (normalized.includes('preferred') || normalized.includes('onboarding')) {
    style = 'bg-chart-4/15 text-chart-4 border-chart-4/30';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        style,
        className
      )}
    >
      {status}
    </span>
  );
}

export function ScoreBar({
  label,
  value,
  max = 100,
  color,
}: {
  label: string;
  value: number;
  max?: number;
  color?: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  const barColor = color || (pct >= 70 ? 'bg-destructive' : pct >= 40 ? 'bg-warning' : 'bg-success');

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold text-foreground">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-out', barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
