'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { updateTaskStatus } from '@/app/(app)/tasks/actions';
import { TaskEditDialog } from './task-edit-dialog';
import { TaskCreateDialog } from './task-create-dialog';
import {
  taskPriorityLabels,
  taskPriorityColors,
  taskCategoryLabels,
  taskCategoryColors,
} from '@/lib/labels';
import { GripVertical } from 'lucide-react';
import { formatShortDate } from '@/lib/formatters';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  category: string | null;
  due_date: string | null;
  company_id: string | null;
  companies: { name: string } | null;
  description?: string | null;
}

interface Company {
  id: string;
  name: string;
}

interface KanbanBoardProps {
  tasks: Task[];
  companies: Company[];
}

const COLUMNS = [
  { id: 'open', label: 'Åpne' },
  { id: 'in_progress', label: 'Under arbeid' },
  { id: 'done', label: 'Fullført' },
];

export function KanbanBoard({ tasks: initialTasks, companies }: KanbanBoardProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  useEffect(() => { setTasks(initialTasks); }, [initialTasks]);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const columns = COLUMNS.map((col) => ({
    ...col,
    tasks: tasks.filter((t) => t.status === col.id),
  }));

  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);

    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    setUpdatingTaskId(taskId);

    const result = await updateTaskStatus(taskId, newStatus);
    if (result?.error) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: task.status } : t))
      );
    }

    setUpdatingTaskId(null);
    router.refresh();
  }, [tasks, router]);

  const handleCardClick = useCallback((task: Task) => {
    setEditingTask(task);
  }, []);

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        {columns.map((column) => (
          <div
            key={column.id}
            className={`min-h-[200px] rounded-lg border bg-muted/30 p-3 transition-[background-color,border-color] duration-150 ${
              dragOverColumn === column.id
                ? 'border-primary/30 bg-primary/5'
                : 'border-transparent'
            }`}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium">{column.label}</h3>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {column.tasks.length}
                </span>
              </div>
              {column.id === 'open' && (
                <TaskCreateDialog companies={companies} />
              )}
            </div>

            <div className="space-y-2">
              {column.tasks.map((task) => {
                const company = task.companies;
                const isDragging = draggedTaskId === task.id;
                const isUpdating = updatingTaskId === task.id;

                return (
                  <Card
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => handleCardClick(task)}
                    className={`cursor-grab p-3 !shadow-none border transition-[opacity] duration-150 active:cursor-grabbing ${
                      isDragging ? 'opacity-50' : ''
                    } ${isUpdating ? 'opacity-70' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical
                        className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/40"
                        strokeWidth={1.75}
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-snug">{task.title}</p>
                        {company && (
                          <p className="mt-0.5 text-xs text-muted-foreground">{company.name}</p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <Badge className={`text-[10px] ${taskPriorityColors[task.priority] ?? ''}`}>
                            {taskPriorityLabels[task.priority] ?? task.priority}
                          </Badge>
                          {task.category && (
                            <Badge className={`text-[10px] ${taskCategoryColors[task.category] ?? ''}`}>
                              {taskCategoryLabels[task.category] ?? task.category}
                            </Badge>
                          )}
                          {task.due_date && (
                            <span className="text-[10px] text-muted-foreground tabular-nums">
                              {formatShortDate(task.due_date)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}

              {column.tasks.length === 0 && (
                <div className="rounded-md border border-dashed py-8 text-center">
                  <p className="text-xs text-muted-foreground">
                    {column.id === 'open' && 'Dra oppgaver hit eller opprett nye'}
                    {column.id === 'in_progress' && 'Dra oppgaver hit for å starte'}
                    {column.id === 'done' && 'Dra ferdige oppgaver hit'}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <TaskEditDialog
        task={editingTask}
        companies={companies}
        open={editingTask !== null}
        onOpenChange={(open) => {
          if (!open) setEditingTask(null);
        }}
      />
    </>
  );
}
