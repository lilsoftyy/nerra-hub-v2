import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // For now, log the submission. In production, this will:
    // 1. Validate the HMAC token
    // 2. Store in Supabase qualification_form_responses
    // 3. Trigger the research agent
    console.log('Qualification form submission:', JSON.stringify(data, null, 2));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
