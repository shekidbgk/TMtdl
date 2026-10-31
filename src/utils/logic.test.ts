import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hasPermission,
  canAccessDepartment,
  canAccessWarehouse,
  calculateChecklistProgress,
  sortChecklistItems,
  generateInventoryCsv,
  canReviewRequest,
  DEFAULT_PERMISSIONS,
} from './logic';
import { ChecklistItem } from '../types';

test('hasPermission: Admin has full rights always', () => {
  assert.equal(hasPermission('admin', 'canEditChecklists'), true);
  assert.equal(hasPermission('admin', 'canAssignTasks'), true);
  assert.equal(hasPermission('admin', 'canManageRequests'), true);
  assert.equal(hasPermission('admin', 'canEditProducts'), true);
});

test('hasPermission: Line staff default rights vs custom toggles', () => {
  // By default bartender cannot edit checklists or products
  assert.equal(hasPermission('bartender', 'canEditChecklists'), false);
  assert.equal(hasPermission('bartender', 'canEditProducts'), false);

  // Custom permissions toggle can enable it
  const custom = {
    ...DEFAULT_PERMISSIONS,
    bartender: {
      ...DEFAULT_PERMISSIONS.bartender,
      canEditChecklists: true,
    },
  };
  assert.equal(hasPermission('bartender', 'canEditChecklists', custom), true);
  assert.equal(hasPermission('bartender', 'canEditProducts', custom), false);
});

test('canAccessDepartment: isolates roles to proper departments', () => {
  assert.equal(canAccessDepartment('admin', 'bar'), true);
  assert.equal(canAccessDepartment('admin', 'kitchen'), true);
  assert.equal(canAccessDepartment('admin', 'hall'), true);

  assert.equal(canAccessDepartment('head_bartender', 'bar'), true);
  assert.equal(canAccessDepartment('head_bartender', 'kitchen'), false);
  assert.equal(canAccessDepartment('bartender', 'bar'), true);
  assert.equal(canAccessDepartment('bartender', 'hall'), false);

  assert.equal(canAccessDepartment('head_chef', 'kitchen'), true);
  assert.equal(canAccessDepartment('head_chef', 'bar'), false);
  assert.equal(canAccessDepartment('cook', 'kitchen'), true);

  assert.equal(canAccessDepartment('waiter', 'hall'), true);
  assert.equal(canAccessDepartment('waiter', 'bar'), false);
});

test('canAccessWarehouse: isolates bar vs kitchen warehouses', () => {
  assert.equal(canAccessWarehouse('admin', 'bar'), true);
  assert.equal(canAccessWarehouse('admin', 'kitchen'), true);

  assert.equal(canAccessWarehouse('bartender', 'bar'), true);
  assert.equal(canAccessWarehouse('bartender', 'kitchen'), false);

  assert.equal(canAccessWarehouse('cook', 'kitchen'), true);
  assert.equal(canAccessWarehouse('cook', 'bar'), false);

  assert.equal(canAccessWarehouse('waiter', 'bar'), false);
  assert.equal(canAccessWarehouse('waiter', 'kitchen'), false);
});

test('calculateChecklistProgress: calculates simple and composite items', () => {
  const items: ChecklistItem[] = [
    {
      id: '1',
      outletId: 'out-1',
      department: 'bar',
      type: 'morning',
      title: 'Протереть стойку',
      completed: true,
      pinned: false,
    },
    {
      id: '2',
      outletId: 'out-1',
      department: 'bar',
      type: 'morning',
      title: 'Включить кофемашину',
      completed: false,
      pinned: false,
    },
    {
      id: '3',
      outletId: 'out-1',
      department: 'bar',
      type: 'composite',
      title: 'Заготовки фрешей',
      completed: false,
      pinned: true,
      subtasks: [
        { id: 's1', title: 'Апельсиновый фреш', completed: true },
        { id: 's2', title: 'Грейпфрутовый фреш', completed: true },
      ],
    },
  ];

  const progress = calculateChecklistProgress(items);
  // Item 1 is completed. Item 2 is not. Item 3 has all subtasks completed -> counted as completed.
  assert.equal(progress.total, 3);
  assert.equal(progress.completed, 2);
  assert.equal(progress.percentage, 67);
});

test('sortChecklistItems: pinned items are placed at the beginning', () => {
  const items: ChecklistItem[] = [
    {
      id: '1',
      outletId: 'out-1',
      department: 'bar',
      type: 'morning',
      title: 'Обычный пункт 1',
      completed: false,
      pinned: false,
    },
    {
      id: '2',
      outletId: 'out-1',
      department: 'bar',
      type: 'morning',
      title: 'Закрепленный пункт',
      completed: false,
      pinned: true,
    },
    {
      id: '3',
      outletId: 'out-1',
      department: 'bar',
      type: 'morning',
      title: 'Обычный пункт 2',
      completed: false,
      pinned: false,
    },
  ];

  const sorted = sortChecklistItems(items);
  assert.equal(sorted[0].id, '2');
  assert.equal(sorted[0].pinned, true);
});

test('generateInventoryCsv: includes UTF-8 BOM and valid formatting', () => {
  const csv = generateInventoryCsv({
    outletName: 'Бар Центр',
    warehouseName: 'Склад Бара',
    submittedBy: 'Алексей (Старший бармен)',
    submittedAt: '2026-10-30T10:00:00.000Z',
    items: [
      {
        id: 'p1',
        name: 'Виски Jameson 1L',
        category: 'Алкоголь крепкий',
        unit: 'бутылка',
        actualCount: 4.5,
      },
    ],
  });

  // Verify UTF-8 BOM
  assert.equal(csv.charCodeAt(0), 0xfeff);
  assert.match(csv, /Склад Бара/);
  assert.match(csv, /Виски Jameson 1L/);
  assert.match(csv, /4\.5/);
});

test('canReviewRequest: verifies department authority', () => {
  assert.equal(canReviewRequest('admin', 'bar'), true);
  assert.equal(canReviewRequest('admin', 'kitchen'), true);
  assert.equal(canReviewRequest('head_bartender', 'bar'), true);
  assert.equal(canReviewRequest('head_bartender', 'kitchen'), false);
  assert.equal(canReviewRequest('head_chef', 'kitchen'), true);
  assert.equal(canReviewRequest('head_chef', 'bar'), false);
  assert.equal(canReviewRequest('bartender', 'bar'), false);
});
