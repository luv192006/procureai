'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, TrendingDown, Brain, ArrowRight, DollarSign, Gauge, Sparkles, LineChart as LineChartIcon } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { priceForecasts } from '@/lib/data';
import type { PriceForecast } from '@/lib/types';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { cn } from '@/lib/utils';

const tooltipStyle = {
  backgroundColor: 'hsl(222 40% 8% / 0.95)',
  border: '1px solid hsl(222 30% 18%)',
  borderRadius: '0.5rem',
  fontSize: '12px',
  color: 'hsl(210 40% 98%)',
};

export default function PriceForecastPage() {
  const router = useRouter();
  const [selectedMaterial, setSelectedMaterial] = useState<string>('Steel');

  const forecast = useMemo(() => priceForecasts.find((f) => f.material === selectedMaterial)!, [selectedMaterial]);
  const isIncrease = forecast.expectedChange > 0;

  return (
    <AppShell title="Price Forecast">
      {/* Material Selector */}
      <div className="mb-4 flex flex-wrap gap-2">
        {priceForecasts.map((f) => (
          <Button
            key={f.material}
            variant={selectedMaterial === f.material ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedMaterial(f.material)}
          >
            {f.material}
          </Button>
        ))}
      </div>

      {/* Price Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Current Price', value: `₹${forecast.currentPrice}${forecast.unit}`, icon: DollarSign, color: 'text-primary' },
          { label: '30-Day Forecast', value: `₹${forecast.forecast30Day}${forecast.unit}`, icon: TrendingUp, color: isIncrease ? 'text-destructive' : 'text-success' },
          { label: 'Expected Change', value: `${isIncrease ? '+' : ''}${forecast.expectedChange}%`, icon: isIncrease ? TrendingUp : TrendingDown, color: isIncrease ? 'text-destructive' : 'text-success' },
          { label: 'Confidence', value: `${forecast.confidence}%`, icon: Gauge, color: 'text-chart-4' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-5 border-border bg-card/40 backdrop-blur-sm animate-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/30">
                  <Icon className={`h-5 w-5 ${s.color}`} />
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-2xl font-bold">{s.value}</p>
            </Card>
          );
        })}
      </div>

      {/* Price Chart */}
      <Card className="mb-6 border-border bg-card/40 p-5 backdrop-blur-sm animate-fade-up">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">{forecast.material} Price History & Forecast</h3>
            <p className="text-xs text-muted-foreground">Historical prices with 30-day AI prediction</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> Historical</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-chart-4" /> Predicted</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-chart-4/40" /> Confidence</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={forecast.history} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(280, 65%, 60%)" stopOpacity={0.15} />
                <stop offset="100%" stopColor="hsl(280, 65%, 60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
            <XAxis dataKey="month" stroke="hsl(215 25% 65%)" fontSize={12} />
            <YAxis stroke="hsl(215 25% 65%)" fontSize={12} tickFormatter={(v) => `₹${v}`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `₹${v}${forecast.unit}`} />
            {/* Confidence range */}
            <Area type="monotone" dataKey="upper" stroke="none" fill="url(#confGrad)" name="Upper bound" />
            <Area type="monotone" dataKey="lower" stroke="none" fill="hsl(222 40% 8%)" name="Lower bound" />
            {/* Historical line */}
            <Line type="monotone" dataKey="price" stroke="hsl(213, 94%, 58%)" strokeWidth={2} dot={{ r: 3 }} name="Price" />
            {/* Reference line for current */}
            <ReferenceLine y={forecast.currentPrice} stroke="hsl(38, 92%, 50%)" strokeDasharray="3 3" label={{ value: 'Current', position: 'insideTopRight', fill: 'hsl(38, 92%, 50%)', fontSize: 11 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      {/* AI Recommendation */}
      <Card className="mb-6 border-primary/20 bg-primary/5 p-6 backdrop-blur-sm animate-fade-up">
        <div className="mb-3 flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold">AI Price Recommendation</h3>
        </div>
        <p className="mb-4 text-sm text-foreground">{forecast.recommendation}</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline">
            <LineChartIcon className="mr-1.5 h-3.5 w-3.5" /> View Forecast Details
          </Button>
          <Button size="sm" onClick={() => router.push('/rfqs')}>
            <ArrowRight className="mr-1.5 h-3.5 w-3.5" /> Create Purchase Plan
          </Button>
        </div>
      </Card>

      {/* All Materials Summary */}
      <Card className="border-border bg-card/40 p-5 backdrop-blur-sm animate-fade-up">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-base font-semibold">All Material Forecasts</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {priceForecasts.map((f) => {
            const up = f.expectedChange > 0;
            return (
              <button
                key={f.material}
                onClick={() => setSelectedMaterial(f.material)}
                className={cn(
                  'flex items-center justify-between rounded-xl border p-4 text-left transition-all hover:border-primary/30',
                  selectedMaterial === f.material ? 'border-primary/30 bg-primary/5' : 'border-border bg-secondary/20'
                )}
              >
                <div>
                  <p className="text-sm font-semibold">{f.material}</p>
                  <p className="text-xs text-muted-foreground">₹{f.currentPrice}{f.unit} → ₹{f.forecast30Day}{f.unit}</p>
                </div>
                <div className="text-right">
                  <span className={cn('flex items-center gap-1 text-sm font-bold', up ? 'text-destructive' : 'text-success')}>
                    {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    {up ? '+' : ''}{f.expectedChange}%
                  </span>
                  <p className="text-xs text-muted-foreground">{f.confidence}% conf.</p>
                </div>
              </button>
            );
          })}
        </div>
      </Card>
    </AppShell>
  );
}
