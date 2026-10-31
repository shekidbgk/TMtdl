/**
 * BarOps Business Logic & Pure Calculations
 */

import {
  Department,
  InventoryReport,
  ProductItem,
  Role,
  RolePermissions,
  WarehouseType,
  ChecklistItem,
} from '../types';

export const DEFAULT_PERMISSIONS: Record<Role, RolePermissions> = {
  admin: {
    canEditChecklists: true,
    canAssignTasks: true,
    canManageRequests: true,
    canEditProducts: true,
  },
  head_bartender: {
    canEditChecklists: true,
    canAssignTasks: true,
    canManageRequests: true,
    canEditProducts: true,
  },
  head_chef: {
    canEditChecklists: true,
    canAssignTasks: true,
    canManageRequests: true,
    canEditProducts: true,
  },
  bartender: {
    canEditChecklists: false,
    canAssignTasks: false,
    canManageRequests: false,
    canEditProducts: false,
  },
  cook: {
    canEditChecklists: false,
    canAssignTasks: false,
    canManageRequests: false,
    canEditProducts: false,
  },
  waiter: {
    canEditChecklists: false,
    canAssignTasks: false,
    canManageRequests: false,
    canEditProducts: false,
  },
};

/**
 * Checks if a given role has a specific permission taking custom permissions into account
 */
export function hasPermission(
  role: Role,
  permission: keyof RolePermissions,
  customPermissions?: Record<Role, RolePermissions>
): boolean {
  if (role === 'admin') return true;
  const perms = customPermissions?.[role] || DEFAULT_PERMISSIONS[role];
  return Boolean(perms?.[permission]);
}

/**
 * Determines whether the role has access to view/switch to a given department
 */
export function canAccessDepartment(role: Role, department: Department): boolean {
  if (role === 'admin') return true;
  if ((role === 'head_bartender' || role === 'bartender') && department === 'bar') {
    return true;
  }
  if ((role === 'head_chef' || role === 'cook') && department === 'kitchen') {
    return true;
  }
  if (role === 'waiter' && department === 'hall') {
    return true;
  }
  return false;
}

/**
 * Determines whether the role has access to view/switch to a given warehouse
 */
export function canAccessWarehouse(role: Role, warehouse: WarehouseType): boolean {
  if (role === 'admin') return true;
  if ((role === 'head_bartender' || role === 'bartender') && warehouse === 'bar') {
    return true;
  }
  if ((role === 'head_chef' || role === 'cook') && warehouse === 'kitchen') {
    return true;
  }
  return false;
}

/**
 * Returns allowed departments for a given role
 */
export function getAllowedDepartments(role: Role): Department[] {
  if (role === 'admin') return ['bar', 'kitchen', 'hall'];
  if (role === 'head_bartender' || role === 'bartender') return ['bar'];
  if (role === 'head_chef' || role === 'cook') return ['kitchen'];
  if (role === 'waiter') return ['hall'];
  return ['bar'];
}

/**
 * Calculates completion stats for a list of checklist items
 */
export function calculateChecklistProgress(items: ChecklistItem[]): {
  completed: number;
  total: number;
  percentage: number;
} {
  if (!items || items.length === 0) {
    return { completed: 0, total: 0, percentage: 0 };
  }

  let completed = 0;
  for (const item of items) {
    if (item.subtasks && item.subtasks.length > 0) {
      const allSubsDone = item.subtasks.every((s) => s.completed);
      if (allSubsDone || item.completed) {
        completed += 1;
      }
    } else if (item.completed) {
      completed += 1;
    }
  }

  const total = items.length;
  const percentage = Math.round((completed / total) * 100);

  return { completed, total, percentage };
}

/**
 * Sorts checklist items: pinned items always on top, preserved order within groups
 */
export function sortChecklistItems(items: ChecklistItem[]): ChecklistItem[] {
  return [...items].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });
}

/**
 * Formats inventory report into CSV with UTF-8 BOM so Russian letters render correctly in Excel
 */
export function generateInventoryCsv(
  report: Pick<InventoryReport, 'outletName' | 'warehouseName' | 'submittedBy' | 'submittedAt' | 'items'>
): string {
  // UTF-8 BOM character
  const BOM = '\uFEFF';
  const lines: string[] = [];

  // Metadata headers
  lines.push(`Отчет по инвентаризации: ${report.warehouseName}`);
  lines.push(`Точка продаж: ${report.outletName}`);
  lines.push(`Сотрудник: ${report.submittedBy}`);
  lines.push(`Дата и время: ${new Date(report.submittedAt).toLocaleString('ru-RU')}`);
  lines.push(''); // blank line

  // Column headers
  lines.push('Категория;Наименование товара;Единица измерения;Фактический остаток');

  // Items
  for (const item of report.items) {
    const category = `"${(item.category || '').replace(/"/g, '""')}"`;
    const name = `"${(item.name || '').replace(/"/g, '""')}"`;
    const unit = `"${(item.unit || '').replace(/"/g, '""')}"`;
    const count = item.actualCount !== null && item.actualCount !== undefined ? item.actualCount : 0;
    lines.push(`${category};${name};${unit};${count}`);
  }

  return BOM + lines.join('\r\n');
}

/**
 * Checks whether user can manage/review requests for a specific department
 */
export function canReviewRequest(role: Role, department: Department): boolean {
  if (role === 'admin') return true;
  if (role === 'head_bartender' && department === 'bar') return true;
  if (role === 'head_chef' && department === 'kitchen') return true;
  return false;
}
