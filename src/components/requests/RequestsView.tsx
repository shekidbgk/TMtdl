import React, { useState } from 'react';
import {
  Inbox,
  Plus,
  Clock,
  User as UserIcon,
  Wrench,
  ShoppingBag,
  PackageSearch,
  HelpCircle,
  CheckCircle,
  PlayCircle,
  XCircle,
  AlertCircle,
  Filter,
  X,
  MessageSquare,
} from 'lucide-react';
import { useApp } from '../../store/AppContext';
import {
  Department,
  DEPARTMENT_LABELS,
  RequestCategory,
  REQUEST_CATEGORY_LABELS,
  RequestItem,
  RequestStatus,
  ROLE_DEFINITIONS,
} from '../../types';
import { canReviewRequest, hasPermission } from '../../utils/logic';

const CATEGORY_ICONS: Record<RequestCategory, React.ComponentType<{ className?: string }>> = {
  breakdown: Wrench,
  procurement: ShoppingBag,
  household: PackageSearch,
  other: HelpCircle,
};

const CATEGORY_COLORS: Record<RequestCategory, string> = {
  breakdown: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  procurement: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  household: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
  other: 'text-neutral-300 bg-neutral-800 border-neutral-700',
};

const STATUS_CONFIG: Record<
  RequestStatus,
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
    label: 'Выполнено',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    icon: CheckCircle,
  },
  rejected: {
    label: 'Отклонено',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    icon: XCircle,
  },
};

export const RequestsView: React.FC = () => {
  const {
    currentUser,
    currentOutletId,
    requests,
    permissions,
    createRequest,
    updateRequestStatus,
  } = useApp();

  const [deptFilter, setDeptFilter] = useState<'all' | Department>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | RequestStatus>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeNoteModalRequestId, setActiveNoteModalRequestId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [pendingStatusChange, setPendingStatusChange] = useState<RequestStatus | null>(null);

  // New Request Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<RequestCategory>('breakdown');
  const [newDept, setNewDept] = useState<Department>(
    currentUser?.role === 'head_chef' || currentUser?.role === 'cook'
      ? 'kitchen'
      : currentUser?.role === 'waiter'
      ? 'hall'
      : 'bar'
  );

  if (!currentUser) return null;

  // Filter requests for current outlet
  const outletRequests = requests.filter((r) => r.outletId === currentOutletId);

  // Filter by dept & status
  const filteredRequests = outletRequests.filter((r) => {
    if (deptFilter !== 'all' && r.department !== deptFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    return true;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    createRequest({
      outletId: currentOutletId,
      category: newCategory,
      department: newDept,
      authorId: currentUser.id,
      authorName: `${currentUser.name} (${ROLE_DEFINITIONS[currentUser.role].label})`,
      title: newTitle.trim(),
      description: newDesc.trim(),
    });

    setNewTitle('');
    setNewDesc('');
    setIsCreateModalOpen(false);
  };

  const openStatusChangeWithNote = (reqId: string, status: RequestStatus) => {
    setActiveNoteModalRequestId(reqId);
    setPendingStatusChange(status);
    setResolutionNote('');
  };

  const confirmStatusChange = () => {
    if (activeNoteModalRequestId && pendingStatusChange) {
      updateRequestStatus(
        activeNoteModalRequestId,
        pendingStatusChange,
        resolutionNote.trim() || undefined
      );
    }
    setActiveNoteModalRequestId(null);
    setPendingStatusChange(null);
    setResolutionNote('');
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Top Banner & Create Action */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-900/60 border border-neutral-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
            <Inbox className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-neutral-100">Служебные заявки</h2>
            <p className="text-[11px] text-neutral-400">
              Поломки, закуп, нехватка и хозтовары
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 text-neutral-950 text-xs font-bold hover:bg-amber-400 active:scale-95 transition shadow-md shadow-amber-500/20"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Создать заявку</span>
        </button>
      </div>

      {/* Department Filter Tabs */}
      <div className="flex rounded-xl bg-neutral-900 border border-neutral-800 p-1">
        {(['all', 'bar', 'kitchen', 'hall'] as const).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDeptFilter(d)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              deptFilter === d
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {d === 'all' ? 'Все цеха' : DEPARTMENT_LABELS[d]}
          </button>
        ))}
      </div>

      {/* Status Filter Badges */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] text-neutral-400 flex items-center gap-1 shrink-0 pl-1">
          <Filter className="w-3 h-3 text-neutral-400" /> Статус:
        </span>
        {(['all', 'new', 'in_progress', 'completed', 'rejected'] as const).map((st) => {
          const count =
            st === 'all'
              ? outletRequests.length
              : outletRequests.filter((r) => r.status === st).length;
          const label =
            st === 'all'
              ? 'Все'
              : st === 'new'
              ? 'Новые'
              : st === 'in_progress'
              ? 'В работе'
              : st === 'completed'
              ? 'Выполнены'
              : 'Отклонены';

          return (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg text-xs shrink-0 transition ${
                statusFilter === st
                  ? 'bg-neutral-800 text-amber-300 border border-amber-500/30 font-semibold'
                  : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-neutral-200'
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border border-dashed border-neutral-800 bg-neutral-950/40 p-6">
            <Inbox className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-neutral-400">Заявок в этой категории нет</p>
            <p className="text-xs text-neutral-400 mt-1">
              Персонал может нажать «+ Создать заявку», чтобы сообщить о нехватке или поломке
            </p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const CatIcon = CATEGORY_ICONS[req.category];
            const catColor = CATEGORY_COLORS[req.category];
            const statusConfig = STATUS_CONFIG[req.status];
            const StatusIcon = statusConfig.icon;

            // Check if current user has authority to review/change status of this request
            const canManage =
              hasPermission(currentUser.role, 'canManageRequests', permissions) &&
              canReviewRequest(currentUser.role, req.department);

            return (
              <div
                key={req.id}
                className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-4 shadow-sm hover:border-neutral-700 transition"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${catColor}`}
                    >
                      <CatIcon className="w-3 h-3" />
                      {REQUEST_CATEGORY_LABELS[req.category]}
                    </span>

                    <span className="text-[10px] text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded-md border border-neutral-800">
                      Цех: {DEPARTMENT_LABELS[req.department]}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${statusConfig.badgeClass}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.label}
                    </span>
                  </div>

                  <span className="text-[10px] text-neutral-500 whitespace-nowrap">
                    {req.createdAt}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-neutral-100">{req.title}</h4>
                <p className="text-xs text-neutral-300 mt-1 leading-relaxed">{req.description}</p>

                {/* Resolution note if exists */}
                {req.statusNote && (
                  <div className="mt-2.5 p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 flex items-start gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-semibold text-neutral-500 block">
                        Ответ руководства ({req.resolvedBy}):
                      </span>
                      {req.statusNote}
                    </div>
                  </div>
                )}

                {/* Author Info */}
                <div className="mt-3 pt-2 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
                  <span className="flex items-center gap-1">
                    <UserIcon className="w-3 h-3 text-neutral-400" />
                    Автор: {req.authorName}
                  </span>

                  {req.resolvedBy && !req.statusNote && (
                    <span className="text-[10px] text-neutral-500">
                      Принял: {req.resolvedBy}
                    </span>
                  )}
                </div>

                {/* Action Buttons for Supervisors & Admin: «В работу», «Выполнено», «Отклонить» */}
                {canManage && (
                  <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex items-center gap-2">
                    <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider mr-1">
                      Решение:
                    </span>

                    {req.status !== 'in_progress' && (
                      <button
                        type="button"
                        onClick={() => openStatusChangeWithNote(req.id, 'in_progress')}
                        className="flex-1 py-1 px-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/20 active:scale-95 transition"
                      >
                        В работу
                      </button>
                    )}

                    {req.status !== 'completed' && (
                      <button
                        type="button"
                        onClick={() => openStatusChangeWithNote(req.id, 'completed')}
                        className="flex-1 py-1 px-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/20 active:scale-95 transition"
                      >
                        Выполнено
                      </button>
                    )}

                    {req.status !== 'rejected' && (
                      <button
                        type="button"
                        onClick={() => openStatusChangeWithNote(req.id, 'rejected')}
                        className="py-1 px-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold hover:bg-rose-500/20 active:scale-95 transition"
                      >
                        Отклонить
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create Request Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-800 p-5 shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800">
              <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                <Inbox className="w-4 h-4 text-amber-400" />
                Новая служебная заявка
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Категория *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as RequestCategory)}
                    className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2 text-xs text-neutral-100 focus:border-amber-400 focus:outline-none"
                  >
                    <option value="breakdown">Поломка</option>
                    <option value="procurement">Закуп/Нехватка</option>
                    <option value="household">Хозтовары</option>
                    <option value="other">Прочее</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Подразделение *
                  </label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value as Department)}
                    className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2 text-xs text-neutral-100 focus:border-amber-400 focus:outline-none"
                  >
                    <option value="bar">Бар</option>
                    <option value="kitchen">Кухня</option>
                    <option value="hall">Зал</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Краткая суть заявки *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Например: Закончился сироп Ваниль / Течет кран"
                  className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3.5 py-2 text-xs text-neutral-100 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Подробное описание проблемы / закупки *
                </label>
                <textarea
                  rows={3}
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Опишите масштаб поломки, точное количество необходимого товара или другие детали..."
                  className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3.5 py-2 text-xs text-neutral-100 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
                Заявка сразу отобразится у Старшего бармена, Шеф-повара и Администратора, а также отправит уведомление.
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold hover:bg-neutral-700 transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 text-neutral-950 text-xs font-bold hover:bg-amber-400 transition"
                >
                  Отправить заявку
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolution Note Modal */}
      {activeNoteModalRequestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-800 p-5 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-bold text-neutral-100 mb-2">
              Смена статуса: {pendingStatusChange ? STATUS_CONFIG[pendingStatusChange].label : ''}
            </h3>
            <p className="text-xs text-neutral-400 mb-3">
              Добавьте комментарий или примечание для сотрудника (необязательно):
            </p>

            <textarea
              rows={3}
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="Например: Закуплено на оптовой базе / Мастер вызван на 17:00 / Отклонено из-за дубликата"
              className="w-full rounded-xl bg-neutral-950 border border-neutral-700 p-2.5 text-xs text-neutral-100 focus:border-amber-400 focus:outline-none mb-4"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveNoteModalRequestId(null);
                  setPendingStatusChange(null);
                }}
                className="flex-1 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={confirmStatusChange}
                className="flex-1 py-2 rounded-xl bg-amber-500 text-neutral-950 text-xs font-bold"
              >
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
