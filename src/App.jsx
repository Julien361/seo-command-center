import { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import { Dashboard, Sites, Keywords, Workflows, QuickWins, Articles, AddSite, Settings, Cocons, Concurrents, Backlinks, AuditContenu, Idees, Positions, Credentials } from './views';
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
  const [activeView, setActiveView] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);

  // Load sites for site detail views
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

  // Handle site-specific views
  useEffect(() => {
    if (activeView.startsWith('site-')) {
      const siteId = activeView.replace('site-', '');
      const site = sites.find(s => s.id === siteId);
      setSelectedSite(site);
    } else {
      setSelectedSite(null);
    }
  }, [activeView, sites]);

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
    if (activeView.startsWith('site-')) {
      if (selectedSite) {
        return <Sites onNavigate={setActiveView} selectedSiteId={selectedSite.id} />;
      }
      return null;
    }

    // Main views
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'sites':
        return <Sites onNavigate={setActiveView} />;
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
        return <PlaceholderView title="Briefs SEO" description="Creez des briefs de contenu optimises pour la Position 0." icon={FileText} />;
      case 'pages':
        return <PlaceholderView title="Pages" description="Gerez vos pages piliers et satellites." icon={File} />;
      case 'articles':
        return <Articles />;
      case 'liens-internes':
        return <PlaceholderView title="Liens Internes" description="Optimisez votre maillage interne avec des suggestions automatiques." icon={Link2} />;
      case 'schema-markup':
        return <PlaceholderView title="Schema Markup" description="Generez des schemas JSON-LD pour vos pages (FAQ, HowTo, etc.)." icon={Code} />;
      case 'images-seo':
        return <PlaceholderView title="Images SEO" description="Optimisez vos images : alt text, compression, lazy loading." icon={Image} />;
      case 'calendrier':
        return <PlaceholderView title="Calendrier Editorial" description="Planifiez votre production de contenu." icon={Calendar} />;
      case 'publication':
        return <PlaceholderView title="Publication" description="Publiez directement sur vos sites WordPress." icon={Send} />;

      // Suivi
      case 'ameliorations':
        return <PlaceholderView title="Ameliorations" description="Suivez vos actions d'optimisation et leur impact sur les positions." icon={TrendingUp} />;
      case 'positions':
        return <Positions />;
      case 'performance':
        return <PlaceholderView title="Performance" description="Trafic, CTR, impressions et metriques cles." icon={BarChart3} />;
      case 'seo-technique':
        return <PlaceholderView title="SEO Technique" description="Core Web Vitals, erreurs 404, indexation." icon={SettingsIcon} />;
      case 'seo-local':
        return <PlaceholderView title="SEO Local" description="Google Business Profile, avis, citations NAP." icon={MapPin} />;
      case 'alertes':
        return <PlaceholderView title="Alertes" description="Soyez notifie des baisses de position et erreurs." icon={Bell} />;
      case 'revenus':
        return <PlaceholderView title="Revenus" description="Suivez vos leads, ventes et revenus par site." icon={DollarSign} />;

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
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

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
