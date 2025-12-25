import { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import ClaudeChat from './components/chat/ClaudeChat';
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
  const [isChatOpen, setIsChatOpen] = useState(false);

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

      {/* Claude Chat Panel */}
      <ClaudeChat isOpen={isChatOpen} onToggle={() => setIsChatOpen(!isChatOpen)} />

      {/* Floating Chat Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className={`fixed right-6 ${isChatOpen ? 'bottom-[620px]' : 'bottom-6'} w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isChatOpen ? 'bg-danger hover:bg-danger/80' : 'bg-primary hover:bg-primary-dark'
        }`}
      >
        {isChatOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageSquare className="w-6 h-6 text-white" />
        )}
      </button>
    </div>
  );
}

export default App;
