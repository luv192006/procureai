import { NextResponse } from 'next/server';
import { z } from 'zod';
import { rfqs as defaultRFQs } from '@/lib/data';
import type { RFQ } from '@/lib/types';

const CreateRFQSchema = z.object({
  product: z.string().min(2, 'Product name is required'),
  description: z.string().optional().default(''),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unit: z.string().default('units'),
  deadline: z.string().min(1, 'Deadline date is required'),
  targetPrice: z.number().min(0).default(0),
  category: z.string().default('Raw Materials'),
  suppliers: z.array(z.string()).default([]),
  specifications: z.union([z.record(z.string()), z.string()]).optional(),
  paymentTerms: z.string().optional().default('Net 30'),
  deliveryLocation: z.string().optional().default('Main Warehouse'),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  let filtered = [...defaultRFQs];
  if (status && status !== 'all') {
    filtered = filtered.filter((r) => r.status === status);
  }

  return NextResponse.json({ success: true, count: filtered.length, data: filtered });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = CreateRFQSchema.parse(body);

    const rfqId = `RFQ-2026-${String(Math.floor(Math.random() * 899) + 100).padStart(3, '0')}`;
    const budget = validated.targetPrice * validated.quantity;

    const newRFQ: RFQ = {
      id: rfqId,
      product: validated.product,
      description: validated.description,
      quantity: validated.quantity,
      unit: validated.unit,
      deadline: validated.deadline,
      targetPrice: validated.targetPrice,
      budget,
      specifications: validated.specifications || {
        'Quality Standard': 'ISO Compliant',
        'Inspection': 'Incoming Inspection Required',
      },
      suppliersInvited: validated.suppliers.length,
      responses: 0,
      status: validated.suppliers.length > 0 ? 'Sent' : 'Draft',
      category: validated.category,
      createdDate: new Date().toISOString().split('T')[0],
      suppliers: validated.suppliers,
      paymentTerms: validated.paymentTerms,
      deliveryLocation: validated.deliveryLocation,
      viewCount: 0,
      timeline: [
        {
          id: `t-${Date.now()}-1`,
          status: 'Draft',
          timestamp: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          title: 'RFQ Created',
          description: `Created RFQ for ${validated.product} (${validated.quantity} ${validated.unit})`,
          actor: 'Procurement Officer',
        },
        ...(validated.suppliers.length > 0
          ? [{
              id: `t-${Date.now()}-2`,
              status: 'Sent' as const,
              timestamp: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
              title: `Dispatched RFQ to ${validated.suppliers.length} matched suppliers`,
              actor: 'AI Dispatch Engine',
            }]
          : []),
      ],
      sentHistory: validated.suppliers.map((supId) => ({
        supplierId: supId,
        supplierName: supId,
        email: `${supId.toLowerCase()}@supplier.com`,
        sentAt: new Date().toISOString(),
        status: 'Sent' as const,
        portalUrl: `/supplier-portal?rfqId=${rfqId}&supplierId=${supId}`,
      })),
    };

    return NextResponse.json({
      success: true,
      message: `RFQ ${rfqId} created successfully`,
      data: newRFQ,
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: err.errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
