import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || '';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true
    }
  })
  : null;

export function isSupabaseConfigured() {
  return Boolean(supabase);
}

function requireSupabase() {
  if (!supabase) {
    throw new Error('O serviço de contas ainda não foi configurado. Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
  }

  return supabase;
}

function raiseIfError(error) {
  if (error) throw new Error(error.message || 'Não foi possível concluir a operação.');
}

async function requireCurrentUser() {
  const client = requireSupabase();
  const { data, error } = await client.auth.getUser();
  raiseIfError(error);

  if (!data.user) {
    throw new Error('Sua sessão expirou. Entre novamente para continuar.');
  }

  return data.user;
}

function toAppUser(user) {
  return {
    id: user.id,
    name: user.user_metadata?.name || '',
    email: user.email || ''
  };
}

export async function getCurrentUser() {
  const client = requireSupabase();
  const { data, error } = await client.auth.getSession();
  raiseIfError(error);

  return data.session?.user ? toAppUser(data.session.user) : null;
}

export async function signUp({ name, email, password }) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signUp({
    email: String(email || '').trim().toLowerCase(),
    password: String(password || ''),
    options: {
      data: { name: String(name || '').trim() }
    }
  });
  raiseIfError(error);

  return {
    user: data.user ? toAppUser(data.user) : null,
    needsEmailConfirmation: Boolean(data.user && !data.session)
  };
}

export async function signIn({ email, password }) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({
    email: String(email || '').trim().toLowerCase(),
    password: String(password || '')
  });
  raiseIfError(error);

  if (!data.user) throw new Error('Não foi possível validar esta conta.');
  return toAppUser(data.user);
}

export async function resetPassword({ email }) {
  const client = requireSupabase();
  const redirectTo = new URL('./redefinir-senha.html', window.location.href).href;
  const { error } = await client.auth.resetPasswordForEmail(String(email || '').trim().toLowerCase(), { redirectTo });
  raiseIfError(error);
}

export async function setNewPassword(password) {
  const client = requireSupabase();
  const { data, error } = await client.auth.updateUser({ password });
  raiseIfError(error);
  return Boolean(data.user);
}

export async function signOut() {
  const client = requireSupabase();
  const { error } = await client.auth.signOut();
  raiseIfError(error);
}

export async function getTransactionsByUser(userId) {
  const client = requireSupabase();
  const user = await requireCurrentUser();
  if (String(userId) !== user.id) throw new Error('Você não pode acessar os dados de outra conta.');

  const { data, error } = await client
    .from('transactions')
    .select('id, user_id, type, description, category, value, date')
    .eq('user_id', user.id)
    .order('date', { ascending: false });
  raiseIfError(error);
  return data;
}

export async function saveTransaction(transaction) {
  const client = requireSupabase();
  const user = await requireCurrentUser();
  if (transaction.user_id !== user.id) throw new Error('Você não pode alterar dados de outra conta.');

  const { data, error } = await client
    .from('transactions')
    .upsert({
      ...(transaction.id ? { id: transaction.id } : {}),
      user_id: user.id,
      type: transaction.type,
      description: transaction.description,
      category: transaction.category,
      value: transaction.value,
      date: transaction.date
    })
    .select('id, user_id, type, description, category, value, date')
    .single();
  raiseIfError(error);
  return data;
}

export async function deleteTransaction(id) {
  const client = requireSupabase();
  const user = await requireCurrentUser();
  const { data, error } = await client
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id')
    .maybeSingle();
  raiseIfError(error);
  if (!data) throw new Error('Movimentação não encontrada ou sem permissão para excluí-la.');
}

export async function getTasksByUser(userId) {
  const client = requireSupabase();
  const user = await requireCurrentUser();
  if (String(userId) !== user.id) throw new Error('Você não pode acessar os dados de outra conta.');

  const { data, error } = await client
    .from('tasks')
    .select('id, user_id, title, date, status')
    .eq('user_id', user.id)
    .order('date', { ascending: true });
  raiseIfError(error);
  return data;
}

export async function saveTask(task) {
  const client = requireSupabase();
  const user = await requireCurrentUser();
  if (task.user_id !== user.id) throw new Error('Você não pode alterar dados de outra conta.');

  const { data, error } = await client
    .from('tasks')
    .upsert({
      ...(task.id ? { id: task.id } : {}),
      user_id: user.id,
      title: task.title,
      date: task.date,
      status: task.status
    })
    .select('id, user_id, title, date, status')
    .single();
  raiseIfError(error);
  return data;
}

export async function deleteTask(id) {
  const client = requireSupabase();
  const user = await requireCurrentUser();
  const { data, error } = await client
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id')
    .maybeSingle();
  raiseIfError(error);
  if (!data) throw new Error('Tarefa não encontrada ou sem permissão para excluí-la.');
}

export async function updateProfileName(name, email) {
  const client = requireSupabase();
  const user = await requireCurrentUser();
  const cleanName = String(name || '').trim();
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanName) throw new Error('Nome não pode ficar vazio.');

  const { error: authError } = await client.auth.updateUser({
    ...(cleanEmail && cleanEmail !== user.email ? { email: cleanEmail } : {}),
    data: { ...user.user_metadata, name: cleanName }
  });
  raiseIfError(authError);

  const { error: profileError } = await client
    .from('profiles')
    .upsert({ id: user.id, name: cleanName });
  raiseIfError(profileError);

  return {
    user: { id: user.id, name: cleanName, email: user.email },
    emailChangePending: Boolean(cleanEmail && cleanEmail !== user.email)
  };
}

export async function updateUserPassword(password) {
  await requireCurrentUser();
  const client = requireSupabase();
  const { error } = await client.auth.updateUser({ password });
  raiseIfError(error);
}

if (typeof window !== 'undefined') {
  window.VPF = window.VPF || {};
  window.VPF.supabase = supabase;
}
