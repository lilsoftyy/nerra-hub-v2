import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import React from 'react';

const styles = StyleSheet.create({
  page: { padding: 50, fontSize: 11, fontFamily: 'Helvetica' },
  title: { fontSize: 22, marginBottom: 20, fontFamily: 'Helvetica-Bold' },
  subtitle: { fontSize: 14, marginBottom: 10, color: '#666' },
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', marginBottom: 8 },
  row: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#eee' },
  rowLabel: { flex: 1 },
  rowValue: { width: 80, textAlign: 'right' as const },
  totalRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, paddingVertical: 6, borderTopWidth: 2, borderTopColor: '#333', marginTop: 4 },
  totalLabel: { flex: 1, fontFamily: 'Helvetica-Bold', fontSize: 13 },
  totalValue: { width: 100, textAlign: 'right' as const, fontFamily: 'Helvetica-Bold', fontSize: 13 },
  footer: { position: 'absolute' as const, bottom: 40, left: 50, right: 50, fontSize: 9, color: '#999', textAlign: 'center' as const },
  meta: { fontSize: 10, color: '#666', marginBottom: 4 },
});

interface ContractPDFProps {
  companyName: string;
  packages: Array<{ name: string; persons: number; price: number }>;
  subtotal: number;
  adjustmentPercent: number;
  total: number;
  currency: string;
  validUntil: string | null;
}

function createContractDocument({ companyName, packages, subtotal, adjustmentPercent, total, currency, validUntil }: ContractPDFProps) {
  const formatAmount = (amount: number) => `${amount.toLocaleString('nb-NO')} ${currency}`;

  return React.createElement(Document, null,
    React.createElement(Page, { size: 'A4', style: styles.page },
      React.createElement(Text, { style: styles.title }, 'Tilbud'),
      React.createElement(Text, { style: styles.subtitle }, companyName),
      validUntil ? React.createElement(Text, { style: styles.meta }, `Gyldig til: ${new Date(validUntil).toLocaleDateString('nb-NO')}`) : null,
      React.createElement(Text, { style: styles.meta }, `Dato: ${new Date().toLocaleDateString('nb-NO')}`),

      React.createElement(View, { style: { ...styles.section, marginTop: 20 } },
        React.createElement(Text, { style: styles.sectionTitle }, 'Pakker'),
        React.createElement(View, { style: styles.row },
          React.createElement(Text, { style: { ...styles.rowLabel, fontFamily: 'Helvetica-Bold' } }, 'Beskrivelse'),
          React.createElement(Text, { style: { width: 50, textAlign: 'right' as const, fontFamily: 'Helvetica-Bold' } }, 'Antall'),
          React.createElement(Text, { style: { ...styles.rowValue, fontFamily: 'Helvetica-Bold' } }, 'Pris'),
          React.createElement(Text, { style: { ...styles.rowValue, fontFamily: 'Helvetica-Bold' } }, 'Sum'),
        ),
        ...packages.map((pkg, i) =>
          React.createElement(View, { key: i, style: styles.row },
            React.createElement(Text, { style: styles.rowLabel }, pkg.name || 'Pakke'),
            React.createElement(Text, { style: { width: 50, textAlign: 'right' as const } }, String(pkg.persons)),
            React.createElement(Text, { style: styles.rowValue }, formatAmount(pkg.price)),
            React.createElement(Text, { style: styles.rowValue }, formatAmount(pkg.price * pkg.persons)),
          )
        ),
      ),

      React.createElement(View, { style: styles.section },
        React.createElement(View, { style: styles.row },
          React.createElement(Text, { style: styles.rowLabel }, 'Subtotal'),
          React.createElement(Text, { style: styles.rowValue }, formatAmount(subtotal)),
        ),
        adjustmentPercent !== 0 ? React.createElement(View, { style: styles.row },
          React.createElement(Text, { style: styles.rowLabel }, `Justering (${adjustmentPercent}%)`),
          React.createElement(Text, { style: styles.rowValue }, formatAmount(subtotal * adjustmentPercent / 100)),
        ) : null,
        React.createElement(View, { style: styles.totalRow },
          React.createElement(Text, { style: styles.totalLabel }, 'Total'),
          React.createElement(Text, { style: styles.totalValue }, formatAmount(total)),
        ),
      ),

      React.createElement(View, { style: styles.footer },
        React.createElement(Text, null, 'Nerra AS -- Drone Wash Academy'),
      ),
    )
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ contractId: string }> },
) {
  const { contractId } = await params;
  const supabase = await createClient();

  const { data: contract } = await supabase
    .from('contracts')
    .select('*, companies(name)')
    .eq('id', contractId)
    .single();

  if (!contract) {
    return NextResponse.json({ error: 'Kontrakt ikke funnet' }, { status: 404 });
  }

  const company = contract.companies as unknown as { name: string } | null;
  const packages = (contract.packages ?? []) as Array<{ name: string; persons: number; price: number }>;

  const pdfElement = createContractDocument({
    companyName: company?.name ?? 'Ukjent',
    packages,
    subtotal: contract.subtotal ?? 0,
    adjustmentPercent: contract.adjustment_percent ?? 0,
    total: contract.total ?? 0,
    currency: contract.currency ?? 'NOK',
    validUntil: contract.valid_until,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- React-PDF types don't align with React 19
  const pdfBuffer = await renderToBuffer(pdfElement as any);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="kontrakt-${company?.name ?? 'ukjent'}.pdf"`,
    },
  });
}
