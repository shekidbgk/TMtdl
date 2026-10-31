import React, { useState } from 'react';
import {
  CheckSquare,
  Pin,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Clock,
  User as UserIcon,
  Layers,
  Sun,
  Moon,
  Sparkles,
  X,
} from 'lucide-react';
import { useApp } from '../../store/AppContext';
import {
  ChecklistItem,
  ChecklistType,
  Department,
  DEPARTMENT_LABELS,
} from '../../types';
import {
  calculateChecklistProgress,
  canAccessDepartment,
  hasPermission,
  sortChecklistItems,
} from '../../utils/logic';

export const ChecklistsView: React.FC = () => {
  const {
    currentUser,
    currentOutletId,
    checklists,
    permissions,
    toggleChecklistItem,
    toggleSubtask,
    addChecklistItem,
    togglePinChecklist,
    deleteChecklistItem,
  } = useApp();

  // Determine initial department based on role
  const defaultDept: Department =
    currentUser?.role === 'head_chef' || currentUser?.role === 'cook'
      ? 'kitchen'
      : currentUser?.role === 'waiter'
      ? 'hall'
      : 'bar';

  const [selectedDept, setSelectedDept] = useState<Department>(defaultDept);
  const [selectedType, setSelectedType] = useState<ChecklistType>('morning');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [expandedCompositeIds, setExpandedCompositeIds] = useState<Record<string, boolean>>({});

  // Add item form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<ChecklistType>('morning');
  const [newPinned, setNewPinned] = useState(false);
  const [newSubtasks, setNewSubtasks] = useState<string[]>(['']);

  if (!currentUser) return null;

  // Can this role edit checklists?
  const canEditChecklists =
    hasPermission(currentUser.role, 'canEditChecklists', permissions) &&
    (currentUser.role === 'admin' ||
      (currentUser.role === 'head_bartender' && selectedDept === 'bar') ||
      (currentUser.role === 'head_chef' && selectedDept === 'kitchen'));

  // Filter items by outlet, department, and checklist type
  const currentDeptItems = checklists.filter(
    (c) => c.outletId === currentOutletId && c.department === selectedDept
  );

  const typeFilteredItems = currentDeptItems.filter((c) => c.type === selectedType);
  const sortedItems = sortChecklistItems(typeFilteredItems);

  // Calculate progress for current department & type
  const progress = calculateChecklistProgress(typeFilteredItems);

  const toggleExpand = (id: string) => {
    setExpandedCompositeIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const filteredSubs = newSubtasks
      .map((s) => s.trim())
      .filter(Boolean)
      .map((title, idx) => ({
        id: 'sub-' + Date.now() + '-' + idx,
        title,
        completed: false,
      }));

    addChecklistItem({
      outletId: currentOutletId,
      department: selectedDept,
      type: newType,
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      completed: false,
      pinned: newPinned,
      subtasks: newType === 'composite' && filteredSubs.length > 0 ? filteredSubs : undefined,
    });

    setNewTitle('');
    setNewDesc('');
    setNewPinned(false);
    setNewSubtasks(['']);
    setIsAddModalOpen(false);
  };

  const departments: Department[] = ['bar', 'kitchen', 'hall'];

  return (
    <div className="space-y-4 pb-20">
      {/* 1. Department Tabs (Admin can toggle all three; others locked to their own) */}
      <div className="flex rounded-xl bg-neutral-900 border border-neutral-800 p-1">
        {departments.map((dept) => {
          const isAllowed = canAccessDepartment(currentUser.role, dept);
          const isSelected = selectedDept === dept;

          return (
            <button
              key={dept}
              type="button"
              disabled={!isAllowed}
              onClick={() => {
                setSelectedDept(dept);
                // Expand composite items by default when switching
              }}
              className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg transition relative ${
                isSelected
                  ? 'bg-amber-500 text-neutral-950 shadow-md'
                  : isAllowed
                  ? 'text-neutral-400 hover:text-neutral-200'
                  : 'text-neutral-600 cursor-not-allowed opacity-40'
              }`}
            >
              {DEPARTMENT_LABELS[dept]}
              {!isAllowed && (
                <span className="block text-[9px] font-normal text-neutral-500">нет доступа</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 2. Checklist Type Switcher */}
      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-neutral-900/60 border border-neutral-800">
        <button
          type="button"
          onClick={() => setSelectedType('morning')}
          className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition ${
            selectedType === 'morning'
              ? 'bg-neutral-800 text-amber-300 border border-amber-500/30'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span>Утренний</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedType('evening')}
          className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition ${
            selectedType === 'evening'
              ? 'bg-neutral-800 text-amber-300 border border-amber-500/30'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Moon className="w-3.5 h-3.5 text-indigo-400" />
          <span>Вечерний</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedType('composite')}
          className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition ${
            selectedType === 'composite'
              ? 'bg-neutral-800 text-amber-300 border border-amber-500/30'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span className="truncate">Составные</span>
        </button>
      </div>

      {/* 3. Progress Bar & Top Summary */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-900/70 border border-neutral-800 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-neutral-200">
                Прогресс чек-листа: {DEPARTMENT_LABELS[selectedDept]}
              </h3>
              <p className="text-[11px] text-neutral-400">
                {selectedType === 'morning'
                  ? 'Открытие смены'
                  : selectedType === 'evening'
                  ? 'Закрытие смены'
                  : 'Сложные составные задачи'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-extrabold text-amber-400">
              {progress.completed}/{progress.total}
            </span>
            <span className="text-[10px] text-neutral-400 ml-1">выполнено</span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-neutral-950 rounded-full h-2.5 overflow-hidden border border-neutral-800 p-0.5">
          <div
            className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-1.5 text-[10px] text-neutral-400">
          <span>{progress.percentage}% готовности цеха</span>
          {progress.percentage === 100 && (
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Все пункты завершены!
            </span>
          )}
        </div>
      </div>

      {/* 4. Action bar (Add item button if allowed) */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          Пункты к выполнению ({sortedItems.length})
        </div>

        {canEditChecklists && (
          <button
            type="button"
            onClick={() => {
              setNewType(selectedType);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-neutral-950 text-xs font-bold hover:bg-amber-400 active:scale-95 transition shadow-md shadow-amber-500/10"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Добавить пункт</span>
          </button>
        )}
      </div>

      {/* 5. Checklist Items List */}
      <div className="space-y-2.5">
        {sortedItems.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border border-dashed border-neutral-800 bg-neutral-950/40 p-6">
            <CheckSquare className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-neutral-400">В этом чек-листе пока нет пунктов</p>
            {canEditChecklists && (
              <p className="text-xs text-neutral-400 mt-1">
                Нажмите «+ Добавить пункт», чтобы настроить сменный чек-лист
              </p>
            )}
          </div>
        ) : (
          sortedItems.map((item) => {
            const hasSubtasks = item.subtasks && item.subtasks.length > 0;
            const isExpanded = expandedCompositeIds[item.id] !== false; // expanded by default

            return (
              <div
                key={item.id}
                className={`rounded-2xl border transition ${
                  item.pinned
                    ? 'border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-neutral-900 to-neutral-900 shadow-sm'
                    : item.completed
                    ? 'border-neutral-800/60 bg-neutral-950/60'
                    : 'border-neutral-800 bg-neutral-900/90'
                }`}
              >
                <div className="p-3.5 flex items-start gap-3">
                  {/* Checkbox button */}
                  <button
                    type="button"
                    onClick={() => toggleChecklistItem(item.id)}
                    className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition active:scale-90 ${
                      item.completed
                        ? 'bg-amber-500 border-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                        : 'border-neutral-600 bg-neutral-950 hover:border-amber-400'
                    }`}
                    aria-label={`Отметить пункт ${item.title}`}
                  >
                    {item.completed && <CheckSquare className="w-3.5 h-3.5" />}
                  </button>

                  {/* Title & Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.pinned && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                          <Pin className="w-2.5 h-2.5 fill-amber-300" /> Закреплено
                        </span>
                      )}
                      {item.type === 'composite' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                          <Layers className="w-2.5 h-2.5" /> Составной ({item.subtasks?.filter(s => s.completed).length || 0}/{item.subtasks?.length || 0})
                        </span>
                      )}
                    </div>

                    <p
                      onClick={() => toggleChecklistItem(item.id)}
                      className={`text-sm font-semibold mt-1 cursor-pointer select-none transition ${
                        item.completed ? 'text-neutral-500 line-through' : 'text-neutral-100'
                      }`}
                    >
                      {item.title}
                    </p>

                    {item.description && (
                      <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    {/* Completion Metadata */}
                    {item.completed && item.completedBy && (
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-neutral-400">
                        <span className="flex items-center gap-1">
                          <UserIcon className="w-3 h-3 text-neutral-400" />
                          {item.completedBy}
                        </span>
                        {item.completedAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-neutral-400" />
                            {item.completedAt}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions for supervisors/admin */}
                  <div className="flex items-center gap-1 shrink-0">
                    {hasSubtasks && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(item.id)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                        title={isExpanded ? 'Свернуть подпункты' : 'Развернуть подпункты'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}

                    {canEditChecklists && (
                      <>
                        <button
                          type="button"
                          onClick={() => togglePinChecklist(item.id)}
                          className={`p-1.5 rounded-lg transition ${
                            item.pinned
                              ? 'text-amber-400 hover:bg-amber-500/10'
                              : 'text-neutral-500 hover:text-amber-300 hover:bg-neutral-800'
                          }`}
                          title={item.pinned ? 'Открепить' : 'Закрепить наверху'}
                          aria-label="Закрепить булавкой"
                        >
                          <Pin className={`w-3.5 h-3.5 ${item.pinned ? 'fill-amber-400' : ''}`} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteChecklistItem(item.id)}
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 transition"
                          title="Удалить пункт"
                          aria-label="Удалить пункт"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Composite Subtasks with individual checkboxes */}
                {hasSubtasks && isExpanded && (
                  <div className="px-4 pb-3.5 pt-1 border-t border-neutral-800/80 bg-neutral-950/30 rounded-b-2xl space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                      Вложенные подпункты:
                    </div>
                    {item.subtasks!.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center gap-2.5 py-1 px-2 rounded-lg bg-neutral-900/60 border border-neutral-800/60 hover:border-neutral-700 transition"
                      >
                        <input
                          type="checkbox"
                          checked={sub.completed}
                          onChange={() => toggleSubtask(item.id, sub.id)}
                          id={`subtask-${sub.id}`}
                          className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 focus:ring-offset-neutral-900 bg-neutral-950 border-neutral-700 cursor-pointer"
                        />
                        <label
                          htmlFor={`subtask-${sub.id}`}
                          className={`text-xs select-none cursor-pointer flex-1 ${
                            sub.completed ? 'text-neutral-500 line-through' : 'text-neutral-200'
                          }`}
                        >
                          {sub.title}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Checklist Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-800 p-5 shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800">
              <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-amber-400" />
                Новый пункт чек-листа ({DEPARTMENT_LABELS[selectedDept]})
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Название пункта *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Например: Проверка сроков годности маркировок"
                  className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3.5 py-2 text-xs text-neutral-100 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Описание / Инструкция (необязательно)
                </label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Уточнения, стандарты и допуски ХАССП..."
                  className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3.5 py-2 text-xs text-neutral-100 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Тип чек-листа
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as ChecklistType)}
                    className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2 text-xs text-neutral-100 focus:border-amber-400 focus:outline-none"
                  >
                    <option value="morning">Утренний</option>
                    <option value="evening">Вечерний</option>
                    <option value="composite">Составной</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-200">
                    <input
                      type="checkbox"
                      checked={newPinned}
                      onChange={(e) => setNewPinned(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-neutral-950 border-neutral-700"
                    />
                    <span>Закрепить булавкой 📌</span>
                  </label>
                </div>
              </div>

              {/* Subtasks Builder if Composite */}
              {newType === 'composite' && (
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="text-xs font-bold text-amber-400 flex items-center justify-between">
                    <span>Подпункты задачи:</span>
                    <button
                      type="button"
                      onClick={() => setNewSubtasks((prev) => [...prev, ''])}
                      className="text-[11px] text-amber-300 hover:underline"
                    >
                      + Добавить подпункт
                    </button>
                  </div>
                  {newSubtasks.map((sub, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={sub}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewSubtasks((prev) => {
                            const copy = [...prev];
                            copy[idx] = val;
                            return copy;
                          });
                        }}
                        placeholder={`Подпункт #${idx + 1}`}
                        className="flex-1 rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-1.5 text-xs text-neutral-100 focus:border-amber-400 focus:outline-none"
                      />
                      {newSubtasks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setNewSubtasks((prev) => prev.filter((_, i) => i !== idx))}
                          className="p-1 text-neutral-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold hover:bg-neutral-700 transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 text-neutral-950 text-xs font-bold hover:bg-amber-400 transition"
                >
                  Создать пункт
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
