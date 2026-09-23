'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  FileText,
  Calendar,
  Users,
  ArrowRight,
  Scale,
  Download,
  Eye,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  Sparkles,
  Send,
  Building2,
} from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/shared-badges';
import { getStoredRFQs, saveStoredRFQs, addNotification } from '@/lib/rfq-storage';
import { generateRFQPDF } from '@/lib/pdf-generator';
import type { RFQ, RFQStatus } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RFQCreateModal } from '@/components/rfq-create-modal';
import { RFQPDFModal } from '@/components/rfq-pdf-modal';
import { toast } from '@/hooks/use-toast';

export default function RFQsPage() {
  const router = useRouter();
  const [rfqList, setRfqList] = useState<RFQ[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateWizard, setShowCreateWizard] = useState(false);

  // PDF Preview State
  const [selectedPDFRfq, setSelectedPDFRfq] = useState<RFQ | null>(null);
  const [showPDFModal, setShowPDFModal] = useState(false);

  useEffect(() => {
    setRfqList(getStoredRFQs());
  }, []);

  const handleCreated = (newRFQ: RFQ) => {
    const updated = [newRFQ, ...rfqList];
    setRfqList(updated);
    saveStoredRFQs(updated);
  };

  const handleDownloadPDF = (rfq: RFQ, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { blob, filename } = generateRFQPDF(rfq);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: 'PDF Downloaded', description: `${filename} downloaded successfully.` });
    } catch {
      toast({ title: 'Download failed', variant: 'destructive' });
    }
  };

  const handlePreviewPDF = (rfq: RFQ, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPDFRfq(rfq);
    setShowPDFModal(true);
  };

  const filtered = rfqList.filter((r) => {
    if (
      search &&
      !r.id.toLowerCase().includes(search.toLowerCase()) &&
      !r.product.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    return true;
  });

  // Calculate KPIs
  const totalCount = rfqList.length;
  const activeCount = rfqList.filter((r) => r.status === 'Sent' || r.status === 'Open' || r.status === 'Viewed').length;
  const responsesReceivedCount = rfqList.filter((r) => r.status === 'Responses Received' || r.responses > 0).length;
  const awardedCount = rfqList.filter((r) => r.status === 'Awarded' || r.status === 'Closed').length;

  return (
    <AppShell title="RFQ Automation & Tracking Dashboard">
      {/* KPI Stats Widgets */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4 animate-fade-up">
        <Card className="border-border bg-card/40 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total RFQs</p>
              <h3 className="mt-1 text-2xl font-bold">{totalCount}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="border-border bg-card/40 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Active & Sent</p>
              <h3 className="mt-1 text-2xl font-bold text-info">{activeCount}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10 text-info">
              <Send className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="border-border bg-card/40 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Responses Received</p>
              <h3 className="mt-1 text-2xl font-bold text-warning">{responsesReceivedCount}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 text-warning">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="border-border bg-card/40 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Awarded / Closed</p>
              <h3 className="mt-1 text-2xl font-bold text-success">{awardedCount}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Action Header & Search */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by RFQ ID or product name..."
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Filter Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Sent">Sent</SelectItem>
              <SelectItem value="Viewed">Viewed</SelectItem>
              <SelectItem value="Responses Received">Responses Received</SelectItem>
              <SelectItem value="Under Review">Under Review</SelectItem>
              <SelectItem value="Awarded">Awarded</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={() => router.push('/supplier-portal')}
            variant="outline"
            className="gap-1.5"
          >
            <Building2 className="h-4 w-4 text-primary" /> Supplier Portal
          </Button>

          <Button onClick={() => setShowCreateWizard(true)} className="gap-1.5 shadow-md shadow-primary/20">
            <Sparkles className="h-4 w-4" /> Create RFQ (AI Wizard)
          </Button>
        </div>
      </div>

      {/* Main RFQ Table */}
      <Card className="border-border bg-card/40 backdrop-blur-sm animate-fade-up overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>RFQ ID</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead className="text-center">Invited</TableHead>
                <TableHead className="text-center">Responses</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => {
                const isExpiring = new Date(r.deadline).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;
                return (
                  <TableRow
                    key={r.id}
                    onClick={() => router.push(`/rfqs/${r.id}`)}
                    className="cursor-pointer transition-colors hover:bg-primary/5"
                  >
                    <TableCell className="font-medium text-primary">{r.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{r.product}</p>
                        <p className="text-xs text-muted-foreground">{r.category}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {r.quantity.toLocaleString()} {r.unit}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{r.deadline}</span>
                        {isExpiring && (
                          <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-bold text-destructive">
                            Soon
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium">{r.suppliersInvited}</TableCell>
                    <TableCell className="text-center font-semibold text-warning">{r.responses}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handlePreviewPDF(r, e)}
                          title="Preview Document"
                          className="h-8 px-2"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDownloadPDF(r, e)}
                          title="Download PDF"
                          className="h-8 px-2"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/quotations?rfqId=${r.id}`);
                          }}
                          className="h-8 text-xs gap-1"
                        >
                          <Scale className="h-3.5 w-3.5" /> Compare
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-sm text-muted-foreground">No matching RFQs found.</p>
          </div>
        )}
      </Card>

      {/* RFQ Creation Wizard Modal */}
      <RFQCreateModal
        open={showCreateWizard}
        onOpenChange={setShowCreateWizard}
        onCreated={handleCreated}
      />

      {/* RFQ PDF Preview Modal */}
      <RFQPDFModal
        rfq={selectedPDFRfq}
        open={showPDFModal}
        onOpenChange={setShowPDFModal}
      />
    </AppShell>
  );
}
