import {
  formatCurrency,
  formatCurrencySigned,
  buildSummary,
  getTaskProgress,
  safeLocalStorageRead,
  safeLocalStorageWrite,
  canAccessRecord
} from './core.js';

window.VPF = {
  formatCurrency,
  formatCurrencySigned,
  buildSummary,
  getTaskProgress,
  safeLocalStorageRead,
  safeLocalStorageWrite,
  canAccessRecord
};

const STORAGE_KEYS = {
  session: 'vpf_session',
  users: 'vpf_users',
  data: 'vpf_data',
  transactions: 'vpf_transactions',
  tasks: 'vpf_tasks'
};

function getSession() {
  return safeLocalStorageRead(STORAGE_KEYS.session, null);
}

function setSession(session) {
  safeLocalStorageWrite(STORAGE_KEYS.session, session);
}

function isProtectedPage() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  return ['dashboard.html', 'financeiro.html', 'planejamento.html', 'perfil.html'].includes(path);
}

function buildDemoUser() {
  return {
    id: 'demo-user',
    name: 'Ana',
    email: 'ana@vidapf.com'
  };
}

function ensureDemoData() {
  const user = getSession()?.user || buildDemoUser();
  const transactions = safeLocalStorageRead(STORAGE_KEYS.transactions, []);
  const tasks = safeLocalStorageRead(STORAGE_KEYS.tasks, []);

  if (!transactions.some((item) => item.user_id === user.id)) {
    safeLocalStorageWrite(STORAGE_KEYS.transactions, [
      { id: 'tx-001', user_id: user.id, type: 'receita', description: 'Salário', category: 'Salário', value: 350000, date: new Date().toISOString().slice(0, 10) },
      { id: 'tx-002', user_id: user.id, type: 'despesa', description: 'Supermercado', category: 'Alimentação', value: 45000, date: new Date().toISOString().slice(0, 10) },
      { id: 'tx-003', user_id: user.id, type: 'despesa', description: 'Transporte', category: 'Transporte', value: 8000, date: new Date().toISOString().slice(0, 10) }
    ]);
  }

  if (!tasks.some((item) => item.user_id === user.id)) {
    const today = new Date();
    const nextDate = (offset) => {
      const date = new Date(today);
      date.setDate(date.getDate() + offset);
      return date.toISOString().slice(0, 10);
    };

    safeLocalStorageWrite(STORAGE_KEYS.tasks, [
      { id: 'task-001', user_id: user.id, title: 'Estudar Python', date: nextDate(0), status: 'pendente' },
      { id: 'task-002', user_id: user.id, title: 'Pagar conta', date: nextDate(1), status: 'pendente' },
      { id: 'task-003', user_id: user.id, title: 'Fazer exercício', date: nextDate(2), status: 'concluida' }
    ]);
  }

  const users = safeLocalStorageRead(STORAGE_KEYS.users, []);
  if (!users.some((entry) => entry.email === user.email)) {
    users.push({ id: user.id, name: user.name, email: user.email, password: 'demo123' });
    safeLocalStorageWrite(STORAGE_KEYS.users, users);
  }
}

function ensureDefaultSession() {
  const existingSession = getSession();
  if (!existingSession) {
    const demoUser = buildDemoUser();
    setSession({ user: demoUser, demo: true });
  }
  ensureDemoData();
}

function guardAccess() {
  if (!isProtectedPage()) return;
  const session = getSession();
  if (!session || !session.user) {
    window.location.href = './login.html';
  }
}

function bindGlobalEvents() {
  const logoutButton = document.querySelector('[data-logout]');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEYS.session);
      window.location.href = './login.html';
    });
  }

  const userName = document.querySelector('[data-user-name]');
  const session = getSession();
  if (userName && session?.user) {
    userName.textContent = session.user.name || session.user.email || 'Usuário';
  }
}

function handleNavigation() {
  const links = document.querySelectorAll('[data-nav]');
  links.forEach((link) => {
    const href = link.getAttribute('href');
    if (window.location.pathname.endsWith(href.replace('./', '')) || window.location.pathname.endsWith(href)) {
      link.classList.add('active');
    }
  });
}

function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js').catch(() => {});
    });
  }
}

function initApp() {
  ensureDefaultSession();
  guardAccess();
  bindGlobalEvents();
  handleNavigation();
  registerSW();
}

initApp();
window.VPF.STORAGE_KEYS = STORAGE_KEYS;
window.VPF.getSession = getSession;
window.VPF.setSession = setSession;
window.VPF.clearSession = () => localStorage.removeItem(STORAGE_KEYS.session);
