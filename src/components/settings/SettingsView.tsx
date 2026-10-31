import React, { useState } from 'react';
import {
  Settings,
  MapPin,
  Users,
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  RotateCcw,
  Building2,
  CheckCircle2,
  Wine,
  Shield,
  ChefHat,
  GlassWater,
  Flame,
  UtensilsCrossed,
  Download,
} from 'lucide-react';
import { useApp } from '../../store/AppContext';
import {
  Outlet,
  Role,
  ROLE_DEFINITIONS,
  RolePermissions,
  User,
} from '../../types';
import { PWAInstallButton } from '../common/PWAInstallButton';

const ROLE_ICONS: Record<Role, React.ComponentType<{ className?: string }>> = {
  admin: Shield,
  head_bartender: Wine,
  head_chef: ChefHat,
  bartender: GlassWater,
  cook: Flame,
  waiter: UtensilsCrossed,
};

export const SettingsView: React.FC = () => {
  const {
    venue,
    outlets,
    users,
    permissions,
    currentUser,
    addOutlet,
    updateOutlet,
    deleteOutlet,
    addUser,
    updateUser,
    deleteUser,
    updateRolePermission,
    resetToDemoData,
  } = useApp();

  const [subTab, setSubTab] = useState<'outlets' | 'staff' | 'permissions'>('outlets');

  // Outlet form states
  const [isAddOutletOpen, setIsAddOutletOpen] = useState(false);
  const [newOutletName, setNewOutletName] = useState('');
  const [newOutletAddress, setNewOutletAddress] = useState('');
  const [editingOutletId, setEditingOutletId] = useState<string | null>(null);
  const [editOutletName, setEditOutletName] = useState('');
  const [editOutletAddress, setEditOutletAddress] = useState('');

  // Staff form states
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffLogin, setNewStaffLogin] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('123');
  const [newStaffRole, setNewStaffRole] = useState<Role>('bartender');
  const [newStaffOutlets, setNewStaffOutlets] = useState<string[]>([outlets[0]?.id || 'out-1']);

  // Editing staff state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editStaffRole, setEditStaffRole] = useState<Role>('bartender');
  const [editStaffOutlets, setEditStaffOutlets] = useState<string[]>([]);

  // Selected role for permissions
  const [selectedRoleForPerms, setSelectedRoleForPerms] = useState<Role>('head_bartender');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  if (currentUser?.role !== 'admin') {
    return (
      <div className="py-16 text-center text-neutral-400">
        У вас нет прав для просмотра этого раздела.
      </div>
    );
  }

  // Handle Add Outlet
  const handleAddOutletSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOutletName.trim()) return;
    addOutlet(newOutletName.trim(), newOutletAddress.trim() || undefined);
    setNewOutletName('');
    setNewOutletAddress('');
    setIsAddOutletOpen(false);
  };

  const startEditOutlet = (outlet: Outlet) => {
    setEditingOutletId(outlet.id);
    setEditOutletName(outlet.name);
    setEditOutletAddress(outlet.address || '');
  };

  const saveEditOutlet = (id: string) => {
    if (!editOutletName.trim()) return;
    updateOutlet(id, editOutletName.trim(), editOutletAddress.trim() || undefined);
    setEditingOutletId(null);
  };

  // Handle Add Staff
  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffLogin.trim() || newStaffOutlets.length === 0) return;

    addUser({
      venueCode: venue.venueCode,
      name: newStaffName.trim(),
      login: newStaffLogin.trim().toLowerCase(),
      password: newStaffPassword.trim() || '123',
      role: newStaffRole,
      outletIds: newStaffOutlets,
    });

    setNewStaffName('');
    setNewStaffLogin('');
    setNewStaffPassword('123');
    setNewStaffRole('bartender');
    setNewStaffOutlets([outlets[0]?.id || 'out-1']);
    setIsAddStaffOpen(false);
  };

  const startEditUser = (u: User) => {
    setEditingUserId(u.id);
    setEditStaffRole(u.role);
    setEditStaffOutlets(u.outletIds);
  };

  const saveEditUser = (id: string) => {
    if (editStaffOutlets.length === 0) return;
    updateUser(id, {
      role: editStaffRole,
      outletIds: editStaffOutlets,
    });
    setEditingUserId(null);
  };

  const allRoles: Role[] = [
    'admin',
    'head_bartender',
    'head_chef',
    'bartender',
    'cook',
    'waiter',
  ];

  const currentRolePerms = permissions[selectedRoleForPerms];

  return (
    <div className="space-y-4 pb-20">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-900/60 border border-neutral-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-neutral-100">Настройки заведения</h2>
            <p className="text-[11px] text-neutral-400">
              {venue.name} • Код: <strong className="text-amber-400">{venue.venueCode}</strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsResetModalOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-rose-400 text-xs transition active:scale-95"
          title="Сбросить демо-данные"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Сброс демо</span>
        </button>
      </div>

      {/* Reset Demo Confirmation Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-800 p-5 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-bold text-neutral-100 mb-2">Сброс демонстрационных данных</h3>
            <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
              Вы уверены, что хотите сбросить все изменения и вернуть исходные демо-данные заведения?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="flex-1 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold hover:bg-neutral-700 transition"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsResetModalOpen(false);
                  resetToDemoData();
                }}
                className="flex-1 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-400 transition"
              >
                Сбросить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3 Sub-tabs Switcher */}
      <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-neutral-900 border border-neutral-800">
        <button
          type="button"
          onClick={() => setSubTab('outlets')}
          className={`flex items-center justify-center gap-1.5 py-2 px-1 text-xs font-bold rounded-lg transition ${
            subTab === 'outlets'
              ? 'bg-amber-500 text-neutral-950 shadow-md'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Точки ({outlets.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('staff')}
          className={`flex items-center justify-center gap-1.5 py-2 px-1 text-xs font-bold rounded-lg transition ${
            subTab === 'staff'
              ? 'bg-amber-500 text-neutral-950 shadow-md'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span className="truncate">Персонал</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('permissions')}
          className={`flex items-center justify-center gap-1.5 py-2 px-1 text-xs font-bold rounded-lg transition ${
            subTab === 'permissions'
              ? 'bg-amber-500 text-neutral-950 shadow-md'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="truncate">Права групп</span>
        </button>
      </div>

      {/* 1. Sub-tab: «Точки продаж» */}
      {subTab === 'outlets' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Список филиалов и баров ({outlets.length})
            </span>
            <button
              type="button"
              onClick={() => setIsAddOutletOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-neutral-950 text-xs font-bold hover:bg-amber-400 active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Новая точка</span>
            </button>
          </div>

          <div className="space-y-2">
            {outlets.map((outlet) => {
              const isEditing = editingOutletId === outlet.id;
              const assignedCount = users.filter((u) => u.outletIds.includes(outlet.id)).length;

              if (isEditing) {
                return (
                  <div
                    key={outlet.id}
                    className="p-3.5 rounded-2xl bg-neutral-900 border border-amber-500/50 space-y-2"
                  >
                    <input
                      type="text"
                      value={editOutletName}
                      onChange={(e) => setEditOutletName(e.target.value)}
                      placeholder="Название точки..."
                      className="w-full rounded-lg bg-neutral-950 border border-neutral-700 px-3 py-1.5 text-xs text-neutral-100"
                    />
                    <input
                      type="text"
                      value={editOutletAddress}
                      onChange={(e) => setEditOutletAddress(e.target.value)}
                      placeholder="Адрес (ул. ..., д. ...)"
                      className="w-full rounded-lg bg-neutral-950 border border-neutral-700 px-3 py-1.5 text-xs text-neutral-100"
                    />
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingOutletId(null)}
                        className="px-3 py-1 text-xs rounded-lg bg-neutral-800 text-neutral-300"
                      >
                        Отмена
                      </button>
                      <button
                        type="button"
                        onClick={() => saveEditOutlet(outlet.id)}
                        className="px-3 py-1 text-xs rounded-lg bg-amber-500 text-neutral-950 font-bold"
                      >
                        Сохранить
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={outlet.id}
                  className="p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-between gap-3 shadow-sm hover:border-neutral-700 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-neutral-100 truncate">
                        {outlet.name}
                      </h4>
                      <p className="text-[11px] text-neutral-400 truncate">
                        {outlet.address || 'Адрес не указан'} • {assignedCount} сотр.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEditOutlet(outlet)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-300 hover:bg-neutral-800 transition"
                      title="Переименовать"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {outlets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => deleteOutlet(outlet.id)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition"
                        title="Удалить точку"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Outlet Modal */}
          {isAddOutletOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-800 p-5 shadow-2xl animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800">
                  <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    Добавить новую точку продаж
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddOutletOpen(false)}
                    className="p-1 text-neutral-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddOutletSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Название точки *
                    </label>
                    <input
                      type="text"
                      required
                      value={newOutletName}
                      onChange={(e) => setNewOutletName(e.target.value)}
                      placeholder="Например: Бар Юг"
                      className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2 text-xs text-neutral-100 focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Адрес точки
                    </label>
                    <input
                      type="text"
                      value={newOutletAddress}
                      onChange={(e) => setNewOutletAddress(e.target.value)}
                      placeholder="пр. Московский, 102"
                      className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2 text-xs text-neutral-100 focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddOutletOpen(false)}
                      className="flex-1 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-xl bg-amber-500 text-neutral-950 text-xs font-bold hover:bg-amber-400"
                    >
                      Создать точку
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Sub-tab: «Персонал» */}
      {subTab === 'staff' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Команда заведения ({users.length})
            </span>
            <button
              type="button"
              onClick={() => setIsAddStaffOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-neutral-950 text-xs font-bold hover:bg-amber-400 active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Добавить сотрудника</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {users.map((user) => {
              const def = ROLE_DEFINITIONS[user.role];
              const Icon = ROLE_ICONS[user.role];
              const isEditing = editingUserId === user.id;

              if (isEditing) {
                return (
                  <div
                    key={user.id}
                    className="p-3.5 rounded-2xl bg-neutral-900 border border-amber-500/50 space-y-3"
                  >
                    <div className="text-xs font-bold text-neutral-100">{user.name} ({user.login})</div>
                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1">Роль сотрудника:</label>
                      <select
                        value={editStaffRole}
                        onChange={(e) => setEditStaffRole(e.target.value as Role)}
                        className="w-full rounded-lg bg-neutral-950 border border-neutral-700 px-2.5 py-1.5 text-xs text-neutral-100"
                      >
                        {allRoles.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_DEFINITIONS[r].label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1.5">
                        Привязка к точкам продаж (галочки):
                      </label>
                      <div className="space-y-1.5">
                        {outlets.map((o) => (
                          <label key={o.id} className="flex items-center gap-2 text-xs text-neutral-200 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editStaffOutlets.includes(o.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditStaffOutlets((prev) => [...prev, o.id]);
                                } else {
                                  setEditStaffOutlets((prev) => prev.filter((id) => id !== o.id));
                                }
                              }}
                              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-neutral-950 border-neutral-700"
                            />
                            <span>{o.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingUserId(null)}
                        className="px-3 py-1 text-xs rounded-lg bg-neutral-800 text-neutral-300"
                      >
                        Отмена
                      </button>
                      <button
                        type="button"
                        onClick={() => saveEditUser(user.id)}
                        className="px-3 py-1 text-xs rounded-lg bg-amber-500 text-neutral-950 font-bold"
                      >
                        Сохранить
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={user.id}
                  className="p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-between gap-3 shadow-sm hover:border-neutral-700 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-neutral-100 truncate">
                          {user.name}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${def.badgeColor}`}>
                          {def.label}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span>Логин: <strong className="text-neutral-300 font-mono">{user.login}</strong></span>
                        <span>• Точки:</span>
                        {user.outletIds.map((oId) => {
                          const o = outlets.find((x) => x.id === oId);
                          return (
                            <span key={oId} className="bg-neutral-950 text-neutral-300 px-1.5 py-0.2 rounded border border-neutral-800 text-[10px]">
                              {o ? o.name : oId}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEditUser(user)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-300 hover:bg-neutral-800 transition"
                      title="Редактировать роль и точки"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {user.id !== currentUser.id && (
                      <button
                        type="button"
                        onClick={() => deleteUser(user.id)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition"
                        title="Удалить сотрудника"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Staff Modal */}
          {isAddStaffOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-800 p-5 shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800">
                  <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    Добавить сотрудника
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddStaffOpen(false)}
                    className="p-1 text-neutral-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddStaffSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      ФИО сотрудника *
                    </label>
                    <input
                      type="text"
                      required
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      placeholder="Например: Иван Васильев"
                      className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2 text-xs text-neutral-100 focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Логин для входа *
                      </label>
                      <input
                        type="text"
                        required
                        value={newStaffLogin}
                        onChange={(e) => setNewStaffLogin(e.target.value)}
                        placeholder="ivan_bar"
                        className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2 text-xs text-neutral-100 focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Пароль *
                      </label>
                      <input
                        type="text"
                        required
                        value={newStaffPassword}
                        onChange={(e) => setNewStaffPassword(e.target.value)}
                        placeholder="123"
                        className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2 text-xs text-neutral-100 focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Роль в заведении *
                    </label>
                    <select
                      value={newStaffRole}
                      onChange={(e) => setNewStaffRole(e.target.value as Role)}
                      className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2 text-xs text-neutral-100 focus:border-amber-400 focus:outline-none"
                    >
                      {allRoles.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_DEFINITIONS[r].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Привязка к точкам продаж (отметьте одну или несколько) *
                    </label>
                    <div className="space-y-2 p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                      {outlets.map((outlet) => (
                        <label
                          key={outlet.id}
                          className="flex items-center gap-2.5 text-xs text-neutral-200 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={newStaffOutlets.includes(outlet.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewStaffOutlets((prev) => [...prev, outlet.id]);
                              } else {
                                setNewStaffOutlets((prev) => prev.filter((id) => id !== outlet.id));
                              }
                            }}
                            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-neutral-900 border-neutral-700"
                          />
                          <span>{outlet.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddStaffOpen(false)}
                      className="flex-1 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      disabled={newStaffOutlets.length === 0}
                      className="flex-1 py-2 rounded-xl bg-amber-500 text-neutral-950 text-xs font-bold hover:bg-amber-400 disabled:opacity-50"
                    >
                      Создать сотрудника
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Sub-tab: «Права групп» */}
      {subTab === 'permissions' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400">
              Выберите роль для настройки прав доступа:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {allRoles.map((role) => {
                const def = ROLE_DEFINITIONS[role];
                const Icon = ROLE_ICONS[role];
                const isSelected = selectedRoleForPerms === role;

                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRoleForPerms(role)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                        : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs truncate">{def.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Permissions toggles card */}
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <div>
                  <h4 className="text-sm font-bold text-neutral-100">
                    Права группы: {ROLE_DEFINITIONS[selectedRoleForPerms].label}
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    Переключение тумблеров немедленно меняет возможности сотрудников
                  </p>
                </div>
              </div>

              {selectedRoleForPerms === 'admin' && (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                  Всегда активны
                </span>
              )}
            </div>

            <div className="space-y-3">
              {[
                {
                  key: 'canEditChecklists' as keyof RolePermissions,
                  title: 'Редактирование чек-листов',
                  desc: 'Добавление новых пунктов, закрепление булавкой и удаление пунктов',
                },
                {
                  key: 'canAssignTasks' as keyof RolePermissions,
                  title: 'Назначение индивидуальных задач',
                  desc: 'Кнопка «+ Назначить задачу» для сотрудников своего цеха',
                },
                {
                  key: 'canManageRequests' as keyof RolePermissions,
                  title: 'Работа со служебными заявками',
                  desc: 'Смена статусов «В работу», «Выполнено», «Отклонить» и добавление комментариев',
                },
                {
                  key: 'canEditProducts' as keyof RolePermissions,
                  title: 'Редактирование справочника склада',
                  desc: 'Добавление новых позиций, переименование, удаление и выбор единиц измерения',
                },
              ].map((perm) => {
                const isChecked = selectedRoleForPerms === 'admin' || Boolean(currentRolePerms?.[perm.key]);
                const isDisabled = selectedRoleForPerms === 'admin';

                return (
                  <div
                    key={perm.key}
                    className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between gap-3 hover:border-neutral-700 transition"
                  >
                    <div className="flex-1">
                      <div className="text-xs font-bold text-neutral-100">{perm.title}</div>
                      <div className="text-[11px] text-neutral-400 leading-relaxed">{perm.desc}</div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        disabled={isDisabled}
                        checked={isChecked}
                        onChange={(e) =>
                          updateRolePermission(selectedRoleForPerms, perm.key, e.target.checked)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 peer-disabled:opacity-60 cursor-pointer"></div>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* PWA & System Info */}
      <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-neutral-200">Мобильное приложение (PWA)</h4>
          <p className="text-[11px] text-neutral-400">Установите BarOps на экран смартфона для быстрой работы</p>
        </div>
        <PWAInstallButton compact />
      </div>

      {/* Export Source Code Archive */}
      <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-bold text-neutral-200">Выгрузка кода проекта</h4>
          <p className="text-[11px] text-neutral-400">Полный архив исходного кода BarOps (.zip, React, TypeScript, Tailwind)</p>
        </div>
        <a
          href="/barops-project.zip"
          download="barops-project.zip"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs font-bold transition active:scale-95 shrink-0"
        >
          <Download className="w-4 h-4 text-amber-400" />
          <span>Скачать .zip</span>
        </a>
      </div>
    </div>
  );
};
