import { NextResponse } from 'next/server';
import { extractRequirementsFromText } from '@/lib/rfq-ai';

export async function POST(request: Request) {
  try {
    const { rawText } = await request.json();
    if (!rawText) {
      return NextResponse.json({ success: false, message: 'rawText is required' }, { status: 400 });
    }

    const extracted = extractRequirementsFromText(rawText);
    return NextResponse.json({ success: true, data: extracted });
  } catch {
    return NextResponse.json({ success: false, message: 'AI Requirement Extraction failed' }, { status: 500 });
  }
}
