'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, MapPin, Mail, Phone, Globe, Calendar, Users, Brain, FileText, TrendingUp, Award, ShieldAlert, X } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RiskBadge, StatusBadge, ScoreBar } from '@/components/shared-badges';
import { AIProcessingOverlay } from '@/components/ai-processing';
import { suppliers, categories, locations } from '@/lib/data';
import { analyzeSupplierRisk } from '@/lib/ai';
import type { Supplier } from '@/lib/types';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function SuppliersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [performanceFilter, setPerformanceFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return suppliers.filter((s) => {
      if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.category.toLowerCase().includes(search.toLowerCase())) return false;
      if (riskFilter !== 'all' && s.riskLevel !== riskFilter) return false;
      if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;
      if (locationFilter !== 'all' && s.location !== locationFilter) return false;
      if (performanceFilter === 'high' && s.performance < 85) return false;
      if (performanceFilter === 'medium' && (s.performance < 70 || s.performance >= 85)) return false;
      if (performanceFilter === 'low' && s.performance >= 70) return false;
      return true;
    });
  }, [search, riskFilter, categoryFilter, performanceFilter, locationFilter]);

  const runAIAnalysis = (supplier: Supplier) => {
    setShowAIAnalysis(true);
    setAiResult(null);
    setTimeout(() => {
      const analysis = analyzeSupplierRisk(supplier);
      setAiResult(analysis.explanation);
      setShowAIAnalysis(false);
    }, 2800);
  };

  return (
    <AppShell title="Suppliers">
      {showAIAnalysis && <AIProcessingOverlay title="AI Risk Analysis" onComplete={() => {}} />}

      {/* Search & Filters */}
      <Card className="mb-4 border-border bg-card/40 p-4 backdrop-blur-sm animate-fade-up">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search suppliers by name or category..."
              className="pl-10"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger><SelectValue placeholder="Risk Level" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="HIGH">High Risk</SelectItem>
                <SelectItem value="MEDIUM">Medium Risk</SelectItem>
                <SelectItem value="LOW">Low Risk</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
              <SelectTrigger><SelectValue placeholder="Performance" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Performance</SelectItem>
                <SelectItem value="high">High (85+)</SelectItem>
                <SelectItem value="medium">Medium (70-84)</SelectItem>
                <SelectItem value="low">Low (&lt;70)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger><SelectValue placeholder="Location" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Results count */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{filtered.length} suppliers found</p>
        {(riskFilter !== 'all' || categoryFilter !== 'all' || performanceFilter !== 'all' || locationFilter !== 'all' || search) && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setRiskFilter('all'); setCategoryFilter('all'); setPerformanceFilter('all'); setLocationFilter('all'); }}>
            <X className="mr-1 h-3 w-3" /> Clear filters
          </Button>
        )}
      </div>

      {/* Table */}
      <Card className="border-border bg-card/40 backdrop-blur-sm animate-fade-up overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Spend</TableHead>
                <TableHead className="text-right">Performance</TableHead>
                <TableHead className="text-right">Delivery</TableHead>
                <TableHead className="text-right">Quality</TableHead>
                <TableHead className="text-right">Risk</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow
                  key={s.id}
                  onClick={() => setSelectedSupplier(s)}
                  className="cursor-pointer transition-colors hover:bg-primary/5"
                >
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground">{s.category}</TableCell>
                  <TableCell className="text-right">${(s.spend / 1000).toFixed(0)}K</TableCell>
                  <TableCell className="text-right">
                    <span className={cn('font-medium', s.performance >= 85 ? 'text-success' : s.performance >= 70 ? 'text-warning' : 'text-destructive')}>{s.performance}%</span>
                  </TableCell>
                  <TableCell className="text-right">{s.deliveryRate}%</TableCell>
                  <TableCell className="text-right">{s.qualityScore}%</TableCell>
                  <TableCell className="text-right"><RiskBadge level={s.riskLevel} /></TableCell>
                  <TableCell><StatusBadge status={s.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-sm text-muted-foreground">No suppliers match your filters.</p>
          </div>
        )}
      </Card>

      {/* Supplier Profile Drawer */}
      {selectedSupplier && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setSelectedSupplier(null); setAiResult(null); }} />
          <div className="relative h-full w-full max-w-2xl overflow-y-auto scrollbar-thin border-l border-border bg-card/95 backdrop-blur-xl animate-slide-in-right">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/80 px-6 py-4 backdrop-blur-xl">
              <div>
                <h2 className="text-xl font-bold">{selectedSupplier.name}</h2>
                <p className="text-sm text-muted-foreground">{selectedSupplier.id} • {selectedSupplier.category}</p>
              </div>
              <button onClick={() => { setSelectedSupplier(null); setAiResult(null); }} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary/50 hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Risk & Status */}
              <div className="flex flex-wrap items-center gap-3">
                <RiskBadge level={selectedSupplier.riskLevel} />
                <StatusBadge status={selectedSupplier.status} />
                <span className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{selectedSupplier.location}</span>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Total Spend', value: `$${(selectedSupplier.spend / 1000).toFixed(0)}K` },
                  { label: 'Performance', value: `${selectedSupplier.performance}%` },
                  { label: 'Delivery Rate', value: `${selectedSupplier.deliveryRate}%` },
                  { label: 'Quality Score', value: `${selectedSupplier.qualityScore}%` },
                ].map((m) => (
                  <div key={m.label} className="rounded-xl border border-border bg-secondary/20 p-3">
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <p className="mt-1 text-lg font-bold">{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Company Info */}
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Company Information</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" />{selectedSupplier.contactEmail}</div>
                  <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" />{selectedSupplier.contactPhone}</div>
                  <div className="flex items-center gap-2 text-sm"><Globe className="h-4 w-4 text-muted-foreground" />{selectedSupplier.website}</div>
                  <div className="flex items-center gap-2 text-sm"><Calendar className="h-4 w-4 text-muted-foreground" />Founded {selectedSupplier.founded}</div>
                  <div className="flex items-center gap-2 text-sm"><Users className="h-4 w-4 text-muted-foreground" />{selectedSupplier.employees} employees</div>
                  <div className="flex items-center gap-2 text-sm"><TrendingUp className="h-4 w-4 text-muted-foreground" />Revenue: {selectedSupplier.annualRevenue}</div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedSupplier.certifications.map((c) => (
                    <span key={c} className="flex items-center gap-1 rounded-full border border-border bg-secondary/30 px-2.5 py-1 text-xs">
                      <Award className="h-3 w-3 text-primary" />{c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Risk Breakdown */}
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Risk Breakdown</h3>
                <div className="space-y-3">
                  <ScoreBar label="Financial Risk" value={selectedSupplier.riskBreakdown.financial} />
                  <ScoreBar label="Delivery Risk" value={selectedSupplier.riskBreakdown.delivery} />
                  <ScoreBar label="Quality Risk" value={selectedSupplier.riskBreakdown.quality} />
                  <ScoreBar label="Price Stability" value={selectedSupplier.riskBreakdown.priceStability} />
                </div>
              </div>

              {/* AI Analysis */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">AI Supplier Analysis</h3>
                </div>
                {aiResult ? (
                  <p className="text-sm text-foreground animate-fade-in">{aiResult}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">{selectedSupplier.aiAnalysis}</p>
                )}
                <Button onClick={() => runAIAnalysis(selectedSupplier)} size="sm" className="mt-3">
                  <ShieldAlert className="mr-1.5 h-3.5 w-3.5" /> Run AI Risk Analysis
                </Button>
              </div>

              {/* Recent Transactions */}
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recent Transactions</h3>
                <div className="space-y-2">
                  {selectedSupplier.recentTransactions.map((t) => (
                    <div key={t.id} className="flex items-center justify-between rounded-lg border border-border bg-secondary/20 p-3">
                      <div>
                        <p className="text-sm font-medium">{t.product}</p>
                        <p className="text-xs text-muted-foreground">{t.id} • {t.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">${(t.amount / 1000).toFixed(1)}K</p>
                        <StatusBadge status={t.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent RFQs */}
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recent RFQs</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedSupplier.recentRFQs.map((r) => (
                    <button key={r} onClick={() => router.push('/rfqs')} className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/20 px-3 py-1.5 text-sm transition-colors hover:border-primary/30 hover:bg-primary/5">
                      <FileText className="h-3.5 w-3.5 text-primary" />{r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'On-Time Delivery', value: `${selectedSupplier.onTimeDelivery}%` },
                  { label: 'Total Orders', value: selectedSupplier.totalOrders },
                  { label: 'Active Contracts', value: selectedSupplier.activeContracts },
                  { label: 'Payment Terms', value: selectedSupplier.paymentTerms },
                ].map((m) => (
                  <div key={m.label} className="rounded-xl border border-border bg-secondary/20 p-3">
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <p className="mt-1 text-sm font-bold">{m.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
