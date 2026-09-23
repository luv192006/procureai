'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  DollarSign,
  Users,
  FileText,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  ArrowUpRight,
  ArrowRight,
  Brain,
  Activity,
  Package,
  AlertTriangle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PriorityBadge, RiskBadge } from '@/components/shared-badges';
import { useAuth } from '@/lib/auth-context';
import { recommendations, suppliers, monthlySpend, categorySpend, rfqs, inventory } from '@/lib/data';

function useCountUp(target: number, duration = 1200, start = false) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!start) return;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, start]);

  return value;
}

function KPICard({
  icon: Icon,
  label,
  value,
  prefix = '',
  suffix = '',
  trend,
  trendLabel,
  trendUp = true,
  delay = 0,
  color,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  trend?: string;
  trendLabel?: string;
  trendUp?: boolean;
  delay?: number;
  color: string;
}) {
  const [animate, setAnimate] = useState(false);
  const count = useCountUp(value, 1500, animate);

  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const displayValue =
    value >= 1000000
      ? `${prefix}${(count / 1000000).toFixed(2)}M`
      : value >= 1000
      ? `${prefix}${(count / 1000).toFixed(1)}K`
      : `${prefix}${Math.round(count).toLocaleString()}${suffix}`;

  return (
    <Card
      className="group relative overflow-hidden border-border bg-card/40 p-5 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-5 blur-2xl transition-opacity group-hover:opacity-10" style={{ background: color }} />
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: `${color}15` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trendUp ? 'text-success' : 'text-destructive'}`}>
            {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend}
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight">{displayValue}</p>
        {trendLabel && <p className="mt-1 text-xs text-muted-foreground">{trendLabel}</p>}
      </div>
    </Card>
  );
}

const tooltipStyle = {
  backgroundColor: 'hsl(222 40% 8% / 0.95)',
  border: '1px solid hsl(222 30% 18%)',
  borderRadius: '0.5rem',
  fontSize: '12px',
  color: 'hsl(210 40% 98%)',
  backdropFilter: 'blur(8px)',
};

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const topRecommendations = recommendations.slice(0, 3);
  const highRiskSuppliers = suppliers
    .filter((s) => s.riskLevel === 'HIGH' || s.riskLevel === 'MEDIUM')
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 4);

  const recentSpend = monthlySpend.slice(-6);
  const topCategories = categorySpend.slice(0, 5);
  const openRFQs = rfqs.filter((r) => r.status === 'Open').length;
  const criticalItems = inventory.filter((i) => i.status === 'Critical').length;

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-6 animate-fade-up">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
              {greeting}, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Here is your procurement intelligence overview.</p>
          </div>
          <Button onClick={() => router.push('/assistant')} className="self-start sm:self-auto">
            <Brain className="mr-2 h-4 w-4" /> Ask AI Assistant
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard
          icon={DollarSign}
          label="Total Spend"
          value={1240000}
          prefix="$"
          trend="+8.4%"
          trendLabel="+8.4% vs last month"
          trendUp={true}
          delay={0}
          color="hsl(213, 94%, 58%)"
        />
        <KPICard
          icon={Users}
          label="Active Suppliers"
          value={128}
          trendLabel="12 new this month"
          delay={100}
          color="hsl(142, 71%, 45%)"
        />
        <KPICard
          icon={FileText}
          label="Open RFQs"
          value={24}
          trendLabel={`${openRFQs} awaiting response`}
          delay={200}
          color="hsl(38, 92%, 50%)"
        />
        <KPICard
          icon={Sparkles}
          label="Potential Savings"
          value={184000}
          prefix="$"
          trendLabel="AI identified"
          delay={300}
          color="hsl(280, 65%, 60%)"
        />
      </div>

      {/* Charts row */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Spend trend */}
        <Card className="border-border bg-card/40 p-5 backdrop-blur-sm lg:col-span-2 animate-fade-up" style={{ animationDelay: '400ms' }}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">Monthly Procurement Spend</h3>
              <p className="text-xs text-muted-foreground">Last 6 months</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> Spend</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" /> Savings</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={recentSpend} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(213, 94%, 58%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(213, 94%, 58%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
              <XAxis dataKey="month" stroke="hsl(215 25% 65%)" fontSize={12} />
              <YAxis stroke="hsl(215 25% 65%)" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
              <Area type="monotone" dataKey="spend" stroke="hsl(213, 94%, 58%)" strokeWidth={2} fill="url(#spendGrad)" />
              <Area type="monotone" dataKey="savings" stroke="hsl(142, 71%, 45%)" strokeWidth={2} fill="url(#savingsGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Category pie */}
        <Card className="border-border bg-card/40 p-5 backdrop-blur-sm animate-fade-up" style={{ animationDelay: '500ms' }}>
          <div className="mb-4">
            <h3 className="text-base font-semibold">Spend by Category</h3>
            <p className="text-xs text-muted-foreground">Current month</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={topCategories}
                dataKey="spend"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={85}
                paddingAngle={2}
              >
                {topCategories.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="hsl(222 40% 8%)" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', color: 'hsl(215 25% 65%)' }}
                formatter={(value) => <span style={{ color: 'hsl(215 25% 65%)' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* AI Recommendations + Risk Alerts */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* AI Recommendations */}
        <Card className="border-border bg-card/40 p-5 backdrop-blur-sm animate-fade-up" style={{ animationDelay: '600ms' }}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-base font-semibold">AI Recommendations</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/recommendations')}>
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-3">
            {topRecommendations.map((rec) => (
              <button
                key={rec.id}
                onClick={() => router.push('/recommendations')}
                className="group flex w-full items-start gap-3 rounded-xl border border-border bg-secondary/20 p-3 text-left transition-all hover:border-primary/30 hover:bg-primary/5"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Brain className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{rec.title}</p>
                    <PriorityBadge priority={rec.priority} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{rec.description}</p>
                  {rec.impactValue > 0 && (
                    <p className="mt-1.5 text-xs font-medium text-success">{rec.impact}</p>
                  )}
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
              </button>
            ))}
          </div>
        </Card>

        {/* Risk Alerts */}
        <Card className="border-border bg-card/40 p-5 backdrop-blur-sm animate-fade-up" style={{ animationDelay: '700ms' }}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
                <ShieldAlert className="h-4 w-4 text-destructive" />
              </div>
              <h3 className="text-base font-semibold">Supplier Risk Alerts</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/supplier-risk')}>
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-3">
            {highRiskSuppliers.map((s) => (
              <button
                key={s.id}
                onClick={() => router.push('/supplier-risk')}
                className="group flex w-full items-start gap-3 rounded-xl border border-border bg-secondary/20 p-3 text-left transition-all hover:border-destructive/30 hover:bg-destructive/5"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{s.name}</p>
                    <RiskBadge level={s.riskLevel} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {s.riskScore >= 70
                      ? 'Financial risk detected'
                      : 'Delivery delays increasing'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Risk score: {s.riskScore}/100</p>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-destructive" />
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick stats row */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="flex items-center gap-3 border-border bg-card/40 p-4 backdrop-blur-sm animate-fade-up" style={{ animationDelay: '800ms' }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Active RFQs</p>
            <p className="text-xl font-bold">{openRFQs}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 border-border bg-card/40 p-4 backdrop-blur-sm animate-fade-up" style={{ animationDelay: '900ms' }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
            <Package className="h-5 w-5 text-warning" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Critical Inventory</p>
            <p className="text-xl font-bold">{criticalItems}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 border-border bg-card/40 p-4 backdrop-blur-sm animate-fade-up" style={{ animationDelay: '1000ms' }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
            <TrendingUp className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Savings YTD</p>
            <p className="text-xl font-bold">$710K</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 border-border bg-card/40 p-4 backdrop-blur-sm animate-fade-up" style={{ animationDelay: '1100ms' }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-4/10">
            <Users className="h-5 w-5 text-chart-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">New Suppliers</p>
            <p className="text-xl font-bold">12</p>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
