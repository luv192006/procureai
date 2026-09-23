import { NextResponse } from 'next/server';
import { rfqs as defaultRFQs } from '@/lib/data';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const rfqId = params.id;
  const rfq = defaultRFQs.find((r) => r.id === rfqId);

  if (!rfq) {
    return NextResponse.json({ success: false, message: 'RFQ not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: rfq });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const rfqId = params.id;
    const body = await request.json();
    const { status, note, actor } = body;

    const rfq = defaultRFQs.find((r) => r.id === rfqId);
    if (!rfq) {
      return NextResponse.json({ success: false, message: 'RFQ not found' }, { status: 404 });
    }

    const updatedRFQ = {
      ...rfq,
      ...(status ? { status } : {}),
    };

    return NextResponse.json({
      success: true,
      message: `RFQ ${rfqId} updated successfully`,
      data: updatedRFQ,
    });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to update RFQ' }, { status: 500 });
  }
}
