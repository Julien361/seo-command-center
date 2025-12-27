import { useState, useEffect } from 'react';
import {
  ExternalLink, Search, Plus, RefreshCw, Loader2, CloudDownload, Zap,
  ArrowLeft, Target, FileText, ArrowUp, ArrowDown, ArrowRight,
  Globe, MousePointer, Eye, BarChart3, Link2, AlertTriangle, CheckCircle, XCircle,
  Layers, Activity, Settings, Play, Clock, Check, Circle, ChevronRight,
  PenTool, Network, FileSearch, TrendingUp, Sparkles, ListTodo
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

// Site Detail View - Workflow oriented
function SiteDetailView({ site, onBack, onRefresh }) {
  const [isLoading, setIsLoading] = useState(true);
  const [keywords, setKeywords] = useState([]);
  const [pages, setPages] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [articles, setArticles] = useState([]);
  const [quickWins, setQuickWins] = useState([]);
  const [gscData, setGscData] = useState([]);
  const [isRunningAction, setIsRunningAction] = useState(null);

  useEffect(() => {
    if (site?.id) {
      loadAllData();
    }
  }, [site?.id]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [kwRes, pagesRes, clustersRes, articlesRes, qwRes, gscRes] = await Promise.all([
        supabase.from('keywords').select('*').eq('site_id', site.id),
        supabase.from('pages').select('*').eq('site_id', site.id),
        supabase.from('semantic_clusters').select('*, cluster_satellites(*)').eq('site_id', site.id),
        supabase.from('articles').select('*').eq('site_id', site.id),
        supabase.from('quick_wins').select('*, keywords(keyword)').eq('site_id', site.id).eq('status', 'pending'),
        supabase.from('gsc_keyword_history').select('*').eq('site_id', site.id).order('date', { ascending: false }).limit(50)
      ]);

      setKeywords(kwRes.data || []);
      setPages(pagesRes.data || []);
      setClusters(clustersRes.data || []);
      setArticles(articlesRes.data || []);
      setQuickWins(qwRes.data || []);
      setGscData(gscRes.data || []);
    } catch (err) {
      console.error('Error loading site data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Action handlers
  const handleAction = async (actionType, data = {}) => {
    setIsRunningAction(actionType);
    try {
      let result;
      switch (actionType) {
        case 'keyword-research':
          if (!confirm(`Lancer une recherche de keywords pour ${site.domain} ?\n\nCela utilisera l'API DataForSEO (payant).`)) return;
          result = await n8nApi.triggerWebhook('wf0', { site_alias: site.alias, seed_keyword: data.keyword || site.focus });
          break;
        case 'technical-audit':
          if (!confirm(`Lancer un audit technique sur ${site.domain} avec Firecrawl ?`)) return;
          result = await n8nApi.triggerWebhook('technical-audit', { site_alias: site.alias, max_pages: 10 });
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
        title: 'Créer des cocons sémantiques',
        description: `${keywords.length} keywords disponibles pour structurer en cocons`,
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
                <FileSearch className="w-4 h-4 mr-2" />
                Audit technique
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
