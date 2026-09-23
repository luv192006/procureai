'use client';

import { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, Sparkles, Brain, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { monthlySpend, categorySpend, suppliers } from '@/lib/data';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line,
} from 'recharts';
import { cn } from '@/lib/utils';

const tooltipStyle = {
  backgroundColor: 'hsl(222 40% 8% / 0.95)',
  border: '1px solid hsl(222 30% 18%)',
  borderRadius: '0.5rem',
  fontSize: '12px',
  color: 'hsl(210 40% 98%)',
};

const dateRanges: Record<string, number> = {
  '7 Days': 1,
  '30 Days': 2,
  '3 Months': 6,
  '12 Months': 12,
};

export default function SpendAnalyticsPage() {
  const [dateRange, setDateRange] = useState('12 Months');
  const monthsToShow = dateRanges[dateRange] || 12;
  const spendData = useMemo(() => monthlySpend.slice(-monthsToShow), [monthsToShow]);

  const totalSpend = spendData.reduce((sum, m) => sum + m.spend, 0);
  const totalSavings = spendData.reduce((sum, m) => sum + m.savings, 0);
  const avgMonthly = totalSpend / spendData.length;
  const top5Spend = suppliers.sort((a, b) => b.spend - a.spend).slice(0, 5).reduce((sum, s) => sum + s.spend, 0);
  const totalSupplierSpend = suppliers.reduce((sum, s) => sum + s.spend, 0);
  const concentration = ((top5Spend / totalSupplierSpend) * 100).toFixed(0);
  const addressableSpend = totalSpend * 0.82;
  const savingsOpportunity = 184000;

  const supplierSpendData = suppliers.sort((a, b) => b.spend - a.spend).slice(0, 10).map((s) => ({
    name: s.name.replace(/\s+(Ltd\.|Industries|Co\.|Systems|Products|Mfg\.|India|Electronics|Packaging|Molding|Foundry|Cables|Valves|Components|Manufacturing|Forge|Solutions|Materials|Works)$/i, '').trim(),
    spend: s.spend,
  }));

  const maverickData = [
    { month: 'Jun', compliant: 88, maverick: 12 },
    { month: 'Jul', compliant: 85, maverick: 15 },
    { month: 'Aug', compliant: 88, maverick: 12 },
  ];

  return (
    <AppShell title="Spend Analytics">
      {/* Date Filter */}
      <div className="mb-4 flex items-center gap-2">
        {Object.keys(dateRanges).map((range) => (
          <Button
            key={range}
            variant={dateRange === range ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange(range)}
          >
            {range}
          </Button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Spend', value: `$${(totalSpend / 1000000).toFixed(2)}M`, icon: DollarSign, color: 'text-primary', trend: '+8.4%' },
          { label: 'Addressable Spend', value: `$${(addressableSpend / 1000000).toFixed(2)}M`, icon: BarChart3, color: 'text-chart-2', trend: '82% of total' },
          { label: 'Savings Opportunity', value: `$${(savingsOpportunity / 1000).toFixed(0)}K`, icon: Sparkles, color: 'text-chart-4', trend: 'AI identified' },
          { label: 'Supplier Concentration', value: `${concentration}%`, icon: TrendingUp, color: 'text-warning', trend: 'Top 5 suppliers' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-5 border-border bg-card/40 backdrop-blur-sm animate-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/30">
                  <Icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <span className="text-xs text-muted-foreground">{s.trend}</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-2xl font-bold">{s.value}</p>
            </Card>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Monthly Spend */}
        <Card className="border-border bg-card/40 p-5 backdrop-blur-sm animate-fade-up">
          <div className="mb-4">
            <h3 className="text-base font-semibold">Monthly Procurement Spend</h3>
            <p className="text-xs text-muted-foreground">Spend vs Budget vs Savings</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={spendData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="spendG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(213, 94%, 58%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(213, 94%, 58%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
              <XAxis dataKey="month" stroke="hsl(215 25% 65%)" fontSize={12} />
              <YAxis stroke="hsl(215 25% 65%)" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
              <Area type="monotone" dataKey="spend" stroke="hsl(213, 94%, 58%)" strokeWidth={2} fill="url(#spendG)" name="Spend" />
              <Line type="monotone" dataKey="budget" stroke="hsl(38, 92%, 50%)" strokeWidth={2} strokeDasharray="5 5" name="Budget" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Category Pie */}
        <Card className="border-border bg-card/40 p-5 backdrop-blur-sm animate-fade-up" style={{ animationDelay: '100ms' }}>
          <div className="mb-4">
            <h3 className="text-base font-semibold">Spend by Category</h3>
            <p className="text-xs text-muted-foreground">Distribution across categories</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={categorySpend} dataKey="spend" nameKey="category" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2}>
                {categorySpend.map((entry, i) => <Cell key={i} fill={entry.color} stroke="hsl(222 40% 8%)" strokeWidth={2} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} formatter={(v) => <span style={{ color: 'hsl(215 25% 65%)' }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Supplier Spend */}
        <Card className="border-border bg-card/40 p-5 backdrop-blur-sm animate-fade-up">
          <div className="mb-4">
            <h3 className="text-base font-semibold">Spend by Supplier (Top 10)</h3>
            <p className="text-xs text-muted-foreground">Highest spend suppliers</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={supplierSpendData} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" horizontal={false} />
              <XAxis type="number" stroke="hsl(215 25% 65%)" fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
              <YAxis type="category" dataKey="name" stroke="hsl(215 25% 65%)" fontSize={11} width={100} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
              <Bar dataKey="spend" fill="hsl(213, 94%, 58%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Savings Trend */}
        <Card className="border-border bg-card/40 p-5 backdrop-blur-sm animate-fade-up" style={{ animationDelay: '100ms' }}>
          <div className="mb-4">
            <h3 className="text-base font-semibold">Savings Trend</h3>
            <p className="text-xs text-muted-foreground">Monthly savings achieved</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={spendData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
              <XAxis dataKey="month" stroke="hsl(215 25% 65%)" fontSize={12} />
              <YAxis stroke="hsl(215 25% 65%)" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
              <Bar dataKey="savings" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} name="Savings" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Maverick Spend */}
      <Card className="mb-6 border-border bg-card/40 p-5 backdrop-blur-sm animate-fade-up">
        <div className="mb-4">
          <h3 className="text-base font-semibold">Maverick Spending</h3>
          <p className="text-xs text-muted-foreground">Spend outside approved supplier list</p>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={maverickData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
            <XAxis dataKey="month" stroke="hsl(215 25% 65%)" fontSize={12} />
            <YAxis stroke="hsl(215 25% 65%)" fontSize={12} tickFormatter={(v) => `${v}%`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} formatter={(v) => <span style={{ color: 'hsl(215 25% 65%)' }}>{v}</span>} />
            <Bar dataKey="compliant" stackId="a" fill="hsl(142, 71%, 45%)" name="Compliant" radius={[0, 0, 0, 0]} />
            <Bar dataKey="maverick" stackId="a" fill="hsl(0, 72%, 51%)" name="Maverick" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* AI Insights */}
      <Card className="border-primary/20 bg-primary/5 p-6 backdrop-blur-sm animate-fade-up">
        <div className="mb-4 flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold">AI Spend Insights</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { icon: TrendingUp, text: `Top 5 suppliers represent ${concentration}% of total procurement spend.` },
            { icon: Sparkles, text: `Supplier consolidation could potentially reduce annual spending by $${(savingsOpportunity / 1000).toFixed(0)}K.` },
            { icon: DollarSign, text: `Average monthly spend is $${(avgMonthly / 1000).toFixed(0)}K with an upward trend of 8.4%.` },
            { icon: BarChart3, text: `Maverick spending at 12% — enforcing preferred suppliers could save $18K annually.` },
          ].map((insight, i) => {
            const Icon = insight.icon;
            return (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-border bg-card/40 p-4">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <p className="text-sm text-foreground">{insight.text}</p>
              </div>
            );
          })}
        </div>
      </Card>
    </AppShell>
  );
}
