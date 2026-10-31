/**
 * BarOps Type Definitions
 */

export type Role =
  | 'admin'
  | 'head_bartender'
  | 'head_chef'
  | 'bartender'
  | 'cook'
  | 'waiter';

export type Department = 'bar' | 'kitchen' | 'hall';

export interface RoleInfo {
  id: Role;
  label: string;
  department: Department | 'all';
  description: string;
  badgeColor: string;
}

export const ROLE_DEFINITIONS: Record<Role, RoleInfo> = {
  admin: {
    id: 'admin',
    label: 'Администратор',
    department: 'all',
    description: 'Полный доступ ко всем точкам, цехам, складам и настройкам системы',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  head_bartender: {
    id: 'head_bartender',
    label: 'Старший бармен',
    department: 'bar',
    description: 'Управление баром, чек-листами, задачами барменов, складом бара и заявками',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  head_chef: {
    id: 'head_chef',
    label: 'Старший повар',
    department: 'kitchen',
    description: 'Управление кухней, чек-листами поваров, задачами кухни, складом и заявками',
    badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  },
  bartender: {
    id: 'bartender',
    label: 'Бармен',
    department: 'bar',
    description: 'Выполнение сменных чек-листов бара, личных задач, подача заявок и учет склада бара',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  },
  cook: {
    id: 'cook',
    label: 'Повар',
    department: 'kitchen',
    description: 'Выполнение сменных чек-листов кухни, учет склада кухни и подача заявок',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  },
  waiter: {
    id: 'waiter',
    label: 'Официант',
    department: 'hall',
    description: 'Выполнение чек-листов зала, отслеживание задач и отправка служебных заявок',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  },
};

export const DEPARTMENT_LABELS: Record<Department, string> = {
  bar: 'Бар',
  kitchen: 'Кухня',
  hall: 'Зал',
};

export interface RolePermissions {
  canEditChecklists: boolean;
  canAssignTasks: boolean;
  canManageRequests: boolean;
  canEditProducts: boolean;
}

export interface Outlet {
  id: string;
  name: string;
  address?: string;
  phone?: string;
}

export interface User {
  id: string;
  venueCode: string;
  login: string;
  password?: string;
  name: string;
  role: Role;
  outletIds: string[];
}

export interface ChecklistSubtask {
  id: string;
  title: string;
  completed: boolean;
}

export type ChecklistType = 'morning' | 'evening' | 'composite';

export interface ChecklistItem {
  id: string;
  outletId: string;
  department: Department;
  type: ChecklistType;
  title: string;
  description?: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: string;
  pinned: boolean;
  subtasks?: ChecklistSubtask[];
}

export type TaskStatus = 'new' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskItem {
  id: string;
  outletId: string;
  title: string;
  description?: string;
  department: Department;
  assignedToUserId: string;
  assignedToName: string;
  assignedByUserId: string;
  assignedByName: string;
  deadline: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
  completedAt?: string;
}

export type RequestCategory = 'breakdown' | 'procurement' | 'household' | 'other';
export type RequestStatus = 'new' | 'in_progress' | 'completed' | 'rejected';

export const REQUEST_CATEGORY_LABELS: Record<RequestCategory, string> = {
  breakdown: 'Поломка',
  procurement: 'Закуп/Нехватка',
  household: 'Хозтовары',
  other: 'Прочее',
};

export interface RequestItem {
  id: string;
  outletId: string;
  category: RequestCategory;
  department: Department;
  authorId: string;
  authorName: string;
  title: string;
  description: string;
  status: RequestStatus;
  createdAt: string;
  resolvedBy?: string;
  statusNote?: string;
}

export type ProductUnit = 'бутылка' | 'литр' | 'упаковка' | 'килограмм' | 'штука';

export const ALLOWED_UNITS: ProductUnit[] = [
  'бутылка',
  'литр',
  'упаковка',
  'килограмм',
  'штука',
];

export type WarehouseType = 'bar' | 'kitchen';

export interface ProductItem {
  id: string;
  outletId: string;
  warehouse: WarehouseType;
  category: string;
  name: string;
  unit: ProductUnit;
  actualCount: number | null;
  minWarningCount?: number;
  lastUpdated?: string;
}

export interface InventoryReportItem {
  id: string;
  name: string;
  category: string;
  unit: ProductUnit;
  actualCount: number;
}

export interface InventoryReport {
  id: string;
  outletId: string;
  outletName: string;
  warehouse: WarehouseType;
  warehouseName: string;
  submittedBy: string;
  submittedAt: string;
  items: InventoryReportItem[];
}

export interface AppNotification {
  id: string;
  outletId?: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'checklist' | 'task' | 'request' | 'inventory' | 'system';
}

export interface VenueConfig {
  venueCode: string;
  name: string;
}
