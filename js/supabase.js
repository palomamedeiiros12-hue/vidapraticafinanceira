import { safeLocalStorageRead, safeLocalStorageWrite, canAccessRecord } from './core.js';

const STORAGE_KEYS = {
  users: 'vpf_users',
  transactions: 'vpf_transactions',
  tasks: 'vpf_tasks',
  session: 'vpf_session'
};

const runtimeEnv = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};
const supabaseUrl = runtimeEnv.VITE_SUPABASE_URL || '';
const supabaseAnonKey = runtimeEnv.VITE_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey
  ? window?.supabase
    ? window.supabase
    : null
  : null;

const normalizeEmail = (email = '') => String(email || '').trim().toLowerCase();

const getUsers = () => safeLocalStorageRead(STORAGE_KEYS.users, []);
const saveUsers = (users) => safeLocalStorageWrite(STORAGE_KEYS.users, users);

const ensureDemoUser = () => {
  const users = getUsers();
  const demoUser = users.find((user) => normalizeEmail(user.email) === 'ana@vidapf.com');

  if (demoUser) {
    return demoUser;
  }

  const created = {
    id: 'demo-user',
    name: 'Ana',
    email: 'ana@vidapf.com',
    password: 'demo123'
  };

  users.push(created);
  saveUsers(users);
  return created;
};

const getTransactions = () => safeLocalStorageRead(STORAGE_KEYS.transactions, []);
const saveTransactions = (transactions) => safeLocalStorageWrite(STORAGE_KEYS.transactions, transactions);

const getTasks = () => safeLocalStorageRead(STORAGE_KEYS.tasks, []);
const saveTasks = (tasks) => safeLocalStorageWrite(STORAGE_KEYS.tasks, tasks);

export function getCurrentUser() {
  const session = safeLocalStorageRead(STORAGE_KEYS.session, null);
  return session?.user || null;
}

export function signUpWithFallback({ name, email, password }) {
  const users = getUsers();
  const normalizedEmail = normalizeEmail(email);
  const existingUser = users.find((user) => normalizeEmail(user.email) === normalizedEmail);
  if (existingUser) {
    return { success: false, message: 'Este e-mail já está cadastrado.' };
  }

  const user = {
    id: `user-${Date.now()}`,
    name: String(name || '').trim(),
    email: normalizedEmail,
    password: String(password || '')
  };

  users.push(user);
  saveUsers(users);
  safeLocalStorageWrite(STORAGE_KEYS.session, { user, demo: true });

  return { success: true, user };
}

export function signInWithFallback({ email, password }) {
  const users = getUsers();
  const normalizedEmail = normalizeEmail(email);
  const demoUser = ensureDemoUser();

  const user = users.find((item) => normalizeEmail(item.email) === normalizedEmail && item.password === String(password || ''));
  const demoMatch = normalizedEmail === normalizeEmail(demoUser.email) && String(password || '') === demoUser.password;

  if (!user && !demoMatch) {
    return { success: false, message: 'E-mail ou senha inválidos.' };
  }

  const activeUser = user || demoUser;
  safeLocalStorageWrite(STORAGE_KEYS.session, { user: activeUser, demo: true });
  return { success: true, user: activeUser };
}

export function resetPasswordFallback({ email }) {
  const users = getUsers();
  const exists = users.some((user) => user.email.toLowerCase() === email.toLowerCase());
  if (!exists) {
    return { success: false, message: 'E-mail não encontrado.' };
  }

  return { success: true, message: 'Se o e-mail estiver correto, um link de recuperação será enviado.' };
}

export function getTransactionsByUser(userId) {
  const transactions = getTransactions().filter((item) => canAccessRecord(item.user_id, userId));
  return transactions;
}

export function saveTransaction(transaction) {
  const transactions = getTransactions();
  const next = transaction.id ? transactions.map((item) => (item.id === transaction.id ? transaction : item)) : [...transactions, transaction];
  saveTransactions(next);
  return next;
}

export function deleteTransaction(id) {
  const transactions = getTransactions().filter((item) => item.id !== id);
  saveTransactions(transactions);
  return transactions;
}

export function getTasksByUser(userId) {
  return getTasks().filter((task) => canAccessRecord(task.user_id, userId));
}

export function saveTask(task) {
  const tasks = getTasks();
  const next = task.id ? tasks.map((item) => (item.id === task.id ? task : item)) : [...tasks, task];
  saveTasks(next);
  return next;
}

export function deleteTask(id) {
  const tasks = getTasks().filter((task) => task.id !== id);
  saveTasks(tasks);
  return tasks;
}

export function updateProfileName(name, email = null) {
  const session = safeLocalStorageRead(STORAGE_KEYS.session, null);
  if (!session?.user) return { success: false, message: 'Usuário não autenticado.' };

  const cleanName = String(name || '').trim();
  const cleanEmail = email ? String(email).trim().toLowerCase() : session.user.email;

  if (!cleanName) {
    return { success: false, message: 'Nome não pode ficar vazio.' };
  }

  const users = getUsers();
  const duplicated = users.some((user) => user.id !== session.user.id && String(user.email || '').toLowerCase() === cleanEmail);
  if (duplicated) {
    return { success: false, message: 'Este e-mail já está sendo usado por outra conta.' };
  }

  const nextUsers = users.map((user) => (user.id === session.user.id ? { ...user, name: cleanName, email: cleanEmail } : user));
  saveUsers(nextUsers);

  session.user.name = cleanName;
  session.user.email = cleanEmail;
  safeLocalStorageWrite(STORAGE_KEYS.session, session);

  return { success: true, user: session.user };
}

export function updateUserPassword(password) {
  const session = safeLocalStorageRead(STORAGE_KEYS.session, null);
  if (!session?.user) return { success: false, message: 'Usuário não autenticado.' };

  const users = getUsers();
  const nextUsers = users.map((user) => (user.id === session.user.id ? { ...user, password } : user));
  saveUsers(nextUsers);
  return { success: true };
}

export function logoutCurrentUser() {
  localStorage.removeItem(STORAGE_KEYS.session);
}

export function getUserById(userId) {
  return getUsers().find((user) => user.id === userId) || null;
}

if (typeof window !== 'undefined') {
  window.VPF = window.VPF || {};
  window.VPF.supabase = supabase;
  window.VPF.getCurrentUser = getCurrentUser;
}
