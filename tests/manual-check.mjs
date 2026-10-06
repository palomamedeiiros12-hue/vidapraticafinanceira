import { calculateBalance, getTaskProgress, canAccessRecord } from '../js/core.js';

const balance = calculateBalance([
  { type: 'receita', value: 300000 },
  { type: 'despesa', value: 100000 },
  { type: 'despesa', value: 50000 }
]);

const taskProgress = getTaskProgress([
  { status: 'concluida' },
  { status: 'concluida' },
  { status: 'pendente' },
  { status: 'pendente' }
]);

const access = canAccessRecord('user-a', 'user-b');

if (balance !== 150000) {
  throw new Error(`Saldo incorreto: ${balance}`);
}

if (JSON.stringify(taskProgress) !== JSON.stringify({ total: 4, finished: 2, pending: 2, progress: 50 })) {
  throw new Error(`Progress incorreto: ${JSON.stringify(taskProgress)}`);
}

if (access !== false) {
  throw new Error('Acesso cruzado não foi bloqueado');
}

console.log('BALANCE_OK', balance);
console.log('TASK_PROGRESS_OK', JSON.stringify(taskProgress));
console.log('ACCESS_CHECK_OK', access);
