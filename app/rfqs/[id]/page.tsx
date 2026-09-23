'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Download,
  Eye,
  FileText,
  Send,
  CheckCircle2,
  AlertCircle,
  Building2,
  Scale,
  DollarSign,
  User,
  Mail,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge, RiskBadge } from '@/components/shared-badges';
import { getStoredRFQs, getStoredQuotations } from '@/lib/rfq-storage';
import { generateRFQPDF } from '@/lib/pdf-generator';
import type { RFQ, Quotation, RFQStatus } from '@/lib/types';
import { RFQPDFModal } from '@/components/rfq-pdf-modal';
import { toast } from '@/hooks/use-toast';

export default function RFQDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rfqId = params.id as string;

  const [rfq, setRfq] = useState<RFQ | null>(null);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [showPDFModal, setShowPDFModal] = useState(false);

  useEffect(() => {
    const list = getStoredRFQs();
    const found = list.find((r) => r.id === rfqId);
    if (found) {
      setRfq(found);
      const quotes = getStoredQuotations().filter((q) => q.rfqId === rfqId);
      setQuotations(quotes);
    }
  }, [rfqId]);

  if (!rfq) {
    return (
      <AppShell title="RFQ Details">
        <div className="p-12 text-center">
          <p className="text-muted-foreground">RFQ not found.</p>
          <Button onClick={() => router.push('/rfqs')} className="mt-4">
            Back to RFQs List
          </Button>
        </div>
      </AppShell>
    );
  }

  const handleDownloadPDF = () => {
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
      toast({ title: 'PDF Downloaded', description: `${filename} saved successfully.` });
    } catch {
      toast({ title: 'Download failed', variant: 'destructive' });
    }
  };

  const statusSteps: { key: RFQStatus; label: string; desc: string }[] = [
    { key: 'Draft', label: '1. Draft Created', desc: 'Requirements formulated & specs defined' },
    { key: 'Sent', label: '2. RFQ Dispatched', desc: `Sent to ${rfq.suppliersInvited} invited suppliers` },
    { key: 'Viewed', label: '3. Viewed by Suppliers', desc: `${rfq.viewCount || 8} portal views logged` },
    { key: 'Responses Received', label: '4. Responses Received', desc: `${quotations.length} quotations submitted` },
    { key: 'Under Review', label: '5. AI Under Review', desc: 'Evaluating price, lead time & risk' },
    { key: 'Awarded', label: '6. Closed / Awarded', desc: 'Contract awarded & PO generated' },
  ];

  const getStepStatusIndex = (st: RFQStatus) => {
    switch (st) {
      case 'Draft': return 0;
      case 'Sent': return 1;
      case 'Viewed': return 2;
      case 'Responses Received': return 3;
      case 'Under Review': return 4;
      case 'Closed':
      case 'Awarded': return 5;
      default: return 1;
    }
  };

  const currentStepIndex = getStepStatusIndex(rfq.status);

  return (
    <AppShell title={`RFQ Tracking — ${rfq.id}`}>
      {/* Top Header Controls */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between animate-fade-up">
        <Button variant="ghost" onClick={() => router.push('/rfqs')} className="w-fit gap-1 text-xs">
          <ArrowLeft className="h-4 w-4" /> Back to RFQ Dashboard
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowPDFModal(true)} className="gap-1.5">
            <Eye className="h-4 w-4" /> Preview PDF
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF} className="gap-1.5">
            <Download className="h-4 w-4" /> Download PDF
          </Button>
          <Button onClick={() => router.push(`/quotations?rfqId=${rfq.id}`)} className="gap-1.5">
            <Scale className="h-4 w-4" /> Compare Quotations ({quotations.length})
          </Button>
        </div>
      </div>

      {/* Overview Header Card */}
      <Card className="mb-6 border-border bg-card/40 p-6 backdrop-blur-sm animate-fade-up">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold">{rfq.product}</h2>
              <StatusBadge status={rfq.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{rfq.description || 'No additional description.'}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Estimated Total Budget</p>
            <p className="text-2xl font-bold text-primary">
              ${((rfq.budget || rfq.targetPrice * rfq.quantity)).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border/60 pt-4 sm:grid-cols-4 text-xs">
          <div><p className="text-muted-foreground">Category</p><p className="font-semibold text-sm">{rfq.category}</p></div>
          <div><p className="text-muted-foreground">Quantity & Unit</p><p className="font-semibold text-sm">{rfq.quantity.toLocaleString()} {rfq.unit}</p></div>
          <div><p className="text-muted-foreground">Target Unit Price</p><p className="font-semibold text-sm">${rfq.targetPrice}</p></div>
          <div><p className="text-muted-foreground">Submission Deadline</p><p className="font-semibold text-sm">{rfq.deadline}</p></div>
        </div>
      </Card>

      {/* Real-Time Status Lifecycle Stepper */}
      <Card className="mb-6 border-border bg-card/40 p-6 backdrop-blur-sm animate-fade-up">
        <h3 className="mb-4 text-base font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" /> Real-Time RFQ Lifecycle Tracker
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
          {statusSteps.map((step, idx) => {
            const isCompleted = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <div
                key={step.key}
                className={`relative rounded-xl border p-3 transition-all ${
                  isCurrent
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : isCompleted
                    ? 'border-success/30 bg-success/5'
                    : 'border-border/50 bg-secondary/10 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                      isCompleted ? 'bg-success text-white' : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? '✓' : idx + 1}
                  </span>
                  <p className="text-xs font-bold truncate">{step.label}</p>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Two Column Section: Specifications & Dispatched Suppliers */}
      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Specifications Matrix */}
        <Card className="border-border bg-card/40 p-6 backdrop-blur-sm">
          <h3 className="mb-3 text-base font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" /> Technical Specifications Matrix
          </h3>
          <div className="space-y-2 text-xs">
            {rfq.specifications && typeof rfq.specifications === 'object' ? (
              Object.entries(rfq.specifications).map(([key, val]) => (
                <div key={key} className="flex justify-between border-b border-border/40 py-2">
                  <span className="font-medium text-muted-foreground">{key}</span>
                  <span className="font-semibold text-foreground">{String(val)}</span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">Standard technical specifications applied.</p>
            )}
            <div className="flex justify-between border-b border-border/40 py-2">
              <span className="font-medium text-muted-foreground">Payment Terms</span>
              <span className="font-semibold">{rfq.paymentTerms || 'Net 30 Days'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="font-medium text-muted-foreground">Delivery Location</span>
              <span className="font-semibold">{rfq.deliveryLocation || 'Mumbai Central Warehouse'}</span>
            </div>
          </div>
        </Card>

        {/* Invited / Sent Suppliers Log */}
        <Card className="border-border bg-card/40 p-6 backdrop-blur-sm">
          <h3 className="mb-3 text-base font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> Supplier Dispatch Log
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              {rfq.sentHistory?.length || rfq.suppliers.length} Invited
            </span>
          </h3>

          <div className="space-y-2.5 max-h-56 overflow-y-auto scrollbar-thin">
            {(rfq.sentHistory || []).map((history, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-lg border border-border/60 p-2.5 bg-secondary/20 text-xs">
                <div>
                  <p className="font-semibold">{history.supplierName}</p>
                  <p className="text-[10px] text-muted-foreground">{history.email}</p>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">
                    {history.status}
                  </span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{history.sentAt.split('T')[0]}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Received Quotations Section */}
      <Card className="border-border bg-card/40 p-6 backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary" /> Received Quotations ({quotations.length})
          </h3>
          <Button onClick={() => router.push(`/quotations?rfqId=${rfq.id}`)} size="sm">
            Launch AI Comparison Engine
          </Button>
        </div>

        {quotations.length > 0 ? (
          <div className="space-y-3">
            {quotations.map((q) => (
              <div key={q.id} className="flex items-center justify-between rounded-xl border border-border p-3.5 bg-secondary/20 text-xs">
                <div>
                  <p className="text-sm font-bold">{q.supplierName}</p>
                  <p className="text-muted-foreground mt-0.5">
                    Lead time: <strong>{q.deliveryDays} days</strong> | Terms: {q.paymentTerms}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Quoted Unit Price</p>
                    <p className="text-sm font-bold text-foreground">${q.price}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Overall AI Score</p>
                    <span className="text-sm font-bold text-success">{q.overallScore}/100</span>
                  </div>
                  <RiskBadge level={q.risk} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center border border-dashed border-border rounded-xl">
            <p className="text-sm text-muted-foreground">No quotations submitted yet for this RFQ.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/supplier-portal?rfqId=${rfq.id}`)}
              className="mt-3 text-xs"
            >
              Submit Quote via Supplier Portal
            </Button>
          </div>
        )}
      </Card>

      {/* PDF Modal */}
      <RFQPDFModal
        rfq={rfq}
        open={showPDFModal}
        onOpenChange={setShowPDFModal}
      />
    </AppShell>
  );
}
