/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './store/AppContext';
import { AuthScreen } from './components/auth/AuthScreen';
import { Header } from './components/layout/Header';
import { BottomNav, TabType } from './components/layout/BottomNav';
import { ChecklistsView } from './components/checklists/ChecklistsView';
import { TasksView } from './components/tasks/TasksView';
import { RequestsView } from './components/requests/RequestsView';
import { WarehouseView } from './components/warehouse/WarehouseView';
import { SettingsView } from './components/settings/SettingsView';
import { OfflineIndicator } from './components/common/PWAInstallButton';

const MainApp: React.FC = () => {
  const { currentUser, quickLogin } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('checklists');

  // Support ?autostart=1 URL param for fast automated testing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1' && !currentUser) {
      quickLogin('admin');
    }
  }, [currentUser, quickLogin]);

  // If unauthenticated, show AuthScreen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-center">
        <OfflineIndicator />
        <AuthScreen />
      </div>
    );
  }

  // Ensure non-admin users cannot stay on settings tab if role changes
  if (activeTab === 'settings' && currentUser.role !== 'admin') {
    setActiveTab('checklists');
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      <OfflineIndicator />
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-xl mx-auto px-3.5 sm:px-4 pt-3.5 pb-24">
        {activeTab === 'checklists' && <ChecklistsView />}
        {activeTab === 'tasks' && <TasksView />}
        {activeTab === 'requests' && <RequestsView />}
        {activeTab === 'warehouse' && <WarehouseView />}
        {activeTab === 'settings' && currentUser.role === 'admin' && <SettingsView />}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
