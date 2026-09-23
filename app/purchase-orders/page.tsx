'use client';

import { useState, useMemo } from 'react';
import { Search, ClipboardList, Calendar, Truck, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/shared-badges';
import { purchaseOrders } from '@/lib/data';
import type { POStatus } from '@/lib/types';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Delivered: CheckCircle2,
  Shipped: Truck,
  Approved: CheckCircle2,
  Pending: Clock,
  Cancelled: XCircle,
};

export default function PurchaseOrdersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    return purchaseOrders.filter((p) => {
      if (search && !p.id.toLowerCase().includes(search.toLowerCase()) && !p.supplier.toLowerCase().includes(search.toLowerCase()) && !p.product.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      return true;
    });
  }, [search, statusFilter]);

  const stats = {
    total: purchaseOrders.length,
    pending: purchaseOrders.filter((p) => p.status === 'Pending').length,
    delivered: purchaseOrders.filter((p) => p.status === 'Delivered').length,
    totalValue: purchaseOrders.reduce((sum, p) => sum + p.amount, 0),
  };

  return (
    <AppShell title="Purchase Orders">
      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total POs', value: stats.total, icon: ClipboardList, color: 'text-primary' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-warning' },
          { label: 'Delivered', value: stats.delivered, icon: CheckCircle2, color: 'text-success' },
          { label: 'Total Value', value: `$${(stats.totalValue / 1000).toFixed(0)}K`, icon: Truck, color: 'text-chart-4' },
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
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search POs..." className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Shipped">Shipped</SelectItem>
            <SelectItem value="Delivered">Delivered</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="mb-3 text-sm text-muted-foreground">{filtered.length} purchase orders found</p>

      {/* Table */}
      <Card className="border-border bg-card/40 backdrop-blur-sm animate-fade-up overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO ID</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Delivery Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const Icon = statusIcons[p.status] || ClipboardList;
                return (
                  <TableRow key={p.id} className="transition-colors hover:bg-primary/5">
                    <TableCell className="font-medium">{p.id}</TableCell>
                    <TableCell>{p.supplier}</TableCell>
                    <TableCell>{p.product}</TableCell>
                    <TableCell className="text-right">{p.quantity.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-medium">${(p.amount / 1000).toFixed(1)}K</TableCell>
                    <TableCell className="text-muted-foreground">{p.date}</TableCell>
                    <TableCell className="text-muted-foreground">{p.deliveryDate}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5" />
                        <StatusBadge status={p.status} />
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-sm text-muted-foreground">No purchase orders found.</p>
          </div>
        )}
      </Card>
    </AppShell>
  );
}
