import {
  suppliers,
  rfqs,
  quotations,
  inventory,
  monthlySpend,
  categorySpend,
  recommendations,
  getQuotationsByRFQ,
  getSupplierById,
} from './data';
import type { Quotation, Supplier, InventoryItem } from './types';

export const aiAnalysisSteps = [
  'Analyzing procurement data...',
  'Evaluating supplier performance...',
  'Checking historical trends...',
  'Calculating risk...',
  'Generating recommendation...',
];

export interface QuotationEvaluation {
  recommendedSupplier: Quotation;
  reasoning: string;
  scores: {
    supplierName: string;
    price: number;
    quality: number;
    delivery: number;
    risk: number;
    performance: number;
    overall: number;
  }[];
  weights: { price: number; quality: number; delivery: number; risk: number; performance: number };
}

export function evaluateQuotations(rfqId: string): QuotationEvaluation | null {
  const quotes = getQuotationsByRFQ(rfqId);
  if (quotes.length === 0) return null;

  const weights = { price: 0.3, quality: 0.25, delivery: 0.2, risk: 0.15, performance: 0.1 };

  const minPrice = Math.min(...quotes.map((q) => q.price));
  const maxPrice = Math.max(...quotes.map((q) => q.price));
  const maxDelivery = Math.max(...quotes.map((q) => q.deliveryDays));
  const riskScoreMap: Record<string, number> = { LOW: 95, MEDIUM: 60, HIGH: 25 };

  const scores = quotes.map((q) => {
    const priceScore =
      maxPrice === minPrice ? 100 : 100 - ((q.price - minPrice) / (maxPrice - minPrice)) * 100;
    const deliveryScore = 100 - (q.deliveryDays / maxDelivery) * 100;
    const riskScore = riskScoreMap[q.risk] ?? 50;

    const overall =
      priceScore * weights.price +
      q.qualityScore * weights.quality +
      deliveryScore * weights.delivery +
      riskScore * weights.risk +
      q.historicalPerformance * weights.performance;

    return {
      supplierName: q.supplierName,
      price: Math.round(priceScore),
      quality: q.qualityScore,
      delivery: Math.round(deliveryScore),
      risk: riskScore,
      performance: q.historicalPerformance,
      overall: Math.round(overall * 10) / 10,
    };
  });

  const sorted = [...scores].sort((a, b) => b.overall - a.overall);
  const best = sorted[0];
  const bestQuote = quotes.find((q) => q.supplierName === best.supplierName)!;

  const second = sorted[1];
  const priceDiff = ((bestQuote.price - quotes.find((q) => q.supplierName === second.supplierName)!.price) /
    quotes.find((q) => q.supplierName === second.supplierName)!.price) * 100;

  const reasoning = `${best.supplierName} is recommended${
    priceDiff > 0
      ? ` despite a ${Math.abs(priceDiff).toFixed(0)}% higher price`
      : priceDiff < 0
      ? ` with a ${Math.abs(priceDiff).toFixed(0)}% lower price`
      : ''
  } because it provides significantly better quality (${best.quality}%), faster delivery, stronger historical performance (${best.performance}%) and lower supply-chain risk. Final score: ${best.overall}/100.`;

  return {
    recommendedSupplier: bestQuote,
    reasoning,
    scores: sorted,
    weights,
  };
}

export interface RiskAnalysis {
  riskScore: number;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  explanation: string;
  factors: { name: string; score: number; trend: string }[];
}

export function analyzeSupplierRisk(supplier: Supplier): RiskAnalysis {
  const factors = [
    { name: 'Financial Stability', score: supplier.riskBreakdown.financial, trend: supplier.riskBreakdown.financial > 60 ? 'Deteriorating' : 'Stable' },
    { name: 'Delivery Performance', score: supplier.riskBreakdown.delivery, trend: supplier.riskBreakdown.delivery > 60 ? 'Declining' : 'Stable' },
    { name: 'Quality Consistency', score: supplier.riskBreakdown.quality, trend: supplier.riskBreakdown.quality > 60 ? 'Worsening' : 'Stable' },
    { name: 'Price Stability', score: supplier.riskBreakdown.priceStability, trend: supplier.riskBreakdown.priceStability > 60 ? 'Volatile' : 'Stable' },
  ];

  const riskScore = supplier.riskScore;
  const riskLevel = riskScore >= 70 ? 'HIGH' : riskScore >= 40 ? 'MEDIUM' : 'LOW';

  const decliningFactors = factors.filter((f) => f.trend !== 'Stable');
  const explanation =
    riskLevel === 'HIGH'
      ? `Risk increased because ${decliningFactors
          .map((f) => f.name.toLowerCase())
          .join(', ')} showed deterioration during the previous quarter. Immediate mitigation recommended.`
      : riskLevel === 'MEDIUM'
      ? `Moderate risk detected. ${decliningFactors
          .map((f) => f.name.toLowerCase())
          .join(', ')} require monitoring. No immediate action required but quarterly review advised.`
      : `Low risk supplier. All key indicators are stable. Continue current engagement strategy.`;

  return { riskScore, riskLevel, explanation, factors };
}

export interface MitigationPlan {
  actions: { title: string; description: string; priority: 'HIGH' | 'MEDIUM' | 'LOW' }[];
  summary: string;
}

export function generateMitigationPlan(supplier: Supplier): MitigationPlan {
  const actions: MitigationPlan['actions'] = [];

  if (supplier.riskBreakdown.delivery > 60) {
    actions.push({
      title: 'Activate backup supplier',
      description: `Identify and qualify a secondary supplier for ${supplier.category} to reduce dependency on ${supplier.name}.`,
      priority: 'HIGH',
    });
  }

  actions.push({
    title: 'Reduce dependency',
    description: `Gradually reduce order volume with ${supplier.name} by 30% over the next quarter while scaling up alternatives.`,
    priority: 'HIGH',
  });

  if (supplier.riskBreakdown.quality > 60) {
    actions.push({
      title: 'Increase inspection',
      description: `Implement 100% incoming inspection for the next 3 batches from ${supplier.name}.`,
      priority: 'MEDIUM',
    });
  }

  actions.push({
    title: 'Review payment terms',
    description: `Renegotiate payment terms from ${supplier.paymentTerms} to shorter terms to leverage early-payment discounts and improve cash flow.`,
    priority: 'MEDIUM',
  });

  if (supplier.riskBreakdown.financial > 60) {
    actions.push({
      title: 'Financial health review',
      description: `Request updated financial statements and credit reports. Consider requiring a performance bond for large orders.`,
      priority: 'HIGH',
    });
  }

  const summary = `Mitigation plan for ${supplier.name} includes ${actions.length} actions across supplier diversification, quality control, and financial risk management. Estimated implementation: 30-60 days.`;

  return { actions, summary };
}

export interface InventoryPrediction {
  daysToCritical: number | null;
  daysToReorder: number | null;
  prediction: string;
  recommendation: string;
}

export function predictInventory(item: InventoryItem): InventoryPrediction {
  if (item.dailyDemand === 0) {
    return {
      daysToCritical: null,
      daysToReorder: null,
      prediction: 'No demand detected for this item.',
      recommendation: 'Review whether this SKU is still needed.',
    };
  }

  const daysToReorder = Math.floor((item.currentStock - item.reorderPoint) / item.dailyDemand);
  const daysToCritical = Math.floor(item.currentStock / item.dailyDemand);

  let prediction: string;
  let recommendation: string;

  if (item.status === 'Critical') {
    prediction = `Inventory will be depleted in approximately ${daysToCritical} days. Immediate action required.`;
    recommendation = `Place an emergency reorder of ${item.dailyDemand * item.leadTime * 2} ${item.unit} immediately. Use expedited shipping.`;
  } else if (item.status === 'Low Stock') {
    prediction = `Inventory will reach reorder point in approximately ${Math.max(daysToReorder, 0)} days and critical level in ${daysToCritical} days.`;
    recommendation = `Initiate reorder of ${item.dailyDemand * (item.leadTime + 7)} ${item.unit} to maintain healthy stock levels.`;
  } else if (item.status === 'Overstocked') {
    prediction = `Current stock is ${(item.currentStock / item.reorderPoint).toFixed(1)}x the reorder point. Excess inventory detected.`;
    recommendation = `Hold off on new orders. Consider redeploying excess stock to other locations.`;
  } else {
    prediction = `Inventory is healthy. Estimated ${daysToCritical} days of stock remaining at current demand.`;
    recommendation = `No action needed. Next reorder expected in approximately ${Math.max(daysToReorder, 0)} days.`;
  }

  return { daysToCritical, daysToReorder, prediction, recommendation };
}

export function answerAssistantQuestion(question: string): string {
  const q = question.toLowerCase();

  if (q.includes('high risk') || (q.includes('which') && q.includes('supplier') && q.includes('risk'))) {
    const highRisk = suppliers.filter((s) => s.riskLevel === 'HIGH');
    const mediumRisk = suppliers.filter((s) => s.riskLevel === 'MEDIUM');
    return `Based on current risk analysis, there ${highRisk.length === 1 ? 'is 1 high-risk supplier' : `are ${highRisk.length} high-risk suppliers`} and ${mediumRisk.length} medium-risk suppliers in your network.\n\n**High Risk:**\n${highRisk
      .map((s) => `• ${s.name} — Risk score: ${s.riskScore}/100 (${s.category})`)
      .join('\n')}\n\n**Medium Risk:**\n${mediumRisk
      .slice(0, 5)
      .map((s) => `• ${s.name} — Risk score: ${s.riskScore}/100`)
      .join('\n')}${mediumRisk.length > 5 ? `\n• ...and ${mediumRisk.length - 5} more` : ''}\n\n**Recommendation:** Prioritize mitigation for Global Materials Ltd. — activate backup supplier and reduce order volume by 30%.`;
  }

  if (q.includes('best quotation') || q.includes('best quote') || (q.includes('which') && q.includes('rfq'))) {
    const openRFQs = rfqs.filter((r) => r.status === 'Open');
    const firstRFQ = openRFQs[0];
    const evalResult = evaluateQuotations(firstRFQ.id);
    if (evalResult) {
      return `For ${firstRFQ.id} (${firstRFQ.product}), ${evalResult.recommendedSupplier.supplierName} is currently the best option.\n\n**Quotation Summary:**\n${evalResult.scores
        .map((s, i) => `${i + 1}. ${s.supplierName} — Overall score: ${s.overall}/100 (Price: ${s.price}, Quality: ${s.quality}, Delivery: ${s.delivery}, Risk: ${s.risk})`)
        .join('\n')}\n\n**AI Reasoning:** ${evalResult.reasoning}`;
    }
    return 'No open RFQs with quotations available.';
  }

  if (q.includes('reduce') && q.includes('cost')) {
    const totalSavings = recommendations
      .filter((r) => r.category === 'COST SAVING')
      .reduce((sum, r) => sum + r.impactValue, 0);
    return `AI has identified ${recommendations.filter((r) => r.category === 'COST SAVING').length} cost-saving opportunities totaling approximately $${(totalSavings / 1000).toFixed(0)}K annually.\n\n**Top opportunities:**\n${recommendations
      .filter((r) => r.category === 'COST SAVING')
      .map((r) => `• ${r.title} — ${r.impact} (Confidence: ${r.confidence}%)`)
      .join('\n')}\n\n**Recommendation:** Start with supplier consolidation — it has the highest confidence (91%) and impact ($84K).`;
  }

  if (q.includes('steel') && q.includes('now')) {
    return `**Steel Price Forecast:**\nCurrent price: ₹72/kg\n30-day forecast: ₹78/kg (+8.3%)\nConfidence: 87%\n\n**AI Recommendation:** Steel prices are predicted to increase over the next 30 days. Consider purchasing 60% of the planned quantity now and the remaining 40% later.\n\nThis strategy balances price risk with inventory carrying costs. Based on your current steel consumption, buying now could save approximately $42,000.`;
  }

  if (q.includes('best delivery') || q.includes('delivery performance')) {
    const sorted = [...suppliers].sort((a, b) => b.deliveryRate - a.deliveryRate).slice(0, 5);
    return `Top 5 suppliers by delivery performance:\n\n${sorted
      .map((s, i) => `${i + 1}. ${s.name} — ${s.deliveryRate}% on-time delivery (${s.category})`)
      .join('\n')}\n\n**Recommendation:** TechSource Industries (94%) and Nova Electronics (91%) are your most reliable delivery partners. Consider consolidating more volume with these preferred suppliers.`;
  }

  if (q.includes('spending increase') || q.includes('spend') && q.includes('increase')) {
    const lastMonth = monthlySpend[monthlySpend.length - 1];
    const prevMonth = monthlySpend[monthlySpend.length - 2];
    const increase = ((lastMonth.spend - prevMonth.spend) / prevMonth.spend) * 100;
    return `Procurement spending increased by ${increase.toFixed(1)}% this month ($${(lastMonth.spend / 1000).toFixed(0)}K vs $${(prevMonth.spend / 1000).toFixed(0)}K last month).\n\n**Key drivers:**\n• Steel and raw material prices rose 8.3%\n• Electronics category spend increased due to new PCB orders\n• 12% of spend was maverick (outside approved suppliers)\n\n**Recommendation:** Enforce preferred supplier list to reduce maverick spending and lock in steel prices with a forward contract.`;
  }

  if (q.includes('spend') || q.includes('spending') || q.includes('total')) {
    const totalSpend = monthlySpend.reduce((sum, m) => sum + m.spend, 0);
    const avgMonthly = totalSpend / monthlySpend.length;
    return `Your total procurement spend over the last 12 months is $${(totalSpend / 1000000).toFixed(2)}M, averaging $${(avgMonthly / 1000).toFixed(0)}K per month.\n\n**Spend by category:**\n${categorySpend
      .slice(0, 5)
      .map((c) => `• ${c.category}: $${(c.spend / 1000).toFixed(0)}K`)
      .join('\n')}\n\n**Top supplier:** TechSource Industries ($312K annual spend)\n\n**AI Insight:** Top 5 suppliers represent 42% of total procurement spend. Consolidation could reduce annual spending by $184K.`;
  }

  if (q.includes('inventory') || q.includes('stock')) {
    const critical = inventory.filter((i) => i.status === 'Critical');
    const lowStock = inventory.filter((i) => i.status === 'Low Stock');
    return `Inventory status overview:\n\n• **Critical:** ${critical.length} items require immediate attention\n• **Low Stock:** ${lowStock.length} items need reordering soon\n• **Healthy:** ${inventory.filter((i) => i.status === 'Healthy').length} items\n• **Overstocked:** ${inventory.filter((i) => i.status === 'Overstocked').length} items\n\n**Critical items:**\n${critical
      .slice(0, 4)
      .map((i) => `• ${i.product} — ${i.currentStock} ${i.unit} (demand: ${i.dailyDemand}/day)`)
      .join('\n')}\n\n**Recommendation:** Place emergency reorders for critical items immediately. Use expedited shipping for Steel Components.`;
  }

  if (q.includes('recommend') || q.includes('suggestion') || q.includes('advice')) {
    return `Here are my top recommendations based on current procurement data:\n\n${recommendations
      .slice(0, 4)
      .map((r, i) => `${i + 1}. **${r.title}** (${r.priority} priority)\n   ${r.description}\n   Impact: ${r.impact} | Confidence: ${r.confidence}%`)
      .join('\n\n')}\n\nWould you like me to elaborate on any of these?`;
  }

  if (q.includes('supplier') && (q.includes('list') || q.includes('all') || q.includes('how many'))) {
    return `You have ${suppliers.length} active suppliers across ${new Set(suppliers.map((s) => s.category)).size} categories.\n\n**By risk level:**\n• High: ${suppliers.filter((s) => s.riskLevel === 'HIGH').length}\n• Medium: ${suppliers.filter((s) => s.riskLevel === 'MEDIUM').length}\n• Low: ${suppliers.filter((s) => s.riskLevel === 'LOW').length}\n\n**By status:**\n• Preferred: ${suppliers.filter((s) => s.status === 'Preferred').length}\n• Active: ${suppliers.filter((s) => s.status === 'Active').length}\n• Under Review: ${suppliers.filter((s) => s.status === 'Under Review').length}\n• Onboarding: ${suppliers.filter((s) => s.status === 'Onboarding').length}\n\n**Top spend:** TechSource Industries ($312K), Nova Electronics ($274K), Global Materials Ltd. ($248K).`;
  }

  if (q.includes('rfq') || q.includes('open')) {
    const open = rfqs.filter((r) => r.status === 'Open');
    return `There are ${open.length} open RFQs currently.\n\n${open
      .slice(0, 5)
      .map((r) => `• **${r.id}** — ${r.product}\n  ${r.quantity.toLocaleString()} ${r.unit} | Deadline: ${r.deadline} | ${r.responses}/${r.suppliersInvited} responses`)
      .join('\n\n')}\n\n${open.length > 5 ? `...and ${open.length - 5} more open RFQs.` : ''}\n\n**Recommendation:** RFQ-2026-001 has 4 of 5 responses received. Run AI evaluation to select the best supplier.`;
  }

  return `I can help you with procurement questions about suppliers, RFQs, quotations, spend analytics, inventory, price forecasts, and risk analysis.\n\nTry asking:\n• "Which suppliers are high risk?"\n• "Which RFQ has the best quotation?"\n• "Where can we reduce procurement costs?"\n• "Should we buy steel now?"\n• "Which suppliers have the best delivery performance?"\n• "Why did procurement spending increase this month?"\n\nI'm analyzing your demo procurement data in real-time to provide answers.`;
}
