import { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import SiteDashboard from './views/SiteDashboard';
import KeywordsList from './views/KeywordsList';
import RecherchesList from './views/RecherchesList';
import ConcurrentsList from './views/ConcurrentsList';
import ArticlesList from './views/ArticlesList';
import QuickWinsList from './views/QuickWinsList';
import CoconsList from './views/CoconsList';
import PositionsList from './views/PositionsList';
import ContentFactory from './views/ContentFactory';
import PaaList from './views/PaaList';
import AddSite from './views/AddSite';
import Workflows from './views/Workflows';
import { sitesApi } from './lib/supabase';

// View titles
const viewConfig = {
  keywords: { title: 'Keywords' },
  recherches: { title: 'Analyses Marche' },
  concurrents: { title: 'Concurrents' },
  articles: { title: 'Articles' },
  quickwins: { title: 'Quick Wins' },
  cocons: { title: 'Cocons Semantiques' },
  positions: { title: 'Suivi Positions' },
  factory: { title: 'Content Factory' },
  paa: { title: 'People Also Ask' },
  'add-site': { title: 'Ajouter un site' },
  workflows: { title: 'Workflows n8n' },
};

function App() {
  const [activeView, setActiveView] = useState('sites');
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);

  // Load sites
  useEffect(() => {
    const loadSites = async () => {
      try {
        const data = await sitesApi.getAll();
        setSites(data || []);
      } catch (error) {
        console.error('Error loading sites:', error);
      }
    };
    loadSites();
  }, []);

  // Handle view changes
  const handleViewChange = (view, site = null) => {
    setActiveView(view);
    if (site) {
      setSelectedSite(site);
    } else if (view.startsWith('site-')) {
      const siteId = view.replace('site-', '');
      const foundSite = sites.find(s => s.id === siteId);
      setSelectedSite(foundSite);
    }
  };

  // Back to site dashboard
  const handleBack = () => {
    if (selectedSite) {
      setActiveView(`site-${selectedSite.id}`);
    }
  };

  const getViewTitle = () => {
    if (activeView.startsWith('site-') && selectedSite) {
      return selectedSite.mcp_alias || selectedSite.domain;
    }
    if (selectedSite && viewConfig[activeView]) {
      return `${selectedSite.mcp_alias} - ${viewConfig[activeView].title}`;
    }
    return viewConfig[activeView]?.title || 'SEO Hub';
  };

  const renderView = () => {
    // Site dashboard (4 cards)
    if (activeView.startsWith('site-') && selectedSite) {
      return <SiteDashboard site={selectedSite} onNavigate={handleViewChange} />;
    }

    // Detail views
    switch (activeView) {
      case 'keywords':
        return <KeywordsList site={selectedSite} onBack={handleBack} />;
      case 'recherches':
        return <RecherchesList site={selectedSite} onBack={handleBack} />;
      case 'concurrents':
        return <ConcurrentsList site={selectedSite} onBack={handleBack} />;
      case 'articles':
        return <ArticlesList site={selectedSite} onBack={handleBack} />;
      case 'quickwins':
        return <QuickWinsList site={selectedSite} onBack={handleBack} />;
      case 'cocons':
        return <CoconsList site={selectedSite} onBack={handleBack} />;
      case 'positions':
        return <PositionsList site={selectedSite} onBack={handleBack} />;
      case 'factory':
        return <ContentFactory site={selectedSite} onBack={handleBack} />;
      case 'paa':
        return <PaaList site={selectedSite} onBack={handleBack} />;
      case 'add-site':
        return <AddSite onNavigate={setActiveView} />;
      case 'workflows':
        return <Workflows />;
      default:
        // No site selected - show welcome message
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">SEO Command Center v2</h2>
              <p className="text-dark-muted">Selectionnez un site dans le menu</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-dark-bg">
      <Sidebar activeView={activeView} onViewChange={handleViewChange} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={getViewTitle()} />

        <main className="flex-1 overflow-auto p-6">
          {renderView()}
        </main>

        <div className="text-center text-xs text-dark-muted py-2 border-t border-dark-border">
          v1.0.148
        </div>
      </div>
    </div>
  );
}

export default App;
