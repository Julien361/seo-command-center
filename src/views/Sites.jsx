import { useState, useEffect } from 'react';
import {
  ExternalLink, Search, Plus, RefreshCw, Loader2, CloudDownload, Zap,
  ArrowLeft, Target, FileText, ArrowUp, ArrowDown, ArrowRight,
  Globe, MousePointer, Eye, BarChart3, Link2, AlertTriangle, CheckCircle, XCircle,
  Layers, Activity, Settings, Play, Clock, Check, Circle, ChevronRight,
  PenTool, Network, FileSearch, TrendingUp, Sparkles, ListTodo,
  // Additional icons for tabs
  LayoutDashboard, Users, LinkIcon, Image, Calendar, Send, LineChart,
  Lightbulb, MapPin, Bell, DollarSign, Code, Wrench, BookOpen
} from 'lucide-react';
import { Card, Badge, Button } from '../components/common';
import { sitesApi, keywordsApi, gscApi, supabase } from '../lib/supabase';
import { n8nApi } from '../lib/n8n';

const entityColors = {
  'SRAT': 'primary',
  'PRO FORMATION': 'success',
  'METIS': 'info',
  'Client': 'warning',
  'Cabinet': 'secondary',
};

// Progress Step Component
function WorkflowStep({ step, isActive, isCompleted, isLast, onAction }) {
  const getStatusIcon = () => {
    if (isCompleted) return <Check className="w-5 h-5" />;
    if (isActive) return <Play className="w-5 h-5" />;
    return <Circle className="w-5 h-5" />;
  };

  const getStatusColor = () => {
    if (isCompleted) return 'bg-success text-white';
    if (isActive) return 'bg-primary text-white animate-pulse';
    return 'bg-dark-border text-dark-muted';
  };

  const getProgressColor = () => {
    if (step.progress >= 100) return 'bg-success';
    if (step.progress >= 50) return 'bg-primary';
    if (step.progress > 0) return 'bg-warning';
    return 'bg-dark-border';
  };

  return (
    <div className="flex-1">
      <div className="flex items-center">
        {/* Step indicator */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor()}`}>
          {getStatusIcon()}
        </div>
        {/* Connector line */}
        {!isLast && (
          <div className="flex-1 h-1 mx-2">
            <div className={`h-full rounded ${isCompleted ? 'bg-success' : 'bg-dark-border'}`} />
          </div>
        )}
      </div>
      <div className="mt-3 pr-4">
        <div className="flex items-center gap-2">
          <step.icon className={`w-4 h-4 ${isCompleted ? 'text-success' : isActive ? 'text-primary' : 'text-dark-muted'}`} />
          <span className={`text-sm font-medium ${isCompleted ? 'text-success' : isActive ? 'text-white' : 'text-dark-muted'}`}>
            {step.label}
          </span>
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-1.5 bg-dark-border rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${getProgressColor()}`}
            style={{ width: `${step.progress}%` }}
          />
        </div>
        <div className="mt-1 text-xs text-dark-muted">
          {step.done}/{step.total} • {step.progress}%
        </div>
      </div>
    </div>
  );
}

// Task Card Component
function TaskCard({ task, onAction }) {
  const priorityColors = {
    high: 'border-danger/50 bg-danger/5',
    medium: 'border-warning/50 bg-warning/5',
    low: 'border-dark-border bg-dark-bg'
  };

  const statusIcons = {
    pending: <Circle className="w-4 h-4 text-dark-muted" />,
    in_progress: <Clock className="w-4 h-4 text-primary animate-pulse" />,
    done: <CheckCircle className="w-4 h-4 text-success" />
  };

  return (
    <div className={`p-4 rounded-lg border ${priorityColors[task.priority] || priorityColors.low}`}>
      <div className="flex items-start gap-3">
        {statusIcons[task.status] || statusIcons.pending}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white font-medium">{task.title}</span>
            {task.priority === 'high' && <Badge variant="danger" size="sm">Urgent</Badge>}
          </div>
          {task.description && (
            <p className="text-sm text-dark-muted mt-1">{task.description}</p>
          )}
          {task.meta && (
            <div className="flex items-center gap-3 mt-2 text-xs text-dark-muted">
              {task.meta}
            </div>
          )}
        </div>
        {task.action && (
          <Button variant="ghost" size="sm" onClick={() => onAction(task)}>
            {task.actionLabel || 'Lancer'}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Tab configuration for site detail view - with dynamic status
const getTabsWithStatus = (keywords, quickWins, clusters, articles, pages, backlinks, gscData) => [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, count: null, status: 'info' },
  { id: 'keywords', label: 'Keywords', icon: Target, count: keywords.length, status: keywords.length > 0 ? 'done' : 'todo' },
  { id: 'quickwins', label: 'Quick Wins', icon: Zap, count: quickWins.length, status: quickWins.length > 0 ? 'warning' : 'done' },
  { id: 'cocons', label: 'Cocons', icon: Network, count: clusters.length, status: clusters.length > 0 ? 'done' : 'todo' },
  { id: 'content', label: 'Contenu', icon: PenTool, count: articles.length, status: articles.length > 0 ? 'done' : 'todo' },
  { id: 'audit', label: 'Audit', icon: FileSearch, count: pages.filter(p => p.seo_score !== null).length, status: pages.filter(p => p.seo_score !== null).length > 0 ? 'done' : 'todo' },
  { id: 'backlinks', label: 'Backlinks', icon: LinkIcon, count: backlinks.length, status: backlinks.length > 0 ? 'done' : 'todo' },
  { id: 'positions', label: 'Positions', icon: LineChart, count: gscData.length, status: gscData.length > 0 ? 'done' : 'todo' },
  { id: 'performance', label: 'Performance', icon: BarChart3, count: null, status: 'info' },
];

// Site Detail View - Tabbed interface
function SiteDetailView({ site, onBack, onRefresh }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [keywords, setKeywords] = useState([]);
  const [pages, setPages] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [articles, setArticles] = useState([]);
  const [quickWins, setQuickWins] = useState([]);
  const [gscData, setGscData] = useState([]);
  const [backlinks, setBacklinks] = useState([]);
  const [isRunningAction, setIsRunningAction] = useState(null);

  useEffect(() => {
    if (site?.id) {
      loadAllData();
    }
  }, [site?.id]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [kwRes, pagesRes, clustersRes, articlesRes, qwRes, gscRes, backlinksRes] = await Promise.all([
        supabase.from('keywords').select('*').eq('site_id', site.id).order('search_volume', { ascending: false }),
        supabase.from('pages').select('*').eq('site_id', site.id),
        supabase.from('semantic_clusters').select('*, cluster_satellites(*)').eq('site_id', site.id),
        supabase.from('articles').select('*').eq('site_id', site.id).order('created_at', { ascending: false }),
        supabase.from('quick_wins').select('*, keywords(keyword)').eq('site_id', site.id).eq('status', 'pending'),
        supabase.from('gsc_keyword_history').select('*').eq('site_id', site.id).order('date', { ascending: false }).limit(100),
        supabase.from('backlinks').select('*').eq('site_id', site.id).order('discovered_at', { ascending: false }).limit(100)
      ]);

      setKeywords(kwRes.data || []);
      setPages(pagesRes.data || []);
      setClusters(clustersRes.data || []);
      setArticles(articlesRes.data || []);
      setQuickWins(qwRes.data || []);
      setGscData(gscRes.data || []);
      setBacklinks(backlinksRes.data || []);
    } catch (err) {
      console.error('Error loading site data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Action costs configuration
  const actionCosts = {
    'keyword-research': { price: '~0.50€', api: 'DataForSEO', isPaid: true },
    'technical-audit': { price: 'Variable', api: 'Firecrawl', isPaid: true },
    'backlink-analysis': { price: '~0.30€', api: 'DataForSEO', isPaid: true },
    'cocon-create': { price: '~0.10€', api: 'Claude AI', isPaid: true },
    'quick-wins': { price: 'Gratuit', api: 'Supabase', isPaid: false },
    'gsc-sync': { price: 'Gratuit', api: 'Google', isPaid: false },
  };

  // Action handlers
  const handleAction = async (actionType, data = {}) => {
    const cost = actionCosts[actionType];

    // Confirmation for paid actions
    if (cost?.isPaid) {
      const confirmed = confirm(
        `🔍 ${actionType === 'keyword-research' ? 'Recherche de keywords' : actionType === 'technical-audit' ? 'Audit technique' : 'Analyse backlinks'}\n\n` +
        `Site: ${site.domain}\n` +
        `API: ${cost.api}\n` +
        `Coût estimé: ${cost.price}\n\n` +
        `Confirmer ?`
      );
      if (!confirmed) return;
    }

    setIsRunningAction(actionType);
    try {
      let result;
      switch (actionType) {
        case 'keyword-research':
          result = await n8nApi.triggerWebhook('seo-cascade-start', { url: `https://${site.domain}`, site_objective: data.keyword || site.focus, site_alias: site.alias });
          break;
        case 'technical-audit':
          result = await n8nApi.triggerWebhook('technical-audit', { site_alias: site.alias });
          break;
        case 'backlink-analysis':
          result = await n8nApi.triggerWebhook('backlinks-sync', { site_alias: site.alias });
          break;
        case 'cocon-create':
          result = await n8nApi.triggerWebhook('wf-setup-3', { site_alias: site.alias, main_keyword: site.focus });
          break;
        case 'quick-wins':
          result = await n8nApi.triggerWebhook('wf7', { site_id: site.id });
          break;
        case 'gsc-sync':
          result = await n8nApi.syncGSC();
          break;
        default:
          console.log('Unknown action:', actionType);
          return;
      }
      if (result?.success !== false) {
        alert('Action lancée ! Les résultats seront disponibles dans quelques instants.');
        setTimeout(loadAllData, 10000);
      } else {
        alert('Erreur: ' + (result?.error || 'Échec'));
      }
    } catch (err) {
      alert('Erreur: ' + err.message);
    } finally {
      setIsRunningAction(null);
    }
  };

  // Calculate workflow progress
  const calculateWorkflowSteps = () => {
    const keywordsAnalyzed = keywords.filter(k => k.search_volume !== null).length;
    const keywordsWithPosition = keywords.filter(k => k.current_position !== null).length;
    const clustersCreated = clusters.length;
    const clustersComplete = clusters.filter(c => c.status === 'complete').length;
    const articlesWritten = articles.filter(a => a.status === 'published' || a.status === 'draft').length;
    const articlesPlanned = articles.length;
    const pagesAudited = pages.filter(p => p.seo_score !== null).length;
    const pagesTotal = pages.length || 1;
    const quickWinsDone = quickWins.filter(q => q.status === 'done').length;
    const quickWinsTotal = quickWins.length;

    return [
      {
        id: 'keywords',
        label: 'Recherche Keywords',
        icon: Target,
        done: keywordsAnalyzed,
        total: Math.max(keywords.length, 10),
        progress: keywords.length > 0 ? Math.round((keywordsAnalyzed / keywords.length) * 100) : 0,
        status: keywordsAnalyzed > 0 ? (keywordsAnalyzed >= 10 ? 'complete' : 'in_progress') : 'pending'
      },
      {
        id: 'clusters',
        label: 'Cocons Sémantiques',
        icon: Network,
        done: clustersComplete,
        total: Math.max(clustersCreated, 3),
        progress: clustersCreated > 0 ? Math.round((clustersComplete / clustersCreated) * 100) : 0,
        status: clustersComplete > 0 ? (clustersComplete >= clustersCreated ? 'complete' : 'in_progress') : 'pending'
      },
      {
        id: 'content',
        label: 'Rédaction Contenu',
        icon: PenTool,
        done: articlesWritten,
        total: Math.max(articlesPlanned, 5),
        progress: articlesPlanned > 0 ? Math.round((articlesWritten / articlesPlanned) * 100) : 0,
        status: articlesWritten > 0 ? (articlesWritten >= articlesPlanned ? 'complete' : 'in_progress') : 'pending'
      },
      {
        id: 'audit',
        label: 'Audit Technique',
        icon: FileSearch,
        done: pagesAudited,
        total: pagesTotal,
        progress: Math.round((pagesAudited / pagesTotal) * 100),
        status: pagesAudited > 0 ? (pagesAudited >= pagesTotal ? 'complete' : 'in_progress') : 'pending'
      },
      {
        id: 'optimization',
        label: 'Optimisation',
        icon: TrendingUp,
        done: quickWinsDone,
        total: Math.max(quickWinsTotal, 1),
        progress: quickWinsTotal > 0 ? Math.round((quickWinsDone / quickWinsTotal) * 100) : 0,
        status: quickWinsDone > 0 ? (quickWinsDone >= quickWinsTotal ? 'complete' : 'in_progress') : 'pending'
      }
    ];
  };

  // Generate tasks to do
  const generateTasks = () => {
    const tasks = [];

    // Keywords tasks
    if (keywords.length === 0) {
      tasks.push({
        id: 'kw-research',
        title: 'Lancer une recherche de keywords',
        description: `Identifier les opportunités SEO pour ${site.domain}`,
        priority: 'high',
        status: 'pending',
        step: 'keywords',
        action: 'keyword-research',
        actionLabel: 'Rechercher'
      });
    } else if (keywords.filter(k => !k.current_position).length > 5) {
      tasks.push({
        id: 'kw-track',
        title: `${keywords.filter(k => !k.current_position).length} keywords sans position`,
        description: 'Synchroniser avec GSC pour obtenir les positions',
        priority: 'medium',
        status: 'pending',
        step: 'keywords',
        action: 'gsc-sync',
        actionLabel: 'Sync GSC'
      });
    }

    // Clusters tasks
    if (clusters.length === 0 && keywords.length >= 5) {
      tasks.push({
        id: 'cluster-create',
        title: 'Créer pages piliers & satellites',
        description: `${keywords.length} keywords disponibles pour générer du contenu`,
        priority: 'high',
        status: 'pending',
        step: 'clusters',
        meta: `${keywords.length} keywords disponibles`
      });
    } else if (clusters.filter(c => c.status !== 'complete').length > 0) {
      const incomplete = clusters.filter(c => c.status !== 'complete');
      tasks.push({
        id: 'cluster-complete',
        title: `${incomplete.length} cocon(s) à compléter`,
        description: incomplete.map(c => c.name).slice(0, 3).join(', '),
        priority: 'medium',
        status: 'in_progress',
        step: 'clusters'
      });
    }

    // Content tasks
    const drafts = articles.filter(a => a.status === 'draft');
    const planned = articles.filter(a => a.status === 'planned' || a.status === 'brief');
    if (planned.length > 0) {
      tasks.push({
        id: 'content-write',
        title: `${planned.length} article(s) à rédiger`,
        description: planned.map(a => a.title).slice(0, 2).join(', '),
        priority: 'high',
        status: 'pending',
        step: 'content',
        meta: `${drafts.length} brouillons en cours`
      });
    }
    if (drafts.length > 0) {
      tasks.push({
        id: 'content-publish',
        title: `${drafts.length} brouillon(s) à publier`,
        description: drafts.map(a => a.title).slice(0, 2).join(', '),
        priority: 'medium',
        status: 'in_progress',
        step: 'content'
      });
    }

    // Audit tasks
    if (pages.length === 0 || pages.filter(p => p.seo_score === null).length > 0) {
      const unaudited = pages.filter(p => p.seo_score === null).length;
      tasks.push({
        id: 'audit-run',
        title: pages.length === 0 ? 'Lancer un audit technique' : `${unaudited} page(s) non auditées`,
        description: 'Analyser le contenu avec Firecrawl',
        priority: pages.length === 0 ? 'high' : 'medium',
        status: 'pending',
        step: 'audit',
        action: 'technical-audit',
        actionLabel: 'Auditer'
      });
    }
    const lowScore = pages.filter(p => p.seo_score !== null && p.seo_score < 50);
    if (lowScore.length > 0) {
      tasks.push({
        id: 'audit-fix',
        title: `${lowScore.length} page(s) avec score faible`,
        description: 'Score SEO < 50, optimisation requise',
        priority: 'high',
        status: 'pending',
        step: 'audit',
        meta: lowScore.map(p => p.title).slice(0, 2).join(', ')
      });
    }

    // Quick wins tasks
    if (quickWins.length > 0) {
      tasks.push({
        id: 'qw-optimize',
        title: `${quickWins.length} quick win(s) disponibles`,
        description: 'Keywords en position 11-20 à optimiser',
        priority: 'high',
        status: 'pending',
        step: 'optimization',
        action: 'quick-wins',
        actionLabel: 'Voir',
        meta: quickWins.slice(0, 3).map(q => q.keywords?.keyword).filter(Boolean).join(', ')
      });
    }

    return tasks;
  };

  // Calculate KPIs
  const kpis = {
    keywords: keywords.length,
    avgPosition: keywords.filter(k => k.current_position).length > 0
      ? (keywords.filter(k => k.current_position).reduce((s, k) => s + k.current_position, 0) / keywords.filter(k => k.current_position).length).toFixed(1)
      : '-',
    clicks: gscData.reduce((sum, r) => sum + (r.clicks || 0), 0),
    impressions: gscData.reduce((sum, r) => sum + (r.impressions || 0), 0),
    pages: pages.length,
    avgScore: pages.filter(p => p.seo_score !== null).length > 0
      ? Math.round(pages.filter(p => p.seo_score !== null).reduce((s, p) => s + p.seo_score, 0) / pages.filter(p => p.seo_score !== null).length)
      : '-',
    clusters: clusters.length,
    articles: articles.length,
    quickWins: quickWins.length
  };

  const workflowSteps = calculateWorkflowSteps();
  const tasks = generateTasks();
  const overallProgress = Math.round(workflowSteps.reduce((sum, s) => sum + s.progress, 0) / workflowSteps.length);

  // Recent activity (simulated from data)
  const recentActivity = [
    ...keywords.slice(0, 3).map(k => ({
      type: 'keyword',
      text: `Keyword "${k.keyword}" ajouté`,
      date: k.created_at
    })),
    ...pages.filter(p => p.seo_score).slice(0, 3).map(p => ({
      type: 'audit',
      text: `Page "${p.title}" auditée (score: ${p.seo_score})`,
      date: p.updated_at
    })),
    ...articles.slice(0, 2).map(a => ({
      type: 'content',
      text: `Article "${a.title}" ${a.status}`,
      date: a.updated_at
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary font-bold text-xl">
            {(site.alias || site.domain || '?')[0].toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{site.domain}</h1>
              <a href={`https://${site.domain}`} target="_blank" rel="noopener noreferrer" className="text-dark-muted hover:text-primary">
                <ExternalLink className="w-5 h-5" />
              </a>
              <Badge variant={entityColors[site.entity] || 'secondary'}>{site.entity}</Badge>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-dark-muted">{site.alias}</span>
              {site.focus && <span className="text-sm text-dark-muted">• {site.focus}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={loadAllData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="ghost">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tab Navigation with status indicators */}
      <div className="flex items-center gap-1 border-b border-dark-border pb-1 overflow-x-auto">
        {getTabsWithStatus(keywords, quickWins, clusters, articles, pages, backlinks, gscData).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary/20 text-primary border-b-2 border-primary'
                : 'text-dark-muted hover:text-white hover:bg-dark-border/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== null && (
              <span className={`ml-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                tab.status === 'done' ? 'bg-success/20 text-success' :
                tab.status === 'warning' ? 'bg-warning/20 text-warning' :
                tab.status === 'todo' ? 'bg-dark-border text-dark-muted' :
                'bg-dark-border/50 text-dark-muted'
              }`}>
                {tab.count}
              </span>
            )}
            {tab.status === 'todo' && tab.count === 0 && (
              <span className="w-2 h-2 rounded-full bg-danger animate-pulse" title="À faire" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && (
        <>
      {/* KPIs Summary */}
      <div className="grid grid-cols-9 gap-3">
        <Card className="p-3 text-center">
          <div className="text-xl font-bold text-white">{kpis.keywords}</div>
          <div className="text-xs text-dark-muted">Keywords</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-xl font-bold text-info">{kpis.avgPosition}</div>
          <div className="text-xs text-dark-muted">Pos. moy.</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-xl font-bold text-success">{kpis.clicks.toLocaleString()}</div>
          <div className="text-xs text-dark-muted">Clics</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-xl font-bold text-white">{kpis.impressions.toLocaleString()}</div>
          <div className="text-xs text-dark-muted">Impressions</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-xl font-bold text-white">{kpis.pages}</div>
          <div className="text-xs text-dark-muted">Pages</div>
        </Card>
        <Card className="p-3 text-center">
          <div className={`text-xl font-bold ${typeof kpis.avgScore === 'number' && kpis.avgScore >= 80 ? 'text-success' : kpis.avgScore >= 50 ? 'text-warning' : 'text-danger'}`}>
            {kpis.avgScore}
          </div>
          <div className="text-xs text-dark-muted">Score SEO</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-xl font-bold text-primary">{kpis.clusters}</div>
          <div className="text-xs text-dark-muted">Cocons</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-xl font-bold text-white">{kpis.articles}</div>
          <div className="text-xs text-dark-muted">Articles</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-xl font-bold text-warning">{kpis.quickWins}</div>
          <div className="text-xs text-dark-muted">Quick Wins</div>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Progression SEO</h2>
            <p className="text-sm text-dark-muted mt-1">Avancement global du projet</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">{overallProgress}%</div>
            <div className="text-sm text-dark-muted">complété</div>
          </div>
        </div>

        {/* Workflow Steps */}
        <div className="flex items-start">
          {workflowSteps.map((step, i) => (
            <WorkflowStep
              key={step.id}
              step={step}
              isActive={step.status === 'in_progress'}
              isCompleted={step.status === 'complete'}
              isLast={i === workflowSteps.length - 1}
              onAction={() => handleAction(step.id)}
            />
          ))}
        </div>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Tasks To Do */}
        <div className="col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-primary" />
              À faire ({tasks.length})
            </h2>
          </div>

          {tasks.length === 0 ? (
            <Card className="p-8 text-center">
              <Sparkles className="w-12 h-12 text-success mx-auto mb-3" />
              <h3 className="text-lg font-medium text-white">Tout est à jour !</h3>
              <p className="text-dark-muted mt-1">Aucune tâche en attente pour ce site</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {tasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onAction={() => task.action && handleAction(task.action)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Recent Activity */}
          <Card className="p-4">
            <h3 className="text-sm font-medium text-dark-muted mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Activité récente
            </h3>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-dark-muted text-center py-4">Aucune activité</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${
                      item.type === 'keyword' ? 'bg-primary' :
                      item.type === 'audit' ? 'bg-info' :
                      item.type === 'content' ? 'bg-success' : 'bg-dark-muted'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white truncate">{item.text}</p>
                      <p className="text-xs text-dark-muted">
                        {item.date ? new Date(item.date).toLocaleDateString('fr-FR') : '-'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Quick Stats by Step */}
          <Card className="p-4">
            <h3 className="text-sm font-medium text-dark-muted mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Détails par étape
            </h3>
            <div className="space-y-3">
              {workflowSteps.map(step => (
                <div key={step.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <step.icon className={`w-4 h-4 ${step.status === 'complete' ? 'text-success' : step.status === 'in_progress' ? 'text-primary' : 'text-dark-muted'}`} />
                    <span className="text-sm text-white">{step.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-dark-muted">{step.done}/{step.total}</span>
                    <Badge variant={step.status === 'complete' ? 'success' : step.status === 'in_progress' ? 'primary' : 'secondary'} size="sm">
                      {step.progress}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-4">
            <h3 className="text-sm font-medium text-dark-muted mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Actions rapides
            </h3>
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleAction('keyword-research')}
                disabled={isRunningAction === 'keyword-research'}
              >
                <Target className="w-4 h-4 mr-2" />
                Recherche keywords
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleAction('technical-audit')}
                disabled={isRunningAction === 'technical-audit'}
              >
                <FileSearch className={`w-4 h-4 mr-2 ${isRunningAction === 'technical-audit' ? 'animate-spin' : ''}`} />
                {isRunningAction === 'technical-audit' ? 'Scan...' : 'Audit technique'}
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleAction('gsc-sync')}
                disabled={isRunningAction === 'gsc-sync'}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Sync GSC
              </Button>
            </div>
          </Card>
        </div>
      </div>
        </>
      )}

      {/* Keywords Tab */}
      {activeTab === 'keywords' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Keywords ({keywords.length})</h2>
              {keywords.length > 0 && (
                <p className="text-sm text-success flex items-center gap-1 mt-1">
                  <CheckCircle className="w-3 h-3" /> Recherche effectuée
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => handleAction('keyword-research')} disabled={isRunningAction} variant={keywords.length > 0 ? 'ghost' : 'primary'}>
                <Target className="w-4 h-4 mr-2" />
                {keywords.length > 0 ? 'Relancer' : 'Rechercher'}
                <span className="ml-2 text-xs opacity-70 bg-warning/20 text-warning px-1.5 py-0.5 rounded">~0.50€</span>
              </Button>
            </div>
          </div>
          {keywords.length === 0 ? (
            <Card className="p-8 text-center">
              <Target className="w-12 h-12 mx-auto text-dark-muted mb-3" />
              <h3 className="font-medium text-white">Aucun keyword</h3>
              <p className="text-dark-muted text-sm mt-1">Lancez une recherche pour identifier des opportunités</p>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <table className="w-full">
                <thead className="bg-dark-border/50">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-dark-muted">Keyword</th>
                    <th className="text-center p-3 text-sm font-medium text-dark-muted">Volume</th>
                    <th className="text-center p-3 text-sm font-medium text-dark-muted">Difficulté</th>
                    <th className="text-center p-3 text-sm font-medium text-dark-muted">Position</th>
                    <th className="text-center p-3 text-sm font-medium text-dark-muted">Intent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                  {keywords.slice(0, 50).map(kw => (
                    <tr key={kw.id} className="hover:bg-dark-border/30">
                      <td className="p-3 text-white font-medium">{kw.keyword}</td>
                      <td className="p-3 text-center text-white">{kw.search_volume?.toLocaleString() || '-'}</td>
                      <td className="p-3 text-center">
                        <Badge variant={kw.difficulty < 30 ? 'success' : kw.difficulty < 60 ? 'warning' : 'danger'} size="sm">
                          {kw.difficulty || '-'}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        {kw.current_position ? (
                          <Badge variant={kw.current_position <= 10 ? 'success' : kw.current_position <= 20 ? 'warning' : 'secondary'} size="sm">
                            #{kw.current_position}
                          </Badge>
                        ) : '-'}
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant="secondary" size="sm">{kw.intent || 'info'}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}

      {/* Quick Wins Tab */}
      {activeTab === 'quickwins' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Quick Wins ({quickWins.length})</h2>
              {quickWins.length > 0 ? (
                <p className="text-sm text-warning flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3 h-3" /> {quickWins.length} opportunité(s) à saisir
                </p>
              ) : keywords.length > 0 ? (
                <p className="text-sm text-success flex items-center gap-1 mt-1">
                  <CheckCircle className="w-3 h-3" /> Aucune opportunité quick win
                </p>
              ) : null}
            </div>
            <Button onClick={() => handleAction('quick-wins')} disabled={isRunningAction} variant="ghost">
              <Zap className="w-4 h-4 mr-2" />
              Détecter
              <span className="ml-2 text-xs opacity-70 bg-success/20 text-success px-1.5 py-0.5 rounded">Gratuit</span>
            </Button>
          </div>
          {quickWins.length === 0 ? (
            <Card className="p-8 text-center">
              <Zap className="w-12 h-12 mx-auto text-dark-muted mb-3" />
              <h3 className="font-medium text-white">Aucun quick win</h3>
              <p className="text-dark-muted text-sm mt-1">Les keywords en position 11-20 apparaîtront ici</p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {quickWins.map(qw => (
                <Card key={qw.id} className="p-4 border-warning/30 bg-warning/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">{qw.keywords?.keyword || 'Keyword'}</span>
                    <Badge variant="warning">Position {qw.current_position}</Badge>
                  </div>
                  <p className="text-sm text-dark-muted">{qw.recommendation || 'Optimisation recommandée'}</p>
                  <div className="flex gap-2 mt-3">
                    <Badge variant="secondary" size="sm">Volume: {qw.search_volume || '-'}</Badge>
                    <Badge variant="secondary" size="sm">Potentiel: +{qw.potential_gain || '?'} clics</Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cocons Tab */}
      {activeTab === 'cocons' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Cocons Sémantiques ({clusters.length})</h2>
              {clusters.length > 0 ? (
                <p className="text-sm text-success flex items-center gap-1 mt-1">
                  <CheckCircle className="w-3 h-3" /> {clusters.filter(c => c.status === 'complete').length}/{clusters.length} cocon(s) complet(s)
                </p>
              ) : (
                <p className="text-sm text-dark-muted flex items-center gap-1 mt-1">
                  <Circle className="w-3 h-3" /> Aucun cocon créé
                </p>
              )}
            </div>
            <Button
              onClick={() => handleAction('cocon-create')}
              disabled={isRunningAction === 'cocon-create' || keywords.length < 5}
              variant={clusters.length > 0 ? 'ghost' : 'primary'}
              title={keywords.length < 5 ? 'Minimum 5 keywords requis' : ''}
            >
              <Network className={`w-4 h-4 mr-2 ${isRunningAction === 'cocon-create' ? 'animate-spin' : ''}`} />
              {isRunningAction === 'cocon-create' ? 'Génération...' : clusters.length > 0 ? 'Nouvelles pages' : 'Créer pages piliers & satellites'}
              <span className="ml-2 text-xs opacity-70 bg-warning/20 text-warning px-1.5 py-0.5 rounded">~0.10€</span>
            </Button>
          </div>
          {clusters.length === 0 ? (
            <Card className="p-8 text-center">
              <Network className="w-12 h-12 mx-auto text-dark-muted mb-3" />
              <h3 className="font-medium text-white">Aucune page générée</h3>
              <p className="text-dark-muted text-sm mt-1">Générez des pages piliers et satellites pour structurer votre contenu</p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {clusters.map(cluster => (
                <Card key={cluster.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-white">{cluster.name}</h3>
                    <Badge variant={cluster.status === 'complete' ? 'success' : 'warning'}>{cluster.status}</Badge>
                  </div>
                  <p className="text-sm text-dark-muted mb-3">Pilier: {cluster.pillar_keyword}</p>
                  <div className="flex items-center gap-2 text-sm text-dark-muted">
                    <span>{cluster.cluster_satellites?.length || 0} satellites</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Articles ({articles.length})</h2>
              {articles.length > 0 ? (
                <p className="text-sm text-success flex items-center gap-1 mt-1">
                  <CheckCircle className="w-3 h-3" /> {articles.filter(a => a.status === 'published').length} publié(s), {articles.filter(a => a.status === 'draft').length} brouillon(s)
                </p>
              ) : (
                <p className="text-sm text-dark-muted flex items-center gap-1 mt-1">
                  <Circle className="w-3 h-3" /> Aucun article
                </p>
              )}
            </div>
            <Button disabled variant="ghost">
              <PenTool className="w-4 h-4 mr-2" />
              Nouvel article
            </Button>
          </div>
          {articles.length === 0 ? (
            <Card className="p-8 text-center">
              <PenTool className="w-12 h-12 mx-auto text-dark-muted mb-3" />
              <h3 className="font-medium text-white">Aucun article</h3>
              <p className="text-dark-muted text-sm mt-1">Créez du contenu pour améliorer votre SEO</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {articles.map(article => (
                <Card key={article.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-white">{article.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={article.status === 'published' ? 'success' : article.status === 'draft' ? 'warning' : 'secondary'} size="sm">
                          {article.status}
                        </Badge>
                        {article.word_count && <span className="text-xs text-dark-muted">{article.word_count} mots</span>}
                      </div>
                    </div>
                    {article.wp_post_id && (
                      <a href={`https://${site.domain}/?p=${article.wp_post_id}`} target="_blank" rel="noopener noreferrer" className="text-dark-muted hover:text-primary">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Audit Tab */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Audit des pages ({pages.length})</h2>
              {pages.filter(p => p.seo_score !== null).length > 0 ? (
                <p className="text-sm text-success flex items-center gap-1 mt-1">
                  <CheckCircle className="w-3 h-3" /> {pages.filter(p => p.seo_score !== null).length} page(s) auditée(s)
                </p>
              ) : (
                <p className="text-sm text-dark-muted flex items-center gap-1 mt-1">
                  <Circle className="w-3 h-3" /> Aucun audit effectué
                </p>
              )}
            </div>
            <Button
              onClick={() => handleAction('technical-audit')}
              disabled={isRunningAction === 'technical-audit'}
              variant={pages.filter(p => p.seo_score !== null).length > 0 ? 'ghost' : 'primary'}
            >
              <FileSearch className={`w-4 h-4 mr-2 ${isRunningAction === 'technical-audit' ? 'animate-spin' : ''}`} />
              {isRunningAction === 'technical-audit' ? 'Scan en cours...' : pages.filter(p => p.seo_score !== null).length > 0 ? 'Re-scanner' : 'Scanner'}
              <span className="ml-2 text-xs opacity-70 bg-warning/20 text-warning px-1.5 py-0.5 rounded">Variable</span>
            </Button>
          </div>
          {pages.length === 0 ? (
            <Card className="p-8 text-center">
              <FileSearch className="w-12 h-12 mx-auto text-dark-muted mb-3" />
              <h3 className="font-medium text-white">Aucune page auditée</h3>
              <p className="text-dark-muted text-sm mt-1">Lancez un scan pour analyser vos pages</p>
            </Card>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {pages.map(page => (
                <Card key={page.id} className={`p-4 ${page.seo_score >= 80 ? 'border-success/30' : page.seo_score >= 50 ? 'border-warning/30' : page.seo_score ? 'border-danger/30' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white truncate flex-1">{page.title || page.slug}</span>
                    {page.seo_score !== null && (
                      <Badge variant={page.seo_score >= 80 ? 'success' : page.seo_score >= 50 ? 'warning' : 'danger'}>
                        {page.seo_score}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-dark-muted truncate">{page.slug || page.wp_url}</p>
                  <div className="flex gap-2 mt-2 text-xs text-dark-muted">
                    {page.word_count && <span>{page.word_count} mots</span>}
                    {page.meta_title && <span>Title: {page.meta_title.length}/60</span>}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Backlinks Tab */}
      {activeTab === 'backlinks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Backlinks ({backlinks.length})</h2>
              {backlinks.length > 0 ? (
                <p className="text-sm text-success flex items-center gap-1 mt-1">
                  <CheckCircle className="w-3 h-3" /> {backlinks.filter(b => b.link_type === 'dofollow').length} dofollow, {backlinks.filter(b => b.link_type !== 'dofollow').length} nofollow
                </p>
              ) : (
                <p className="text-sm text-dark-muted flex items-center gap-1 mt-1">
                  <Circle className="w-3 h-3" /> Pas encore analysé
                </p>
              )}
            </div>
            <Button
              onClick={() => handleAction('backlink-analysis')}
              disabled={isRunningAction === 'backlink-analysis'}
              variant={backlinks.length > 0 ? 'ghost' : 'primary'}
            >
              <LinkIcon className={`w-4 h-4 mr-2 ${isRunningAction === 'backlink-analysis' ? 'animate-spin' : ''}`} />
              {isRunningAction === 'backlink-analysis' ? 'Analyse...' : backlinks.length > 0 ? 'Actualiser' : 'Analyser'}
              <span className="ml-2 text-xs opacity-70 bg-warning/20 text-warning px-1.5 py-0.5 rounded">~0.30€</span>
            </Button>
          </div>
          {backlinks.length === 0 ? (
            <Card className="p-8 text-center">
              <LinkIcon className="w-12 h-12 mx-auto text-dark-muted mb-3" />
              <h3 className="font-medium text-white">Aucun backlink</h3>
              <p className="text-dark-muted text-sm mt-1">Lancez une analyse de votre profil de liens</p>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <table className="w-full">
                <thead className="bg-dark-border/50">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-dark-muted">Source</th>
                    <th className="text-left p-3 text-sm font-medium text-dark-muted">Ancre</th>
                    <th className="text-center p-3 text-sm font-medium text-dark-muted">DA</th>
                    <th className="text-center p-3 text-sm font-medium text-dark-muted">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                  {backlinks.slice(0, 30).map(bl => (
                    <tr key={bl.id} className="hover:bg-dark-border/30">
                      <td className="p-3">
                        <a href={bl.source_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block max-w-xs">
                          {bl.source_domain || bl.source_url}
                        </a>
                      </td>
                      <td className="p-3 text-white">{bl.anchor_text || '-'}</td>
                      <td className="p-3 text-center">
                        <Badge variant={bl.domain_authority >= 50 ? 'success' : bl.domain_authority >= 30 ? 'warning' : 'secondary'} size="sm">
                          {bl.domain_authority || '-'}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant={bl.link_type === 'dofollow' ? 'success' : 'secondary'} size="sm">
                          {bl.link_type || 'dofollow'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}

      {/* Positions Tab */}
      {activeTab === 'positions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Évolution des positions</h2>
              {gscData.length > 0 ? (
                <p className="text-sm text-success flex items-center gap-1 mt-1">
                  <CheckCircle className="w-3 h-3" /> {gscData.length} entrée(s) GSC
                </p>
              ) : (
                <p className="text-sm text-dark-muted flex items-center gap-1 mt-1">
                  <Circle className="w-3 h-3" /> Pas encore synchronisé
                </p>
              )}
            </div>
            <Button onClick={() => handleAction('gsc-sync')} disabled={isRunningAction} variant="ghost">
              <TrendingUp className="w-4 h-4 mr-2" />
              Sync GSC
              <span className="ml-2 text-xs opacity-70 bg-success/20 text-success px-1.5 py-0.5 rounded">Gratuit</span>
            </Button>
          </div>
          {gscData.length === 0 ? (
            <Card className="p-8 text-center">
              <LineChart className="w-12 h-12 mx-auto text-dark-muted mb-3" />
              <h3 className="font-medium text-white">Pas de données GSC</h3>
              <p className="text-dark-muted text-sm mt-1">Synchronisez avec Google Search Console</p>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-4">
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-success">{gscData.reduce((sum, r) => sum + (r.clicks || 0), 0).toLocaleString()}</div>
                  <div className="text-sm text-dark-muted">Clics totaux</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-white">{gscData.reduce((sum, r) => sum + (r.impressions || 0), 0).toLocaleString()}</div>
                  <div className="text-sm text-dark-muted">Impressions</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-info">
                    {gscData.length > 0 ? (gscData.reduce((sum, r) => sum + (r.position || 0), 0) / gscData.length).toFixed(1) : '-'}
                  </div>
                  <div className="text-sm text-dark-muted">Position moy.</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">
                    {gscData.length > 0 ? ((gscData.reduce((sum, r) => sum + (r.ctr || 0), 0) / gscData.length) * 100).toFixed(1) : '-'}%
                  </div>
                  <div className="text-sm text-dark-muted">CTR moyen</div>
                </Card>
              </div>
              <Card className="overflow-hidden">
                <table className="w-full">
                  <thead className="bg-dark-border/50">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium text-dark-muted">Keyword</th>
                      <th className="text-center p-3 text-sm font-medium text-dark-muted">Position</th>
                      <th className="text-center p-3 text-sm font-medium text-dark-muted">Clics</th>
                      <th className="text-center p-3 text-sm font-medium text-dark-muted">Impressions</th>
                      <th className="text-center p-3 text-sm font-medium text-dark-muted">CTR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-border">
                    {gscData.slice(0, 30).map((row, i) => (
                      <tr key={i} className="hover:bg-dark-border/30">
                        <td className="p-3 text-white font-medium">{row.keyword || row.query || '-'}</td>
                        <td className="p-3 text-center">
                          <Badge variant={row.position <= 10 ? 'success' : row.position <= 20 ? 'warning' : 'secondary'} size="sm">
                            #{Math.round(row.position)}
                          </Badge>
                        </td>
                        <td className="p-3 text-center text-success">{row.clicks || 0}</td>
                        <td className="p-3 text-center text-white">{row.impressions?.toLocaleString() || 0}</td>
                        <td className="p-3 text-center text-dark-muted">{((row.ctr || 0) * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Performance SEO</h2>
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-6">
              <h3 className="font-medium text-white mb-4">Résumé du mois</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-dark-muted">Keywords trackés</span>
                  <span className="text-white font-medium">{keywords.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-dark-muted">Top 10</span>
                  <span className="text-success font-medium">{keywords.filter(k => k.current_position && k.current_position <= 10).length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-dark-muted">Top 20</span>
                  <span className="text-warning font-medium">{keywords.filter(k => k.current_position && k.current_position <= 20).length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-dark-muted">Articles publiés</span>
                  <span className="text-white font-medium">{articles.filter(a => a.status === 'published').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-dark-muted">Pages auditées</span>
                  <span className="text-white font-medium">{pages.filter(p => p.seo_score !== null).length}</span>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <h3 className="font-medium text-white mb-4">Objectifs</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-dark-muted text-sm">Keywords Top 10</span>
                    <span className="text-sm text-white">{keywords.filter(k => k.current_position && k.current_position <= 10).length}/10</span>
                  </div>
                  <div className="h-2 bg-dark-border rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${Math.min(100, (keywords.filter(k => k.current_position && k.current_position <= 10).length / 10) * 100)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-dark-muted text-sm">Articles publiés</span>
                    <span className="text-sm text-white">{articles.filter(a => a.status === 'published').length}/20</span>
                  </div>
                  <div className="h-2 bg-dark-border rounded-full overflow-hidden">
                    <div className="h-full bg-success" style={{ width: `${Math.min(100, (articles.filter(a => a.status === 'published').length / 20) * 100)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-dark-muted text-sm">Score SEO moyen</span>
                    <span className="text-sm text-white">{kpis.avgScore}/100</span>
                  </div>
                  <div className="h-2 bg-dark-border rounded-full overflow-hidden">
                    <div className="h-full bg-info" style={{ width: `${typeof kpis.avgScore === 'number' ? kpis.avgScore : 0}%` }} />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

// Main Sites List Component
export default function Sites({ onNavigate, selectedSite: propSelectedSite }) {
  const [sites, setSites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingGSC, setIsSyncingGSC] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ done: 0, total: 0, lastSync: null });
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEntity, setFilterEntity] = useState('all');
  const [internalSelectedSite, setInternalSelectedSite] = useState(null);

  // Use prop if provided, otherwise use internal state
  const selectedSite = propSelectedSite || internalSelectedSite;
  const setSelectedSite = propSelectedSite ? () => {} : setInternalSelectedSite;

  const loadSites = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sitesData, keywordsData, quickWinsData, gscData] = await Promise.all([
        sitesApi.getAll(),
        keywordsApi.getAll(),
        import('../lib/supabase').then(m => m.quickWinsApi.getAll()),
        gscApi.getPositionsBySite().catch(() => ({}))
      ]);

      const statsPerSite = {};
      keywordsData.forEach(kw => {
        if (kw.site_id) {
          if (!statsPerSite[kw.site_id]) {
            statsPerSite[kw.site_id] = { keywords: 0, volume: 0 };
          }
          statsPerSite[kw.site_id].keywords += 1;
          statsPerSite[kw.site_id].volume += (kw.search_volume || 0);
        }
      });

      const quickWinsPerSite = {};
      quickWinsData.forEach(qw => {
        if (qw.site_id && qw.status === 'pending') {
          quickWinsPerSite[qw.site_id] = (quickWinsPerSite[qw.site_id] || 0) + 1;
        }
      });

      const mappedSites = sitesData.map(site => {
        const stats = statsPerSite[site.id] || { keywords: 0, volume: 0 };
        const gsc = gscData[site.id] || {};

        return {
          id: site.id,
          alias: site.mcp_alias,
          domain: site.domain,
          entity: site.entity_id,
          focus: site.seo_focus || '',
          status: site.is_active ? 'active' : 'inactive',
          keywords: stats.keywords,
          volume: stats.volume,
          quickWins: quickWinsPerSite[site.id] || 0,
          articles: site.total_articles || 0,
          avgPosition: gsc.avgPosition || null,
          clicks: gsc.totalClicks || 0,
          impressions: gsc.totalImpressions || 0,
          priority: site.priority || 3,
          lastSync: site.last_monitored_at,
        };
      });
      setSites(mappedSites);
    } catch (err) {
      console.error('Erreur chargement sites:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const syncGSC = async () => {
    setIsSyncingGSC(true);
    try {
      const result = await n8nApi.syncGSC();
      if (result.success) {
        setTimeout(loadSites, 5000);
      } else {
        setError('Erreur sync GSC: ' + result.error);
      }
    } catch (err) {
      setError('Erreur sync GSC: ' + err.message);
    } finally {
      setIsSyncingGSC(false);
    }
  };

  const syncAllSites = async () => {
    setIsSyncing(true);
    setSyncStatus({ done: 0, total: 0, lastSync: null });

    try {
      const allSites = await sitesApi.getAll();
      const sitesWithWP = allSites.filter(s => s.wp_api_url && s.wp_username && s.wp_app_password);
      setSyncStatus(prev => ({ ...prev, total: sitesWithWP.length }));

      for (let i = 0; i < sitesWithWP.length; i++) {
        const site = sitesWithWP[i];
        await sitesApi.syncSiteStats(site);
        setSyncStatus(prev => ({ ...prev, done: i + 1 }));
      }

      setSyncStatus(prev => ({ ...prev, lastSync: new Date() }));
      await loadSites();
    } catch (err) {
      console.error('Sync error:', err);
      setError('Erreur lors de la synchronisation');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadSites();
  }, []);

  useEffect(() => {
    if (sites.length > 0 && !isSyncing && syncStatus.lastSync === null) {
      const timer = setTimeout(() => {
        syncAllSites();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [sites.length]);

  const entities = [...new Set(sites.map(s => s.entity).filter(Boolean))];

  const filteredSites = sites.filter(site => {
    const matchesSearch = (site.domain?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (site.alias?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesEntity = filterEntity === 'all' || site.entity === filterEntity;
    return matchesSearch && matchesEntity;
  });

  // If a site is selected, show the detail view
  if (selectedSite) {
    const handleBack = () => {
      if (propSelectedSite) {
        // If site was passed from sidebar, navigate to sites list
        onNavigate && onNavigate('sites');
      } else {
        // Otherwise just clear internal state
        setInternalSelectedSite(null);
      }
    };

    return (
      <SiteDetailView
        site={selectedSite}
        onBack={handleBack}
        onRefresh={loadSites}
      />
    );
  }

  // Otherwise show the sites list
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Sites du Portfolio</h2>
          <p className="text-dark-muted mt-1">
            {isLoading ? 'Chargement...' : `${sites.length} site${sites.length > 1 ? 's' : ''} WordPress`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            icon={isSyncingGSC ? Loader2 : Zap}
            onClick={syncGSC}
            disabled={isSyncingGSC || isLoading}
            className={isSyncingGSC ? 'animate-pulse' : ''}
            title="Synchronise les positions depuis Google Search Console"
          >
            {isSyncingGSC ? 'Sync GSC...' : 'Sync GSC'}
          </Button>
          <Button
            variant="secondary"
            icon={isSyncing ? Loader2 : CloudDownload}
            onClick={syncAllSites}
            disabled={isSyncing || isLoading}
            className={isSyncing ? 'animate-pulse' : ''}
          >
            {isSyncing
              ? `Sync ${syncStatus.done}/${syncStatus.total}`
              : syncStatus.lastSync
                ? 'Re-synchroniser'
                : 'Sync WordPress'
            }
          </Button>
          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={loadSites}
            disabled={isLoading}
          >
            {isLoading ? 'Chargement...' : 'Actualiser'}
          </Button>
          <Button icon={Plus} onClick={() => onNavigate && onNavigate('add-site')}>
            Ajouter un site
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 text-danger">
          Erreur: {error}
        </div>
      )}

      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
            <input
              type="text"
              placeholder="Rechercher un site..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-lg pl-10 pr-4 py-2 text-white placeholder:text-dark-muted focus:outline-none focus:border-primary"
            />
          </div>
          <select
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            className="bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
          >
            <option value="all">Toutes les entités</option>
            {entities.map(entity => (
              <option key={entity} value={entity}>{entity}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filteredSites.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-dark-muted">Aucun site trouvé</p>
            <Button
              className="mt-4"
              icon={Plus}
              onClick={() => onNavigate && onNavigate('add-site')}
            >
              Ajouter votre premier site
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Site</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Entité</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Keywords</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Pos. Moy.</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Clics GSC</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Quick Wins</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Articles</th>
                </tr>
              </thead>
              <tbody>
                {filteredSites.map((site) => (
                  <tr
                    key={site.id || site.alias}
                    className="border-b border-dark-border/50 hover:bg-dark-border/30 cursor-pointer transition-colors"
                    onClick={() => setSelectedSite(site)}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary font-bold">
                          {(site.alias || site.domain || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{site.domain}</span>
                            <ExternalLink className="w-3 h-3 text-dark-muted" />
                          </div>
                          <span className="text-xs text-dark-muted">{site.alias}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={entityColors[site.entity] || 'secondary'}>{site.entity || '-'}</Badge>
                    </td>
                    <td className="py-4 px-4 text-center text-white">{site.keywords}</td>
                    <td className="py-4 px-4 text-center">
                      {site.avgPosition ? (
                        <Badge variant={site.avgPosition <= 10 ? 'success' : site.avgPosition <= 30 ? 'warning' : 'secondary'}>
                          {site.avgPosition}
                        </Badge>
                      ) : (
                        <span className="text-dark-muted">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center text-white">
                      {site.clicks > 0 ? site.clicks.toLocaleString() : '-'}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {site.quickWins > 0 ? (
                        <Badge variant="warning">{site.quickWins}</Badge>
                      ) : (
                        <span className="text-dark-muted">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center text-white">{site.articles}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
