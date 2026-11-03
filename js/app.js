import {
  formatCurrency,
  formatCurrencySigned,
  buildSummary,
  getTaskProgress
} from './core.js';
import { getCurrentUser, isSupabaseConfigured, signOut } from './supabase.js';

window.VPF = {
  formatCurrency,
  formatCurrencySigned,
  buildSummary,
  getTaskProgress
};

function isProtectedPage() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  return ['dashboard.html', 'financeiro.html', 'planejamento.html', 'perfil.html'].includes(path);
}

async function guardAccess() {
  if (!isProtectedPage()) return true;
  if (!isSupabaseConfigured()) {
    window.location.replace('./login.html?setup=required');
    return false;
  }

  const user = await getCurrentUser();
  if (!user) {
    window.location.replace('./login.html');
    return false;
  }
  return true;
}

function bindGlobalEvents(user) {
  const logoutButton = document.querySelector('[data-logout]');
  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      logoutButton.disabled = true;
      try {
        await signOut();
        window.location.href = './login.html';
      } catch (error) {
        logoutButton.disabled = false;
        window.alert(`Não foi possível sair da conta: ${error.message}`);
      }
    });
  }

  const userName = document.querySelector('[data-user-name]');
  if (userName && user) {
    userName.textContent = user.name || user.email || 'Usuário';
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
      navigator.serviceWorker.register('./service-worker.js').catch((error) => {
        console.error('Não foi possível registrar o service worker.', error);
      });
    });
  }
}

async function initApp() {
  try {
    localStorage.removeItem('vpf_users');
    localStorage.removeItem('vpf_session');
  } catch (error) {
    console.error('Não foi possível limpar credenciais antigas do navegador.', error);
  }
  const hasAccess = await guardAccess();
  if (!hasAccess) return;
  const user = isProtectedPage() ? await getCurrentUser() : null;
  bindGlobalEvents(user);
  handleNavigation();
  registerSW();
}

initApp().catch((error) => {
  console.error('Não foi possível inicializar a aplicação.', error);
  if (isProtectedPage()) {
    window.location.replace('./login.html?setup=required');
  }
});
