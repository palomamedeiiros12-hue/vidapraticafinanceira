import { CATEGORY_OPTIONS, buildSummary, formatCurrency, formatDateBR } from './core.js';
import { deleteTransaction, getCurrentUser, getTransactionsByUser, saveTransaction } from './supabase.js';

const form = document.querySelector('#transaction-form');
const typeSelect = document.querySelector('#transaction-type');
const categorySelect = document.querySelector('#transaction-category');
const chartCanvas = document.querySelector('#expense-chart');
const filterMonth = document.querySelector('#filter-month');
const filterCategory = document.querySelector('#filter-category');
const filterType = document.querySelector('#filter-type');
const tableBody = document.querySelector('#transactions-table-body');
const message = document.querySelector('#transaction-message');
const dataMessage = document.querySelector('#finance-data-message');
let expenseChartInstance = null;
let currentUser = null;
let transactionRows = [];

function showMessage(element, text, type = '') {
  if (!element) return;
  element.textContent = text;
  element.className = `form-message ${type}`.trim();
}

function getCategories(type = 'receita') {
  return CATEGORY_OPTIONS[type] || CATEGORY_OPTIONS.receita;
}

function populateCategoryOptions(type) {
  categorySelect.innerHTML = getCategories(type).map((category) => `<option value="${category}">${category}</option>`).join('');
}

function renderSummary(transactions) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const summary = buildSummary(transactions.filter((item) => item.date.startsWith(currentMonth)));
  document.querySelector('#summary-income').textContent = formatCurrency(summary.income);
  document.querySelector('#summary-expenses').textContent = formatCurrency(summary.expenses);
  document.querySelector('#summary-balance').textContent = formatCurrency(summary.balance);
}

function renderFilters(transactions) {
  const selectedMonth = filterMonth.value;
  const selectedCategory = filterCategory.value;
  const months = [...new Set(transactions.map((item) => item.date.slice(0, 7)))].sort().reverse();
  filterMonth.innerHTML = ['<option value="all">Todos os meses</option>']
    .concat(months.map((month) => `<option value="${month}">${month}</option>`)).join('');
  if (months.includes(selectedMonth)) filterMonth.value = selectedMonth;

  const categories = [...new Set(transactions.map((item) => item.category))].sort();
  filterCategory.innerHTML = ['<option value="all">Todas</option>']
    .concat(categories.map((category) => `<option value="${category}">${category}</option>`)).join('');
  if (categories.includes(selectedCategory)) filterCategory.value = selectedCategory;
}

function appendCell(row, text, className = '') {
  const cell = document.createElement('td');
  cell.textContent = text;
  if (className) cell.className = className;
  row.append(cell);
  return cell;
}

function renderTransactions(allTransactions) {
  let transactions = [...allTransactions];
  const month = filterMonth.value;
  const category = filterCategory.value;
  const type = filterType.value;

  if (month !== 'all') transactions = transactions.filter((item) => item.date.startsWith(month));
  if (category !== 'all') transactions = transactions.filter((item) => item.category === category);
  if (type !== 'all') transactions = transactions.filter((item) => item.type === type);
  transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  tableBody.replaceChildren();

  if (!transactions.length) {
    const row = document.createElement('tr');
    const cell = appendCell(row, 'Você ainda não registrou movimentações.');
    cell.colSpan = 6;
    tableBody.append(row);
    return;
  }

  transactions.forEach((item) => {
    const row = document.createElement('tr');
    appendCell(row, formatDateBR(item.date));
    appendCell(row, item.description);
    appendCell(row, item.category);
    appendCell(row, item.type === 'receita' ? 'Receita' : 'Despesa');
    appendCell(row, `${item.type === 'receita' ? '+' : '-'} ${formatCurrency(item.value)}`, `money ${item.type === 'receita' ? 'income' : 'expense'}`);

    const actions = appendCell(row, '');
    const editButton = document.createElement('button');
    editButton.className = 'small-btn';
    editButton.dataset.editId = item.id;
    editButton.type = 'button';
    editButton.textContent = 'Editar';
    editButton.addEventListener('click', () => {
      form.dataset.editId = item.id;
      typeSelect.value = item.type;
      populateCategoryOptions(item.type);
      categorySelect.value = item.category;
      document.querySelector('#transaction-description').value = item.description;
      document.querySelector('#transaction-value').value = item.value / 100;
      document.querySelector('#transaction-date').value = item.date;
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    const deleteButton = document.createElement('button');
    deleteButton.className = 'small-btn';
    deleteButton.dataset.deleteId = item.id;
    deleteButton.type = 'button';
    deleteButton.textContent = 'Excluir';
    deleteButton.addEventListener('click', async () => {
      if (!window.confirm('Deseja excluir esta movimentação?')) return;
      deleteButton.disabled = true;
      try {
        await deleteTransaction(item.id);
        showMessage(message, 'Movimentação excluída.', 'success');
        await renderAll();
      } catch (error) {
        showMessage(message, error.message, 'error');
        deleteButton.disabled = false;
      }
    });
    actions.append(editButton, deleteButton);
    tableBody.append(row);
  });
}

function renderChart(transactions) {
  if (!chartCanvas) return;
  const expenses = transactions.filter((item) => item.type === 'despesa');
  const labels = [...new Set(expenses.map((item) => item.category))];
  const values = labels.map((label) => expenses
    .filter((item) => item.category === label)
    .reduce((sum, item) => sum + Number(item.value), 0));

  expenseChartInstance?.destroy();
  if (!labels.length || !values.some((value) => value > 0)) {
    const context = chartCanvas.getContext('2d');
    context?.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
    chartCanvas.setAttribute('data-empty', 'true');
    return;
  }

  chartCanvas.removeAttribute('data-empty');
  expenseChartInstance = new Chart(chartCanvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: ['#1d4ed8', '#10b981', '#f59e0b', '#f97316', '#ef4444', '#6366f1', '#14b8a6', '#64748b']
      }]
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
  });
}

async function renderAll() {
  try {
    transactionRows = await getTransactionsByUser(currentUser.id);
    showMessage(dataMessage, '');
    renderSummary(transactionRows);
    renderFilters(transactionRows);
    renderTransactions(transactionRows);
    renderChart(transactionRows);
  } catch (error) {
    showMessage(dataMessage, `Não foi possível carregar suas movimentações: ${error.message}`, 'error');
  }
}

typeSelect?.addEventListener('change', () => populateCategoryOptions(typeSelect.value));

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const description = document.querySelector('#transaction-description').value.trim();
  const category = categorySelect.value;
  const value = Number(document.querySelector('#transaction-value').value);
  const date = document.querySelector('#transaction-date').value;
  const type = typeSelect.value;

  if (!description || !category || !date || !Number.isFinite(value) || value <= 0) {
    showMessage(message, 'Preencha descrição, categoria, data e valor maior que zero.', 'error');
    return;
  }

  const submitButton = form.querySelector('[type="submit"]');
  submitButton.disabled = true;
  try {
    await saveTransaction({
      ...(form.dataset.editId ? { id: form.dataset.editId } : {}),
      user_id: currentUser.id,
      type,
      description,
      category,
      value: Math.round(value * 100),
      date
    });
    showMessage(message, 'Movimentação salva com sucesso.', 'success');
    form.reset();
    delete form.dataset.editId;
    populateCategoryOptions(typeSelect.value);
    await renderAll();
  } catch (error) {
    showMessage(message, `Não foi possível salvar a movimentação: ${error.message}`, 'error');
  } finally {
    submitButton.disabled = false;
  }
});

const urlParams = new URLSearchParams(window.location.search);
const preferredType = urlParams.get('mode');
if (preferredType) typeSelect.value = preferredType === 'despesa' ? 'despesa' : 'receita';
populateCategoryOptions(typeSelect.value);
document.querySelector('#transaction-date').value = new Date().toISOString().slice(0, 10);
filterMonth?.addEventListener('change', () => renderTransactions(transactionRows));
filterCategory?.addEventListener('change', () => renderTransactions(transactionRows));
filterType?.addEventListener('change', () => renderTransactions(transactionRows));

async function initFinancePage() {
  try {
    currentUser = await getCurrentUser();
    if (currentUser) await renderAll();
  } catch (error) {
    showMessage(dataMessage, `Não foi possível carregar sua conta: ${error.message}`, 'error');
  }
}

initFinancePage();
