import { useState } from 'react';
import { PanelRightClose, PanelRight } from 'lucide-react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import ClaudePanel from './components/chat/ClaudePanel';
import { Dashboard, Sites, Keywords, Workflows, QuickWins, Articles } from './views';

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
  const [isChatOpen, setIsChatOpen] = useState(true);

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
        return <Articles />;
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
      {/* Sidebar Navigation */}
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title={viewTitles[activeView]}
          onRefresh={handleRefresh}
          isLoading={isLoading}
          rightAction={
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="p-2 rounded-lg hover:bg-dark-border transition-colors"
              title={isChatOpen ? 'Masquer Claude' : 'Afficher Claude'}
            >
              {isChatOpen ? (
                <PanelRightClose className="w-5 h-5 text-dark-muted" />
              ) : (
                <PanelRight className="w-5 h-5 text-primary" />
              )}
            </button>
          }
        />

        <main className="flex-1 overflow-auto p-6">
          {renderView()}
        </main>
      </div>

      {/* Claude Panel - Fixed Right */}
      {isChatOpen && (
        <ClaudePanel onClose={() => setIsChatOpen(false)} />
      )}
    </div>
  );
}

export default App;
