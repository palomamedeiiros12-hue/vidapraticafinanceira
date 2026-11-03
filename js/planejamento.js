import { getDaysOfWeek, getTaskProgress } from './core.js';
import { deleteTask, getCurrentUser, getTasksByUser, saveTask } from './supabase.js';

const form = document.querySelector('#task-form');
const container = document.querySelector('#week-tasks');
const message = document.querySelector('#task-message');
const dataMessage = document.querySelector('#task-data-message');
let currentUser = null;
let tasks = [];

function showMessage(element, text, type = '') {
  if (!element) return;
  element.textContent = text;
  element.className = `form-message ${type}`.trim();
}

function renderProgress() {
  const progress = getTaskProgress(tasks);
  document.querySelector('#task-total').textContent = progress.total;
  document.querySelector('#task-finished').textContent = progress.finished;
  document.querySelector('#task-pending').textContent = progress.pending;
  document.querySelector('#task-progress-value').textContent = `${progress.progress}%`;
  document.querySelector('#task-progress-bar').style.width = `${progress.progress}%`;
}

function renderWeek() {
  container.replaceChildren();
  getDaysOfWeek().forEach((day) => {
    const dayCard = document.createElement('article');
    dayCard.className = 'day-card';
    const heading = document.createElement('h3');
    heading.textContent = day.label;
    const list = document.createElement('ul');
    const dayTasks = tasks.filter((task) => task.date === day.key);

    if (!dayTasks.length) {
      const empty = document.createElement('li');
      empty.textContent = 'Você não possui tarefas para este dia.';
      list.append(empty);
    }

    dayTasks.forEach((task) => {
      const item = document.createElement('li');
      if (task.status === 'concluida') item.classList.add('completed');
      const label = document.createElement('label');
      label.className = 'task-mark';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.status === 'concluida';
      checkbox.addEventListener('change', async () => {
        checkbox.disabled = true;
        try {
          await saveTask({ ...task, status: checkbox.checked ? 'concluida' : 'pendente' });
          await reloadTasks();
        } catch (error) {
          showMessage(dataMessage, `Não foi possível atualizar a tarefa: ${error.message}`, 'error');
          checkbox.disabled = false;
          checkbox.checked = task.status === 'concluida';
        }
      });
      const title = document.createElement('span');
      title.textContent = task.title;
      label.append(checkbox, title);

      const actions = document.createElement('div');
      actions.className = 'task-actions';
      const editButton = document.createElement('button');
      editButton.type = 'button';
      editButton.className = 'small-btn';
      editButton.textContent = 'Editar';
      editButton.addEventListener('click', () => {
        document.querySelector('#task-title').value = task.title;
        document.querySelector('#task-date').value = task.date;
        form.dataset.editId = task.id;
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'small-btn';
      deleteButton.textContent = 'Excluir';
      deleteButton.addEventListener('click', async () => {
        if (!window.confirm('Deseja excluir esta tarefa?')) return;
        deleteButton.disabled = true;
        try {
          await deleteTask(task.id);
          await reloadTasks();
        } catch (error) {
          showMessage(dataMessage, `Não foi possível excluir a tarefa: ${error.message}`, 'error');
          deleteButton.disabled = false;
        }
      });
      actions.append(editButton, deleteButton);
      item.append(label, actions);
      list.append(item);
    });

    dayCard.append(heading, list);
    container.append(dayCard);
  });
}

async function reloadTasks() {
  tasks = await getTasksByUser(currentUser.id);
  showMessage(dataMessage, '');
  renderWeek();
  renderProgress();
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const title = document.querySelector('#task-title').value.trim();
  const date = document.querySelector('#task-date').value;
  if (!title || !date) {
    showMessage(message, 'Preencha a tarefa e a data.', 'error');
    return;
  }

  const existingTask = tasks.find((task) => task.id === form.dataset.editId);
  const submitButton = form.querySelector('[type="submit"]');
  submitButton.disabled = true;
  try {
    await saveTask({
      ...(existingTask ? { id: existingTask.id } : {}),
      user_id: currentUser.id,
      title,
      date,
      status: existingTask?.status || 'pendente'
    });
    showMessage(message, 'Tarefa salva com sucesso.', 'success');
    form.reset();
    delete form.dataset.editId;
    await reloadTasks();
  } catch (error) {
    showMessage(message, `Não foi possível salvar a tarefa: ${error.message}`, 'error');
  } finally {
    submitButton.disabled = false;
  }
});

async function initPlanningPage() {
  try {
    currentUser = await getCurrentUser();
    if (!currentUser) return;
    await reloadTasks();
  } catch (error) {
    showMessage(dataMessage, `Não foi possível carregar suas tarefas: ${error.message}`, 'error');
  }
}

initPlanningPage();
