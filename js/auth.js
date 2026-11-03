import { getCurrentUser, isSupabaseConfigured, resetPassword, signIn, signUp } from './supabase.js';

function showMessage(element, text, type = '') {
  if (!element) return;
  element.textContent = text;
  element.className = `form-message ${type}`.trim();
}

function setSubmitting(form, submitting) {
  const button = form.querySelector('[type="submit"]');
  if (button) button.disabled = submitting;
}

function goToDashboard() {
  window.location.href = './dashboard.html';
}

const loginForm = document.querySelector('#login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = document.querySelector('#login-message');
    const formData = new FormData(loginForm);
    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('password') || '');

    if (!email || !password) {
      showMessage(message, 'Preencha e-mail e senha.', 'error');
      return;
    }

    setSubmitting(loginForm, true);
    try {
      if (!isSupabaseConfigured()) throw new Error('O acesso às contas ainda não foi configurado. Consulte a documentação do projeto.');
      await signIn({ email, password });
      showMessage(message, 'Login realizado com sucesso.', 'success');
      goToDashboard();
    } catch (error) {
      showMessage(message, error.message, 'error');
    } finally {
      setSubmitting(loginForm, false);
    }
  });

  const createButton = loginForm.querySelector('[data-role="link-create"]');
  createButton?.addEventListener('click', () => window.location.href = './cadastro.html');

  const resetButton = loginForm.querySelector('[data-role="link-reset"]');
  resetButton?.addEventListener('click', async () => {
    const email = document.querySelector('#login-email')?.value?.trim();
    const message = document.querySelector('#login-message');
    if (!email) {
      showMessage(message, 'Informe seu e-mail para recuperar a senha.', 'error');
      return;
    }

    resetButton.disabled = true;
    try {
      await resetPassword({ email });
      showMessage(message, 'Enviamos um link para redefinir sua senha. Verifique seu e-mail.', 'success');
    } catch (error) {
      showMessage(message, error.message, 'error');
    } finally {
      resetButton.disabled = false;
    }
  });
}

const signupForm = document.querySelector('#signup-form');
if (signupForm) {
  signupForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = document.querySelector('#signup-message');
    const formData = new FormData(signupForm);
    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('password') || '');

    if (!name || !email || !password) {
      showMessage(message, 'Preencha todos os campos.', 'error');
      return;
    }

    if (password.length < 8) {
      showMessage(message, 'A senha deve ter pelo menos 8 caracteres.', 'error');
      return;
    }

    setSubmitting(signupForm, true);
    try {
      if (!isSupabaseConfigured()) throw new Error('O cadastro de contas ainda não foi configurado. Consulte a documentação do projeto.');
      const result = await signUp({ name, email, password });
      if (result.needsEmailConfirmation) {
        showMessage(message, 'Conta criada. Confirme seu e-mail antes de entrar.', 'success');
        signupForm.reset();
        return;
      }

      showMessage(message, 'Conta criada com sucesso.', 'success');
      goToDashboard();
    } catch (error) {
      showMessage(message, error.message, 'error');
    } finally {
      setSubmitting(signupForm, false);
    }
  });

  const loginLink = signupForm.querySelector('[data-role="link-login"]');
  loginLink?.addEventListener('click', () => window.location.href = './login.html');
}

async function redirectAuthenticatedUser() {
  if (!loginForm || !isSupabaseConfigured()) return;
  try {
    if (await getCurrentUser()) goToDashboard();
  } catch (error) {
    showMessage(document.querySelector('#login-message'), error.message, 'error');
  }
}

redirectAuthenticatedUser();

if (!isSupabaseConfigured()) {
  const setupMessage = 'Cadastro e sincronização precisam ser configurados com as credenciais do Supabase. Veja a seção “Configurar contas e sincronização” no README.';
  if (loginForm) showMessage(document.querySelector('#login-message'), setupMessage, 'error');
  const signupMessage = document.querySelector('#signup-message');
  if (signupMessage) showMessage(signupMessage, setupMessage, 'error');
  document.querySelector('#login-form [type="submit"]')?.setAttribute('disabled', '');
  document.querySelector('#signup-form [type="submit"]')?.setAttribute('disabled', '');
  document.querySelector('[data-role="link-reset"]')?.setAttribute('disabled', '');
}
