import { NextResponse } from 'next/server';
import { z } from 'zod';
import { quotations as defaultQuotations } from '@/lib/data';
import type { Quotation } from '@/lib/types';

const CreateQuotationSchema = z.object({
  rfqId: z.string(),
  supplierId: z.string(),
  supplierName: z.string(),
  unitPrice: z.number().positive('Unit price must be positive'),
  quantity: z.number().positive(),
  deliveryDays: z.number().min(1),
  paymentTerms: z.string().default('Net 30'),
  warranty: z.string().optional().default('12 Months Warranty'),
  remarks: z.string().optional().default(''),
  qualityScore: z.number().min(0).max(100).default(88),
  risk: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('LOW'),
  historicalPerformance: z.number().default(90),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rfqId = searchParams.get('rfqId');

  let list = [...defaultQuotations];
  if (rfqId) {
    list = list.filter((q) => q.rfqId === rfqId);
  }

  return NextResponse.json({ success: true, count: list.length, data: list });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = CreateQuotationSchema.parse(body);

    const price = validated.unitPrice;
    const totalAmount = Math.round(validated.unitPrice * validated.quantity * 100) / 100;
    const overallScore = Math.round(
      (100 - (validated.unitPrice / (validated.unitPrice * 1.2)) * 30) +
      validated.qualityScore * 0.25 +
      (100 - validated.deliveryDays * 2) * 0.2 +
      validated.historicalPerformance * 0.25
    );

    const newQuotation: Quotation = {
      id: `QT-2026-${String(Math.floor(Math.random() * 899) + 100).padStart(3, '0')}`,
      rfqId: validated.rfqId,
      supplierId: validated.supplierId,
      supplierName: validated.supplierName,
      price,
      unitPrice: validated.unitPrice,
      totalAmount,
      deliveryDays: validated.deliveryDays,
      qualityScore: validated.qualityScore,
      paymentTerms: validated.paymentTerms,
      warranty: validated.warranty,
      remarks: validated.remarks,
      risk: validated.risk,
      historicalPerformance: validated.historicalPerformance,
      overallScore: Math.min(Math.max(overallScore, 65), 98),
      submittedAt: new Date().toISOString(),
      status: 'Pending',
    };

    return NextResponse.json({
      success: true,
      message: 'Quotation submitted successfully',
      data: newQuotation,
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: err.errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'Failed to submit quotation' }, { status: 500 });
  }
}
