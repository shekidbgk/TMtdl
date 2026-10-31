import React from 'react';
import {
  CheckSquare,
  Zap,
  Inbox,
  Package,
  Settings,
} from 'lucide-react';
import { useApp } from '../../store/AppContext';

export type TabType = 'checklists' | 'tasks' | 'requests' | 'warehouse' | 'settings';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const { currentUser, tasks, requests, currentOutletId } = useApp();

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';

  // Count active pending tasks for this user/outlet
  const activeTasksCount = tasks.filter(
    (t) =>
      t.outletId === currentOutletId &&
      t.status !== 'completed' &&
      (isAdmin || t.assignedToUserId === currentUser.id || currentUser.role.startsWith('head_'))
  ).length;

  // Count new requests for this department/outlet
  const pendingRequestsCount = requests.filter(
    (r) => r.outletId === currentOutletId && r.status === 'new'
  ).length;

  const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    {
      id: 'checklists',
      label: 'Чек-листы',
      icon: CheckSquare,
    },
    {
      id: 'tasks',
      label: 'Задачи',
      icon: Zap,
      badge: activeTasksCount > 0 ? activeTasksCount : undefined,
    },
    {
      id: 'requests',
      label: 'Заявки',
      icon: Inbox,
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
    },
    {
      id: 'warehouse',
      label: 'Склад',
      icon: Package,
    },
  ];

  // Only Administrator sees Settings tab!
  if (isAdmin) {
    tabs.push({
      id: 'settings',
      label: 'Настройки',
      icon: Settings,
    });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-md border-t border-neutral-800/80 px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
      <div className="max-w-md mx-auto grid grid-cols-4 data-[has-settings=true]:grid-cols-5 gap-1" data-has-settings={isAdmin}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition ${
                isActive
                  ? 'text-amber-400 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 flex h-3.5 min-w-[14px] px-0.5 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-neutral-950">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight truncate w-full text-center ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute -bottom-1 w-5 h-0.5 rounded-full bg-amber-400" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
