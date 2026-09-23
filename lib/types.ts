export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type SupplierStatus = 'Active' | 'Under Review' | 'Preferred' | 'Onboarding';
export type RFQStatus =
  | 'Draft'
  | 'Sent'
  | 'Viewed'
  | 'Responses Received'
  | 'Under Review'
  | 'Closed'
  | 'Awarded'
  | 'Open';
export type POStatus = 'Pending' | 'Approved' | 'Shipped' | 'Delivered' | 'Cancelled';
export type StockStatus = 'Healthy' | 'Low Stock' | 'Critical' | 'Overstocked';
export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
export type RecommendationCategory =
  | 'COST SAVING'
  | 'RISK'
  | 'PRICE'
  | 'INVENTORY'
  | 'SUPPLIER'
  | 'CONTRACT';

export interface Supplier {
  id: string;
  name: string;
  category: string;
  location: string;
  spend: number;
  performance: number;
  deliveryRate: number;
  qualityScore: number;
  riskScore: number;
  riskLevel: RiskLevel;
  status: SupplierStatus;
  contactEmail: string;
  contactPhone: string;
  website: string;
  founded: number;
  employees: number;
  annualRevenue: string;
  onTimeDelivery: number;
  totalOrders: number;
  activeContracts: number;
  paymentTerms: string;
  certifications: string[];
  riskBreakdown: {
    financial: number;
    delivery: number;
    quality: number;
    priceStability: number;
  };
  recentTransactions: {
    id: string;
    date: string;
    amount: number;
    product: string;
    status: string;
  }[];
  recentRFQs: string[];
  aiAnalysis: string;
}

export interface RFQTimelineItem {
  id: string;
  status: RFQStatus;
  timestamp: string;
  title: string;
  description?: string;
  actor?: string;
}

export interface RFQSentHistory {
  supplierId: string;
  supplierName: string;
  email: string;
  sentAt: string;
  status: 'Sent' | 'Delivered' | 'Opened' | 'Failed';
  portalUrl?: string;
  viewedAt?: string;
}

export interface RFQ {
  id: string;
  product: string;
  description: string;
  quantity: number;
  unit: string;
  deadline: string;
  targetPrice: number;
  budget?: number;
  specifications?: Record<string, string> | string;
  suppliersInvited: number;
  responses: number;
  status: RFQStatus;
  category: string;
  createdDate: string;
  suppliers: string[];
  pdfUrl?: string;
  timeline?: RFQTimelineItem[];
  sentHistory?: RFQSentHistory[];
  viewCount?: number;
  paymentTerms?: string;
  shippingTerms?: string;
  deliveryLocation?: string;
}

export interface Quotation {
  id: string;
  rfqId: string;
  supplierId: string;
  supplierName: string;
  price: number;
  unitPrice?: number;
  totalAmount?: number;
  deliveryDays: number;
  qualityScore: number;
  paymentTerms: string;
  warranty?: string;
  remarks?: string;
  documentUrl?: string;
  extractedByAI?: boolean;
  risk: RiskLevel;
  historicalPerformance: number;
  overallScore: number;
  submittedAt?: string;
  status?: 'Pending' | 'Under Review' | 'Accepted' | 'Rejected' | 'Awarded';
}

export interface InventoryItem {
  id: string;
  product: string;
  sku: string;
  currentStock: number;
  dailyDemand: number;
  reorderPoint: number;
  leadTime: number;
  unit: string;
  unitCost: number;
  status: StockStatus;
  category: string;
  supplier: string;
}

export interface SpendDataPoint {
  month: string;
  spend: number;
  savings: number;
  budget: number;
}

export interface CategorySpend {
  category: string;
  spend: number;
  color: string;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: RecommendationCategory;
  priority: Priority;
  impact: string;
  impactValue: number;
  confidence: number;
  action: string;
  relatedSupplier?: string;
}

export interface PriceForecast {
  material: string;
  currentPrice: number;
  unit: string;
  forecast30Day: number;
  expectedChange: number;
  confidence: number;
  history: { month: string; price: number; predicted?: boolean; upper?: number; lower?: number }[];
  recommendation: string;
}

export interface Notification {
  id: string;
  type: 'risk' | 'quotation' | 'price' | 'inventory' | 'savings' | 'rfq';
  title: string;
  description: string;
  time: string;
  read: boolean;
  link?: string;
}

export interface PurchaseOrder {
  id: string;
  supplier: string;
  product: string;
  quantity: number;
  amount: number;
  status: POStatus;
  date: string;
  deliveryDate: string;
}
