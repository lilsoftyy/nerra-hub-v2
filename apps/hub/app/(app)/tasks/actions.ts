'use server';

import { createClient } from '@/lib/supabase/server';
import { v7 as uuidv7 } from 'uuid';
import { redirect } from 'next/navigation';

const ALLOWED_NEW_TASK_STATUSES = new Set(['open', 'in_progress']);

async function insertTask(formData: FormData) {
  const supabase = await createClient();
  const title = formData.get('title') as string;
  if (!title) return { error: 'Tittel er påkrevd' };

  const estimatedHours = formData.get('estimated_hours') as string;
  const assigneeEmail = formData.get('assignee_email') as string;
  const rawStatus = (formData.get('status') as string) || 'open';
  const status = ALLOWED_NEW_TASK_STATUSES.has(rawStatus) ? rawStatus : 'open';

  const { error } = await supabase.from('tasks').insert({
    id: uuidv7(),
    title,
    description: (formData.get('description') as string) || null,
    status,
    priority: (formData.get('priority') as string) || 'medium',
    category: (formData.get('category') as string) || null,
    company_id: (formData.get('company_id') as string) || null,
    due_date: (formData.get('due_date') as string) || null,
    start_date: new Date().toISOString(),
    estimated_hours: estimatedHours ? parseFloat(estimatedHours) : null,
    assignee_agent: assigneeEmail || null,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function createTask(formData: FormData) {
  const result = await insertTask(formData);
  if (result.error) return result;
  redirect('/tasks');
}

export async function createTaskFromDialog(formData: FormData) {
  return insertTask(formData);
}

export async function updateTaskStatus(taskId: string, status: string) {
  const supabase = await createClient();
  const updateData: Record<string, unknown> = { status };
  if (status === 'done') {
    updateData.completed_at = new Date().toISOString();
  }
  const { error } = await supabase.from('tasks').update(updateData).eq('id', taskId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function updateTask(taskId: string, formData: FormData) {
  const supabase = await createClient();
  const title = formData.get('title') as string;
  if (!title) return { error: 'Tittel er påkrevd' };

  const estimatedHours = formData.get('estimated_hours') as string;
  const assigneeEmail = formData.get('assignee_email') as string;

  const { error } = await supabase.from('tasks').update({
    title,
    description: (formData.get('description') as string) || null,
    priority: (formData.get('priority') as string) || 'medium',
    category: (formData.get('category') as string) || null,
    company_id: (formData.get('company_id') as string) || null,
    due_date: (formData.get('due_date') as string) || null,
    estimated_hours: estimatedHours ? parseFloat(estimatedHours) : null,
    assignee_agent: assigneeEmail || null,
  }).eq('id', taskId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function updateTaskDueDate(taskId: string, dueDate: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('tasks').update({ due_date: dueDate }).eq('id', taskId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function updateTaskDates(taskId: string, startDate: string, dueDate: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('tasks').update({ start_date: startDate, due_date: dueDate }).eq('id', taskId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  if (error) return { error: error.message };
  return { success: true };
}
