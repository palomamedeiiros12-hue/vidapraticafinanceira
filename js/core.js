export const CATEGORY_OPTIONS = {
  receita: ['Salário', 'Freelance', 'Benefício', 'Outros'],
  despesa: ['Alimentação', 'Transporte', 'Moradia', 'Educação', 'Saúde', 'Lazer', 'Compras', 'Outros']
};

export function formatCurrency(value = 0) {
  const numericValue = Number(value) || 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numericValue / 100);
}

export function formatCurrencySigned(value = 0) {
  const numericValue = Number(value) || 0;
  const sign = numericValue >= 0 ? '+' : '-';
  return `${sign} ${formatCurrency(Math.abs(numericValue))}`;
}

export function parseCurrencyInput(rawValue) {
  if (!rawValue && rawValue !== 0) return 0;
  const sanitized = String(rawValue).replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.');
  const numericValue = Number(sanitized);
  if (!Number.isFinite(numericValue)) return 0;
  return Math.round(numericValue * 100);
}

export function calculateBalance(transactions = []) {
  return transactions.reduce((total, item) => {
    const amount = Number(item.value) || 0;
    return item.type === 'receita' ? total + amount : total - amount;
  }, 0);
}

export function getTaskProgress(tasks = []) {
  const total = tasks.length;
  const finished = tasks.filter((task) => task.status === 'concluida').length;
  const pending = total - finished;
  const progress = total ? Math.round((finished / total) * 100) : 0;

  return { total, finished, pending, progress };
}

export function getDaysOfWeek() {
  const start = new Date();
  start.setDate(start.getDate() - start.getDay() + 1);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      key: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString('pt-BR', { weekday: 'long' })
    };
  });
}

export function formatDateBR(dateString) {
  if (!dateString) return '';
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('pt-BR');
}

export function safeLocalStorageRead(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

export function safeLocalStorageWrite(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function canAccessRecord(recordUserId, currentUserId) {
  if (!recordUserId || !currentUserId) return false;
  return String(recordUserId) === String(currentUserId);
}

export function buildSummary(transactions = []) {
  const income = transactions.filter((tx) => tx.type === 'receita').reduce((sum, tx) => sum + Number(tx.value || 0), 0);
  const expenses = transactions.filter((tx) => tx.type === 'despesa').reduce((sum, tx) => sum + Number(tx.value || 0), 0);
  return {
    income,
    expenses,
    balance: income - expenses
  };
}
