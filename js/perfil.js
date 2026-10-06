import { buildSummary, formatCurrency, safeLocalStorageRead } from './core.js';
import { getCurrentUser, getTransactionsByUser, getTasksByUser, updateProfileName, updateUserPassword } from './supabase.js';

function showMessage(element, text, type) {
  if (!element) return;
  element.textContent = text;
  element.className = `form-message ${type}`.trim();
}

function populateProfileSummary() {
  const user = getCurrentUser();
  if (!user) return;

  const profileGreeting = document.querySelector('#profile-greeting');
  const emailLabel = document.querySelector('#profile-email-label');
  const avatar = document.querySelector('#profile-avatar');
  const balanceEl = document.querySelector('#profile-balance');
  const goalsEl = document.querySelector('#profile-goals');

  if (profileGreeting) profileGreeting.textContent = user.name || 'Usuário';
  if (emailLabel) emailLabel.textContent = user.email || 'usuario@email.com';
  if (avatar) avatar.textContent = (user.name || 'U').charAt(0).toUpperCase();

  const transactions = getTransactionsByUser(user.id);
  const tasks = getTasksByUser(user.id);
  const summary = buildSummary(transactions);
  const activeGoals = tasks.filter((task) => task.status !== 'concluida').length;

  if (balanceEl) balanceEl.textContent = formatCurrency(summary.balance);
  if (goalsEl) goalsEl.textContent = `${activeGoals} ${activeGoals === 1 ? 'ativo' : 'ativos'}`;
}

const profileForm = document.querySelector('#profile-form');
if (profileForm) {
  const currentUser = getCurrentUser();
  if (currentUser) {
    document.querySelector('#profile-name').value = currentUser.name || '';
    document.querySelector('#profile-email').value = currentUser.email || '';
  }

  profileForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.querySelector('#profile-name').value.trim();
    const email = document.querySelector('#profile-email').value.trim();

    if (!name || !email) {
      showMessage(document.querySelector('#profile-message'), 'Nome e e-mail são obrigatórios.', 'error');
      return;
    }

    const result = updateProfileName(name, email);
    if (!result.success) {
      showMessage(document.querySelector('#profile-message'), result.message, 'error');
      return;
    }

    populateProfileSummary();
    showMessage(document.querySelector('#profile-message'), 'Perfil atualizado com sucesso.', 'success');
  });
}

const passwordForm = document.querySelector('#password-form');
if (passwordForm) {
  passwordForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const password = document.querySelector('#new-password').value.trim();
    if (!password || password.length < 6) {
      showMessage(document.querySelector('#password-message'), 'A senha deve ter pelo menos 6 caracteres.', 'error');
      return;
    }

    const result = updateUserPassword(password);
    if (!result.success) {
      showMessage(document.querySelector('#password-message'), result.message, 'error');
      return;
    }

    passwordForm.reset();
    showMessage(document.querySelector('#password-message'), 'Senha atualizada com sucesso.', 'success');
  });
}

populateProfileSummary();
