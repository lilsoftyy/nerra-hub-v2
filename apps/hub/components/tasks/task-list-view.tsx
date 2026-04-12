'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { TaskEditDialog } from './task-edit-dialog';
import { useToast } from '@/components/shared/toast-provider';
import { createTaskFromDialog, updateTaskStatus } from '@/app/(app)/tasks/actions';
import { TEAM_MEMBERS } from '@/lib/constants';
import {
  taskPriorityLabels,
  taskPriorityColors,
  taskCategoryLabels,
  taskCategoryColors,
} from '@/lib/labels';
import { formatShortDate } from '@/lib/formatters';
import { GripVertical, Plus, ArrowUpDown, Clock, ChevronRight } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  category: string | null;
  due_date: string | null;
  estimated_hours: number | null;
  assignee_agent: string | null;
  company_id: string | null;
  companies: { name: string } | null;
  description?: string | null;
}

interface TaskListViewProps {
  tasks: Task[];
  companies: { id: string; name: string }[];
}

const STATUS_SECTIONS = [
  { id: 'open', label: 'Åpne' },
  { id: 'in_progress', label: 'Under arbeid' },
  { id: 'done', label: 'Fullført', collapsible: true },
];

type SortKey = 'priority' | 'category' | 'due_date' | null;
type SortDir = 'asc' | 'desc';
const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

function assigneeLabel(email: string | null): string {
  if (!email) return '—';
  if (email.startsWith('magnus')) return 'Mag';
  if (email.startsWith('martin')) return 'Mar';
  return TEAM_MEMBERS[email]?.slice(0, 3) ?? '—';
}

export function TaskListView({ tasks, companies }: TaskListViewProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [addingInSection, setAddingInSection] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);
  const [doneExpanded, setDoneExpanded] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else { setSortKey(null); setSortDir('asc'); }
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortTasks = (list: Task[]) => {
    if (!sortKey) return list;
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'priority') {
        cmp = (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9);
      } else if (sortKey === 'category') {
        cmp = (a.category ?? 'zzz').localeCompare(b.category ?? 'zzz', 'nb');
      } else if (sortKey === 'due_date') {
        cmp = (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999');
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  };

  const handleQuickAdd = async (status: string) => {
    if (!newTitle.trim() || saving) return;
    setSaving(true);
    const formData = new FormData();
    formData.set('title', newTitle.trim());
    formData.set('priority', 'medium');
    formData.set('status', status);
    const result = await createTaskFromDialog(formData);
    if (result?.error) {
      addToast({ type: 'error', title: 'Feil', description: result.error });
    } else {
      setNewTitle('');
      setAddingInSection(null);
      router.refresh();
    }
    setSaving(false);
  };

  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOverSection(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) { setDraggedTaskId(null); return; }
    setDraggedTaskId(null);
    await updateTaskStatus(taskId, newStatus);
    router.refresh();
  }, [tasks, router]);

  const today = new Date().toISOString().split('T')[0]!;

  return (
    <>
      <div className="rounded-xl">
        {/* Header */}
        <div className="flex items-center gap-4 px-3 py-2 text-[11px] font-medium text-muted-foreground/50">
          <div className="w-5" />
          <div className="flex-1">Oppgave</div>
          <button onClick={() => handleSort('priority')} className="w-20 text-center flex items-center justify-center gap-1 hover:text-foreground transition-[color] duration-150">
            Prioritet
            {sortKey === 'priority' && <ArrowUpDown className="size-3" />}
          </button>
          <button onClick={() => handleSort('category')} className="w-24 text-center flex items-center justify-center gap-1 hover:text-foreground transition-[color] duration-150">
            Kategori
            {sortKey === 'category' && <ArrowUpDown className="size-3" />}
          </button>
          <div className="w-12 text-center">Timer</div>
          <div className="w-24">Firma</div>
          <div className="w-14 text-center">Tildelt</div>
          <button onClick={() => handleSort('due_date')} className="w-20 text-right flex items-center justify-end gap-1 hover:text-foreground transition-[color] duration-150">
            Frist
            {sortKey === 'due_date' && <ArrowUpDown className="size-3" />}
          </button>
        </div>

        {/* Sections */}
        {STATUS_SECTIONS.map((section) => {
          const sectionTasks = sortTasks(tasks.filter((t) => t.status === section.id));
          const isDragOver = dragOverSection === section.id;

          return (
            <div
              key={section.id}
              onDragOver={(e) => { e.preventDefault(); setDragOverSection(section.id); }}
              onDragLeave={() => setDragOverSection(null)}
              onDrop={(e) => handleDrop(e, section.id)}
            >
              {/* Section header */}
              <div
                className={`flex items-center gap-2 px-4 py-1.5 transition-[background-color] duration-150 ${isDragOver ? 'bg-primary/[0.08]' : 'bg-muted/10'} ${'collapsible' in section ? 'cursor-pointer' : ''}`}
                onClick={() => { if ('collapsible' in section) setDoneExpanded(!doneExpanded); }}
              >
                {'collapsible' in section && (
                  <ChevronRight className={`size-3 text-muted-foreground transition-transform duration-150 ${doneExpanded ? 'rotate-90' : ''}`} strokeWidth={2} />
                )}
                <span className="text-xs font-semibold">{section.label}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">{sectionTasks.length}</span>
              </div>

              {/* Rows — hide done tasks unless expanded */}
              {('collapsible' in section && !doneExpanded) ? null : sectionTasks.map((task) => {
                const isDone = task.status === 'done';
                const isOverdue = task.due_date && task.due_date.split(/[T ]/)[0]! < today && !isDone;
                const isDragging = draggedTaskId === task.id;

                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={() => setDraggedTaskId(null)}
                    onClick={() => setEditingTask(task)}
                    className={`group flex items-center gap-3 px-3 py-1.5 rounded-md cursor-pointer transition-all duration-150 hover:bg-primary/[0.06] hover:border-l-2 hover:border-l-primary/40 hover:pl-[14px] ${isDragging ? 'opacity-40' : ''}`}
                  >
                    {/* Drag handle */}
                    <GripVertical
                      className="size-3.5 shrink-0 text-muted-foreground/20 transition-[color] duration-150 group-hover:text-muted-foreground/60 cursor-grab active:cursor-grabbing"
                      strokeWidth={1.75}
                    />

                    {/* Task name */}
                    <div className={`flex-1 text-xs ${isDone ? 'text-muted-foreground line-through' : ''}`}>
                      {task.title}
                    </div>

                    {/* Priority */}
                    <div className="w-20 text-center">
                      <Badge className={`text-[10px] ${taskPriorityColors[task.priority] ?? ''}`}>
                        {taskPriorityLabels[task.priority] ?? task.priority}
                      </Badge>
                    </div>

                    {/* Category */}
                    <div className="w-24 text-center">
                      {task.category ? (
                        <Badge className={`text-[10px] ${taskCategoryColors[task.category] ?? ''}`}>
                          {taskCategoryLabels[task.category] ?? task.category}
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/30">—</span>
                      )}
                    </div>

                    {/* Hours */}
                    <div className="w-12 text-center text-[10px] text-muted-foreground tabular-nums">
                      {task.estimated_hours ? (
                        <span className="flex items-center justify-center gap-0.5">
                          <Clock className="size-2.5" strokeWidth={1.75} />
                          {task.estimated_hours}t
                        </span>
                      ) : '—'}
                    </div>

                    {/* Company */}
                    <div className="w-24 truncate text-xs text-muted-foreground">
                      {task.companies?.name ?? '—'}
                    </div>

                    {/* Assignee */}
                    <div className="w-14 text-center text-[10px] font-medium text-muted-foreground">
                      {assigneeLabel(task.assignee_agent)}
                    </div>

                    {/* Due date */}
                    <div className={`w-20 text-right text-xs tabular-nums ${isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                      {task.due_date ? formatShortDate(task.due_date) : '—'}
                    </div>
                  </div>
                );
              })}

              {sectionTasks.length === 0 && !isDragOver && !('collapsible' in section && !doneExpanded) && (
                <div className="px-4 py-4 text-center text-xs text-muted-foreground/30">
                  Dra oppgaver hit
                </div>
              )}

              {isDragOver && sectionTasks.length === 0 && (
                <div className="px-4 py-4 text-center text-xs text-primary/40 bg-primary/[0.04]">
                  Slipp her
                </div>
              )}

              {/* Add task row — hide for collapsed done */}
              {'collapsible' in section && !doneExpanded ? null : addingInSection === section.id ? (
                <div className="flex items-center gap-4 px-4 py-1.5">
                  <div className="w-5" />
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleQuickAdd(section.id);
                      if (e.key === 'Escape') { setAddingInSection(null); setNewTitle(''); }
                    }}
                    placeholder="Skriv tittel og trykk Enter..."
                    className="flex-1 h-8 text-sm border-none shadow-none focus-visible:ring-0 px-0"
                    autoFocus
                    disabled={saving}
                  />
                </div>
              ) : (
                <button
                  onClick={() => { setAddingInSection(section.id); setNewTitle(''); }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-xs text-muted-foreground/30 transition-[color] duration-150 hover:text-muted-foreground"
                >
                  <Plus className="size-3" strokeWidth={2} />
                  Ny
                </button>
              )}
            </div>
          );
        })}
      </div>

      <TaskEditDialog
        task={editingTask}
        companies={companies}
        open={editingTask !== null}
        onOpenChange={(open) => { if (!open) setEditingTask(null); }}
      />
    </>
  );
}
