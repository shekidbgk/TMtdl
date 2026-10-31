import React, { useState } from 'react';
import {
  Zap,
  Plus,
  Clock,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  Trash2,
  Calendar,
  X,
} from 'lucide-react';
import { useApp } from '../../store/AppContext';
import {
  Department,
  DEPARTMENT_LABELS,
  Role,
  ROLE_DEFINITIONS,
  TaskItem,
  TaskPriority,
  TaskStatus,
} from '../../types';
import { hasPermission } from '../../utils/logic';

const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; badgeClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  new: {
    label: 'Новая',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    icon: AlertCircle,
  },
  in_progress: {
    label: 'В работе',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    icon: PlayCircle,
  },
  completed: {
    label: 'Выполнена',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    icon: CheckCircle2,
  },
};

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  new: 'in_progress',
  in_progress: 'completed',
  completed: 'new',
};

const PRIORITY_LABELS: Record<TaskPriority, { label: string; color: string }> = {
  urgent: { label: 'Срочно', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
  high: { label: 'Высокий', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  medium: { label: 'Средний', color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
  low: { label: 'Низкий', color: 'text-neutral-400 bg-neutral-800 border-neutral-700' },
};

export const TasksView: React.FC = () => {
  const {
    currentUser,
    currentOutletId,
    tasks,
    users,
    permissions,
    createTask,
    updateTaskStatus,
    deleteTask,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAssigneeId, setNewAssigneeId] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');

  if (!currentUser) return null;

  const canAssignTasks = hasPermission(currentUser.role, 'canAssignTasks', permissions);

  // Filter tasks for current outlet
  const outletTasks = tasks.filter((t) => t.outletId === currentOutletId);

  // Filter by status tab
  const filteredTasks = outletTasks.filter((t) => {
    if (statusFilter !== 'all') return t.status === statusFilter;
    return true;
  });

  // Filter potential assignees on current outlet
  const eligibleAssignees = users.filter((u) => {
    if (!u.outletIds.includes(currentOutletId)) return false;

    // Admin can assign to anyone
    if (currentUser.role === 'admin') return true;

    // Head bartender assigns to bartenders / bar staff
    if (currentUser.role === 'head_bartender') {
      return u.role === 'bartender' || u.role === 'head_bartender';
    }

    // Head chef assigns to cooks / kitchen staff
    if (currentUser.role === 'head_chef') {
      return u.role === 'cook' || u.role === 'head_chef';
    }

    return false;
  });

  const handleCreateTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAssigneeId) return;

    const assignee = users.find((u) => u.id === newAssigneeId);
    if (!assignee) return;

    // Determine task department based on assignee
    const dept: Department =
      assignee.role === 'cook' || assignee.role === 'head_chef'
        ? 'kitchen'
        : assignee.role === 'waiter'
        ? 'hall'
        : 'bar';

    createTask({
      outletId: currentOutletId,
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      department: dept,
      assignedToUserId: assignee.id,
      assignedToName: `${assignee.name} (${ROLE_DEFINITIONS[assignee.role].label})`,
      assignedByUserId: currentUser.id,
      assignedByName: `${currentUser.name} (${ROLE_DEFINITIONS[currentUser.role].label})`,
      deadline: newDeadline.trim() || 'До конца смены',
      status: 'new',
      priority: newPriority,
    });

    setNewTitle('');
    setNewDesc('');
    setNewAssigneeId('');
    setNewDeadline('');
    setNewPriority('medium');
    setIsAssignModalOpen(false);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Top Banner & Action */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-900/60 border border-neutral-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-neutral-100">Индивидуальные задачи</h2>
            <p className="text-[11px] text-neutral-400">
              Поручения для сотрудников текущей точки
            </p>
          </div>
        </div>

        {canAssignTasks && (
          <button
            type="button"
            onClick={() => {
              if (eligibleAssignees.length > 0 && !newAssigneeId) {
                setNewAssigneeId(eligibleAssignees[0].id);
              }
              setIsAssignModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 text-neutral-950 text-xs font-bold hover:bg-amber-400 active:scale-95 transition shadow-md shadow-amber-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Назначить</span>
          </button>
        )}
      </div>

      {/* Status Filter Tabs */}
      <div className="flex rounded-xl bg-neutral-900 border border-neutral-800 p-1">
        {(['all', 'new', 'in_progress', 'completed'] as const).map((st) => {
          const count =
            st === 'all'
              ? outletTasks.length
              : outletTasks.filter((t) => t.status === st).length;

          const label =
            st === 'all' ? 'Все' : st === 'new' ? 'Новые' : st === 'in_progress' ? 'В работе' : 'Выполнены';

          return (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`flex-1 py-1.5 px-1 text-xs font-semibold rounded-lg transition ${
                statusFilter === st
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border border-dashed border-neutral-800 bg-neutral-950/40 p-6">
            <Zap className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-neutral-400">Задач в этом списке нет</p>
            {canAssignTasks && (
              <p className="text-xs text-neutral-400 mt-1">
                Нажмите «+ Назначить», чтобы выдать поручение сотруднику
              </p>
            )}
          </div>
        ) : (
          filteredTasks.map((task) => {
            const statusConfig = STATUS_CONFIG[task.status];
            const StatusIcon = statusConfig.icon;
            const priorityConfig = PRIORITY_LABELS[task.priority];

            const canDelete =
              currentUser.role === 'admin' || task.assignedByUserId === currentUser.id;

            return (
              <div
                key={task.id}
                className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-4 shadow-sm hover:border-neutral-700 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      {/* Interactive Status Button: clicking changes status */}
                      <button
                        type="button"
                        onClick={() => updateTaskStatus(task.id, NEXT_STATUS[task.status])}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition active:scale-95 ${statusConfig.badgeClass}`}
                        title="Нажмите, чтобы переключить статус"
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span>{statusConfig.label}</span>
                      </button>

                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${priorityConfig.color}`}
                      >
                        {priorityConfig.label}
                      </span>

                      <span className="text-[10px] text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded-md border border-neutral-800">
                        {DEPARTMENT_LABELS[task.department]}
                      </span>
                    </div>

                    <h4
                      className={`text-sm font-semibold text-neutral-100 ${
                        task.status === 'completed' ? 'line-through text-neutral-500' : ''
                      }`}
                    >
                      {task.title}
                    </h4>

                    {task.description && (
                      <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                        {task.description}
                      </p>
                    )}
                  </div>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => deleteTask(task.id)}
                      className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 transition"
                      title="Удалить задачу"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Footer Metadata */}
                <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-400">
                  <div className="flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-neutral-300 font-medium">Кому: {task.assignedToName}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-amber-300">
                      <Clock className="w-3.5 h-3.5" />
                      Срок: {task.deadline}
                    </span>
                  </div>
                </div>

                <div className="mt-1 text-[10px] text-neutral-500">
                  Назначил: {task.assignedByName} • {task.createdAt}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Assign Task Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-800 p-5 shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800">
              <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Назначить индивидуальную задачу
              </h3>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTaskSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Исполнитель на текущей точке *
                </label>
                {eligibleAssignees.length === 0 ? (
                  <p className="text-xs text-rose-400">
                    На этой точке пока нет привязанных сотрудников вашего подразделения.
                  </p>
                ) : (
                  <select
                    required
                    value={newAssigneeId}
                    onChange={(e) => setNewAssigneeId(e.target.value)}
                    className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2 text-xs text-neutral-100 focus:border-amber-400 focus:outline-none"
                  >
                    <option value="" disabled>
                      Выберите сотрудника...
                    </option>
                    {eligibleAssignees.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {ROLE_DEFINITIONS[u.role].label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Текст задачи *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Например: Проверить накладные поставки крафта"
                  className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3.5 py-2 text-xs text-neutral-100 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Подробное описание (необязательно)
                </label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Дополнительные указания и детали..."
                  className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3.5 py-2 text-xs text-neutral-100 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Срок выполнения *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    placeholder="Сегодня к 18:00"
                    className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2 text-xs text-neutral-100 focus:border-amber-400 focus:outline-none"
                  />
                  <div className="flex gap-1 mt-1">
                    {['К 15:00', 'До конца смены', 'Завтра'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setNewDeadline(preset)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 hover:text-amber-300"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Приоритет
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                    className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2 text-xs text-neutral-100 focus:border-amber-400 focus:outline-none"
                  >
                    <option value="low">Низкий</option>
                    <option value="medium">Средний</option>
                    <option value="high">Высокий</option>
                    <option value="urgent">Срочно</option>
                  </select>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
                После назначения задачи выбранному сотруднику поступит push-уведомление в колокольчик.
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold hover:bg-neutral-700 transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={eligibleAssignees.length === 0}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 text-neutral-950 text-xs font-bold hover:bg-amber-400 transition disabled:opacity-50"
                >
                  Назначить задачу
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
