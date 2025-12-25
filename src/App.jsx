import { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import { Dashboard, Sites, Keywords, Workflows, QuickWins } from './views';

const viewTitles = {
  dashboard: 'Dashboard',
  sites: 'Sites',
  keywords: 'Keywords',
  quickwins: 'Quick Wins',
  articles: 'Articles',
  workflows: 'Workflows',
  analytics: 'Analytics',
  automations: 'Automations',
};

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'sites':
        return <Sites />;
      case 'keywords':
        return <Keywords />;
      case 'quickwins':
        return <QuickWins />;
      case 'workflows':
        return <Workflows />;
      case 'articles':
        return (
          <div className="flex items-center justify-center h-96">
            <p className="text-dark-muted">Module Articles - Coming Soon</p>
          </div>
        );
      case 'analytics':
        return (
          <div className="flex items-center justify-center h-96">
            <p className="text-dark-muted">Module Analytics - Coming Soon</p>
          </div>
        );
      case 'automations':
        return (
          <div className="flex items-center justify-center h-96">
            <p className="text-dark-muted">Module Automations - Coming Soon</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-dark-bg">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title={viewTitles[activeView]}
          onRefresh={handleRefresh}
          isLoading={isLoading}
        />

        <main className="flex-1 overflow-auto p-6">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

export default App;
