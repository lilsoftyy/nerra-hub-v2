'use server';

import { createClient } from '@/lib/supabase/server';
import { v7 as uuidv7 } from 'uuid';
import { redirect } from 'next/navigation';
import crypto from 'crypto';

export async function createContract(companyId: string, formData: FormData) {
  const supabase = await createClient();

  const packagesRaw = formData.get('packages') as string;
  const subtotal = Number(formData.get('subtotal')) || 0;
  const adjustmentPercent = Number(formData.get('adjustment_percent')) || 0;
  const currency = (formData.get('currency') as string) || 'NOK';
  const validUntilStr = formData.get('valid_until') as string;
  const language = (formData.get('language') as string) || 'no';

  let packages;
  try {
    packages = JSON.parse(packagesRaw || '[]');
  } catch {
    packages = [];
  }

  const adjustment = subtotal * (adjustmentPercent / 100);
  const total = subtotal + adjustment;

  const slug = crypto.randomBytes(16).toString('base64url');
  const contractId = uuidv7();

  const { error } = await supabase.from('contracts').insert({
    id: contractId,
    company_id: companyId,
    status: 'draft',
    packages,
    subtotal,
    adjustment_percent: adjustmentPercent,
    total,
    currency,
    valid_until: validUntilStr || null,
    public_url_slug: slug,
    language,
  });

  if (error) return { error: error.message };

  redirect(`/contracts/${contractId}`);
}

export async function updateContractStatus(contractId: string, status: string) {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = { status };

  if (status === 'sent') {
    updateData.sent_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('contracts')
    .update(updateData)
    .eq('id', contractId);

  if (error) return { error: error.message };
  return { success: true };
}
