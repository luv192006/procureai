import { rfqs as defaultRFQs, quotations as defaultQuotations, notifications as defaultNotifications } from './data';
import type { RFQ, Quotation, Notification, RFQStatus } from './types';

const RFQ_KEY = 'procureai-rfqs-v2';
const QUOTE_KEY = 'procureai-quotations-v2';
const NOTIF_KEY = 'procureai-notifications-v2';

export function getStoredRFQs(): RFQ[] {
  if (typeof window === 'undefined') return defaultRFQs;
  const stored = localStorage.getItem(RFQ_KEY);
  if (!stored) {
    // Enrich default RFQs with budget and timeline
    const enriched = defaultRFQs.map((r) => ({
      ...r,
      budget: r.budget || r.targetPrice * r.quantity,
      specifications: r.specifications || {
        'Material Standard': 'Grade A Industrial',
        'Quality Tolerance': '±0.05mm',
        'Inspection Requirement': '100% Visual & Dimensional Audit',
        'Packaging Requirement': 'Standard Export Pallets',
      },
      timeline: r.timeline || [
        { id: 't1', status: 'Draft', timestamp: `${r.createdDate} 09:00`, title: 'RFQ Created as Draft', actor: 'Alex Morgan' },
        { id: 't2', status: 'Sent', timestamp: `${r.createdDate} 10:30`, title: `Dispatched to ${r.suppliersInvited} Suppliers via Email/Portal`, actor: 'ProcureAI Automation Engine' },
        { id: 't3', status: 'Viewed', timestamp: `${r.createdDate} 14:15`, title: 'Supplier viewed RFQ details in portal', actor: 'Supplier Portal' },
        ...(r.responses > 0
          ? [{ id: 't4', status: 'Responses Received' as RFQStatus, timestamp: `${r.createdDate} 18:00`, title: `${r.responses} Quotation responses submitted`, actor: 'Supplier Portal' }]
          : []),
      ],
      sentHistory: r.sentHistory || [
        { supplierId: r.suppliers[0] || 'SUP-001', supplierName: 'Global Materials Ltd.', email: 'contact@globalmaterials.com', sentAt: `${r.createdDate} 10:30`, status: 'Opened' },
        { supplierId: r.suppliers[1] || 'SUP-002', supplierName: 'Prime Components', email: 'sales@primecomponents.com', sentAt: `${r.createdDate} 10:30`, status: 'Sent' },
      ],
      viewCount: r.viewCount || Math.floor(Math.random() * 12) + 4,
    }));
    localStorage.setItem(RFQ_KEY, JSON.stringify(enriched));
    return enriched;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return defaultRFQs;
  }
}

export function saveStoredRFQs(list: RFQ[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(RFQ_KEY, JSON.stringify(list));
}

export function getStoredQuotations(): Quotation[] {
  if (typeof window === 'undefined') return defaultQuotations;
  const stored = localStorage.getItem(QUOTE_KEY);
  if (!stored) {
    localStorage.setItem(QUOTE_KEY, JSON.stringify(defaultQuotations));
    return defaultQuotations;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return defaultQuotations;
  }
}

export function saveStoredQuotations(quotes: Quotation[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(QUOTE_KEY, JSON.stringify(quotes));
}

export function getStoredNotifications(): Notification[] {
  if (typeof window === 'undefined') return defaultNotifications;
  const stored = localStorage.getItem(NOTIF_KEY);
  if (!stored) {
    localStorage.setItem(NOTIF_KEY, JSON.stringify(defaultNotifications));
    return defaultNotifications;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return defaultNotifications;
  }
}

export function addNotification(notif: Omit<Notification, 'id' | 'time' | 'read'>) {
  if (typeof window === 'undefined') return;
  const current = getStoredNotifications();
  const newNotif: Notification = {
    id: `NOTIF-${Date.now()}`,
    time: 'Just now',
    read: false,
    ...notif,
  };
  const updated = [newNotif, ...current];
  localStorage.setItem(NOTIF_KEY, JSON.stringify(updated));
  // Dispatch custom event for UI updates
  window.dispatchEvent(new Event('procureai-notification'));
}
