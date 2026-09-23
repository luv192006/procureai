'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  Bot,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Users,
  Building2,
  DollarSign,
  Calendar,
  Layers,
  Send,
  Plus,
  Trash2,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RiskBadge } from '@/components/shared-badges';
import { categories } from '@/lib/data';
import { extractRequirementsFromText, matchSuppliersForRFQ, type ExtractedRequirement, type SupplierMatchResult } from '@/lib/rfq-ai';
import type { RFQ } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { addNotification } from '@/lib/rfq-storage';

interface RFQCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (newRFQ: RFQ) => void;
}

export function RFQCreateModal({ open, onOpenChange, onCreated }: RFQCreateModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1 AI state
  const [rawText, setRawText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    product: '',
    description: '',
    quantity: '5000',
    unit: 'units',
    targetPrice: '95.00',
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    category: 'Raw Materials',
    paymentTerms: 'Net 30',
    deliveryLocation: 'Mumbai Central Warehouse',
  });

  const [specList, setSpecList] = useState<{ key: string; value: string }[]>([
    { key: 'Material Grade', value: 'SS304 High Grade Stainless' },
    { key: 'Tolerance', value: '±0.05mm' },
    { key: 'Inspection', value: '100% Dimensional Audit' },
  ]);

  // Step 3 Suppliers match
  const [matchedSuppliers, setMatchedSuppliers] = useState<SupplierMatchResult[]>([]);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);

  // Run AI supplier matching when category / price changes
  useEffect(() => {
    const qty = parseInt(formData.quantity) || 5000;
    const price = parseFloat(formData.targetPrice) || 95;
    const matches = matchSuppliersForRFQ(formData.category, price, qty);
    setMatchedSuppliers(matches);
    // Auto-select recommended suppliers by default
    const recommendedIds = matches.filter((m) => m.recommended).map((m) => m.supplier.id);
    setSelectedSupplierIds(recommendedIds);
  }, [formData.category, formData.targetPrice, formData.quantity]);

  const handleAiExtract = () => {
    if (!rawText.trim()) {
      toast({ title: 'Please enter requirement details', variant: 'destructive' });
      return;
    }
    setIsParsing(true);
    setTimeout(() => {
      const extracted: ExtractedRequirement = extractRequirementsFromText(rawText);
      setFormData({
        product: extracted.product,
        description: rawText,
        quantity: String(extracted.quantity),
        unit: extracted.unit,
        targetPrice: String(extracted.targetPrice),
        deadline: extracted.deadline,
        category: extracted.category,
        paymentTerms: extracted.paymentTerms,
        deliveryLocation: extracted.deliveryLocation,
      });

      const specs = Object.entries(extracted.specifications).map(([key, value]) => ({ key, value }));
      if (specs.length > 0) setSpecList(specs);
      setWarnings(extracted.validationWarnings);
      setIsParsing(false);
      setStep(2);
      toast({ title: 'AI Requirement Extraction Complete', description: 'Form auto-filled and validated.' });
    }, 1200);
  };

  const handleAddSpec = () => {
    setSpecList([...specList, { key: '', value: '' }]);
  };

  const handleRemoveSpec = (index: number) => {
    setSpecList(specList.filter((_, i) => i !== index));
  };

  const toggleSupplier = (id: string) => {
    setSelectedSupplierIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleFinalSubmit = (sendToSuppliers: boolean = true) => {
    if (!formData.product || !formData.quantity || !formData.deadline) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    const rfqId = `RFQ-2026-${String(Math.floor(Math.random() * 899) + 100).padStart(3, '0')}`;
    const qty = parseInt(formData.quantity) || 1000;
    const price = parseFloat(formData.targetPrice) || 0;
    const budget = price * qty;

    const specsRecord: Record<string, string> = {};
    specList.forEach((s) => {
      if (s.key.trim()) specsRecord[s.key.trim()] = s.value.trim();
    });

    const newRFQ: RFQ = {
      id: rfqId,
      product: formData.product,
      description: formData.description,
      quantity: qty,
      unit: formData.unit,
      deadline: formData.deadline,
      targetPrice: price,
      budget,
      specifications: specsRecord,
      suppliersInvited: selectedSupplierIds.length,
      responses: 0,
      status: sendToSuppliers && selectedSupplierIds.length > 0 ? 'Sent' : 'Draft',
      category: formData.category,
      createdDate: new Date().toISOString().split('T')[0],
      suppliers: selectedSupplierIds,
      paymentTerms: formData.paymentTerms,
      deliveryLocation: formData.deliveryLocation,
      viewCount: 0,
      timeline: [
        {
          id: `t1-${Date.now()}`,
          status: 'Draft',
          timestamp: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          title: 'RFQ Created',
          description: `Created RFQ for ${formData.product} (${qty} ${formData.unit})`,
          actor: 'Alex Morgan',
        },
        ...(sendToSuppliers && selectedSupplierIds.length > 0
          ? [{
              id: `t2-${Date.now()}`,
              status: 'Sent' as const,
              timestamp: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
              title: `Dispatched to ${selectedSupplierIds.length} matched suppliers via Email & Portal`,
              actor: 'ProcureAI Dispatch Engine',
            }]
          : []),
      ],
      sentHistory: selectedSupplierIds.map((supId) => {
        const match = matchedSuppliers.find((m) => m.supplier.id === supId);
        return {
          supplierId: supId,
          supplierName: match?.supplier.name || supId,
          email: match?.supplier.contactEmail || 'supplier@procureai.com',
          sentAt: new Date().toISOString(),
          status: 'Sent' as const,
          portalUrl: `/supplier-portal?rfqId=${rfqId}&supplierId=${supId}`,
        };
      }),
    };

    // Add notification
    addNotification({
      type: 'rfq',
      title: `RFQ ${rfqId} Created & Dispatched`,
      description: `Sent to ${selectedSupplierIds.length} eligible suppliers for ${formData.product}.`,
      link: `/rfqs/${rfqId}`,
    });

    onCreated(newRFQ);
    onOpenChange(false);
    toast({
      title: sendToSuppliers ? 'RFQ Dispatched Successfully!' : 'RFQ Saved as Draft',
      description: `${rfqId} created for ${formData.product}.`,
    });

    // Reset wizard
    setStep(1);
    setRawText('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              AI-Powered RFQ Automation Wizard
            </DialogTitle>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
              Step {step} of 4
            </span>
          </div>

          {/* Stepper Header */}
          <div className="mt-4 grid grid-cols-4 gap-2">
            {[
              { num: 1, label: 'AI Extraction' },
              { num: 2, label: 'Specifications' },
              { num: 3, label: 'Supplier Match' },
              { num: 4, label: 'Dispatch & PDF' },
            ].map((s) => (
              <button
                key={s.num}
                onClick={() => setStep(s.num as 1 | 2 | 3 | 4)}
                className={`flex items-center gap-2 text-xs font-medium pb-2 border-b-2 transition-all ${
                  step === s.num
                    ? 'border-primary text-primary'
                    : step > s.num
                    ? 'border-success text-success'
                    : 'border-border text-muted-foreground'
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    step === s.num
                      ? 'bg-primary text-primary-foreground'
                      : step > s.num
                      ? 'bg-success text-success-foreground'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {s.num}
                </span>
                <span className="truncate">{s.label}</span>
              </button>
            ))}
          </div>
        </DialogHeader>

        {/* Wizard Content Body */}
        <div className="flex-1 overflow-y-auto scrollbar-thin py-4 space-y-4">
          {/* STEP 1: AI Prompt Extraction */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-up">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <Bot className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold">AI Requirement Extraction</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Paste an email, plant specification note, or raw requirement prompt. ProcureAI will parse product name, specs, budget, quantity, category, and deadline automatically.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium">Raw Requirement Text / Specification Prompt</Label>
                <Textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="e.g. We need 10,000 units of Industrial Steel Components for our Pune facility. Budget around $95 per unit. Material must be SS304 grade with ISO compliance, required by 2026-08-25..."
                  rows={6}
                  className="mt-1.5 font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                  Skip to Manual Entry <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
                <Button onClick={handleAiExtract} disabled={isParsing} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  {isParsing ? 'Analyzing Specifications...' : 'Run AI Extraction & Validation'}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Specifications & Budget Details */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-up">
              {warnings.length > 0 && (
                <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 space-y-1">
                  <div className="flex items-center gap-2 text-warning font-semibold text-xs">
                    <AlertTriangle className="h-4 w-4" /> AI Validation Warnings
                  </div>
                  {warnings.map((w, idx) => (
                    <p key={idx} className="text-xs text-muted-foreground pl-6">• {w}</p>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Product Name *</Label>
                  <Input
                    value={formData.product}
                    onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                    placeholder="e.g. Industrial Steel Components"
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData({ ...formData, category: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Requirement Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed background context or usage specifications..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Unit</Label>
                  <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['units', 'kg', 'meters', 'sets', 'molds', 'pcs', 'tons'].map((u) => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Target Unit Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.targetPrice}
                    onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Submission Deadline *</Label>
                  <Input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Delivery Location</Label>
                  <Input
                    value={formData.deliveryLocation}
                    onChange={(e) => setFormData({ ...formData, deliveryLocation: e.target.value })}
                  />
                </div>
              </div>

              {/* Dynamic Technical Specifications Builder */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs font-semibold">Technical Specifications Matrix</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddSpec} className="h-7 text-xs gap-1">
                    <Plus className="h-3 w-3" /> Add Spec
                  </Button>
                </div>
                <div className="space-y-2 border border-border rounded-xl p-3 bg-card/30">
                  {specList.map((spec, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        placeholder="Spec Name (e.g. Material)"
                        value={spec.key}
                        onChange={(e) => {
                          const copy = [...specList];
                          copy[idx].key = e.target.value;
                          setSpecList(copy);
                        }}
                        className="h-8 text-xs flex-1"
                      />
                      <Input
                        placeholder="Requirement Detail (e.g. SS304)"
                        value={spec.value}
                        onChange={(e) => {
                          const copy = [...specList];
                          copy[idx].value = e.target.value;
                          setSpecList(copy);
                        }}
                        className="h-8 text-xs flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSpec(idx)}
                        className="h-8 w-8 p-0 text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Automated AI Supplier Matching */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-up">
              <div className="flex items-center justify-between bg-secondary/30 p-3 rounded-xl border border-border">
                <div>
                  <p className="text-sm font-semibold">Matching for Category: {formData.category}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedSupplierIds.length} of {matchedSuppliers.length} suppliers selected
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSupplierIds(matchedSuppliers.map((m) => m.supplier.id))}
                >
                  Select All
                </Button>
              </div>

              <div className="max-h-72 overflow-y-auto scrollbar-thin space-y-2.5">
                {matchedSuppliers.map(({ supplier, matchScore, reasons, recommended }) => {
                  const isChecked = selectedSupplierIds.includes(supplier.id);
                  return (
                    <div
                      key={supplier.id}
                      onClick={() => toggleSupplier(supplier.id)}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-primary/50 bg-primary/5 shadow-sm'
                          : 'border-border bg-card/40 hover:bg-secondary/30'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-1 h-4 w-4 rounded border-border accent-primary"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{supplier.name}</span>
                            {recommended && (
                              <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">
                                Recommended
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{supplier.location}</span>
                            <span className="text-sm font-bold text-primary">{matchScore}% Match</span>
                          </div>
                        </div>

                        <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>Quality: <strong className="text-foreground">{supplier.qualityScore}%</strong></span>
                          <span>Delivery: <strong className="text-foreground">{supplier.deliveryRate}%</strong></span>
                          <span>Risk: <RiskBadge level={supplier.riskLevel} /></span>
                        </div>

                        <div className="mt-2 text-[11px] text-muted-foreground/80 space-y-0.5">
                          {reasons.slice(0, 2).map((r, i) => (
                            <p key={i}>✓ {r}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Review, Dispatch & Summary */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-up">
              <div className="rounded-xl border border-success/30 bg-success/5 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-success shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold">RFQ Ready for Dispatch</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Review RFQ summary. Click &quot;Dispatch RFQ&quot; to send email notifications & generate supplier portal links.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-xl border border-border p-4 bg-card/40 text-xs">
                <div><span className="text-muted-foreground">Product:</span> <p className="font-semibold text-sm">{formData.product}</p></div>
                <div><span className="text-muted-foreground">Category:</span> <p className="font-semibold text-sm">{formData.category}</p></div>
                <div><span className="text-muted-foreground">Quantity:</span> <p className="font-semibold">{parseInt(formData.quantity).toLocaleString()} {formData.unit}</p></div>
                <div><span className="text-muted-foreground">Target Budget:</span> <p className="font-semibold">${(parseFloat(formData.targetPrice) * parseInt(formData.quantity)).toLocaleString()}</p></div>
                <div><span className="text-muted-foreground">Deadline:</span> <p className="font-semibold">{formData.deadline}</p></div>
                <div><span className="text-muted-foreground">Invited Suppliers:</span> <p className="font-semibold text-primary">{selectedSupplierIds.length} Suppliers</p></div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <DialogFooter className="pt-3 border-t border-border flex flex-row items-center justify-between">
          <div>
            {step > 1 && (
              <Button type="button" variant="outline" onClick={() => setStep((step - 1) as 1 | 2 | 3 | 4)}>
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {step < 4 ? (
              <Button type="button" onClick={() => setStep((step + 1) as 1 | 2 | 3 | 4)}>
                Continue <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => handleFinalSubmit(false)}>
                  Save Draft
                </Button>
                <Button type="button" onClick={() => handleFinalSubmit(true)} className="gap-2">
                  <Send className="h-4 w-4" /> Dispatch RFQ Now
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
