import { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import { Dashboard, Sites, Keywords, Workflows, QuickWins, Articles, AddSite, Settings, Cocons, Concurrents, Backlinks, AuditContenu, Idees, Calendrier, SchemaMarkup, LiensInternes, Briefs, ImagesSeo, Pages, Publication, Positions, Performance, Alertes, Ameliorations, Revenus, SeoLocal, SeoTechnique, Credentials } from './views';
import SeoCoach from './views/SeoCoach';
import PlaceholderView from './views/PlaceholderView';
import { sitesApi } from './lib/supabase';

// Import icons for placeholders
import {
  Target,
  Link,
  FileSearch,
  GitBranch,
  Lightbulb,
  FileText,
  File,
  Link2,
  Code,
  Image,
  Calendar,
  Send,
  TrendingUp,
  LineChart,
  BarChart3,
  Settings as SettingsIcon,
  MapPin,
  Bell,
  DollarSign,
  Key
} from 'lucide-react';

// View titles and descriptions
const viewConfig = {
  // Main
  dashboard: { title: 'Dashboard', description: 'Vue d\'ensemble de vos performances SEO' },
  coach: { title: 'SEO Coach', description: 'Assistant intelligent pour atteindre la Position 0' },
  sites: { title: 'Sites', description: 'Gerer vos sites WordPress' },
  'add-site': { title: 'Ajouter un site', description: 'Configurer un nouveau site' },
  settings: { title: 'Parametres', description: 'Configuration de l\'application' },

  // Analyse
  keywords: { title: 'Recherche KW', description: 'Analyser et suivre vos mots-cles' },
  quickwins: { title: 'Quick Wins', description: 'Opportunites d\'amelioration rapide' },
  concurrents: { title: 'Concurrents', description: 'Analyser vos concurrents SEO', icon: Target },
  backlinks: { title: 'Backlinks', description: 'Suivi de votre profil de liens', icon: Link },
  'audit-contenu': { title: 'Audit Contenu', description: 'Analyser la qualite de vos contenus', icon: FileSearch },
  cocons: { title: 'Cocons Semantiques', description: 'Visualiser et gerer vos cocons', icon: GitBranch },

  // Creation
  idees: { title: 'Idees', description: 'Generateur d\'idees de contenu', icon: Lightbulb },
  briefs: { title: 'Briefs', description: 'Creer des briefs SEO', icon: FileText },
  pages: { title: 'Pages', description: 'Gerer vos pages meres et filles', icon: File },
  articles: { title: 'Articles', description: 'Rediger et optimiser vos articles' },
  'liens-internes': { title: 'Liens Internes', description: 'Optimiser votre maillage interne', icon: Link2 },
  'schema-markup': { title: 'Schema Markup', description: 'Generer des donnees structurees', icon: Code },
  'images-seo': { title: 'Images SEO', description: 'Optimiser vos images', icon: Image },
  calendrier: { title: 'Calendrier', description: 'Planifier votre contenu', icon: Calendar },
  publication: { title: 'Publication', description: 'Publier sur WordPress', icon: Send },

  // Suivi
  ameliorations: { title: 'Ameliorations', description: 'Suivre vos actions d\'optimisation', icon: TrendingUp },
  positions: { title: 'Positions', description: 'Evolution de vos positions', icon: LineChart },
  performance: { title: 'Performance', description: 'Metriques de performance', icon: BarChart3 },
  'seo-technique': { title: 'SEO Technique', description: 'Core Web Vitals et audit technique', icon: SettingsIcon },
  'seo-local': { title: 'SEO Local', description: 'Google Business Profile', icon: MapPin },
  alertes: { title: 'Alertes', description: 'Notifications et alertes SEO', icon: Bell },
  revenus: { title: 'Revenus', description: 'Suivi de la monetisation', icon: DollarSign },

  // Config
  workflows: { title: 'Workflows n8n', description: 'Gerer vos automatisations' },
  credentials: { title: 'Credentials & APIs', description: 'Configurer vos acces API', icon: Key },
};

function App() {
  const [activeView, setActiveView] = useState('sites');
  const [isLoading, setIsLoading] = useState(false);
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

  // Handle view changes - site can be passed directly from sidebar
  const handleViewChange = (view, site = null) => {
    setActiveView(view);
    if (site) {
      setSelectedSite(site);
    } else if (view.startsWith('site-')) {
      // Fallback: look up site by ID if not passed directly
      const siteId = view.replace('site-', '');
      const foundSite = sites.find(s => s.id === siteId);
      setSelectedSite(foundSite);
    } else {
      setSelectedSite(null);
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  const getViewTitle = () => {
    if (activeView.startsWith('site-') && selectedSite) {
      return selectedSite.mcp_alias || selectedSite.domain;
    }
    return viewConfig[activeView]?.title || 'Dashboard';
  };

  const renderView = () => {
    // Site detail view
    if (activeView.startsWith('site-') && selectedSite) {
      return <Sites onNavigate={handleViewChange} selectedSite={selectedSite} />;
    }

    // Main views
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'coach':
        return <SeoCoach onNavigate={handleViewChange} />;
      case 'sites':
        return <Sites onNavigate={handleViewChange} />;
      case 'add-site':
        return <AddSite onNavigate={setActiveView} />;
      case 'settings':
        return <Settings />;

      // Analyse
      case 'keywords':
        return <Keywords />;
      case 'quickwins':
        return <QuickWins />;
      case 'concurrents':
        return <Concurrents />;
      case 'backlinks':
        return <Backlinks />;
      case 'audit-contenu':
        return <AuditContenu />;
      case 'cocons':
        return <Cocons />;

      // Creation
      case 'idees':
        return <Idees />;
      case 'briefs':
        return <Briefs />;
      case 'pages':
        return <Pages />;
      case 'articles':
        return <Articles />;
      case 'liens-internes':
        return <LiensInternes />;
      case 'schema-markup':
        return <SchemaMarkup />;
      case 'images-seo':
        return <ImagesSeo />;
      case 'calendrier':
        return <Calendrier />;
      case 'publication':
        return <Publication />;

      // Suivi
      case 'ameliorations':
        return <Ameliorations />;
      case 'positions':
        return <Positions />;
      case 'performance':
        return <Performance />;
      case 'seo-technique':
        return <SeoTechnique />;
      case 'seo-local':
        return <SeoLocal />;
      case 'alertes':
        return <Alertes />;
      case 'revenus':
        return <Revenus />;

      // Config
      case 'workflows':
        return <Workflows />;
      case 'credentials':
        return <Credentials />;

      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-dark-bg">
      {/* Sidebar with Claude Code */}
      <Sidebar activeView={activeView} onViewChange={handleViewChange} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title={getViewTitle()}
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
