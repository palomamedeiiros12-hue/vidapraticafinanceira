import { buildSummary, formatCurrency } from './core.js';
import {
  getCurrentUser,
  getTasksByUser,
  getTransactionsByUser,
  updateProfileName,
  updateUserPassword
} from './supabase.js';

const profileForm = document.querySelector('#profile-form');
const passwordForm = document.querySelector('#password-form');
const profileMessage = document.querySelector('#profile-message');
const passwordMessage = document.querySelector('#password-message');

function showMessage(element, text, type = '') {
  if (!element) return;
  element.textContent = text;
  element.className = `form-message ${type}`.trim();
}

function setSubmitting(form, submitting) {
  const button = form?.querySelector('[type="submit"]');
  if (button) button.disabled = submitting;
}

async function populateProfileSummary() {
  const user = await getCurrentUser();
  if (!user) return;

  const [transactions, tasks] = await Promise.all([
    getTransactionsByUser(user.id),
    getTasksByUser(user.id)
  ]);
  const summary = buildSummary(transactions);
  const activeGoals = tasks.filter((task) => task.status !== 'concluida').length;
  document.querySelector('#profile-greeting').textContent = user.name || 'Usuário';
  document.querySelector('#profile-email-label').textContent = user.email;
  document.querySelector('#profile-avatar').textContent = (user.name || 'U').charAt(0).toUpperCase();
  document.querySelector('#profile-balance').textContent = formatCurrency(summary.balance);
  document.querySelector('#profile-goals').textContent = `${activeGoals} ${activeGoals === 1 ? 'ativo' : 'ativos'}`;
  document.querySelector('#profile-name').value = user.name || '';
  document.querySelector('#profile-email').value = user.email || '';
}

profileForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = document.querySelector('#profile-name').value.trim();
  const email = document.querySelector('#profile-email').value.trim();

  if (!name || !email) {
    showMessage(profileMessage, 'Nome e e-mail são obrigatórios.', 'error');
    return;
  }

  setSubmitting(profileForm, true);
  try {
    const result = await updateProfileName(name, email);
    await populateProfileSummary();
    showMessage(
      profileMessage,
      result.emailChangePending
        ? 'Nome atualizado. Confirme a alteração do e-mail pelo link enviado para sua caixa de entrada.'
        : 'Perfil atualizado com sucesso.',
      'success'
    );
  } catch (error) {
    showMessage(profileMessage, `Não foi possível atualizar seu perfil: ${error.message}`, 'error');
  } finally {
    setSubmitting(profileForm, false);
  }
});

passwordForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const password = document.querySelector('#new-password').value;
  if (password.length < 8) {
    showMessage(passwordMessage, 'A senha deve ter pelo menos 8 caracteres.', 'error');
    return;
  }

  setSubmitting(passwordForm, true);
  try {
    await updateUserPassword(password);
    passwordForm.reset();
    showMessage(passwordMessage, 'Senha atualizada com sucesso.', 'success');
  } catch (error) {
    showMessage(passwordMessage, `Não foi possível atualizar sua senha: ${error.message}`, 'error');
  } finally {
    setSubmitting(passwordForm, false);
  }
});

populateProfileSummary().catch((error) => {
  showMessage(profileMessage, `Não foi possível carregar seus dados: ${error.message}`, 'error');
});
