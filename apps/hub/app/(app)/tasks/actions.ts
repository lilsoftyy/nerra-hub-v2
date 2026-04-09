'use server';

import { createClient } from '@/lib/supabase/server';
import { v7 as uuidv7 } from 'uuid';
import { redirect } from 'next/navigation';

export async function createTask(formData: FormData) {
  const supabase = await createClient();

  const title = formData.get('title') as string;
  if (!title) return { error: 'Tittel er påkrevd' };

  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from('tasks').insert({
    id: uuidv7(),
    title,
    description: (formData.get('description') as string) || null,
    priority: (formData.get('priority') as string) || 'medium',
    category: (formData.get('category') as string) || null,
    company_id: (formData.get('company_id') as string) || null,
    due_date: (formData.get('due_date') as string) || null,
    assignee_id: user?.id ?? null,
    created_by: user?.id ?? null,
  });

  if (error) return { error: error.message };
  redirect('/tasks');
}

export async function createTaskFromDialog(formData: FormData) {
  const supabase = await createClient();

  const title = formData.get('title') as string;
  if (!title) return { error: 'Tittel er påkrevd' };

  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from('tasks').insert({
    id: uuidv7(),
    title,
    description: (formData.get('description') as string) || null,
    priority: (formData.get('priority') as string) || 'medium',
    category: (formData.get('category') as string) || null,
    company_id: (formData.get('company_id') as string) || null,
    due_date: (formData.get('due_date') as string) || null,
    assignee_id: user?.id ?? null,
    created_by: user?.id ?? null,
  });

  if (error) return { error: error.message };
  return { success: true };
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

  const updateData: Record<string, unknown> = {
    title,
    description: (formData.get('description') as string) || null,
    priority: (formData.get('priority') as string) || 'medium',
    category: (formData.get('category') as string) || null,
    company_id: (formData.get('company_id') as string) || null,
    due_date: (formData.get('due_date') as string) || null,
  };

  const { error } = await supabase.from('tasks').update(updateData).eq('id', taskId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  if (error) return { error: error.message };
  return { success: true };
}
