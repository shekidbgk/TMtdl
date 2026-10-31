/**
 * BarOps Application State & Persistence Context
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AppNotification,
  ChecklistItem,
  InventoryReport,
  Outlet,
  ProductItem,
  RequestItem,
  RequestStatus,
  Role,
  RolePermissions,
  TaskItem,
  TaskStatus,
  User,
  VenueConfig,
  WarehouseType,
} from '../types';
import {
  INITIAL_CHECKLISTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_OUTLETS,
  INITIAL_PERMISSIONS,
  INITIAL_PRODUCTS,
  INITIAL_REPORTS,
  INITIAL_REQUESTS,
  INITIAL_TASKS,
  INITIAL_USERS,
  INITIAL_VENUE,
} from './initialData';

interface AppContextType {
  // Auth state
  venue: VenueConfig;
  currentUser: User | null;
  currentOutletId: string;
  outlets: Outlet[];
  users: User[];
  permissions: Record<Role, RolePermissions>;

  // Data collections
  checklists: ChecklistItem[];
  tasks: TaskItem[];
  requests: RequestItem[];
  products: ProductItem[];
  reports: InventoryReport[];
  notifications: AppNotification[];

  // Auth actions
  login: (venueCode: string, login: string, password?: string) => { success: boolean; error?: string };
  quickLogin: (role: Role) => void;
  switchRole: (role: Role) => void;
  logout: () => void;
  registerVenue: (venueName: string, venueCode: string, login: string, password?: string) => void;

  // Outlet selection
  setCurrentOutletId: (outletId: string) => void;

  // Checklists actions
  toggleChecklistItem: (itemId: string) => void;
  toggleSubtask: (itemId: string, subtaskId: string) => void;
  addChecklistItem: (item: Omit<ChecklistItem, 'id'>) => void;
  togglePinChecklist: (itemId: string) => void;
  deleteChecklistItem: (itemId: string) => void;

  // Tasks actions
  createTask: (task: Omit<TaskItem, 'id' | 'createdAt'>) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  deleteTask: (taskId: string) => void;

  // Requests actions
  createRequest: (req: Omit<RequestItem, 'id' | 'createdAt' | 'status'>) => void;
  updateRequestStatus: (requestId: string, status: RequestStatus, note?: string) => void;

  // Inventory actions
  updateProductCount: (productId: string, count: number | null) => void;
  addProduct: (product: Omit<ProductItem, 'id'>) => void;
  updateProduct: (productId: string, data: Partial<ProductItem>) => void;
  deleteProduct: (productId: string) => void;
  submitInventoryReport: (warehouse: WarehouseType) => InventoryReport;

  // Settings actions (Admin)
  addOutlet: (name: string, address?: string) => void;
  updateOutlet: (id: string, name: string, address?: string) => void;
  deleteOutlet: (id: string) => void;
  addUser: (userData: Omit<User, 'id'>) => void;
  updateUser: (id: string, userData: Partial<User>) => void;
  deleteUser: (id: string) => void;
  updateRolePermission: (role: Role, perm: keyof RolePermissions, value: boolean) => void;

  // Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;

  // Reset demo
  resetToDemoData: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_PREFIX = 'barops_v1_';

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`Error loading storage ${key}:`, e);
    return fallback;
  }
}

function saveStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving storage ${key}:`, e);
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [venue, setVenue] = useState<VenueConfig>(() => loadStorage('venue', INITIAL_VENUE));
  const [users, setUsers] = useState<User[]>(() => loadStorage('users', INITIAL_USERS));
  const [currentUser, setCurrentUser] = useState<User | null>(() => loadStorage('currentUser', null));
  const [outlets, setOutlets] = useState<Outlet[]>(() => loadStorage('outlets', INITIAL_OUTLETS));
  const [currentOutletId, setCurrentOutletIdState] = useState<string>(() => {
    const saved = loadStorage<string>('currentOutletId', '');
    if (saved && outlets.some((o) => o.id === saved)) return saved;
    return outlets[0]?.id || 'out-1';
  });
  const [permissions, setPermissions] = useState<Record<Role, RolePermissions>>(() =>
    loadStorage('permissions', INITIAL_PERMISSIONS)
  );

  const [checklists, setChecklists] = useState<ChecklistItem[]>(() =>
    loadStorage('checklists', INITIAL_CHECKLISTS)
  );
  const [tasks, setTasks] = useState<TaskItem[]>(() => loadStorage('tasks', INITIAL_TASKS));
  const [requests, setRequests] = useState<RequestItem[]>(() => loadStorage('requests', INITIAL_REQUESTS));
  const [products, setProducts] = useState<ProductItem[]>(() => loadStorage('products', INITIAL_PRODUCTS));
  const [reports, setReports] = useState<InventoryReport[]>(() => loadStorage('reports', INITIAL_REPORTS));
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    loadStorage('notifications', INITIAL_NOTIFICATIONS)
  );

  // Sync to localStorage
  useEffect(() => saveStorage('venue', venue), [venue]);
  useEffect(() => saveStorage('users', users), [users]);
  useEffect(() => saveStorage('currentUser', currentUser), [currentUser]);
  useEffect(() => saveStorage('outlets', outlets), [outlets]);
  useEffect(() => saveStorage('currentOutletId', currentOutletId), [currentOutletId]);
  useEffect(() => saveStorage('permissions', permissions), [permissions]);
  useEffect(() => saveStorage('checklists', checklists), [checklists]);
  useEffect(() => saveStorage('tasks', tasks), [tasks]);
  useEffect(() => saveStorage('requests', requests), [requests]);
  useEffect(() => saveStorage('products', products), [products]);
  useEffect(() => saveStorage('reports', reports), [reports]);
  useEffect(() => saveStorage('notifications', notifications), [notifications]);

  // Push internal notification helper
  const addNotification = (
    title: string,
    message: string,
    type: AppNotification['type'],
    targetOutletId?: string
  ) => {
    const notif: AppNotification = {
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      outletId: targetOutletId || currentOutletId,
      title,
      message,
      timestamp: 'Только что',
      read: false,
      type,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  // Auth functions
  const login = (venueCode: string, loginVal: string, passwordVal?: string) => {
    const trimmedVenue = venueCode.trim().toUpperCase();
    const trimmedLogin = loginVal.trim().toLowerCase();

    if (venue.venueCode.toUpperCase() !== trimmedVenue) {
      return { success: false, error: 'Заведение с таким кодом не найдено' };
    }

    const found = users.find(
      (u) =>
        u.venueCode.toUpperCase() === trimmedVenue &&
        u.login.toLowerCase() === trimmedLogin &&
        (!passwordVal || u.password === passwordVal)
    );

    if (!found) {
      return { success: false, error: 'Неверный логин или пароль' };
    }

    setCurrentUser(found);
    if (!found.outletIds.includes(currentOutletId) && found.outletIds.length > 0) {
      setCurrentOutletIdState(found.outletIds[0]);
    }

    return { success: true };
  };

  const quickLogin = (role: Role) => {
    const userForRole = users.find((u) => u.role === role) || {
      id: `u-${role}-demo`,
      venueCode: venue.venueCode,
      login: role,
      name: `Сотрудник (${role})`,
      role,
      outletIds: outlets.map((o) => o.id),
    };
    setCurrentUser(userForRole);
    if (!userForRole.outletIds.includes(currentOutletId) && userForRole.outletIds.length > 0) {
      setCurrentOutletIdState(userForRole.outletIds[0]);
    }
  };

  const switchRole = (newRole: Role) => {
    if (!currentUser) return;
    const userForRole = users.find((u) => u.role === newRole);
    if (userForRole) {
      setCurrentUser(userForRole);
      if (!userForRole.outletIds.includes(currentOutletId) && userForRole.outletIds.length > 0) {
        setCurrentOutletIdState(userForRole.outletIds[0]);
      }
    } else {
      // Dynamic shift of role for current profile
      const updated: User = {
        ...currentUser,
        role: newRole,
      };
      setCurrentUser(updated);
    }
    addNotification('Смена роли', `Вы переключились на роль: ${newRole}`, 'system');
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const registerVenue = (
    venueName: string,
    venueCode: string,
    adminLogin: string,
    adminPassword?: string
  ) => {
    const code = venueCode.trim().toUpperCase();
    const newVenue: VenueConfig = {
      venueCode: code,
      name: venueName.trim(),
    };
    const adminUser: User = {
      id: 'u-' + Date.now(),
      venueCode: code,
      login: adminLogin.trim().toLowerCase(),
      password: adminPassword || '123',
      name: 'Администратор (' + adminLogin.trim() + ')',
      role: 'admin',
      outletIds: outlets.map((o) => o.id),
    };

    setVenue(newVenue);
    setUsers((prev) => [adminUser, ...prev]);
    setCurrentUser(adminUser);
    addNotification(
      'Добро пожаловать!',
      `Заведение «${newVenue.name}» успешно создано с кодом ${newVenue.venueCode}.`,
      'system'
    );
  };

  const setCurrentOutletId = (outletId: string) => {
    setCurrentOutletIdState(outletId);
  };

  // Checklists
  const toggleChecklistItem = (itemId: string) => {
    setChecklists((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const nextCompleted = !item.completed;
          const updatedSubtasks = item.subtasks?.map((s) => ({ ...s, completed: nextCompleted }));
          return {
            ...item,
            completed: nextCompleted,
            completedBy: nextCompleted ? currentUser?.name || 'Сотрудник' : undefined,
            completedAt: nextCompleted
              ? new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
              : undefined,
            subtasks: updatedSubtasks,
          };
        }
        return item;
      })
    );
  };

  const toggleSubtask = (itemId: string, subtaskId: string) => {
    setChecklists((prev) =>
      prev.map((item) => {
        if (item.id === itemId && item.subtasks) {
          const newSubs = item.subtasks.map((s) => (s.id === subtaskId ? { ...s, completed: !s.completed } : s));
          const allDone = newSubs.every((s) => s.completed);
          return {
            ...item,
            subtasks: newSubs,
            completed: allDone,
            completedBy: allDone ? currentUser?.name || 'Сотрудник' : item.completedBy,
            completedAt: allDone
              ? new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
              : item.completedAt,
          };
        }
        return item;
      })
    );
  };

  const addChecklistItem = (newItemData: Omit<ChecklistItem, 'id'>) => {
    const newItem: ChecklistItem = {
      ...newItemData,
      id: 'chk-' + Date.now(),
    };
    setChecklists((prev) => [newItem, ...prev]);
    addNotification(
      'Изменение чек-листа',
      `${currentUser?.name || 'Сотрудник'} добавил пункт: «${newItem.title}»`,
      'checklist',
      newItem.outletId
    );
  };

  const togglePinChecklist = (itemId: string) => {
    setChecklists((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, pinned: !item.pinned } : item))
    );
  };

  const deleteChecklistItem = (itemId: string) => {
    const itemToDelete = checklists.find((c) => c.id === itemId);
    setChecklists((prev) => prev.filter((item) => item.id !== itemId));
    if (itemToDelete) {
      addNotification(
        'Чек-лист обновлен',
        `Удален пункт: «${itemToDelete.title}»`,
        'checklist',
        itemToDelete.outletId
      );
    }
  };

  // Tasks
  const createTask = (taskData: Omit<TaskItem, 'id' | 'createdAt'>) => {
    const newTask: TaskItem = {
      ...taskData,
      id: 'tsk-' + Date.now(),
      createdAt: new Date().toLocaleDateString('ru-RU') + ' ' + new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    };
    setTasks((prev) => [newTask, ...prev]);
    addNotification(
      'Новая задача',
      `Сотруднику ${newTask.assignedToName} назначена задача: «${newTask.title}»`,
      'task',
      newTask.outletId
    );
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            status,
            completedAt:
              status === 'completed'
                ? new Date().toLocaleDateString('ru-RU') + ' ' + new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                : undefined,
          };
        }
        return t;
      })
    );
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // Requests
  const createRequest = (reqData: Omit<RequestItem, 'id' | 'createdAt' | 'status'>) => {
    const newReq: RequestItem = {
      ...reqData,
      id: 'req-' + Date.now(),
      status: 'new',
      createdAt: new Date().toLocaleDateString('ru-RU') + ' ' + new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    };
    setRequests((prev) => [newReq, ...prev]);
    addNotification(
      'Новая заявка',
      `${newReq.authorName} создал заявку: «${newReq.title}»`,
      'request',
      newReq.outletId
    );
  };

  const updateRequestStatus = (requestId: string, status: RequestStatus, note?: string) => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            status,
            statusNote: note !== undefined ? note : r.statusNote,
            resolvedBy: currentUser?.name || 'Руководитель',
          };
        }
        return r;
      })
    );
  };

  // Products & Warehouse
  const updateProductCount = (productId: string, count: number | null) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          return {
            ...p,
            actualCount: count,
            lastUpdated: new Date().toLocaleDateString('ru-RU') + ' ' + new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          };
        }
        return p;
      })
    );
  };

  const addProduct = (prodData: Omit<ProductItem, 'id'>) => {
    const newProd: ProductItem = {
      ...prodData,
      id: 'prod-' + Date.now(),
      lastUpdated: new Date().toLocaleDateString('ru-RU') + ' ' + new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    };
    setProducts((prev) => [newProd, ...prev]);
  };

  const updateProduct = (productId: string, data: Partial<ProductItem>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, ...data, lastUpdated: new Date().toLocaleTimeString('ru-RU') } : p))
    );
  };

  const deleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const submitInventoryReport = (warehouse: WarehouseType): InventoryReport => {
    const outlet = outlets.find((o) => o.id === currentOutletId) || outlets[0];
    const warehouseName = warehouse === 'bar' ? 'Склад Бара' : 'Склад Кухни';
    const warehouseProds = products.filter(
      (p) => p.warehouse === warehouse && p.outletId === currentOutletId
    );

    const report: InventoryReport = {
      id: 'rep-' + Date.now(),
      outletId: currentOutletId,
      outletName: outlet ? outlet.name : 'Точка продаж',
      warehouse,
      warehouseName,
      submittedBy: currentUser ? `${currentUser.name} (${currentUser.role})` : 'Сотрудник',
      submittedAt: new Date().toISOString(),
      items: warehouseProds.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        unit: p.unit,
        actualCount: p.actualCount ?? 0,
      })),
    };

    setReports((prev) => [report, ...prev]);
    addNotification(
      'Инвентаризация получена',
      `${report.submittedBy} отправил отчет по «${warehouseName}» (${report.outletName}). Зафиксировано позиций: ${report.items.length}`,
      'inventory',
      currentOutletId
    );

    return report;
  };

  // Settings Actions
  const addOutlet = (name: string, address?: string) => {
    const newOutlet: Outlet = {
      id: 'out-' + Date.now(),
      name: name.trim(),
      address: address?.trim(),
    };
    setOutlets((prev) => [...prev, newOutlet]);
    // Also grant admin access to this outlet
    setUsers((prev) =>
      prev.map((u) => (u.role === 'admin' ? { ...u, outletIds: [...u.outletIds, newOutlet.id] } : u))
    );
  };

  const updateOutlet = (id: string, name: string, address?: string) => {
    setOutlets((prev) =>
      prev.map((o) => (o.id === id ? { ...o, name: name.trim(), address: address?.trim() } : o))
    );
  };

  const deleteOutlet = (id: string) => {
    if (outlets.length <= 1) return; // Keep at least one
    setOutlets((prev) => prev.filter((o) => o.id !== id));
    if (currentOutletId === id) {
      const remaining = outlets.filter((o) => o.id !== id);
      if (remaining.length > 0) {
        setCurrentOutletIdState(remaining[0].id);
      }
    }
  };

  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: 'u-' + Date.now(),
    };
    setUsers((prev) => [...prev, newUser]);
  };

  const updateUser = (id: string, userData: Partial<User>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...userData } : u)));
    if (currentUser?.id === id) {
      setCurrentUser((prev) => (prev ? { ...prev, ...userData } : prev));
    }
  };

  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const updateRolePermission = (role: Role, perm: keyof RolePermissions, value: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [perm]: value,
      },
    }));
  };

  // Notifications
  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const resetToDemoData = () => {
    localStorage.clear();
    setVenue(INITIAL_VENUE);
    setUsers(INITIAL_USERS);
    setCurrentUser(null);
    setOutlets(INITIAL_OUTLETS);
    setCurrentOutletIdState(INITIAL_OUTLETS[0].id);
    setPermissions(INITIAL_PERMISSIONS);
    setChecklists(INITIAL_CHECKLISTS);
    setTasks(INITIAL_TASKS);
    setRequests(INITIAL_REQUESTS);
    setProducts(INITIAL_PRODUCTS);
    setReports(INITIAL_REPORTS);
    setNotifications(INITIAL_NOTIFICATIONS);
  };

  return (
    <AppContext.Provider
      value={{
        venue,
        currentUser,
        currentOutletId,
        outlets,
        users,
        permissions,
        checklists,
        tasks,
        requests,
        products,
        reports,
        notifications,
        login,
        quickLogin,
        switchRole,
        logout,
        registerVenue,
        setCurrentOutletId,
        toggleChecklistItem,
        toggleSubtask,
        addChecklistItem,
        togglePinChecklist,
        deleteChecklistItem,
        createTask,
        updateTaskStatus,
        deleteTask,
        createRequest,
        updateRequestStatus,
        updateProductCount,
        addProduct,
        updateProduct,
        deleteProduct,
        submitInventoryReport,
        addOutlet,
        updateOutlet,
        deleteOutlet,
        addUser,
        updateUser,
        deleteUser,
        updateRolePermission,
        markNotificationRead,
        markAllNotificationsRead,
        clearNotifications,
        resetToDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return ctx;
}
