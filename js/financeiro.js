import { CATEGORY_OPTIONS, buildSummary, formatCurrency, formatDateBR, safeLocalStorageRead, safeLocalStorageWrite } from './core.js';

const STORAGE_KEYS = {
  session: 'vpf_session',
  transactions: 'vpf_transactions'
};

const form = document.querySelector('#transaction-form');
const typeSelect = document.querySelector('#transaction-type');
const categorySelect = document.querySelector('#transaction-category');
const chartCanvas = document.querySelector('#expense-chart');
const filterMonth = document.querySelector('#filter-month');
const filterCategory = document.querySelector('#filter-category');
const filterType = document.querySelector('#filter-type');
const tableBody = document.querySelector('#transactions-table-body');
let expenseChartInstance = null;

const currentUser = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.session) || '{}')?.user || null;
  } catch {
    return null;
  }
};

function getCategories(type = 'receita') {
  return CATEGORY_OPTIONS[type] || CATEGORY_OPTIONS.receita;
}

function populateCategoryOptions(type) {
  categorySelect.innerHTML = getCategories(type).map((category) => `<option value="${category}">${category}</option>`).join('');
}

function getTransactions() {
  const user = currentUser();
  if (!user) return [];
  return safeLocalStorageRead(STORAGE_KEYS.transactions, []).filter((item) => item.user_id === user.id);
}

function renderSummary() {
  const summary = buildSummary(getTransactions());
  document.querySelector('#summary-income').textContent = formatCurrency(summary.income);
  document.querySelector('#summary-expenses').textContent = formatCurrency(summary.expenses);
  document.querySelector('#summary-balance').textContent = formatCurrency(summary.balance);
}

function renderFilters() {
  const transactions = getTransactions();
  const months = [...new Set(transactions.map((item) => item.date.slice(0, 7)))].sort().reverse();
  const monthOptions = ['<option value="all">Todos os meses</option>']
    .concat(months.map((month) => `<option value="${month}">${month}</option>`));
  filterMonth.innerHTML = monthOptions.join('');

  const categories = [...new Set(transactions.map((item) => item.category))].sort();
  const categoryOptions = ['<option value="all">Todas</option>']
    .concat(categories.map((category) => `<option value="${category}">${category}</option>`));
  filterCategory.innerHTML = categoryOptions.join('');
}

function renderTransactions() {
  const user = currentUser();
  if (!user) return;

  let transactions = getTransactions();
  const month = filterMonth.value;
  const category = filterCategory.value;
  const type = filterType.value;

  if (month !== 'all') {
    transactions = transactions.filter((item) => item.date.startsWith(month));
  }

  if (category !== 'all') {
    transactions = transactions.filter((item) => item.category === category);
  }

  if (type !== 'all') {
    transactions = transactions.filter((item) => item.type === type);
  }

  transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (!transactions.length) {
    tableBody.innerHTML = '<tr><td colspan="6">Você ainda não registrou movimentações.</td></tr>';
    return;
  }

  tableBody.innerHTML = transactions.map((item) => `
    <tr>
      <td>${formatDateBR(item.date)}</td>
      <td>${item.description}</td>
      <td>${item.category}</td>
      <td>${item.type === 'receita' ? 'Receita' : 'Despesa'}</td>
      <td class="money ${item.type === 'receita' ? 'income' : 'expense'}">${item.type === 'receita' ? '+' : '-'} ${formatCurrency(item.value)}</td>
      <td>
        <button class="small-btn" data-edit-id="${item.id}" type="button">Editar</button>
        <button class="small-btn" data-delete-id="${item.id}" type="button">Excluir</button>
      </td>
    </tr>
  `).join('');

  document.querySelectorAll('[data-edit-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const transaction = getTransactions().find((item) => item.id === button.dataset.editId);
      if (!transaction) return;
      form.dataset.editId = transaction.id;
      typeSelect.value = transaction.type;
      populateCategoryOptions(transaction.type);
      categorySelect.value = transaction.category;
      document.querySelector('#transaction-description').value = transaction.description;
      document.querySelector('#transaction-value').value = transaction.value / 100;
      document.querySelector('#transaction-date').value = transaction.date;
    });
  });

  document.querySelectorAll('[data-delete-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.deleteId;
      if (!window.confirm('Deseja excluir esta movimentação?')) return;
      const transactionsList = safeLocalStorageRead(STORAGE_KEYS.transactions, []).filter((item) => item.id !== id);
      safeLocalStorageWrite(STORAGE_KEYS.transactions, transactionsList);
      renderAll();
    });
  });
}

function renderChart() {
  if (!chartCanvas) return;

  const expenses = getTransactions().filter((item) => item.type === 'despesa');
  const labels = [...new Set(expenses.map((item) => item.category))];
  const values = labels.map((label) => expenses.filter((item) => item.category === label).reduce((sum, item) => sum + Number(item.value), 0));

  if (expenseChartInstance) {
    expenseChartInstance.destroy();
  }

  if (!labels.length || !values.some((value) => value > 0)) {
    const context = chartCanvas.getContext('2d');
    if (context) {
      context.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
    }
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
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

function renderAll() {
  renderSummary();
  renderFilters();
  renderTransactions();
  renderChart();
}

if (typeSelect) {
  typeSelect.addEventListener('change', () => populateCategoryOptions(typeSelect.value));
}

if (form) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const user = currentUser();
    if (!user) return;

    const description = document.querySelector('#transaction-description').value.trim();
    const category = categorySelect.value;
    const value = Number(document.querySelector('#transaction-value').value || 0);
    const date = document.querySelector('#transaction-date').value;
    const type = typeSelect.value;

    const message = document.querySelector('#transaction-message');

    if (!description || !category || !date || value <= 0) {
      message.textContent = 'Preencha descrição, categoria, data e valor maior que zero.';
      message.className = 'form-message error';
      return;
    }

    const payload = {
      id: form.dataset.editId || crypto.randomUUID(),
      user_id: user.id,
      type,
      description,
      category,
      value: Math.round(value * 100),
      date
    };

    const list = safeLocalStorageRead(STORAGE_KEYS.transactions, []);
    const nextList = form.dataset.editId
      ? list.map((item) => item.id === form.dataset.editId ? payload : item)
      : [...list, payload];

    safeLocalStorageWrite(STORAGE_KEYS.transactions, nextList);
    message.textContent = 'Movimentação salva com sucesso.';
    message.className = 'form-message success';
    form.reset();
    delete form.dataset.editId;
    populateCategoryOptions(typeSelect.value);
    renderAll();
  });
}

const urlParams = new URLSearchParams(window.location.search);
const preferredType = urlParams.get('mode');
if (preferredType) {
  typeSelect.value = preferredType === 'despesa' ? 'despesa' : 'receita';
}
populateCategoryOptions(typeSelect.value);
renderAll();

filterMonth?.addEventListener('change', renderTransactions);
filterCategory?.addEventListener('change', renderTransactions);
filterType?.addEventListener('change', renderTransactions);
