import { formatDateBR, getDaysOfWeek, getTaskProgress, safeLocalStorageRead, safeLocalStorageWrite } from './core.js';

const STORAGE_KEYS = {
  session: 'vpf_session',
  tasks: 'vpf_tasks'
};

function currentUser() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.session) || '{}')?.user || null;
  } catch {
    return null;
  }
}

function getTasks() {
  const user = currentUser();
  if (!user) return [];
  return safeLocalStorageRead(STORAGE_KEYS.tasks, []).filter((task) => task.user_id === user.id);
}

function renderProgress() {
  const tasks = getTasks();
  const progress = getTaskProgress(tasks);
  document.querySelector('#task-total').textContent = progress.total;
  document.querySelector('#task-finished').textContent = progress.finished;
  document.querySelector('#task-pending').textContent = progress.pending;
  document.querySelector('#task-progress-value').textContent = `${progress.progress}%`;
  document.querySelector('#task-progress-bar').style.width = `${progress.progress}%`;
}

function renderWeek() {
  const container = document.querySelector('#week-tasks');
  if (!container) return;

  const tasks = getTasks();
  const days = getDaysOfWeek();

  container.innerHTML = days.map((day) => {
    const dayTasks = tasks.filter((task) => task.date === day.key);
    return `
      <article class="day-card">
        <h3>${day.label}</h3>
        <ul>
          ${dayTasks.length ? dayTasks.map((task) => `
            <li class="${task.status === 'concluida' ? 'completed' : ''}">
              <label class="task-mark">
                <input type="checkbox" data-toggle-id="${task.id}" ${task.status === 'concluida' ? 'checked' : ''} />
                <span>${task.title}</span>
              </label>
              <div class="task-actions">
                <button type="button" class="small-btn" data-edit-id="${task.id}">Editar</button>
                <button type="button" class="small-btn" data-delete-id="${task.id}">Excluir</button>
              </div>
            </li>
          `).join('') : '<li>Você não possui tarefas para este dia.</li>'}
        </ul>
      </article>
    `;
  }).join('');

  document.querySelectorAll('[data-toggle-id]').forEach((checkbox) => {
    checkbox.addEventListener('change', (event) => {
      const taskId = event.target.dataset.toggleId;
      const list = safeLocalStorageRead(STORAGE_KEYS.tasks, []);
      const next = list.map((item) => item.id === taskId ? { ...item, status: event.target.checked ? 'concluida' : 'pendente' } : item);
      safeLocalStorageWrite(STORAGE_KEYS.tasks, next);
      renderWeek();
      renderProgress();
    });
  });

  document.querySelectorAll('[data-edit-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const taskId = button.dataset.editId;
      const list = getTasks();
      const task = list.find((item) => item.id === taskId);
      if (!task) return;
      document.querySelector('#task-title').value = task.title;
      document.querySelector('#task-date').value = task.date;
      document.querySelector('#task-form').dataset.editId = taskId;
    });
  });

  document.querySelectorAll('[data-delete-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const taskId = button.dataset.deleteId;
      if (!window.confirm('Deseja excluir esta tarefa?')) return;
      const list = safeLocalStorageRead(STORAGE_KEYS.tasks, []).filter((item) => item.id !== taskId);
      safeLocalStorageWrite(STORAGE_KEYS.tasks, list);
      renderWeek();
      renderProgress();
    });
  });
}

const form = document.querySelector('#task-form');
if (form) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const user = currentUser();
    if (!user) return;

    const title = document.querySelector('#task-title').value.trim();
    const date = document.querySelector('#task-date').value;
    const message = document.querySelector('#task-message');

    if (!title || !date) {
      message.textContent = 'Preencha a tarefa e a data.';
      message.className = 'form-message error';
      return;
    }

    const list = safeLocalStorageRead(STORAGE_KEYS.tasks, []);
    const payload = {
      id: form.dataset.editId || crypto.randomUUID(),
      user_id: user.id,
      title,
      date,
      status: 'pendente'
    };

    const next = form.dataset.editId
      ? list.map((item) => item.id === form.dataset.editId ? { ...item, title, date } : item)
      : [...list, payload];

    safeLocalStorageWrite(STORAGE_KEYS.tasks, next);
    message.textContent = 'Tarefa salva com sucesso.';
    message.className = 'form-message success';
    form.reset();
    delete form.dataset.editId;
    renderWeek();
    renderProgress();
  });
}

renderWeek();
renderProgress();
