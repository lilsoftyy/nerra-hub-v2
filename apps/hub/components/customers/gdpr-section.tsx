'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { exportCustomerData, deleteCustomerData } from '@/app/(app)/customers/gdpr-actions';

interface GdprSectionProps {
  companyId: string;
  companyName: string;
}

export function GdprSection({ companyId, companyName }: GdprSectionProps) {
  const [confirmName, setConfirmName] = useState('');
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await exportCustomerData(companyId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${companyName.toLowerCase().replace(/\s+/g, '-')}-data-export.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    await deleteCustomerData(companyId);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground">GDPR</h3>
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={handleExport}
        disabled={exporting}
      >
        {exporting ? 'Eksporterer...' : 'Eksporter kundedata'}
      </Button>

      <AlertDialog>
        <AlertDialogTrigger
          render={<Button variant="destructive" size="sm" className="w-full" />}
        >
          Slett kunde permanent
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
            <AlertDialogDescription>
              Dette sletter all data knyttet til <strong>{companyName}</strong> permanent.
              Denne handlingen kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-2">
              Skriv &quot;{companyName}&quot; for å bekrefte:
            </p>
            <Input
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={companyName}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmName('')}>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={confirmName !== companyName || deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Sletter...' : 'Slett permanent'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
