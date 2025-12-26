import { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import { Dashboard, Sites, Keywords, Workflows, QuickWins, Articles, AddSite } from './views';

const viewTitles = {
  dashboard: 'Dashboard',
  sites: 'Sites',
  keywords: 'Keywords',
  quickwins: 'Quick Wins',
  articles: 'Articles',
  workflows: 'Workflows',
  'add-site': 'Ajouter un site',
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
        return <Sites onNavigate={setActiveView} />;
      case 'keywords':
        return <Keywords />;
      case 'quickwins':
        return <QuickWins />;
      case 'workflows':
        return <Workflows />;
      case 'articles':
        return <Articles />;
      case 'add-site':
        return <AddSite onNavigate={setActiveView} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-dark-bg">
      {/* Sidebar with Claude Code */}
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      {/* Main Content */}
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
