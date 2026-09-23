'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Brain, ArrowRight, TrendingUp, ShieldAlert, DollarSign, Package, FileText, Users, CheckCircle2, Filter } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PriorityBadge } from '@/components/shared-badges';
import { recommendations } from '@/lib/data';
import type { RecommendationCategory } from '@/lib/types';
import { cn } from '@/lib/utils';

const categoryIcons: Record<RecommendationCategory, React.ComponentType<{ className?: string }>> = {
  'COST SAVING': DollarSign,
  'RISK': ShieldAlert,
  'PRICE': TrendingUp,
  'INVENTORY': Package,
  'SUPPLIER': Users,
  'CONTRACT': FileText,
};

const categoryColors: Record<RecommendationCategory, string> = {
  'COST SAVING': 'text-success',
  'RISK': 'text-destructive',
  'PRICE': 'text-warning',
  'INVENTORY': 'text-chart-2',
  'SUPPLIER': 'text-chart-4',
  'CONTRACT': 'text-primary',
};

export default function RecommendationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<'ALL' | RecommendationCategory>('ALL');

  const categories = useMemo(() => {
    const cats = Array.from(new Set(recommendations.map((r) => r.category)));
    return ['ALL', ...cats] as ('ALL' | RecommendationCategory)[];
  }, []);

  const filtered = filter === 'ALL' ? recommendations : recommendations.filter((r) => r.category === filter);
  const totalSavings = recommendations.filter((r) => r.impactValue > 0).reduce((sum, r) => sum + r.impactValue, 0);

  const handleAction = (rec: typeof recommendations[0]) => {
    if (rec.category === 'RISK') router.push('/supplier-risk');
    else if (rec.category === 'PRICE') router.push('/price-forecast');
    else if (rec.category === 'INVENTORY') router.push('/inventory');
    else if (rec.category === 'SUPPLIER') router.push('/suppliers');
    else if (rec.category === 'CONTRACT') router.push('/suppliers');
    else router.push('/spend-analytics');
  };

  return (
    <AppShell title="AI Recommendations">
      {/* Summary */}
      <Card className="mb-4 border-primary/20 bg-primary/5 p-5 backdrop-blur-sm animate-fade-up">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">AI has identified {recommendations.length} recommendations</p>
            <p className="text-2xl font-bold">${(totalSavings / 1000).toFixed(0)}K in potential annual savings</p>
          </div>
        </div>
      </Card>

      {/* Category Filter */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Filter className="mr-1 h-4 w-4 text-muted-foreground" />
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={filter === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Recommendation Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((rec, i) => {
          const Icon = categoryIcons[rec.category];
          const color = categoryColors[rec.category];
          return (
            <Card
              key={rec.id}
              className="group border-border bg-card/40 p-5 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/30">
                    <Icon className={cn('h-5 w-5', color)} />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">{rec.category}</span>
                  </div>
                </div>
                <PriorityBadge priority={rec.priority} />
              </div>

              <h3 className="mb-2 text-base font-semibold">{rec.title}</h3>
              <p className="mb-4 text-sm text-muted-foreground">{rec.description}</p>

              <div className="mb-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-secondary/20 p-3">
                  <p className="text-xs text-muted-foreground">Potential Impact</p>
                  <p className="text-sm font-bold text-foreground">{rec.impact}</p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/20 p-3">
                  <p className="text-xs text-muted-foreground">AI Confidence</p>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${rec.confidence}%` }} />
                    </div>
                    <span className="text-sm font-bold">{rec.confidence}%</span>
                  </div>
                </div>
              </div>

              {rec.relatedSupplier && (
                <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  Related: <span className="font-medium text-foreground">{rec.relatedSupplier}</span>
                </div>
              )}

              <Button variant="outline" size="sm" onClick={() => handleAction(rec)} className="w-full group-hover:border-primary/30">
                {rec.action} <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <Card className="border-border bg-card/40 p-12 text-center backdrop-blur-sm">
          <Sparkles className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No recommendations in this category.</p>
        </Card>
      )}
    </AppShell>
  );
}
