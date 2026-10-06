import { buildSummary, formatCurrency, getTaskProgress, safeLocalStorageRead } from './core.js';

const STORAGE_KEYS = {
  session: 'vpf_session',
  transactions: 'vpf_transactions',
  tasks: 'vpf_tasks'
};

function getSessionUser() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.session) || '{}')?.user || null;
  } catch {
    return null;
  }
}

function getTransactions(userId) {
  return safeLocalStorageRead(STORAGE_KEYS.transactions, []).filter((item) => item.user_id === userId);
}

function getTasks(userId) {
  return safeLocalStorageRead(STORAGE_KEYS.tasks, []).filter((item) => item.user_id === userId);
}

function renderDashboard() {
  const user = getSessionUser();
  if (!user) return;

  const transactions = getTransactions(user.id);
  const tasks = getTasks(user.id);
  const summary = buildSummary(transactions);
  const progress = getTaskProgress(tasks);

  const weekSummary = document.querySelector('#week-summary');
  if (weekSummary) {
    weekSummary.textContent = `${progress.finished} de ${progress.total} tarefas concluídas`;
  }

  const balance = document.querySelector('#dashboard-balance');
  if (balance) balance.textContent = formatCurrency(summary.balance);

  const balanceChip = document.querySelector('#dashboard-balance-chip');
  if (balanceChip) balanceChip.textContent = formatCurrency(summary.balance);

  const income = document.querySelector('#dashboard-income');
  if (income) income.textContent = formatCurrency(summary.income);

  const expenses = document.querySelector('#dashboard-expenses');
  if (expenses) expenses.textContent = formatCurrency(summary.expenses);

  const taskList = document.querySelector('#dashboard-tasks');
  const actionsCount = document.querySelector('#dashboard-actions-count');
  const pendingCount = tasks.filter((task) => task.status !== 'concluida').length;

  if (actionsCount) {
    actionsCount.textContent = `${pendingCount} ${pendingCount === 1 ? 'item' : 'itens'}`;
  }

  if (taskList) {
    if (!tasks.length) {
      taskList.innerHTML = `
        <li class="task-item empty-state">
          <span>Você ainda não tem tarefas para esta semana.</span>
          <a href="./planejamento.html" class="small-btn">Adicionar</a>
        </li>
      `;
      return;
    }

    const upcoming = [...tasks].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 3);
    taskList.innerHTML = upcoming.map((task) => `
      <li class="task-item ${task.status === 'concluida' ? 'completed' : ''}">
        <label>
          <input type="checkbox" ${task.status === 'concluida' ? 'checked' : ''} disabled />
          <span class="task-title">${task.title}</span>
        </label>
        <span class="task-badge ${task.status === 'concluida' ? 'done' : 'pending'}">${task.status === 'concluida' ? 'Concluída' : 'Pendente'}</span>
      </li>
    `).join('');
  }
}

renderDashboard();
