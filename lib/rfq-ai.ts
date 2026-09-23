import { suppliers } from './data';
import type { Supplier, RFQ } from './types';

export interface ExtractedRequirement {
  product: string;
  category: string;
  quantity: number;
  unit: string;
  targetPrice: number;
  budget: number;
  deadline: string;
  specifications: Record<string, string>;
  paymentTerms: string;
  deliveryLocation: string;
  validationWarnings: string[];
}

export interface SupplierMatchResult {
  supplier: Supplier;
  matchScore: number;
  reasons: string[];
  recommended: boolean;
}

export interface ExtractedQuotation {
  supplierName: string;
  unitPrice: number;
  totalPrice: number;
  deliveryDays: number;
  paymentTerms: string;
  qualityScore: number;
  warranty: string;
  remarks: string;
  extractedFields: Record<string, string>;
}

export function extractRequirementsFromText(rawText: string): ExtractedRequirement {
  const text = rawText || '';
  const warnings: string[] = [];

  // Default values
  let product = 'Industrial Steel Components';
  let category = 'Raw Materials';
  let quantity = 5000;
  let unit = 'units';
  let targetPrice = 95.00;
  let deadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  let paymentTerms = 'Net 30';
  let deliveryLocation = 'Mumbai Warehouse, India';
  const specifications: Record<string, string> = {
    'Material Grade': 'SS304 High Grade',
    'Tolerance': '±0.05mm',
    'Surface Finish': 'Polished Grade 4',
    'Inspection Standard': 'ISO 2859-1 Sampling Plan',
    'Packaging': 'Palletized & Vacuum Wrapped',
  };

  const lower = text.toLowerCase();

  // Quantity extraction
  const qtyMatch = text.match(/(\d+[\d,]*)\s*(units|pcs|pieces|kg|tons|meters|sets|molds|boxes)/i) ||
                   text.match(/quantity[:\s]*(\d+[\d,]*)/i) ||
                   text.match(/qty[:\s]*(\d+[\d,]*)/i);
  if (qtyMatch) {
    const parsedQty = parseInt(qtyMatch[1].replace(/,/g, ''), 10);
    if (!isNaN(parsedQty) && parsedQty > 0) {
      quantity = parsedQty;
    }
    if (qtyMatch[2]) {
      unit = qtyMatch[2].toLowerCase();
    }
  } else {
    warnings.push('Quantity not explicitly specified in prompt. Assigned default of 5,000 units.');
  }

  // Target price / Budget extraction
  const priceMatch = text.match(/(?:budget|target price|price|cost|rate)[:\s]*\$?\s*(\d+(?:\.\d+)?)/i) ||
                     text.match(/\$\s*(\d+(?:\.\d+)?)\s*(?:per|\/|a)?\s*(?:unit|pc|kg)?/i);
  if (priceMatch) {
    const p = parseFloat(priceMatch[1]);
    if (!isNaN(p) && p > 0) {
      targetPrice = p;
    }
  } else {
    warnings.push('Target price not specified. Standard benchmark target price assigned.');
  }

  // Product name extraction
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length > 0 && lines[0].length < 60 && !lines[0].toLowerCase().startsWith('need') && !lines[0].toLowerCase().startsWith('rfq')) {
    product = lines[0];
  } else {
    const prodMatch = text.match(/(?:for|need|purchase|buy|procure|rfq for)\s+([a-zA-Z0-9\s\-]+?)(?:,|\.|\s+with|\s+quantity|\s+budget|\n|$)/i);
    if (prodMatch && prodMatch[1].trim().length > 3) {
      product = prodMatch[1].trim().replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }

  // Category matching
  if (lower.includes('steel') || lower.includes('metal') || lower.includes('aluminum') || lower.includes('copper') || lower.includes('raw material')) {
    category = 'Raw Materials';
  } else if (lower.includes('electronic') || lower.includes('pcb') || lower.includes('sensor') || lower.includes('circuit')) {
    category = 'Electronics';
  } else if (lower.includes('gear') || lower.includes('bearing') || lower.includes('valve') || lower.includes('bracket') || lower.includes('component')) {
    category = 'Components';
  } else if (lower.includes('chemical') || lower.includes('resin') || lower.includes('polymer')) {
    category = 'Chemicals';
  } else if (lower.includes('package') || lower.includes('carton') || lower.includes('box')) {
    category = 'Packaging';
  } else if (lower.includes('fastener') || lower.includes('bolt') || lower.includes('screw') || lower.includes('nut')) {
    category = 'Fasteners';
  }

  // Deadline extraction
  const dateMatch = text.match(/(?:by|deadline|date|before)[:\s]*(\d{4}-\d{2}-\d{2})/i) ||
                    text.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
  if (dateMatch) {
    deadline = dateMatch[1];
  }

  // Spec parsing
  if (lower.includes('ss316') || lower.includes('316')) {
    specifications['Material Grade'] = 'SS316 Marine Grade Stainless';
  } else if (lower.includes('aluminum') || lower.includes('al6061')) {
    specifications['Material Grade'] = 'Aluminum Alloy 6061-T6';
  }
  if (lower.includes('iso')) {
    const isoMatch = text.match(/iso\s*\d{4}/i);
    if (isoMatch) specifications['Certification Requirement'] = isoMatch[0].toUpperCase();
  }

  const budget = targetPrice * quantity;

  return {
    product,
    category,
    quantity,
    unit,
    targetPrice,
    budget,
    deadline,
    specifications,
    paymentTerms,
    deliveryLocation,
    validationWarnings: warnings,
  };
}

export function matchSuppliersForRFQ(
  rfqCategory: string,
  targetPrice?: number,
  requiredQty?: number
): SupplierMatchResult[] {
  return suppliers.map((supplier) => {
    let score = 50;
    const reasons: string[] = [];

    // Category match (+30 pts)
    if (supplier.category.toLowerCase() === rfqCategory.toLowerCase()) {
      score += 30;
      reasons.push(`Direct category match in ${supplier.category}`);
    } else {
      reasons.push(`Secondary supplier in ${supplier.category}`);
    }

    // Delivery performance (+15 pts max)
    if (supplier.deliveryRate >= 90) {
      score += 15;
      reasons.push(`Excellent delivery reliability (${supplier.deliveryRate}% on-time)`);
    } else if (supplier.deliveryRate >= 80) {
      score += 10;
      reasons.push(`Good delivery rate (${supplier.deliveryRate}%)`);
    }

    // Quality score (+15 pts max)
    if (supplier.qualityScore >= 90) {
      score += 15;
      reasons.push(`Superior quality rating (${supplier.qualityScore}%)`);
    } else if (supplier.qualityScore >= 80) {
      score += 10;
    }

    // Risk level (+10 pts max)
    if (supplier.riskLevel === 'LOW') {
      score += 10;
      reasons.push('Low supply chain risk profile');
    } else if (supplier.riskLevel === 'MEDIUM') {
      score += 5;
    } else {
      reasons.push('High risk score warning — requires review');
    }

    // Status preference (+10 pts max)
    if (supplier.status === 'Preferred') {
      score += 10;
      reasons.push('ProcureAI Preferred Vendor');
    } else if (supplier.status === 'Active') {
      score += 5;
    }

    // Certifications (+10 pts max)
    if (supplier.certifications.length >= 2) {
      score += 10;
      reasons.push(`Certified (${supplier.certifications.join(', ')})`);
    }

    const matchScore = Math.min(Math.max(score, 35), 98);

    return {
      supplier,
      matchScore,
      reasons,
      recommended: matchScore >= 75,
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
}

export function extractQuotationFromDocument(
  fileName: string,
  fileText: string,
  rfq?: RFQ
): ExtractedQuotation {
  const text = fileText || fileName || '';
  const lower = text.toLowerCase();

  let unitPrice = rfq ? Math.round(rfq.targetPrice * (0.88 + Math.random() * 0.18) * 100) / 100 : 92.50;
  let deliveryDays = 14;
  let paymentTerms = 'Net 30';
  let qualityScore = 92;
  let warranty = '12 Months Full Warranty';
  let supplierName = 'TechSource Industries';
  let remarks = 'Fully compliant with all requested RFQ technical specifications. Includes free delivery.';

  // Extraction rules
  const priceMatch = text.match(/(?:unit price|rate|price per unit|price)[:\s]*\$?\s*(\d+(?:\.\d+)?)/i);
  if (priceMatch) {
    const parsedPrice = parseFloat(priceMatch[1]);
    if (!isNaN(parsedPrice) && parsedPrice > 0) unitPrice = parsedPrice;
  }

  const deliveryMatch = text.match(/(?:delivery|lead time|days)[:\s]*(\d+)\s*(?:days|weeks)?/i);
  if (deliveryMatch) {
    const d = parseInt(deliveryMatch[1], 10);
    if (!isNaN(d)) deliveryDays = d;
  }

  if (lower.includes('net 60')) paymentTerms = 'Net 60';
  if (lower.includes('net 45')) paymentTerms = 'Net 45';
  if (lower.includes('net 30')) paymentTerms = 'Net 30';

  if (lower.includes('global materials')) supplierName = 'Global Materials Ltd.';
  if (lower.includes('prime components')) supplierName = 'Prime Components';
  if (lower.includes('techsource')) supplierName = 'TechSource Industries';
  if (lower.includes('apex')) supplierName = 'Apex Manufacturing';
  if (lower.includes('nova')) supplierName = 'Nova Electronics';

  const totalQty = rfq?.quantity || 5000;
  const totalPrice = Math.round(unitPrice * totalQty * 100) / 100;

  return {
    supplierName,
    unitPrice,
    totalPrice,
    deliveryDays,
    paymentTerms,
    qualityScore,
    warranty,
    remarks,
    extractedFields: {
      'Extracted Unit Price': `$${unitPrice.toFixed(2)}`,
      'Extracted Total Amount': `$${totalPrice.toLocaleString()}`,
      'Delivery Timeframe': `${deliveryDays} business days`,
      'Payment Terms': paymentTerms,
      'Warranty Period': warranty,
    },
  };
}
