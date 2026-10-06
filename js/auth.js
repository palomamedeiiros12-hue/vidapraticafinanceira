import {
  signInWithFallback,
  signUpWithFallback,
  resetPasswordFallback,
  getCurrentUser
} from './supabase.js';

function showMessage(element, text, type = '') {
  if (!element) return;
  element.textContent = text;
  element.className = `form-message ${type}`.trim();
}

function saveSession(user) {
  localStorage.setItem('vpf_session', JSON.stringify({ user, demo: true }));
}

function goToDashboard() {
  window.location.href = './dashboard.html';
}

const loginForm = document.querySelector('#login-form');
if (loginForm) {
  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('password') || '').trim();

    if (!email || !password) {
      showMessage(document.querySelector('#login-message'), 'Preencha e-mail e senha.', 'error');
      return;
    }

    const response = signInWithFallback({ email, password });
    if (!response.success) {
      showMessage(document.querySelector('#login-message'), response.message || 'E-mail ou senha inválidos.', 'error');
      return;
    }

    saveSession(response.user);
    showMessage(document.querySelector('#login-message'), 'Login realizado com sucesso.', 'success');
    setTimeout(goToDashboard, 500);
  });

  const createButton = loginForm.querySelector('[data-role="link-create"]');
  if (createButton) createButton.addEventListener('click', () => window.location.href = './cadastro.html');

  const resetButton = loginForm.querySelector('[data-role="link-reset"]');
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      const email = document.querySelector('#login-email')?.value?.trim();
      if (!email) {
        showMessage(document.querySelector('#login-message'), 'Informe seu e-mail para recuperar a senha.', 'error');
        return;
      }

      const response = resetPasswordFallback({ email });
      showMessage(document.querySelector('#login-message'), response.message, response.success ? 'success' : 'error');
    });
  }
}

const signupForm = document.querySelector('#signup-form');
if (signupForm) {
  signupForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(signupForm);
    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('password') || '').trim();

    if (!name || !email || !password) {
      showMessage(document.querySelector('#signup-message'), 'Preencha todos os campos.', 'error');
      return;
    }

    const response = signUpWithFallback({ name, email, password });
    if (!response.success) {
      showMessage(document.querySelector('#signup-message'), response.message, 'error');
      return;
    }

    saveSession(response.user);
    showMessage(document.querySelector('#signup-message'), 'Conta criada com sucesso.', 'success');
    setTimeout(goToDashboard, 500);
  });

  const loginLink = signupForm.querySelector('[data-role="link-login"]');
  if (loginLink) loginLink.addEventListener('click', () => window.location.href = './login.html');
}

const currentUser = getCurrentUser();
if (currentUser && window.location.pathname.endsWith('login.html')) {
  goToDashboard();
}
