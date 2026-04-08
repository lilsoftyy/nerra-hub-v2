'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { updateTaskStatus } from '@/app/(app)/tasks/actions';

interface TaskStatusButtonProps {
  taskId: string;
  currentStatus: string;
}

export function TaskStatusButton({ taskId, currentStatus }: TaskStatusButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (currentStatus === 'done' || currentStatus === 'cancelled') {
    return null;
  }

  const nextStatus = currentStatus === 'open' ? 'in_progress' : 'done';
  const label = currentStatus === 'open' ? 'Start' : 'Fullfør';

  const handleClick = async () => {
    setLoading(true);
    const result = await updateTaskStatus(taskId, nextStatus);
    if (result?.error) {
      alert(result.error);
    }
    router.refresh();
    setLoading(false);
  };

  return (
    <Button size="sm" variant="outline" onClick={handleClick} disabled={loading}>
      {loading ? '...' : label}
    </Button>
  );
}
