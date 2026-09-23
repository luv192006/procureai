import { NextResponse } from 'next/server';
import { z } from 'zod';

const SendEmailSchema = z.object({
  rfqId: z.string(),
  supplierIds: z.array(z.string()).min(1, 'Select at least one supplier'),
  channel: z.enum(['email', 'portal', 'both']).default('both'),
  customMessage: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = SendEmailSchema.parse(body);

    // Simulate dispatch to suppliers
    const dispatched = validated.supplierIds.map((supId) => ({
      supplierId: supId,
      email: `${supId.toLowerCase()}@supplier.com`,
      status: 'Sent',
      timestamp: new Date().toISOString(),
      portalLink: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/supplier-portal?rfqId=${validated.rfqId}&supplierId=${supId}`,
    }));

    return NextResponse.json({
      success: true,
      message: `RFQ ${validated.rfqId} successfully sent to ${validated.supplierIds.length} suppliers via ${validated.channel}.`,
      dispatched,
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: err.errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'Failed to send email' }, { status: 500 });
  }
}
