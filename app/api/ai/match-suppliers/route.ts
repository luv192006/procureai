import { NextResponse } from 'next/server';
import { matchSuppliersForRFQ } from '@/lib/rfq-ai';

export async function POST(request: Request) {
  try {
    const { category, targetPrice, quantity } = await request.json();
    if (!category) {
      return NextResponse.json({ success: false, message: 'category is required' }, { status: 400 });
    }

    const matches = matchSuppliersForRFQ(category, targetPrice, quantity);
    return NextResponse.json({ success: true, count: matches.length, data: matches });
  } catch {
    return NextResponse.json({ success: false, message: 'AI Supplier Matching failed' }, { status: 500 });
  }
}
