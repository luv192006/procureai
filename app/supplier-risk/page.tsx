'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Brain, TrendingUp, TrendingDown, Minus, CheckCircle2, Zap, ArrowRight, AlertTriangle } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RiskBadge, ScoreBar } from '@/components/shared-badges';
import { AIProcessingOverlay } from '@/components/ai-processing';
import { suppliers } from '@/lib/data';
import { analyzeSupplierRisk, generateMitigationPlan } from '@/lib/ai';
import type { Supplier } from '@/lib/types';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

const tooltipStyle = {
  backgroundColor: 'hsl(222 40% 8% / 0.95)',
  border: '1px solid hsl(222 30% 18%)',
  borderRadius: '0.5rem',
  fontSize: '12px',
  color: 'hsl(210 40% 98%)',
};

export default function SupplierRiskPage() {
  const router = useRouter();
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showAI, setShowAI] = useState(false);
  const [showMitigation, setShowMitigation] = useState(false);
  const [riskAnalysis, setRiskAnalysis] = useState<ReturnType<typeof analyzeSupplierRisk> | null>(null);
  const [mitigationPlan, setMitigationPlan] = useState<ReturnType<typeof generateMitigationPlan> | null>(null);

  const sortedSuppliers = useMemo(() => [...suppliers].sort((a, b) => b.riskScore - a.riskScore), []);

  const riskCounts = {
    HIGH: suppliers.filter((s) => s.riskLevel === 'HIGH').length,
    MEDIUM: suppliers.filter((s) => s.riskLevel === 'MEDIUM').length,
    LOW: suppliers.filter((s) => s.riskLevel === 'LOW').length,
  };

  const riskDistribution = [
    { name: 'High Risk', value: riskCounts.HIGH, color: 'hsl(0, 72%, 51%)' },
    { name: 'Medium Risk', value: riskCounts.MEDIUM, color: 'hsl(38, 92%, 50%)' },
    { name: 'Low Risk', value: riskCounts.LOW, color: 'hsl(142, 71%, 45%)' },
  ];

  const runRiskAnalysis = (supplier: Supplier) => {
    setShowAI(true);
    setRiskAnalysis(null);
    setMitigationPlan(null);
    setTimeout(() => {
      setRiskAnalysis(analyzeSupplierRisk(supplier));
      setShowAI(false);
    }, 2800);
  };

  const generateMitigation = (supplier: Supplier) => {
    setShowMitigation(true);
    setMitigationPlan(null);
    setTimeout(() => {
      setMitigationPlan(generateMitigationPlan(supplier));
      setShowMitigation(false);
    }, 2500);
  };

  return (
    <AppShell title="Supplier Risk Analysis">
      {(showAI || showMitigation) && (
        <AIProcessingOverlay
          title={showMitigation ? 'Generating Mitigation Plan' : 'AI Risk Analysis'}
          onComplete={() => {}}
        />
      )}

      {/* Risk Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'High Risk', count: riskCounts.HIGH, color: 'destructive', bg: 'bg-destructive/10', border: 'border-destructive/30', icon: AlertTriangle },
          { label: 'Medium Risk', count: riskCounts.MEDIUM, color: 'warning', bg: 'bg-warning/10', border: 'border-warning/30', icon: ShieldAlert },
          { label: 'Low Risk', count: riskCounts.LOW, color: 'success', bg: 'bg-success/10', border: 'border-success/30', icon: CheckCircle2 },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className={cn('p-5 border backdrop-blur-sm animate-fade-up', s.border, s.bg)} style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-3xl font-bold">{s.count}</p>
                  <p className="mt-1 text-xs text-muted-foreground">suppliers</p>
                </div>
                <Icon className={cn('h-8 w-8', `text-${s.color}`)} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Risk Distribution Chart */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-border bg-card/40 p-5 backdrop-blur-sm animate-fade-up">
          <h3 className="mb-4 text-base font-semibold">Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={riskDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3}>
                {riskDistribution.map((entry, i) => <Cell key={i} fill={entry.color} stroke="hsl(222 40% 8%)" strokeWidth={2} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} formatter={(v) => <span style={{ color: 'hsl(215 25% 65%)' }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Supplier List */}
        <Card className="border-border bg-card/40 p-5 backdrop-blur-sm animate-fade-up lg:col-span-2">
          <h3 className="mb-4 text-base font-semibold">Suppliers by Risk Score</h3>
          <div className="max-h-64 space-y-2 overflow-y-auto scrollbar-thin">
            {sortedSuppliers.map((s) => (
              <button
                key={s.id}
                onClick={() => { setSelectedSupplier(s); setRiskAnalysis(null); setMitigationPlan(null); }}
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition-all hover:border-primary/30',
                  selectedSupplier?.id === s.id ? 'border-primary/30 bg-primary/5' : 'border-border bg-secondary/20'
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.category}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden w-24 sm:block">
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className={cn('h-full rounded-full transition-all', s.riskScore >= 70 ? 'bg-destructive' : s.riskScore >= 40 ? 'bg-warning' : 'bg-success')}
                        style={{ width: `${s.riskScore}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold">{s.riskScore}</span>
                  <RiskBadge level={s.riskLevel} />
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Selected Supplier Risk Detail */}
      {selectedSupplier && (
        <div className="space-y-4 animate-fade-up">
          {/* Supplier Header */}
          <Card className="border-border bg-card/40 p-5 backdrop-blur-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold">{selectedSupplier.name}</h2>
                <p className="text-sm text-muted-foreground">{selectedSupplier.id} • {selectedSupplier.category} • {selectedSupplier.location}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Risk Score</p>
                  <p className={cn('text-3xl font-bold', selectedSupplier.riskScore >= 70 ? 'text-destructive' : selectedSupplier.riskScore >= 40 ? 'text-warning' : 'text-success')}>
                    {selectedSupplier.riskScore}
                  </p>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs text-muted-foreground">/ 100</span>
                  <RiskBadge level={selectedSupplier.riskLevel} />
                </div>
              </div>
            </div>
          </Card>

          {/* Risk Score Bars */}
          <Card className="border-border bg-card/40 p-5 backdrop-blur-sm">
            <h3 className="mb-4 text-base font-semibold">Risk Score Breakdown</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ScoreBar label="Financial Risk" value={selectedSupplier.riskBreakdown.financial} />
              <ScoreBar label="Delivery Risk" value={selectedSupplier.riskBreakdown.delivery} />
              <ScoreBar label="Quality Risk" value={selectedSupplier.riskBreakdown.quality} />
              <ScoreBar label="Price Stability" value={selectedSupplier.riskBreakdown.priceStability} />
            </div>
          </Card>

          {/* AI Risk Explanation */}
          <Card className="border-primary/20 bg-primary/5 p-5 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <h3 className="text-base font-semibold">Why is this supplier risky?</h3>
            </div>
            {riskAnalysis ? (
              <div className="space-y-3 animate-fade-in">
                <p className="text-sm text-foreground">{riskAnalysis.explanation}</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {riskAnalysis.factors.map((f) => {
                    const TrendIcon = f.trend === 'Stable' ? Minus : f.trend.includes('Deteriorat') || f.trend.includes('Declin') || f.trend.includes('Worsen') || f.trend.includes('Volat') ? TrendingUp : TrendingDown;
                    return (
                      <div key={f.name} className="rounded-lg border border-border bg-card/40 p-3">
                        <p className="text-xs text-muted-foreground">{f.name}</p>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-lg font-bold">{f.score}</span>
                          <span className={cn('flex items-center gap-1 text-xs', f.trend === 'Stable' ? 'text-success' : 'text-destructive')}>
                            <TrendIcon className="h-3 w-3" />{f.trend}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{selectedSupplier.aiAnalysis}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => runRiskAnalysis(selectedSupplier)}>
                <Brain className="mr-1.5 h-3.5 w-3.5" /> Run AI Risk Analysis
              </Button>
              <Button size="sm" variant="outline" onClick={() => generateMitigation(selectedSupplier)}>
                <ShieldAlert className="mr-1.5 h-3.5 w-3.5" /> Generate Mitigation Plan
              </Button>
            </div>
          </Card>

          {/* Mitigation Plan */}
          {mitigationPlan && (
            <Card className="border-success/30 bg-success/5 p-5 backdrop-blur-sm animate-fade-in">
              <div className="mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-success" />
                <h3 className="text-base font-semibold">AI Mitigation Plan</h3>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">{mitigationPlan.summary}</p>
              <div className="space-y-3">
                {mitigationPlan.actions.map((action, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl border border-border bg-card/40 p-4">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">{i + 1}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">{action.title}</p>
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', action.priority === 'HIGH' ? 'bg-destructive/15 text-destructive' : action.priority === 'MEDIUM' ? 'bg-warning/15 text-warning' : 'bg-success/15 text-success')}>
                          {action.priority}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {!selectedSupplier && (
        <Card className="border-border bg-card/40 p-8 text-center backdrop-blur-sm animate-fade-up">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <ShieldAlert className="h-7 w-7 text-primary" />
          </div>
          <h3 className="mb-1 text-base font-semibold">Select a Supplier</h3>
          <p className="text-sm text-muted-foreground">Choose a supplier from the list above to view detailed risk analysis and AI mitigation plans.</p>
        </Card>
      )}
    </AppShell>
  );
}
