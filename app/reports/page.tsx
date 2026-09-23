'use client';

import { useState, useMemo } from 'react';
import { Download, FileText, BarChart3, Users, Package, TrendingUp, ShieldAlert, DollarSign, Calendar, Filter } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RiskBadge, StatusBadge, StockBadge, PriorityBadge } from '@/components/shared-badges';
import { suppliers, rfqs, purchaseOrders, inventory, monthlySpend, categorySpend, recommendations } from '@/lib/data';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type ReportType = 'spend' | 'supplier' | 'inventory' | 'risk' | 'rfq' | 'po' | 'recommendations';

const reportTypes: { id: ReportType; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
  { id: 'spend', label: 'Spend Analysis Report', icon: DollarSign, description: 'Monthly spend, savings, and category breakdown' },
  { id: 'supplier', label: 'Supplier Performance Report', icon: Users, description: 'Supplier metrics, scores, and risk levels' },
  { id: 'inventory', label: 'Inventory Status Report', icon: Package, description: 'Stock levels, reorder points, and critical items' },
  { id: 'risk', label: 'Supplier Risk Report', icon: ShieldAlert, description: 'Risk scores, breakdown, and mitigation status' },
  { id: 'rfq', label: 'RFQ Summary Report', icon: FileText, description: 'All RFQs with response rates and status' },
  { id: 'po', label: 'Purchase Order Report', icon: BarChart3, description: 'PO status, delivery tracking, and values' },
  { id: 'recommendations', label: 'AI Recommendations Report', icon: TrendingUp, description: 'All AI-generated recommendations and savings' },
];

function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function downloadJSON(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('spend');
  const [dateRange, setDateRange] = useState('12 Months');

  const report = reportTypes.find((r) => r.id === selectedReport)!;

  const tableData = useMemo(() => {
    switch (selectedReport) {
      case 'spend':
        return {
          headers: ['Month', 'Spend ($)', 'Savings ($)', 'Budget ($)', 'Variance (%)'],
          rows: monthlySpend.map((m) => [
            m.month,
            m.spend,
            m.savings,
            m.budget,
            (((m.spend - m.budget) / m.budget) * 100).toFixed(1),
          ]),
        };
      case 'supplier':
        return {
          headers: ['ID', 'Name', 'Category', 'Spend ($)', 'Performance (%)', 'Delivery (%)', 'Quality (%)', 'Risk Score', 'Risk Level', 'Status'],
          rows: suppliers.map((s) => [s.id, s.name, s.category, s.spend, s.performance, s.deliveryRate, s.qualityScore, s.riskScore, s.riskLevel, s.status]),
        };
      case 'inventory':
        return {
          headers: ['SKU', 'Product', 'Category', 'Current Stock', 'Daily Demand', 'Reorder Point', 'Lead Time (days)', 'Unit Cost ($)', 'Status', 'Supplier'],
          rows: inventory.map((i) => [i.sku, i.product, i.category, i.currentStock, i.dailyDemand, i.reorderPoint, i.leadTime, i.unitCost, i.status, i.supplier]),
        };
      case 'risk':
        return {
          headers: ['ID', 'Name', 'Category', 'Risk Score', 'Risk Level', 'Financial Risk', 'Delivery Risk', 'Quality Risk', 'Price Stability', 'Status'],
          rows: suppliers.map((s) => [s.id, s.name, s.category, s.riskScore, s.riskLevel, s.riskBreakdown.financial, s.riskBreakdown.delivery, s.riskBreakdown.quality, s.riskBreakdown.priceStability, s.status]),
        };
      case 'rfq':
        return {
          headers: ['RFQ ID', 'Product', 'Category', 'Quantity', 'Unit', 'Target Price ($)', 'Deadline', 'Invited', 'Responses', 'Status'],
          rows: rfqs.map((r) => [r.id, r.product, r.category, r.quantity, r.unit, r.targetPrice, r.deadline, r.suppliersInvited, r.responses, r.status]),
        };
      case 'po':
        return {
          headers: ['PO ID', 'Supplier', 'Product', 'Quantity', 'Amount ($)', 'Order Date', 'Delivery Date', 'Status'],
          rows: purchaseOrders.map((p) => [p.id, p.supplier, p.product, p.quantity, p.amount, p.date, p.deliveryDate, p.status]),
        };
      case 'recommendations':
        return {
          headers: ['ID', 'Title', 'Category', 'Priority', 'Impact', 'Confidence (%)', 'Related Supplier'],
          rows: recommendations.map((r) => [r.id, r.title, r.category, r.priority, r.impact, r.confidence, r.relatedSupplier || 'N/A']),
        };
    }
  }, [selectedReport]);

  const summaryStats = useMemo(() => {
    switch (selectedReport) {
      case 'spend':
        return [
          { label: 'Total Spend', value: `$${(monthlySpend.reduce((s, m) => s + m.spend, 0) / 1000000).toFixed(2)}M` },
          { label: 'Total Savings', value: `$${(monthlySpend.reduce((s, m) => s + m.savings, 0) / 1000).toFixed(0)}K` },
          { label: 'Avg Monthly', value: `$${(monthlySpend.reduce((s, m) => s + m.spend, 0) / monthlySpend.length / 1000).toFixed(0)}K` },
          { label: 'Categories', value: categorySpend.length },
        ];
      case 'supplier':
        return [
          { label: 'Total Suppliers', value: suppliers.length },
          { label: 'High Risk', value: suppliers.filter((s) => s.riskLevel === 'HIGH').length },
          { label: 'Preferred', value: suppliers.filter((s) => s.status === 'Preferred').length },
          { label: 'Avg Performance', value: `${(suppliers.reduce((s, sup) => s + sup.performance, 0) / suppliers.length).toFixed(0)}%` },
        ];
      case 'inventory':
        return [
          { label: 'Total Items', value: inventory.length },
          { label: 'Critical', value: inventory.filter((i) => i.status === 'Critical').length },
          { label: 'Low Stock', value: inventory.filter((i) => i.status === 'Low Stock').length },
          { label: 'Overstocked', value: inventory.filter((i) => i.status === 'Overstocked').length },
        ];
      case 'risk':
        return [
          { label: 'High Risk', value: suppliers.filter((s) => s.riskLevel === 'HIGH').length },
          { label: 'Medium Risk', value: suppliers.filter((s) => s.riskLevel === 'MEDIUM').length },
          { label: 'Low Risk', value: suppliers.filter((s) => s.riskLevel === 'LOW').length },
          { label: 'Avg Risk Score', value: (suppliers.reduce((s, sup) => s + sup.riskScore, 0) / suppliers.length).toFixed(0) },
        ];
      case 'rfq':
        return [
          { label: 'Total RFQs', value: rfqs.length },
          { label: 'Open', value: rfqs.filter((r) => r.status === 'Open').length },
          { label: 'Closed', value: rfqs.filter((r) => r.status === 'Closed').length },
          { label: 'Total Invited', value: rfqs.reduce((s, r) => s + r.suppliersInvited, 0) },
        ];
      case 'po':
        return [
          { label: 'Total POs', value: purchaseOrders.length },
          { label: 'Delivered', value: purchaseOrders.filter((p) => p.status === 'Delivered').length },
          { label: 'Pending', value: purchaseOrders.filter((p) => p.status === 'Pending').length },
          { label: 'Total Value', value: `$${(purchaseOrders.reduce((s, p) => s + p.amount, 0) / 1000).toFixed(0)}K` },
        ];
      case 'recommendations':
        return [
          { label: 'Total Recommendations', value: recommendations.length },
          { label: 'High Priority', value: recommendations.filter((r) => r.priority === 'HIGH').length },
          { label: 'Savings Potential', value: `$${(recommendations.reduce((s, r) => s + r.impactValue, 0) / 1000).toFixed(0)}K` },
          { label: 'Avg Confidence', value: `${(recommendations.reduce((s, r) => s + r.confidence, 0) / recommendations.length).toFixed(0)}%` },
        ];
    }
  }, [selectedReport]);

  const handleExportCSV = () => {
    downloadCSV(`procureai-${selectedReport}-${new Date().toISOString().split('T')[0]}.csv`, tableData.headers, tableData.rows);
    toast({ title: 'Report exported', description: 'CSV file downloaded successfully.' });
  };

  const handleExportJSON = () => {
    const data = tableData.rows.map((row) => {
      const obj: Record<string, string | number> = {};
      tableData.headers.forEach((h, i) => { obj[h] = row[i]; });
      return obj;
    });
    downloadJSON(`procureai-${selectedReport}-${new Date().toISOString().split('T')[0]}.json`, data);
    toast({ title: 'Report exported', description: 'JSON file downloaded successfully.' });
  };

  return (
    <AppShell title="Reports">
      {/* Report Type Selector */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {reportTypes.map((r, i) => {
          const Icon = r.icon;
          const active = selectedReport === r.id;
          return (
            <button
              key={r.id}
              onClick={() => setSelectedReport(r.id)}
              className={cn(
                'group flex flex-col gap-2 rounded-xl border p-4 text-left transition-all animate-fade-up',
                active ? 'border-primary/30 bg-primary/5 shadow-lg shadow-primary/5' : 'border-border bg-card/40 backdrop-blur-sm hover:border-primary/20'
              )}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', active ? 'bg-primary/15' : 'bg-secondary/30')}>
                <Icon className={cn('h-4.5 w-4.5', active ? 'text-primary' : 'text-muted-foreground')} />
              </div>
              <p className="text-sm font-semibold">{r.label}</p>
              <p className="text-xs text-muted-foreground">{r.description}</p>
            </button>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryStats?.map((stat, i) => (
          <Card key={i} className="p-4 border-border bg-card/40 backdrop-blur-sm animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-xl font-bold">{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Report Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{report.label}</h2>
          <p className="text-sm text-muted-foreground">{report.description} • {dateRange}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7 Days">7 Days</SelectItem>
              <SelectItem value="30 Days">30 Days</SelectItem>
              <SelectItem value="3 Months">3 Months</SelectItem>
              <SelectItem value="12 Months">12 Months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExportJSON}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> JSON
          </Button>
          <Button size="sm" onClick={handleExportCSV}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <Card className="border-border bg-card/40 backdrop-blur-sm animate-fade-up overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {tableData?.headers.map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData?.rows.map((row, i) => (
                <tr key={i} className="border-b border-border/50 transition-colors hover:bg-primary/5">
                  {row.map((cell, j) => {
                    const header = tableData.headers[j];
                    if (header === 'Risk Level' && typeof cell === 'string') {
                      return <td key={j} className="px-4 py-3"><RiskBadge level={cell as 'HIGH' | 'MEDIUM' | 'LOW'} /></td>;
                    }
                    if (header === 'Status') {
                      if (selectedReport === 'inventory') return <td key={j} className="px-4 py-3"><StockBadge status={cell as 'Healthy' | 'Low Stock' | 'Critical' | 'Overstocked'} /></td>;
                      return <td key={j} className="px-4 py-3"><StatusBadge status={String(cell)} /></td>;
                    }
                    if (header === 'Priority') {
                      return <td key={j} className="px-4 py-3"><PriorityBadge priority={cell as 'HIGH' | 'MEDIUM' | 'LOW'} /></td>;
                    }
                    if (typeof cell === 'number' && header.includes('($)')) {
                      return <td key={j} className="px-4 py-3 text-right font-medium">${(cell / 1000).toFixed(1)}K</td>;
                    }
                    if (typeof cell === 'number' && (header.includes('Spend') || header.includes('Amount'))) {
                      return <td key={j} className="px-4 py-3 text-right font-medium">${cell.toLocaleString()}</td>;
                    }
                    if (typeof cell === 'number') {
                      return <td key={j} className="px-4 py-3 text-right">{cell}</td>;
                    }
                    return <td key={j} className="px-4 py-3 text-sm">{cell}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="mt-3 text-xs text-muted-foreground">
        {tableData?.rows.length} records • Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
    </AppShell>
  );
}
