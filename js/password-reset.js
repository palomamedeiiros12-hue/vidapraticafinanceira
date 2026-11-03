import { getCurrentUser, isSupabaseConfigured, setNewPassword } from './supabase.js';

const form = document.querySelector('#password-reset-form');
const message = document.querySelector('#password-reset-message');
const submitButton = form.querySelector('[type="submit"]');

function showMessage(text, type = '') {
  message.textContent = text;
  message.className = `form-message ${type}`.trim();
}

async function init() {
  if (!isSupabaseConfigured()) {
    showMessage('O serviço de contas ainda não foi configurado.', 'error');
    submitButton.disabled = true;
    return;
  }

  try {
    if (!await getCurrentUser()) {
      showMessage('Abra o link de recuperação enviado para seu e-mail. Se ele expirou, solicite outro na página de login.', 'error');
      submitButton.disabled = true;
    }
  } catch (error) {
    showMessage(`Não foi possível validar o link: ${error.message}`, 'error');
    submitButton.disabled = true;
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const password = document.querySelector('#reset-password').value;
  if (password.length < 8) {
    showMessage('A senha deve ter pelo menos 8 caracteres.', 'error');
    return;
  }

  submitButton.disabled = true;
  try {
    await setNewPassword(password);
    showMessage('Senha alterada. Redirecionando para sua conta...', 'success');
    setTimeout(() => window.location.replace('./dashboard.html'), 800);
  } catch (error) {
    showMessage(`Não foi possível alterar a senha: ${error.message}`, 'error');
    submitButton.disabled = false;
  }
});

init();
