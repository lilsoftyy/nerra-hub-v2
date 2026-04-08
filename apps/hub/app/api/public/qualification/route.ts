import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { v7 as uuidv7 } from 'uuid';
import { z } from 'zod';
import crypto from 'crypto';

const qualificationSchema = z.object({
  contact_name: z.string().min(1),
  contact_email: z.string().email(),
  contact_phone: z.string().optional(),
  company_name: z.string().min(1),
  country: z.string().min(1),
  operational_area: z.string().optional(),
  employee_count: z.coerce.number().optional(),
  facade_team_size: z.coerce.number().optional(),
  building_types: z.string().min(1),
  current_methods: z.string().optional(),
  drone_experience: z.string().optional(),
  desired_start_date: z.string().optional(),
  drone_teams: z.coerce.number().optional(),
  additional_info: z.string().optional(),
});

export async function POST(request: Request) {
  // Allow CORS from qualification form
  const origin = request.headers.get('origin') ?? '';

  try {
    const body = await request.json();
    const parsed = qualificationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ugyldig data', details: parsed.error.flatten() },
        { status: 400, headers: corsHeaders(origin) },
      );
    }

    const data = parsed.data;
    const supabase = createServiceClient();

    // 1. Create company
    const companyId = uuidv7();
    const { error: companyError } = await supabase.from('companies').insert({
      id: companyId,
      name: data.company_name,
      country: data.country,
      operational_area: data.operational_area || null,
      employee_count: data.employee_count || null,
      facade_team_size: data.facade_team_size || null,
      phase: 'lead',
    });

    if (companyError) {
      return NextResponse.json(
        { error: companyError.message },
        { status: 500, headers: corsHeaders(origin) },
      );
    }

    // 2. Create primary contact
    await supabase.from('contacts').insert({
      id: uuidv7(),
      company_id: companyId,
      full_name: data.contact_name,
      email: data.contact_email,
      phone: data.contact_phone || null,
      is_primary: true,
    });

    // 3. Save DWA details
    await supabase.from('customer_dwa_details').insert({
      company_id: companyId,
      existing_drone_experience: data.drone_experience || null,
      target_start_date: data.desired_start_date || null,
      pilots_to_train: data.drone_teams || null,
    });

    // 4. Save qualification form response
    const slug = crypto.randomBytes(16).toString('base64url');
    await supabase.from('qualification_form_responses').insert({
      id: uuidv7(),
      slug,
      company_id: companyId,
      responses: data,
      submitted_at: new Date().toISOString(),
      submitter_email: data.contact_email,
    });

    // 5. Log activity
    await supabase.from('activity_log').insert({
      id: uuidv7(),
      actor_type: 'human',
      action: 'qualification.submitted',
      entity_type: 'company',
      entity_id: companyId,
      company_id: companyId,
      details: { submitter: data.contact_name, company: data.company_name },
    });

    return NextResponse.json(
      { success: true, company_id: companyId },
      { headers: corsHeaders(origin) },
    );
  } catch {
    return NextResponse.json(
      { error: 'Serverfeil' },
      { status: 500, headers: corsHeaders(origin) },
    );
  }
}

// Handle CORS preflight
export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin') ?? '';
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

function corsHeaders(origin: string): Record<string, string> {
  const allowed = [
    'https://nerra-qualification.vercel.app',
    'http://localhost:3001',
  ];
  const allowOrigin = allowed.includes(origin) ? origin : '';

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
