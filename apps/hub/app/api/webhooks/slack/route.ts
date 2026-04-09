import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { runResearchAgent } from '@/lib/agents/research-agent';
import crypto from 'crypto';

async function verifySlackSignature(request: Request, body: string): Promise<boolean> {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) return false;

  const timestamp = request.headers.get('x-slack-request-timestamp');
  const signature = request.headers.get('x-slack-signature');

  if (!timestamp || !signature) return false;

  // Prevent replay attacks (5 min window)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - Number(timestamp)) > 300) return false;

  const sigBasestring = `v0:${timestamp}:${body}`;
  const mySignature = 'v0=' + crypto
    .createHmac('sha256', signingSecret)
    .update(sigBasestring)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(mySignature), Buffer.from(signature));
}

export async function POST(request: Request) {
  const body = await request.text();

  // Verify Slack signature
  const isValid = await verifySlackSignature(request, body);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const params = new URLSearchParams(body);
  const command = params.get('command');
  const text = params.get('text')?.trim() ?? '';

  if (command === '/research') {
    if (!text) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: 'Bruk: /research <firmanavn>',
      });
    }

    // Find company by name
    const supabase = createServiceClient();
    const { data: companies } = await supabase
      .from('companies')
      .select('id, name')
      .ilike('name', `%${text}%`)
      .is('deleted_at', null)
      .limit(1);

    if (!companies || companies.length === 0) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: `Fant ingen kunde med navn "${text}". Opprett kunden i Hub forst.`,
      });
    }

    const company = companies[0]!;

    // Run research in background (respond immediately to Slack)
    runResearchAgent(company.id).catch(() => {});

    return NextResponse.json({
      response_type: 'in_channel',
      text: `Starter research for *${company.name}*. Resultatet postes i kanalen nar det er klart.`,
    });
  }

  return NextResponse.json({
    response_type: 'ephemeral',
    text: 'Ukjent kommando.',
  });
}
