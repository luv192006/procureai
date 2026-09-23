'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Building2,
  FileText,
  Upload,
  Sparkles,
  CheckCircle2,
  DollarSign,
  Clock,
  ShieldCheck,
  Download,
  Bot,
  Send,
  ArrowRight,
} from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getStoredRFQs, getStoredQuotations, saveStoredQuotations, saveStoredRFQs, addNotification } from '@/lib/rfq-storage';
import { extractQuotationFromDocument } from '@/lib/rfq-ai';
import { generateRFQPDF } from '@/lib/pdf-generator';
import type { RFQ, Quotation } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

export default function SupplierPortalPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialRfqId = searchParams.get('rfqId') || '';

  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [selectedRfqId, setSelectedRfqId] = useState(initialRfqId);
  const [selectedRfq, setSelectedRfq] = useState<RFQ | null>(null);

  // Form State
  const [supplierName, setSupplierName] = useState('TechSource Industries');
  const [unitPrice, setUnitPrice] = useState('92.00');
  const [deliveryDays, setDeliveryDays] = useState('12');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [warranty, setWarranty] = useState('12 Months Warranty');
  const [remarks, setRemarks] = useState('Fully compliant with technical requirements and ISO quality standards.');

  // AI Document parsing state
  const [quoteFileText, setQuoteFileText] = useState('');
  const [isParsingQuote, setIsParsingQuote] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const list = getStoredRFQs();
    setRfqs(list);
    if (list.length > 0) {
      const activeId = initialRfqId || list[0].id;
      setSelectedRfqId(activeId);
      const target = list.find((r) => r.id === activeId) || list[0];
      setSelectedRfq(target);
      setUnitPrice(String((target.targetPrice * 0.95).toFixed(2)));
    }
  }, [initialRfqId]);

  const handleRfqChange = (id: string) => {
    setSelectedRfqId(id);
    const target = rfqs.find((r) => r.id === id) || null;
    setSelectedRfq(target);
    if (target) {
      setUnitPrice(String((target.targetPrice * 0.95).toFixed(2)));
    }
    setSubmitted(false);
  };

  const handleDownloadPDF = () => {
    if (!selectedRfq) return;
    try {
      const { blob, filename } = generateRFQPDF(selectedRfq);
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

  const handleAiParseDocument = () => {
    if (!quoteFileText.trim()) {
      toast({ title: 'Please paste quotation text or upload document text', variant: 'destructive' });
      return;
    }
    setIsParsingQuote(true);
    setTimeout(() => {
      const parsed = extractQuotationFromDocument('quote-doc.txt', quoteFileText, selectedRfq || undefined);
      setSupplierName(parsed.supplierName);
      setUnitPrice(String(parsed.unitPrice));
      setDeliveryDays(String(parsed.deliveryDays));
      setPaymentTerms(parsed.paymentTerms);
      setWarranty(parsed.warranty);
      setRemarks(parsed.remarks);
      setIsParsingQuote(false);
      toast({ title: 'AI Quote Extraction Complete', description: 'Form auto-populated from document.' });
    }, 1000);
  };

  const handleSubmitQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRfq) return;

    const priceNum = parseFloat(unitPrice) || selectedRfq.targetPrice;
    const deliveryNum = parseInt(deliveryDays, 10) || 14;
    const totalAmount = priceNum * selectedRfq.quantity;

    const newQuote: Quotation = {
      id: `QT-2026-${String(Math.floor(Math.random() * 899) + 100).padStart(3, '0')}`,
      rfqId: selectedRfq.id,
      supplierId: `SUP-${Math.floor(Math.random() * 10) + 1}`,
      supplierName,
      price: priceNum,
      unitPrice: priceNum,
      totalAmount,
      deliveryDays: deliveryNum,
      qualityScore: 92,
      paymentTerms,
      warranty,
      remarks,
      risk: 'LOW',
      historicalPerformance: 91,
      overallScore: 89,
      submittedAt: new Date().toISOString(),
      status: 'Pending',
    };

    // Save quotation
    const storedQuotes = getStoredQuotations();
    const updatedQuotes = [newQuote, ...storedQuotes];
    saveStoredQuotations(updatedQuotes);

    // Update RFQ status & response count
    const updatedRfqs = rfqs.map((r) => {
      if (r.id === selectedRfq.id) {
        const newResponses = (r.responses || 0) + 1;
        const newTimeline = [
          ...(r.timeline || []),
          {
            id: `t-quote-${Date.now()}`,
            status: 'Responses Received' as const,
            timestamp: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            title: `Quotation submitted by ${supplierName}`,
            description: `Quoted $${priceNum}/unit (${deliveryNum} days lead time)`,
            actor: supplierName,
          },
        ];
        return {
          ...r,
          responses: newResponses,
          status: 'Responses Received' as const,
          timeline: newTimeline,
        };
      }
      return r;
    });

    setRfqs(updatedRfqs);
    saveStoredRFQs(updatedRfqs);

    // Add Buyer Notification
    addNotification({
      type: 'quotation',
      title: `New Quotation for ${selectedRfq.id}`,
      description: `${supplierName} submitted quote of $${priceNum}/unit.`,
      link: `/quotations?rfqId=${selectedRfq.id}`,
    });

    setSubmitted(true);
    toast({
      title: 'Quotation Submitted Successfully!',
      description: `Quotation for ${selectedRfq.id} sent to procurement team.`,
    });
  };

  return (
    <AppShell title="Supplier Portal — Submit Quotation">
      {/* Top Banner */}
      <Card className="mb-6 border-primary/30 bg-primary/5 p-6 backdrop-blur-sm animate-fade-up">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">ProcureAI Supplier Quotation Portal</h2>
              <p className="text-xs text-muted-foreground">
                Review official buyer RFQs, download specification documents, and submit binding quotations.
              </p>
            </div>
          </div>

          <Select value={selectedRfqId} onValueChange={handleRfqChange}>
            <SelectTrigger className="w-64 border-primary/40 bg-card"><SelectValue placeholder="Select RFQ" /></SelectTrigger>
            <SelectContent>
              {rfqs.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.id} — {r.product}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {selectedRfq && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* RFQ Specifications Summary Card (1 Col) */}
          <Card className="border-border bg-card/40 p-5 backdrop-blur-sm h-fit space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="text-xs font-semibold uppercase text-muted-foreground">RFQ Overview</span>
              <span className="text-xs font-bold text-primary">{selectedRfq.id}</span>
            </div>

            <div>
              <h3 className="font-bold text-base">{selectedRfq.product}</h3>
              <p className="text-xs text-muted-foreground mt-1">{selectedRfq.category}</p>
            </div>

            <div className="space-y-2 text-xs border-y border-border/60 py-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity Needed:</span>
                <span className="font-bold">{selectedRfq.quantity.toLocaleString()} {selectedRfq.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Target Unit Price:</span>
                <span className="font-bold">${selectedRfq.targetPrice}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deadline Date:</span>
                <span className="font-bold text-warning">{selectedRfq.deadline}</span>
              </div>
            </div>

            <div>
              <Button onClick={handleDownloadPDF} variant="outline" className="w-full text-xs gap-2">
                <Download className="h-4 w-4" /> Download Official RFQ PDF
              </Button>
            </div>
          </Card>

          {/* Quotation Submission Form / AI Extractor (2 Cols) */}
          <div className="md:col-span-2 space-y-6">
            {submitted ? (
              <Card className="border-success/30 bg-success/5 p-8 text-center backdrop-blur-sm animate-fade-up">
                <CheckCircle2 className="mx-auto h-12 w-12 text-success mb-3" />
                <h3 className="text-lg font-bold">Quotation Successfully Submitted!</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                  Your quotation of <strong>${unitPrice} per unit</strong> for {selectedRfq.id} has been securely transmitted to the procurement evaluation engine.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <Button variant="outline" onClick={() => setSubmitted(false)}>
                    Submit Another Quote
                  </Button>
                  <Button onClick={() => router.push(`/quotations?rfqId=${selectedRfq.id}`)}>
                    View Quotation Comparison Matrix <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ) : (
              <>
                {/* AI Document Upload / Text Parsing Accordion */}
                <Card className="border-border bg-card/40 p-5 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="h-5 w-5 text-primary" />
                    <h3 className="text-sm font-semibold">AI Quotation Document Auto-Parser</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Paste your quote letter/PDF text below. AI will extract unit price, delivery lead time, and payment terms automatically into the form.
                  </p>
                  <Textarea
                    value={quoteFileText}
                    onChange={(e) => setQuoteFileText(e.target.value)}
                    placeholder="e.g. Official Quotation from TechSource Industries. Unit price: $92.00, delivery within 12 business days, Net 30 payment terms, 12 months full warranty..."
                    rows={3}
                    className="text-xs font-mono"
                  />
                  <Button
                    onClick={handleAiParseDocument}
                    disabled={isParsingQuote}
                    variant="secondary"
                    size="sm"
                    className="mt-2.5 text-xs gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    {isParsingQuote ? 'Parsing Document...' : 'Auto-Fill Form with AI'}
                  </Button>
                </Card>

                {/* Quotation Form */}
                <Card className="border-border bg-card/40 p-6 backdrop-blur-sm">
                  <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                    <Send className="h-4 w-4 text-primary" /> Official Quotation Form
                  </h3>

                  <form onSubmit={handleSubmitQuotation} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Supplier Organization Name *</Label>
                        <Input
                          value={supplierName}
                          onChange={(e) => setSupplierName(e.target.value)}
                          placeholder="e.g. TechSource Industries"
                          required
                        />
                      </div>
                      <div>
                        <Label>Quoted Price Per Unit ($) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={unitPrice}
                          onChange={(e) => setUnitPrice(e.target.value)}
                          placeholder="92.00"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label>Delivery Lead Time (Days) *</Label>
                        <Input
                          type="number"
                          value={deliveryDays}
                          onChange={(e) => setDeliveryDays(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label>Payment Terms</Label>
                        <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Advance'].map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Warranty Commitment</Label>
                        <Input
                          value={warranty}
                          onChange={(e) => setWarranty(e.target.value)}
                          placeholder="e.g. 12 Months Warranty"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Technical Remarks & Terms</Label>
                      <Textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Additional technical commitments, packaging, or warranty terms..."
                        rows={3}
                      />
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Button type="submit" size="lg" className="gap-2 shadow-lg shadow-primary/20">
                        <Send className="h-4 w-4" /> Submit Binding Quotation
                      </Button>
                    </div>
                  </form>
                </Card>
              </>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
