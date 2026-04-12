'use client';

import { RowActionsMenu } from '@/components/shared/row-actions-menu';
import { deleteCompany } from '@/app/(app)/customers/actions';

export function CompanyRowActions({ companyId, companyName }: { companyId: string; companyName: string }) {
  return (
    <RowActionsMenu
      entityType="company"
      entityId={companyId}
      entityName={companyName}
      onDelete={deleteCompany}
    />
  );
}
