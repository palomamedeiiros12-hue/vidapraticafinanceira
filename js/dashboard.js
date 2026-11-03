import { buildSummary, formatCurrency, getTaskProgress } from './core.js';
import { getCurrentUser, getTasksByUser, getTransactionsByUser } from './supabase.js';

function showDataError(error) {
  const message = document.querySelector('#dashboard-message');
  if (message) {
    message.textContent = `Não foi possível carregar seus dados: ${error.message}`;
    message.className = 'form-message error';
  }
}

function renderTaskList(tasks) {
  const taskList = document.querySelector('#dashboard-tasks');
  if (!taskList) return;
  taskList.replaceChildren();

  if (!tasks.length) {
    const item = document.createElement('li');
    item.className = 'task-item empty-state';
    item.append(document.createTextNode('Você ainda não tem tarefas para esta semana. '));
    const link = document.createElement('a');
    link.href = './planejamento.html';
    link.className = 'small-btn';
    link.textContent = 'Adicionar';
    item.append(link);
    taskList.append(item);
    return;
  }

  const upcoming = [...tasks].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 3);
  upcoming.forEach((task) => {
    const item = document.createElement('li');
    item.className = `task-item ${task.status === 'concluida' ? 'completed' : ''}`;
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.status === 'concluida';
    checkbox.disabled = true;
    const title = document.createElement('span');
    title.className = 'task-title';
    title.textContent = task.title;
    label.append(checkbox, title);
    const badge = document.createElement('span');
    badge.className = `task-badge ${task.status === 'concluida' ? 'done' : 'pending'}`;
    badge.textContent = task.status === 'concluida' ? 'Concluída' : 'Pendente';
    item.append(label, badge);
    taskList.append(item);
  });
}

async function renderDashboard() {
  try {
    const user = await getCurrentUser();
    if (!user) return;
    const [transactions, tasks] = await Promise.all([
      getTransactionsByUser(user.id),
      getTasksByUser(user.id)
    ]);
    const currentMonth = new Date().toISOString().slice(0, 7);
    const summary = buildSummary(transactions.filter((item) => item.date.startsWith(currentMonth)));
    const progress = getTaskProgress(tasks);

    const userName = document.querySelector('[data-user-name]');
    if (userName) userName.textContent = user.name || user.email || 'Usuário';
    document.querySelector('#week-summary').textContent = `${progress.finished} de ${progress.total} tarefas concluídas`;
    document.querySelector('#dashboard-balance').textContent = formatCurrency(summary.balance);
    document.querySelector('#dashboard-balance-chip').textContent = formatCurrency(summary.balance);
    document.querySelector('#dashboard-income').textContent = formatCurrency(summary.income);
    document.querySelector('#dashboard-expenses').textContent = formatCurrency(summary.expenses);

    const pendingCount = tasks.filter((task) => task.status !== 'concluida').length;
    document.querySelector('#dashboard-actions-count').textContent = `${pendingCount} ${pendingCount === 1 ? 'item' : 'itens'}`;
    renderTaskList(tasks);
  } catch (error) {
    showDataError(error);
  }
}

renderDashboard();
