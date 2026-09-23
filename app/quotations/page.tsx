'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Brain,
  Trophy,
  Scale,
  CheckCircle2,
  Zap,
  Building2,
  DollarSign,
  Award,
  Clock,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RiskBadge, StatusBadge } from '@/components/shared-badges';
import { AIProcessingOverlay } from '@/components/ai-processing';
import { getStoredRFQs, getStoredQuotations, saveStoredRFQs, saveStoredQuotations, addNotification } from '@/lib/rfq-storage';
import { evaluateQuotations } from '@/lib/ai';
import type { QuotationEvaluation } from '@/lib/ai';
import type { RFQ, Quotation } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export default function QuotationsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialRfqId = searchParams.get('rfqId') || '';

  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [selectedRFQId, setSelectedRFQId] = useState(initialRfqId);
  const [showAI, setShowAI] = useState(false);
  const [evaluation, setEvaluation] = useState<QuotationEvaluation | null>(null);

  useEffect(() => {
    const stored = getStoredRFQs();
    setRfqs(stored);
    if (stored.length > 0 && !selectedRFQId) {
      setSelectedRFQId(stored[0].id);
    }
  }, [selectedRFQId]);

  const rfq = useMemo(() => rfqs.find((r) => r.id === selectedRFQId) || null, [rfqs, selectedRFQId]);
  const quotes = useMemo(() => {
    if (!selectedRFQId) return [];
    return getStoredQuotations().filter((q) => q.rfqId === selectedRFQId);
  }, [selectedRFQId]);

  const runAIEvaluation = () => {
    setShowAI(true);
    setEvaluation(null);
    setTimeout(() => {
      const result = evaluateQuotations(selectedRFQId);
      setEvaluation(result);
      setShowAI(false);
      toast({ title: 'AI Evaluation Complete', description: 'Multi-criteria weighted evaluation finished.' });
    }, 2000);
  };

  const handleAwardContract = (quotation: Quotation) => {
    if (!rfq) return;

    // Update RFQ status to Awarded / Closed
    const updatedRfqs = rfqs.map((r) => {
      if (r.id === rfq.id) {
        return {
          ...r,
          status: 'Awarded' as const,
          timeline: [
            ...(r.timeline || []),
            {
              id: `t-award-${Date.now()}`,
              status: 'Awarded' as const,
              timestamp: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
              title: `Contract Awarded to ${quotation.supplierName}`,
              description: `Awarded at $${quotation.price}/unit (${quotation.deliveryDays} days lead time)`,
              actor: 'Procurement Director',
            },
          ],
        };
      }
      return r;
    });

    setRfqs(updatedRfqs);
    saveStoredRFQs(updatedRfqs);

    // Update quote status
    const allQuotes = getStoredQuotations();
    const updatedQuotes = allQuotes.map((q) => {
      if (q.id === quotation.id) return { ...q, status: 'Awarded' as const };
      if (q.rfqId === rfq.id) return { ...q, status: 'Rejected' as const };
      return q;
    });
    saveStoredQuotations(updatedQuotes);

    // Notification
    addNotification({
      type: 'rfq',
      title: `Contract Awarded for ${rfq.id}`,
      description: `Awarded to ${quotation.supplierName} for $${(quotation.price * rfq.quantity).toLocaleString()}.`,
      link: `/rfqs/${rfq.id}`,
    });

    toast({
      title: 'Contract Awarded Successfully!',
      description: `Purchase order initiated for ${quotation.supplierName}.`,
    });
  };

  return (
    <AppShell title="Quotation Comparison & Contract Awarding Engine">
      {showAI && <AIProcessingOverlay title="AI Multi-Criteria Quotation Evaluation" onComplete={() => {}} />}

      {/* RFQ Selector Card */}
      <Card className="mb-6 border-border bg-card/40 p-5 backdrop-blur-sm animate-fade-up">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 max-w-md">
            <label className="mb-1.5 block text-xs font-semibold uppercase text-muted-foreground">Select Active RFQ</label>
            <Select value={selectedRFQId} onValueChange={(v) => { setSelectedRFQId(v); setEvaluation(null); }}>
              <SelectTrigger><SelectValue placeholder="Select RFQ" /></SelectTrigger>
              <SelectContent>
                {rfqs.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.id} — {r.product} ({r.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/supplier-portal?rfqId=${selectedRFQId}`)}
              className="gap-1.5"
            >
              <Building2 className="h-4 w-4 text-primary" /> Submit Quote (Portal)
            </Button>
            <Button onClick={runAIEvaluation} disabled={quotes.length === 0} className="gap-2 shadow-md shadow-primary/20">
              <Brain className="h-4 w-4" /> AI Evaluate Quotations
            </Button>
          </div>
        </div>

        {rfq && (
          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border/60 pt-4 sm:grid-cols-5 text-xs">
            <div><p className="text-muted-foreground">Product</p><p className="font-semibold text-sm">{rfq.product}</p></div>
            <div><p className="text-muted-foreground">Quantity</p><p className="font-semibold text-sm">{rfq.quantity.toLocaleString()} {rfq.unit}</p></div>
            <div><p className="text-muted-foreground">Target Unit Price</p><p className="font-semibold text-sm">${rfq.targetPrice}</p></div>
            <div><p className="text-muted-foreground">RFQ Status</p><StatusBadge status={rfq.status} /></div>
            <div><p className="text-muted-foreground">Deadline</p><p className="font-semibold text-sm">{rfq.deadline}</p></div>
          </div>
        )}
      </Card>

      {/* Side-By-Side Quotation Comparison Matrix */}
      {quotes.length > 0 ? (
        <Card className="mb-6 border-border bg-card/40 backdrop-blur-sm animate-fade-up overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier Name</TableHead>
                  <TableHead className="text-right">Unit Price ($)</TableHead>
                  <TableHead className="text-right">Total Amount ($)</TableHead>
                  <TableHead className="text-right">Lead Time</TableHead>
                  <TableHead className="text-right">Quality Score</TableHead>
                  <TableHead>Payment Terms</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead className="text-right">AI Score</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((q) => {
                  const isAwarded = rfq?.status === 'Awarded' && q.status === 'Awarded';
                  const isRecommended = evaluation?.recommendedSupplier.supplierName === q.supplierName;
                  return (
                    <TableRow
                      key={q.id}
                      className={cn(
                        'transition-colors hover:bg-primary/5',
                        isAwarded && 'bg-success/15 font-semibold',
                        isRecommended && !isAwarded && 'bg-success/5'
                      )}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {isRecommended && <Trophy className="h-4 w-4 text-warning shrink-0" />}
                          <span>{q.supplierName}</span>
                          {isAwarded && (
                            <span className="rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-bold text-success">
                              Contract Awarded
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">${q.price}</TableCell>
                      <TableCell className="text-right font-medium">
                        ${(q.totalAmount || q.price * (rfq?.quantity || 1000)).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">{q.deliveryDays} days</TableCell>
                      <TableCell className="text-right">{q.qualityScore}%</TableCell>
                      <TableCell className="text-muted-foreground">{q.paymentTerms}</TableCell>
                      <TableCell><RiskBadge level={q.risk} /></TableCell>
                      <TableCell className="text-right">
                        <span className={cn('font-extrabold text-sm', q.overallScore >= 90 ? 'text-success' : q.overallScore >= 75 ? 'text-warning' : 'text-destructive')}>
                          {q.overallScore}/100
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          disabled={rfq?.status === 'Awarded'}
                          onClick={() => handleAwardContract(q)}
                          variant={isRecommended ? 'default' : 'outline'}
                          className="h-8 text-xs gap-1"
                        >
                          <Award className="h-3.5 w-3.5" /> Award Contract
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        <Card className="mb-6 border-border bg-card/40 p-12 text-center backdrop-blur-sm">
          <Scale className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h3 className="font-bold text-base">No Quotations Received Yet</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Suppliers can submit quotes through the Supplier Portal or email dispatch links.
          </p>
          <Button onClick={() => router.push(`/supplier-portal?rfqId=${selectedRFQId}`)} className="gap-2">
            <Building2 className="h-4 w-4" /> Open Supplier Quotation Portal
          </Button>
        </Card>
      )}

      {/* AI Evaluation Recommendation Breakdown */}
      {evaluation && (
        <div className="space-y-4 animate-fade-up">
          <Card className="border-success/30 bg-success/5 p-6 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success/15">
                <Trophy className="h-6 w-6 text-warning" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold">AI Recommended Supplier Winner</h3>
                  <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">
                    {evaluation.recommendedSupplier.supplierName}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{evaluation.reasoning}</p>
                {rfq?.status !== 'Awarded' && (
                  <Button
                    onClick={() => handleAwardContract(evaluation.recommendedSupplier)}
                    className="mt-4 gap-2"
                  >
                    <Award className="h-4 w-4" /> 1-Click Award Contract to {evaluation.recommendedSupplier.supplierName}
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Scoring Breakdown */}
          <Card className="border-border bg-card/40 p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold">Transparent Multi-Criteria Scoring Breakdown</h3>
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
              {Object.entries(evaluation.weights).map(([key, val]) => (
                <span key={key} className="rounded-full border border-border bg-secondary/30 px-3 py-1 text-xs">
                  <span className="capitalize">{key} Weight</span>: <span className="font-semibold text-primary">{(val * 100).toFixed(0)}%</span>
                </span>
              ))}
            </div>

            <div className="space-y-4">
              {evaluation.scores.map((s) => (
                <div
                  key={s.supplierName}
                  className={cn(
                    'rounded-xl border p-4',
                    evaluation.recommendedSupplier.supplierName === s.supplierName
                      ? 'border-success/30 bg-success/5'
                      : 'border-border bg-secondary/20'
                  )}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {evaluation.recommendedSupplier.supplierName === s.supplierName && (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      )}
                      <span className="font-medium">{s.supplierName}</span>
                    </div>
                    <span className={cn('text-base font-bold', s.overall >= 90 ? 'text-success' : 'text-warning')}>
                      {s.overall}/100
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-3">
                    {[
                      { label: 'Price Score', value: s.price },
                      { label: 'Quality Score', value: s.quality },
                      { label: 'Delivery Score', value: s.delivery },
                      { label: 'Risk Score', value: s.risk },
                      { label: 'Hist. Performance', value: s.performance },
                    ].map((m) => (
                      <div key={m.label}>
                        <p className="mb-1 text-[10px] text-muted-foreground">{m.label}</p>
                        <div className="h-2 overflow-hidden rounded-full bg-secondary">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-700',
                              m.value >= 85 ? 'bg-success' : m.value >= 60 ? 'bg-warning' : 'bg-destructive'
                            )}
                            style={{ width: `${m.value}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs font-semibold">{m.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
