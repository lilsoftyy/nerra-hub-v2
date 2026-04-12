'use client';

import { RowActionsMenu } from '@/components/shared/row-actions-menu';
import { deleteContact } from '@/app/(app)/customers/actions';

export function ContactRowActions({ contactId, contactName, onEdit }: { contactId: string; contactName: string; onEdit?: () => void }) {
  return (
    <RowActionsMenu
      entityType="contact"
      entityId={contactId}
      entityName={contactName}
      onDelete={deleteContact}
      onEdit={onEdit}
    />
  );
}
