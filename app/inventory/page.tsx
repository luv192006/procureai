'use client';

import { useState, useMemo } from 'react';
import { Search, Package, Brain, AlertTriangle, TrendingDown, Boxes, Zap } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StockBadge } from '@/components/shared-badges';
import { AIProcessingOverlay } from '@/components/ai-processing';
import { inventory } from '@/lib/data';
import { predictInventory } from '@/lib/ai';
import type { InventoryItem } from '@/lib/types';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showAI, setShowAI] = useState(false);
  const [prediction, setPrediction] = useState<{ prediction: string; recommendation: string } | null>(null);

  const categories = useMemo(() => Array.from(new Set(inventory.map((i) => i.category))), []);

  const filtered = useMemo(() => {
    return inventory.filter((i) => {
      if (search && !i.product.toLowerCase().includes(search.toLowerCase()) && !i.sku.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== 'all' && i.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && i.category !== categoryFilter) return false;
      return true;
    });
  }, [search, statusFilter, categoryFilter]);

  const stats = {
    total: inventory.length,
    critical: inventory.filter((i) => i.status === 'Critical').length,
    lowStock: inventory.filter((i) => i.status === 'Low Stock').length,
    overstocked: inventory.filter((i) => i.status === 'Overstocked').length,
  };

  const generatePrediction = (item: InventoryItem) => {
    setShowAI(true);
    setPrediction(null);
    setTimeout(() => {
      const result = predictInventory(item);
      setPrediction(result);
      setShowAI(false);
    }, 2500);
  };

  return (
    <AppShell title="Inventory Intelligence">
      {showAI && <AIProcessingOverlay title="AI Demand Prediction" onComplete={() => {}} />}

      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total Items', value: stats.total, icon: Package, color: 'text-primary' },
          { label: 'Critical', value: stats.critical, icon: AlertTriangle, color: 'text-destructive' },
          { label: 'Low Stock', value: stats.lowStock, icon: TrendingDown, color: 'text-warning' },
          { label: 'Overstocked', value: stats.overstocked, icon: Boxes, color: 'text-chart-4' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="flex items-center gap-3 border-border bg-card/40 p-4 backdrop-blur-sm animate-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/30">
                <Icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold">{s.value}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search inventory..." className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Healthy">Healthy</SelectItem>
            <SelectItem value="Low Stock">Low Stock</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
            <SelectItem value="Overstocked">Overstocked</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <p className="mb-3 text-sm text-muted-foreground">{filtered.length} items found</p>

      {/* Table */}
      <Card className="border-border bg-card/40 backdrop-blur-sm animate-fade-up overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Current Stock</TableHead>
                <TableHead className="text-right">Daily Demand</TableHead>
                <TableHead className="text-right">Reorder Point</TableHead>
                <TableHead className="text-right">Lead Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">AI Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((i) => (
                <TableRow key={i.id} className="transition-colors hover:bg-primary/5">
                  <TableCell>
                    <p className="font-medium">{i.product}</p>
                    <p className="text-xs text-muted-foreground">{i.sku}</p>
                  </TableCell>
                  <TableCell className="text-right">{i.currentStock.toLocaleString()} {i.unit}</TableCell>
                  <TableCell className="text-right">{i.dailyDemand}/day</TableCell>
                  <TableCell className="text-right text-muted-foreground">{i.reorderPoint.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{i.leadTime} days</TableCell>
                  <TableCell><StockBadge status={i.status} /></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedItem(i); setPrediction(null); }}>
                      <Brain className="mr-1 h-3.5 w-3.5 text-primary" /> Predict
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-sm text-muted-foreground">No inventory items found.</p>
          </div>
        )}
      </Card>

      {/* AI Prediction Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => { if (!open) setSelectedItem(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" /> AI Demand Prediction
            </DialogTitle>
            <DialogDescription>
              {selectedItem?.product} ({selectedItem?.sku})
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              {/* Current stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-border bg-secondary/20 p-3">
                  <p className="text-xs text-muted-foreground">Current Stock</p>
                  <p className="text-lg font-bold">{selectedItem.currentStock.toLocaleString()} {selectedItem.unit}</p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/20 p-3">
                  <p className="text-xs text-muted-foreground">Daily Demand</p>
                  <p className="text-lg font-bold">{selectedItem.dailyDemand}/day</p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/20 p-3">
                  <p className="text-xs text-muted-foreground">Lead Time</p>
                  <p className="text-lg font-bold">{selectedItem.leadTime} days</p>
                </div>
              </div>

              {prediction ? (
                <div className="space-y-3 animate-fade-in">
                  <div className={cn('rounded-xl border p-4', selectedItem.status === 'Critical' ? 'border-destructive/30 bg-destructive/5' : selectedItem.status === 'Low Stock' ? 'border-warning/30 bg-warning/5' : 'border-primary/30 bg-primary/5')}>
                    <div className="mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <p className="text-sm font-semibold">AI Prediction</p>
                    </div>
                    <p className="text-sm text-foreground">{prediction.prediction}</p>
                  </div>
                  <div className="rounded-xl border border-success/30 bg-success/5 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Package className="h-4 w-4 text-success" />
                      <p className="text-sm font-semibold">Reorder Recommendation</p>
                    </div>
                    <p className="text-sm text-foreground">{prediction.recommendation}</p>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">Analyzing demand patterns...</p>
                </div>
              )}

              {!prediction && (
                <Button onClick={() => generatePrediction(selectedItem)} className="w-full">
                  <Brain className="mr-1.5 h-4 w-4" /> Generate Reorder Recommendation
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
