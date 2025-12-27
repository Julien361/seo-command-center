import { useState, useEffect } from 'react';
import {
  ExternalLink, Search, Plus, RefreshCw, Loader2, CloudDownload, Zap,
  ArrowLeft, Target, FileText, ArrowUp, ArrowDown, ArrowRight,
  Globe, MousePointer, Eye, BarChart3, Link2, AlertTriangle, CheckCircle, XCircle,
  Layers, Activity, Settings, Play, Clock, Check, Circle, ChevronRight,
  PenTool, Network, FileSearch, TrendingUp, Sparkles, ListTodo,
  Pencil, Save, X, Info,
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

// SEO Pipeline Step Component - Version améliorée avec workflows
function PipelineStep({ step, isActive, isCompleted, isLocked, onWorkflowLaunch, isRunning }) {
  const getStatusColor = () => {
    if (isLocked) return 'bg-dark-border/50 border-dark-border';
    if (isCompleted) return 'bg-success/20 border-success';
    if (isActive) return 'bg-primary/20 border-primary';
    return 'bg-dark-border/30 border-dark-border';
  };

  const getIconColor = () => {
    if (isLocked) return 'text-dark-muted';
    if (isCompleted) return 'text-success';
    if (isActive) return 'text-primary';
    return 'text-dark-muted';
  };

  return (
    <div className={`rounded-xl border-2 p-4 transition-all ${getStatusColor()} ${isLocked ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${isCompleted ? 'bg-success/20' : isActive ? 'bg-primary/20' : 'bg-dark-border'}`}>
            <step.icon className={`w-5 h-5 ${getIconColor()}`} />
          </div>
          <div>
            <h4 className={`font-semibold ${isLocked ? 'text-dark-muted' : 'text-white'}`}>{step.label}</h4>
            <p className="text-xs text-dark-muted">{step.description}</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-bold ${isCompleted ? 'text-success' : isActive ? 'text-primary' : 'text-dark-muted'}`}>
            {step.progress}%
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {step.metrics?.map((metric, i) => (
          <div key={i} className="flex items-center justify-between text-xs bg-dark-bg/50 rounded px-2 py-1">
            <span className="text-dark-muted">{metric.label}</span>
            <span className={metric.ok ? 'text-success font-medium' : 'text-white'}>{metric.value}</span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-dark-border rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all ${isCompleted ? 'bg-success' : isActive ? 'bg-primary' : 'bg-dark-muted'}`}
          style={{ width: `${step.progress}%` }}
        />
      </div>

      {/* Workflow buttons */}
      {step.workflows && step.workflows.length > 0 && !isLocked && (
        <div className="flex flex-wrap gap-2">
          {step.workflows.map((wf, i) => (
            <button
              key={i}
              onClick={() => !wf.done && !wf.isSubWorkflow && onWorkflowLaunch(wf.key)}
              disabled={wf.done || wf.isSubWorkflow || isRunning}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                wf.done
                  ? 'bg-success/20 text-success cursor-default'
                  : wf.isSubWorkflow
                  ? 'bg-dark-border text-dark-muted cursor-not-allowed'
                  : 'bg-primary/20 text-primary hover:bg-primary/30 cursor-pointer'
              }`}
              title={wf.isSubWorkflow ? 'Sub-workflow (automatique)' : wf.done ? 'Terminé' : 'Lancer ce workflow'}
            >
              {wf.done ? <Check className="w-3 h-3" /> : isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
              {wf.label}
              {wf.isPaid && !wf.done && <span className="text-warning">€</span>}
            </button>
          ))}
        </div>
      )}

      {/* Locked message */}
      {isLocked && step.requires && (
        <div className="flex items-center gap-2 text-xs text-warning bg-warning/10 rounded-lg px-3 py-2">
          <AlertTriangle className="w-3 h-3" />
          {step.requires}
        </div>
      )}

      {/* Next action */}
      {!isLocked && step.nextAction && !isCompleted && (
        <div className="mt-2 text-xs text-primary bg-primary/10 rounded-lg px-3 py-2 flex items-center gap-2">
          <ChevronRight className="w-3 h-3" />
          {step.nextAction}
        </div>
      )}
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

  // SEO Objective & Strategy editing
  const [isEditingStrategy, setIsEditingStrategy] = useState(false);
  const [isSavingStrategy, setIsSavingStrategy] = useState(false);
  const [siteStrategy, setSiteStrategy] = useState({
    objective: site?.seo_focus?.[0] || site?.focus || '',
    monetization: site?.monetization_type || 'lead_gen',
    targetAudience: site?.target_audience || '',
    geoFocus: site?.geographic_focus || 'France',
    competitors: site?.main_competitors || [],
    seedKeywords: site?.seed_keywords || []
  });

  // Monetization types
  const monetizationTypes = [
    { value: 'lead_gen', label: 'Génération de leads', icon: '🎯', description: 'Formulaires, devis, contacts' },
    { value: 'affiliate', label: 'Affiliation', icon: '🔗', description: 'Liens affiliés, comparateurs' },
    { value: 'ecommerce', label: 'E-commerce', icon: '🛒', description: 'Vente de produits' },
    { value: 'ads', label: 'Publicité', icon: '📢', description: 'AdSense, display ads' },
    { value: 'sponsored', label: 'Vente d\'espace', icon: '🏪', description: 'Commerçants, annonceurs locaux' },
    { value: 'links', label: 'Vente de liens', icon: '🔗', description: 'Articles sponsorisés, backlinks' },
    { value: 'membership', label: 'Abonnements', icon: '👥', description: 'Contenu premium, communauté' },
    { value: 'saas', label: 'SaaS', icon: '💳', description: 'Service en ligne payant' },
    { value: 'info', label: 'Contenu informatif', icon: '📚', description: 'Autorité, notoriété' },
  ];

  // Save strategy to Supabase
  const saveStrategy = async () => {
    setIsSavingStrategy(true);
    try {
      // Store full strategy in seo_focus array: [objective, monetization:type, seeds:kw1,kw2]
      const seoFocusArray = [
        siteStrategy.objective,
        `monetization:${siteStrategy.monetization}`,
        siteStrategy.seedKeywords.length > 0 ? `seeds:${siteStrategy.seedKeywords.join(',')}` : null
      ].filter(Boolean);

      const { error } = await supabase
        .from('sites')
        .update({
          seo_focus: seoFocusArray,
          target_audience: siteStrategy.targetAudience || null,
          geographic_focus: siteStrategy.geoFocus || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', site.id);

      if (error) throw error;
      setIsEditingStrategy(false);
      if (onRefresh) onRefresh();
      alert('✅ Stratégie sauvegardée ! Les prochains workflows utiliseront ces paramètres.');
    } catch (err) {
      console.error('Error saving strategy:', err);
      alert('Erreur lors de la sauvegarde: ' + err.message);
    } finally {
      setIsSavingStrategy(false);
    }
  };

  // Parse strategy from seo_focus on mount
  useEffect(() => {
    if (site?.seo_focus && Array.isArray(site.seo_focus)) {
      const focus = site.seo_focus;
      const objective = focus.find(f => !f?.startsWith('monetization:') && !f?.startsWith('seeds:')) || '';
      const monetizationItem = focus.find(f => f?.startsWith('monetization:'));
      const seedsItem = focus.find(f => f?.startsWith('seeds:'));

      setSiteStrategy(s => ({
        ...s,
        objective: objective,
        monetization: monetizationItem ? monetizationItem.replace('monetization:', '') : 'lead_gen',
        seedKeywords: seedsItem ? seedsItem.replace('seeds:', '').split(',') : [],
        targetAudience: site.target_audience || '',
        geoFocus: site.geographic_focus || 'France'
      }));
    }
  }, [site?.id]);

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
    // Mapping des workflow keys vers leurs configs
    const workflowConfigs = {
      // Pipeline workflows
      GSC_SYNC: { webhook: 'gsc-sync', label: 'Sync GSC', isPaid: false },
      WF0_CASCADE: { webhook: 'seo-cascade-start', label: 'Analyse SEO Complète', isPaid: true, cost: '~0.15€' },
      WF1_DATAFORSEO: { webhook: 'wf1', label: 'DataForSEO Keywords', isPaid: true, cost: '~0.05€' },
      WF2_PERPLEXITY: { webhook: 'wf2', label: 'Perplexity Research', isPaid: true, cost: '~0.02€' },
      WF3_FIRECRAWL: { webhook: 'wf3', label: 'Firecrawl Scraping', isPaid: true, cost: '~0.10€' },
      WF6_CLUSTERING: { webhook: 'wf6', label: 'Clustering Sémantique', isPaid: false },
      COCON_BUILDER: { webhook: 'wf-setup-3', label: 'Construction Cocons', isPaid: true, cost: '~0.10€' },
      CONTENT_BRIEF: { webhook: 'content-brief', label: 'Générer Brief', isPaid: true, cost: '~0.05€' },
      ARTICLE_GENERATOR: { webhook: 'article-generator', label: 'Rédiger Article', isPaid: true, cost: '~0.10€' },
      WP_PUBLISHER: { webhook: 'wp-publish', label: 'Publier WordPress', isPaid: false },
      POSITION_MONITOR: { webhook: 'position-monitor', label: 'Suivi Positions', isPaid: false },
      PAA_EXTRACTION: { webhook: 'paa', label: 'PAA Extraction', isPaid: true, cost: '~0.02€' },
      // Legacy actions
      'keyword-research': { webhook: 'seo-cascade-start', label: 'Recherche Keywords', isPaid: true },
      'technical-audit': { webhook: 'technical-audit', label: 'Audit Technique', isPaid: false },
      'backlink-analysis': { webhook: 'backlinks-sync', label: 'Analyse Backlinks', isPaid: false },
      'gsc-sync': { webhook: 'gsc-sync', label: 'Sync GSC', isPaid: false },
    };

    const config = workflowConfigs[actionType];
    if (!config) {
      console.log('Unknown action:', actionType);
      return;
    }

    // Confirmation for paid actions
    if (config.isPaid) {
      const confirmed = confirm(
        `🚀 ${config.label}\n\n` +
        `Site: ${site.domain}\n` +
        `Coût estimé: ${config.cost || 'Variable'}\n\n` +
        `Lancer ce workflow ?`
      );
      if (!confirmed) return;
    }

    setIsRunningAction(actionType);
    try {
      const payload = {
        site_alias: site.alias,
        site_id: site.id,
        url: `https://${site.domain}`,
        // Stratégie SEO complète pour orienter les workflows
        site_objective: siteStrategy.objective || site.focus,
        monetization_type: siteStrategy.monetization,
        target_audience: siteStrategy.targetAudience,
        geographic_focus: siteStrategy.geoFocus,
        seed_keywords: siteStrategy.seedKeywords,
        ...data
      };

      const result = await n8nApi.triggerWebhook(config.webhook, payload);

      if (result?.success !== false) {
        alert(`✅ ${config.label} lancé !\n\nLes résultats seront disponibles dans quelques instants.`);
        setTimeout(loadAllData, 10000);
      } else {
        alert('❌ Erreur: ' + (result?.error || 'Échec du workflow'));
      }
    } catch (err) {
      alert('❌ Erreur: ' + err.message);
    } finally {
      setIsRunningAction(null);
    }
  };

  // Calculate workflow progress
  const calculateWorkflowSteps = () => {
    // Calculs pour chaque étape
    const hasGSCData = gscData.length > 0;
    const keywordsAnalyzed = keywords.filter(k => k.search_volume !== null).length;
    const keywordsWithVolume = keywords.filter(k => k.search_volume > 0).length;
    const keywordsTotal = keywords.length;
    const clustersCreated = clusters.length;
    const clustersComplete = clusters.filter(c => c.status === 'complete').length;
    const articlesPublished = articles.filter(a => a.status === 'published').length;
    const articlesDraft = articles.filter(a => a.status === 'draft').length;
    const articlesTotal = articles.length;
    const pagesOptimized = pages.filter(p => p.seo_score && p.seo_score >= 80).length;
    const quickWinsDone = quickWins.filter(q => q.status === 'done').length;
    const quickWinsTotal = quickWins.length;
    const keywordsTop3 = keywords.filter(k => k.current_position && k.current_position <= 3).length;
    const keywordsTop10 = keywords.filter(k => k.current_position && k.current_position <= 10).length;
    const keywordsP0 = keywords.filter(k => k.featured_snippet).length;

    return [
      {
        id: 'data',
        label: '1. Collecte Données',
        shortLabel: 'Data',
        icon: CloudDownload,
        description: 'GSC + Analyse marché',
        done: (hasGSCData ? 1 : 0) + (keywordsWithVolume > 0 ? 1 : 0),
        total: 2,
        progress: ((hasGSCData ? 50 : 0) + (keywordsWithVolume > 0 ? 50 : 0)),
        status: hasGSCData && keywordsWithVolume > 0 ? 'complete' : (hasGSCData || keywordsWithVolume > 0 ? 'in_progress' : 'pending'),
        workflows: [
          { key: 'GSC_SYNC', label: 'Sync GSC', done: hasGSCData },
          { key: 'WF0_CASCADE', label: 'Analyse SEO', done: keywordsWithVolume >= 10, isPaid: true },
        ],
        metrics: [
          { label: 'Données GSC', value: hasGSCData ? 'OK' : 'Non', ok: hasGSCData },
          { label: 'Keywords analysés', value: keywordsWithVolume, ok: keywordsWithVolume >= 10 },
        ],
        nextAction: !hasGSCData ? 'Lancer Sync GSC' : (keywordsWithVolume < 10 ? 'Lancer WF0 Cascade' : null),
      },
      {
        id: 'strategy',
        label: '2. Stratégie',
        shortLabel: 'Stratégie',
        icon: Target,
        description: 'Clustering + Cocons',
        done: clustersComplete,
        total: Math.max(clustersCreated, 3),
        progress: clustersCreated > 0 ? Math.round((clustersComplete / clustersCreated) * 100) : 0,
        status: clustersComplete >= 3 ? 'complete' : (clustersCreated > 0 ? 'in_progress' : 'pending'),
        workflows: [
          { key: 'WF6_CLUSTERING', label: 'Clustering', done: clustersCreated > 0 },
          { key: 'COCON_BUILDER', label: 'Cocons', done: clustersComplete > 0, isPaid: true },
        ],
        metrics: [
          { label: 'Cocons créés', value: clustersCreated, ok: clustersCreated >= 3 },
          { label: 'Cocons complets', value: clustersComplete, ok: clustersComplete >= 1 },
        ],
        requires: keywordsWithVolume < 10 ? 'Étape 1 requise' : null,
        nextAction: clustersCreated === 0 ? 'Lancer Clustering' : (clustersComplete === 0 ? 'Compléter cocons' : null),
      },
      {
        id: 'content',
        label: '3. Création Contenu',
        shortLabel: 'Contenu',
        icon: PenTool,
        description: 'Briefs + Articles',
        done: articlesPublished,
        total: Math.max(articlesTotal, 5),
        progress: articlesTotal > 0 ? Math.round((articlesPublished / articlesTotal) * 100) : 0,
        status: articlesPublished >= 5 ? 'complete' : (articlesTotal > 0 ? 'in_progress' : 'pending'),
        workflows: [
          { key: 'CONTENT_BRIEF', label: 'Générer Brief', done: articlesDraft > 0 || articlesPublished > 0, isPaid: true },
          { key: 'ARTICLE_GENERATOR', label: 'Rédiger Article', done: articlesPublished > 0, isPaid: true },
        ],
        metrics: [
          { label: 'Briefs/Drafts', value: articlesDraft, ok: articlesDraft >= 1 },
          { label: 'Publiés', value: articlesPublished, ok: articlesPublished >= 5 },
        ],
        requires: clustersCreated === 0 ? 'Étape 2 requise' : null,
        nextAction: articlesDraft === 0 ? 'Générer un brief' : (articlesPublished === 0 ? 'Rédiger un article' : null),
      },
      {
        id: 'publish',
        label: '4. Publication',
        shortLabel: 'Publier',
        icon: Send,
        description: 'WordPress',
        done: articlesPublished,
        total: Math.max(articlesDraft + articlesPublished, 1),
        progress: (articlesDraft + articlesPublished) > 0 ? Math.round((articlesPublished / (articlesDraft + articlesPublished)) * 100) : 0,
        status: articlesPublished >= 5 ? 'complete' : (articlesPublished > 0 ? 'in_progress' : 'pending'),
        workflows: [
          { key: 'WP_PUBLISHER', label: 'Publier WP', done: articlesPublished > 0 },
        ],
        metrics: [
          { label: 'En attente', value: articlesDraft, ok: true },
          { label: 'Publiés', value: articlesPublished, ok: articlesPublished >= 5 },
        ],
        requires: articlesDraft === 0 && articlesPublished === 0 ? 'Étape 3 requise' : null,
        nextAction: articlesDraft > 0 ? `Publier ${articlesDraft} article(s)` : null,
      },
      {
        id: 'optimize',
        label: '5. Optimisation',
        shortLabel: 'Optimiser',
        icon: Zap,
        description: 'Quick Wins + Audit',
        done: quickWinsDone + pagesOptimized,
        total: Math.max(quickWinsTotal + pages.length, 1),
        progress: quickWinsTotal > 0 ? Math.round((quickWinsDone / quickWinsTotal) * 100) : (pagesOptimized > 0 ? 50 : 0),
        status: quickWinsDone >= quickWinsTotal && pagesOptimized > 0 ? 'complete' : (quickWinsTotal > 0 || pagesOptimized > 0 ? 'in_progress' : 'pending'),
        workflows: [
          { key: 'POSITION_MONITOR', label: 'Suivi Positions', done: hasGSCData },
          { key: 'WF7_QUICKWINS', label: 'Quick Wins', done: quickWinsTotal > 0, isSubWorkflow: true },
        ],
        metrics: [
          { label: 'Quick Wins', value: `${quickWinsDone}/${quickWinsTotal}`, ok: quickWinsDone === quickWinsTotal && quickWinsTotal > 0 },
          { label: 'Pages optimisées', value: pagesOptimized, ok: pagesOptimized >= 1 },
        ],
        requires: articlesPublished === 0 ? 'Étape 4 requise' : null,
        nextAction: quickWinsTotal > quickWinsDone ? `${quickWinsTotal - quickWinsDone} quick wins à traiter` : null,
      },
      {
        id: 'position0',
        label: '6. Position 0',
        shortLabel: 'P0',
        icon: Sparkles,
        description: 'Featured Snippets',
        done: keywordsP0,
        total: Math.max(keywordsTop10, 1),
        progress: keywordsTop10 > 0 ? Math.round((keywordsP0 / keywordsTop10) * 100) : 0,
        status: keywordsP0 > 0 ? 'complete' : (keywordsTop3 > 0 ? 'in_progress' : 'pending'),
        workflows: [],
        metrics: [
          { label: 'Top 3', value: keywordsTop3, ok: keywordsTop3 >= 1 },
          { label: 'Top 10', value: keywordsTop10, ok: keywordsTop10 >= 5 },
          { label: 'Position 0', value: keywordsP0, ok: keywordsP0 >= 1 },
        ],
        requires: keywordsTop10 === 0 ? 'Atteindre Top 10 d\'abord' : null,
        nextAction: keywordsTop3 > 0 && keywordsP0 === 0 ? 'Cibler Featured Snippets' : null,
      }
    ];
  };

  // Generate tasks to do
  const generateTasks = () => {
    const tasks = [];

    // === DONNÉES GSC ===
    if (gscData.length === 0) {
      tasks.push({
        id: 'gsc-sync-initial',
        title: 'Synchroniser Google Search Console',
        description: 'Récupérer clics, impressions et positions depuis GSC',
        priority: 'high',
        status: 'pending',
        step: 'data',
        action: 'gsc-sync',
        actionLabel: 'Sync GSC'
      });
    }

    // === KEYWORDS ===
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
    } else {
      const noPosition = keywords.filter(k => !k.current_position);
      if (noPosition.length > 5) {
        tasks.push({
          id: 'kw-track',
          title: `${noPosition.length} keywords sans position`,
          description: 'Synchroniser avec GSC pour obtenir les positions',
          priority: 'medium',
          status: 'pending',
          step: 'keywords',
          action: 'gsc-sync',
          actionLabel: 'Sync GSC'
        });
      }

      // Keywords avec position qui chute
      const kwWithPosition = keywords.filter(k => k.current_position && k.current_position > 0);
      const avgPos = kwWithPosition.length > 0
        ? kwWithPosition.reduce((s, k) => s + k.current_position, 0) / kwWithPosition.length
        : 0;
      if (avgPos > 20 && kwWithPosition.length > 0) {
        tasks.push({
          id: 'position-improve',
          title: `Position moyenne: ${avgPos.toFixed(1)} (page 2+)`,
          description: 'Optimiser le contenu pour améliorer les positions',
          priority: 'high',
          status: 'pending',
          step: 'optimization'
        });
      }

      // Top 3 - à maintenir
      const top3 = kwWithPosition.filter(k => k.current_position <= 3);
      if (top3.length > 0) {
        tasks.push({
          id: 'top3-maintain',
          title: `${top3.length} keyword(s) en Top 3`,
          description: 'Maintenir ces positions avec du contenu frais',
          priority: 'low',
          status: 'done',
          step: 'optimization',
          meta: top3.slice(0, 3).map(k => k.keyword).join(', ')
        });
      }
    }

    // === BACKLINKS ===
    if (backlinks.length === 0) {
      tasks.push({
        id: 'backlinks-sync',
        title: 'Analyser les backlinks',
        description: 'Découvrir le profil de liens entrants',
        priority: 'medium',
        status: 'pending',
        step: 'backlinks',
        action: 'backlink-analysis',
        actionLabel: 'Analyser'
      });
    } else {
      const toxicLinks = backlinks.filter(b => b.spam_score && b.spam_score > 30);
      if (toxicLinks.length > 0) {
        tasks.push({
          id: 'backlinks-toxic',
          title: `${toxicLinks.length} backlink(s) toxiques détectés`,
          description: 'Liens avec spam score élevé à désavouer',
          priority: 'high',
          status: 'pending',
          step: 'backlinks'
        });
      }
    }

    // === COCONS SÉMANTIQUES ===
    if (clusters.length === 0 && keywords.length >= 5) {
      tasks.push({
        id: 'cluster-create',
        title: 'Créer pages piliers & satellites',
        description: `${keywords.length} keywords disponibles pour générer du contenu`,
        priority: 'high',
        status: 'pending',
        step: 'clusters',
        action: 'cocon-create',
        actionLabel: 'Créer',
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

    // === CONTENU ===
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

    // === AUDIT TECHNIQUE ===
    if (pages.length === 0) {
      tasks.push({
        id: 'audit-run',
        title: 'Lancer un audit technique complet',
        description: 'Scanner toutes les pages du site',
        priority: 'high',
        status: 'pending',
        step: 'audit',
        action: 'technical-audit',
        actionLabel: 'Auditer'
      });
    } else {
      const unaudited = pages.filter(p => p.seo_score === null);
      if (unaudited.length > 0) {
        tasks.push({
          id: 'audit-pending',
          title: `${unaudited.length} page(s) non auditées`,
          description: 'Analyser le contenu avec Firecrawl',
          priority: 'medium',
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
          title: `${lowScore.length} page(s) avec score < 50`,
          description: 'Optimisation requise pour ces pages',
          priority: 'high',
          status: 'pending',
          step: 'audit',
          meta: lowScore.map(p => p.title || p.url).slice(0, 2).join(', ')
        });
      }

      // Pages avec bon score
      const goodScore = pages.filter(p => p.seo_score !== null && p.seo_score >= 80);
      if (goodScore.length > 0) {
        tasks.push({
          id: 'audit-good',
          title: `${goodScore.length} page(s) optimisées (80+)`,
          description: 'Ces pages sont bien optimisées',
          priority: 'low',
          status: 'done',
          step: 'audit'
        });
      }
    }

    // === QUICK WINS ===
    if (quickWins.length > 0) {
      tasks.push({
        id: 'qw-optimize',
        title: `${quickWins.length} quick win(s) disponibles`,
        description: 'Keywords P11-20 faciles à passer en page 1',
        priority: 'high',
        status: 'pending',
        step: 'optimization',
        action: 'quick-wins',
        actionLabel: 'Voir',
        meta: quickWins.slice(0, 3).map(q => q.keywords?.keyword).filter(Boolean).join(', ')
      });
    }

    // === CTR OPTIMIZATION ===
    const ctr = gscData.length > 0
      ? (gscData.reduce((s, r) => s + (r.clicks || 0), 0) / Math.max(gscData.reduce((s, r) => s + (r.impressions || 0), 0), 1)) * 100
      : 0;
    if (ctr > 0 && ctr < 2) {
      tasks.push({
        id: 'ctr-optimize',
        title: `CTR faible: ${ctr.toFixed(2)}%`,
        description: 'Optimiser les titles et meta descriptions',
        priority: 'medium',
        status: 'pending',
        step: 'optimization'
      });
    }

    return tasks;
  };

  // Calculate KPIs
  const totalClicks = gscData.reduce((sum, r) => sum + (r.clicks || 0), 0);
  const totalImpressions = gscData.reduce((sum, r) => sum + (r.impressions || 0), 0);
  const kpis = {
    keywords: keywords.length,
    avgPosition: keywords.filter(k => k.current_position).length > 0
      ? (keywords.filter(k => k.current_position).reduce((s, k) => s + k.current_position, 0) / keywords.filter(k => k.current_position).length).toFixed(1)
      : '-',
    clicks: totalClicks,
    impressions: totalImpressions,
    ctr: totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '-',
    pages: pages.length,
    avgScore: (() => {
      const pagesWithScore = pages.filter(p => typeof p.seo_score === 'number' && !isNaN(p.seo_score));
      if (pagesWithScore.length === 0) return '-';
      const avg = pagesWithScore.reduce((s, p) => s + p.seo_score, 0) / pagesWithScore.length;
      return isNaN(avg) ? '-' : Math.round(avg);
    })(),
    clusters: clusters.length,
    articles: articles.length,
    backlinks: backlinks.length,
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

      {/* Stratégie SEO du site - Éditable */}
      {isEditingStrategy ? (
        <Card className="p-5 border-primary/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Stratégie SEO & Monétisation
            </h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditingStrategy(false)}>
                <X className="w-4 h-4 mr-1" /> Annuler
              </Button>
              <Button variant="primary" size="sm" onClick={saveStrategy} disabled={isSavingStrategy}>
                {isSavingStrategy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                Sauvegarder
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Objectif principal */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-dark-muted mb-1">
                Objectif SEO principal <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                value={siteStrategy.objective}
                onChange={(e) => setSiteStrategy(s => ({ ...s, objective: e.target.value }))}
                placeholder="Ex: Lead generation MaPrimeAdapt, Vendre des formations..."
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white placeholder:text-dark-muted focus:outline-none focus:border-primary"
              />
              <p className="text-xs text-dark-muted mt-1">
                Cet objectif guide la recherche de mots-clés et l'analyse des concurrents
              </p>
            </div>

            {/* Type de monétisation */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-dark-muted mb-1">
                Monétisation
              </label>
              <div className="grid grid-cols-3 gap-2">
                {monetizationTypes.map(type => (
                  <button
                    key={type.value}
                    onClick={() => setSiteStrategy(s => ({ ...s, monetization: type.value }))}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                      siteStrategy.monetization === type.value
                        ? 'border-primary bg-primary/20 text-white'
                        : 'border-dark-border bg-dark-bg text-dark-muted hover:border-dark-muted'
                    }`}
                  >
                    <span className="text-lg">{type.icon}</span>
                    <div>
                      <div className="text-sm font-medium">{type.label}</div>
                      <div className="text-xs opacity-70">{type.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Audience cible */}
            <div>
              <label className="block text-sm font-medium text-dark-muted mb-1">
                Audience cible
              </label>
              <textarea
                value={siteStrategy.targetAudience}
                onChange={(e) => setSiteStrategy(s => ({ ...s, targetAudience: e.target.value }))}
                placeholder="Ex: Seniors 60+, propriétaires, revenus modestes..."
                rows={3}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white placeholder:text-dark-muted focus:outline-none focus:border-primary"
              />
            </div>

            {/* Zone géographique */}
            <div>
              <label className="block text-sm font-medium text-dark-muted mb-1">
                Zone géographique
              </label>
              <input
                type="text"
                value={siteStrategy.geoFocus}
                onChange={(e) => setSiteStrategy(s => ({ ...s, geoFocus: e.target.value }))}
                placeholder="Ex: France, Île-de-France, Marseille..."
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white placeholder:text-dark-muted focus:outline-none focus:border-primary"
              />
            </div>

            {/* Mots-clés prioritaires */}
            <div>
              <label className="block text-sm font-medium text-dark-muted mb-1">
                Mots-clés prioritaires (seeds)
              </label>
              <input
                type="text"
                value={siteStrategy.seedKeywords.join(', ')}
                onChange={(e) => setSiteStrategy(s => ({ ...s, seedKeywords: e.target.value.split(',').map(k => k.trim()).filter(k => k) }))}
                placeholder="maprimeadapt, aide senior, adaptation logement..."
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white placeholder:text-dark-muted focus:outline-none focus:border-primary"
              />
              <p className="text-xs text-dark-muted mt-1">Séparés par des virgules</p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-info/10 border border-info/30 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-info mt-0.5 flex-shrink-0" />
              <div className="text-sm text-info">
                <strong>Comment ces infos sont utilisées :</strong>
                <ul className="mt-1 space-y-1 text-xs opacity-90">
                  <li>• <strong>Objectif</strong> → Guide la génération de mots-clés et briefs</li>
                  <li>• <strong>Monétisation</strong> → Oriente le type de contenu (landing pages, articles, comparatifs)</li>
                  <li>• <strong>Audience</strong> → Adapte le ton et le vocabulaire</li>
                  <li>• <strong>Géo</strong> → Cible les recherches locales</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <div
          className="bg-gradient-to-r from-primary/10 to-info/10 border border-primary/30 rounded-lg px-4 py-3 cursor-pointer hover:border-primary/50 transition-all group"
          onClick={() => setIsEditingStrategy(true)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <span className="text-xs font-medium text-primary uppercase tracking-wide">Stratégie SEO</span>
                <p className="text-white font-medium">
                  {siteStrategy.objective || site.focus || 'Cliquez pour définir votre objectif'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {siteStrategy.monetization && (
                <div className="text-center">
                  <span className="text-lg">{monetizationTypes.find(t => t.value === siteStrategy.monetization)?.icon || '🎯'}</span>
                  <div className="text-xs text-dark-muted">{monetizationTypes.find(t => t.value === siteStrategy.monetization)?.label || 'Lead gen'}</div>
                </div>
              )}
              <Pencil className="w-4 h-4 text-dark-muted group-hover:text-primary transition-colors" />
            </div>
          </div>
        </div>
      )}

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
      {/* KPIs Summary - 2 rows */}
      <div className="grid grid-cols-6 gap-3">
        {/* Row 1 - GSC Metrics */}
        <Card className="p-3 text-center">
          <div className={`text-xl font-bold ${kpis.avgPosition !== '-' && parseFloat(kpis.avgPosition) <= 10 ? 'text-success' : kpis.avgPosition !== '-' && parseFloat(kpis.avgPosition) <= 20 ? 'text-warning' : 'text-danger'}`}>
            {kpis.avgPosition}
          </div>
          <div className="text-xs text-dark-muted">Position moy.</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-xl font-bold text-success">{kpis.clicks.toLocaleString()}</div>
          <div className="text-xs text-dark-muted">Clics (28j)</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-xl font-bold text-white">{kpis.impressions.toLocaleString()}</div>
          <div className="text-xs text-dark-muted">Impressions</div>
        </Card>
        <Card className="p-3 text-center">
          <div className={`text-xl font-bold ${kpis.ctr !== '-' && parseFloat(kpis.ctr) >= 5 ? 'text-success' : kpis.ctr !== '-' && parseFloat(kpis.ctr) >= 2 ? 'text-warning' : 'text-danger'}`}>
            {kpis.ctr}{kpis.ctr !== '-' ? '%' : ''}
          </div>
          <div className="text-xs text-dark-muted">CTR</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-xl font-bold text-white">{kpis.keywords}</div>
          <div className="text-xs text-dark-muted">Keywords</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-xl font-bold text-warning">{kpis.quickWins}</div>
          <div className="text-xs text-dark-muted">Quick Wins</div>
        </Card>

        {/* Row 2 - Content & Tech Metrics */}
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
          <div className="text-xl font-bold text-info">{kpis.backlinks}</div>
          <div className="text-xs text-dark-muted">Backlinks</div>
        </Card>
        <Card className="p-3 text-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => handleAction('gsc-sync')}>
          <div className="text-xl font-bold text-primary">
            <RefreshCw className={`w-5 h-5 mx-auto ${isRunningAction === 'gsc-sync' ? 'animate-spin' : ''}`} />
          </div>
          <div className="text-xs text-dark-muted">Actualiser</div>
        </Card>
      </div>

      {/* SEO Pipeline - Parcours vers Position 0 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Parcours vers Position 0
            </h2>
            <p className="text-sm text-dark-muted mt-1">6 étapes pour dominer les SERPs</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">{overallProgress}%</div>
            <div className="text-sm text-dark-muted">complété</div>
          </div>
        </div>

        {/* Pipeline Steps - Grille 3x2 */}
        <div className="grid grid-cols-3 gap-4">
          {workflowSteps.map((step, i) => {
            const prevStep = i > 0 ? workflowSteps[i - 1] : null;
            const isLocked = prevStep && prevStep.status === 'pending' && step.requires;

            return (
              <PipelineStep
                key={step.id}
                step={step}
                isActive={step.status === 'in_progress'}
                isCompleted={step.status === 'complete'}
                isLocked={isLocked}
                onWorkflowLaunch={(wfKey) => handleAction(wfKey)}
                isRunning={isRunningAction !== null}
              />
            );
          })}
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
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Cocons Sémantiques</h2>
              <p className="text-sm text-dark-muted mt-1">
                Suivi de la couverture thématique - Keywords couverts par vos pages
              </p>
            </div>
          </div>

          {/* Couverture Keywords */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Keywords à couvrir ({keywords.length})
              </h3>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-success flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {keywords.filter(k => articles.some(a => a.keyword_id === k.id && a.status === 'published')).length} couverts
                </span>
                <span className="text-dark-muted">|</span>
                <span className="text-warning">
                  {keywords.filter(k => !articles.some(a => a.keyword_id === k.id)).length} à créer
                </span>
              </div>
            </div>

            {keywords.length === 0 ? (
              <div className="text-center py-6">
                <Target className="w-10 h-10 mx-auto text-dark-muted mb-2" />
                <p className="text-dark-muted">Aucun keyword. Lancez une recherche d'abord.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
                {keywords.sort((a, b) => (b.search_volume || 0) - (a.search_volume || 0)).map(kw => {
                  const hasArticle = articles.some(a => a.keyword_id === kw.id);
                  const isPublished = articles.some(a => a.keyword_id === kw.id && a.status === 'published');
                  const isDraft = articles.some(a => a.keyword_id === kw.id && a.status === 'draft');

                  return (
                    <div
                      key={kw.id}
                      className={`flex items-center gap-3 p-2 rounded-lg border transition-colors ${
                        isPublished ? 'border-success/30 bg-success/5' :
                        isDraft ? 'border-warning/30 bg-warning/5' :
                        'border-dark-border bg-dark-bg hover:border-primary/30'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                        isPublished ? 'bg-success text-white' :
                        isDraft ? 'bg-warning text-dark-bg' :
                        'border border-dark-muted'
                      }`}>
                        {isPublished && <Check className="w-3 h-3" />}
                        {isDraft && <Clock className="w-3 h-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${isPublished ? 'text-success' : isDraft ? 'text-warning' : 'text-white'}`}>
                          {kw.keyword}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-dark-muted">
                          <span>{kw.search_volume?.toLocaleString() || 0}/mois</span>
                          {kw.current_position && (
                            <Badge variant={kw.current_position <= 10 ? 'success' : kw.current_position <= 20 ? 'warning' : 'secondary'} size="sm">
                              P{kw.current_position}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Clusters existants */}
          {clusters.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-white flex items-center gap-2">
                  <Network className="w-4 h-4 text-info" />
                  Clusters sémantiques ({clusters.length})
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {clusters.map(cluster => {
                  const satellites = cluster.cluster_satellites || [];
                  const completedSatellites = satellites.filter(s => s.status === 'published').length;

                  return (
                    <div key={cluster.id} className="p-4 rounded-lg border border-dark-border bg-dark-bg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-white">{cluster.name}</h4>
                        <Badge variant={cluster.status === 'complete' ? 'success' : 'warning'} size="sm">
                          {completedSatellites}/{satellites.length}
                        </Badge>
                      </div>
                      <p className="text-sm text-primary mb-3">Pilier: {cluster.pillar_keyword}</p>
                      {satellites.length > 0 && (
                        <div className="space-y-1">
                          {satellites.slice(0, 5).map((sat, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              {sat.status === 'published' ? (
                                <CheckCircle className="w-3 h-3 text-success" />
                              ) : (
                                <Circle className="w-3 h-3 text-dark-muted" />
                              )}
                              <span className="text-dark-muted truncate">{sat.keyword || `Satellite ${i + 1}`}</span>
                            </div>
                          ))}
                          {satellites.length > 5 && (
                            <p className="text-xs text-dark-muted">+{satellites.length - 5} autres</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Légende */}
          <div className="flex items-center gap-6 text-sm text-dark-muted">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-success flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-white" />
              </div>
              <span>Publié</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-warning flex items-center justify-center">
                <Clock className="w-2.5 h-2.5 text-dark-bg" />
              </div>
              <span>Brouillon</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border border-dark-muted" />
              <span>À créer</span>
            </div>
          </div>
        </div>
      )}

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          {/* Header avec accès WordPress */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Création de contenu</h2>
              <p className="text-sm text-dark-muted mt-1">
                {articles.filter(a => a.status === 'published').length} publié(s), {articles.filter(a => a.status === 'draft').length} brouillon(s)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => window.open(`https://${site.domain}/wp-admin/edit.php`, '_blank')}
              >
                <Globe className="w-4 h-4 mr-2" />
                WordPress
              </Button>
              <Button
                onClick={() => handleAction('cocon-create')}
                disabled={isRunningAction === 'cocon-create' || keywords.length < 3}
              >
                <Plus className="w-4 h-4 mr-2" />
                Générer pages
                <span className="ml-2 text-xs opacity-70">~0.10€</span>
              </Button>
            </div>
          </div>

          {/* Propositions d'articles basées sur les keywords non couverts */}
          {(() => {
            const uncoveredKeywords = keywords
              .filter(k => !articles.some(a => a.keyword_id === k.id))
              .sort((a, b) => (b.search_volume || 0) - (a.search_volume || 0))
              .slice(0, 6);

            return uncoveredKeywords.length > 0 && (
              <Card className="p-4 border-primary/30 bg-primary/5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-white flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-primary" />
                    Propositions d'articles ({uncoveredKeywords.length})
                  </h3>
                  <span className="text-xs text-dark-muted">Basé sur vos keywords non couverts</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {uncoveredKeywords.map(kw => (
                    <div
                      key={kw.id}
                      className="p-3 rounded-lg border border-dark-border bg-dark-bg hover:border-primary/50 cursor-pointer transition-colors"
                    >
                      <p className="text-sm font-medium text-white truncate">{kw.keyword}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-dark-muted">
                        <span>{kw.search_volume?.toLocaleString() || 0}/mois</span>
                        {kw.keyword_difficulty && (
                          <Badge variant={kw.keyword_difficulty < 30 ? 'success' : kw.keyword_difficulty < 60 ? 'warning' : 'danger'} size="sm">
                            KD {kw.keyword_difficulty}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })()}

          {/* Articles existants */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-info" />
                Articles ({articles.length})
              </h3>
            </div>

            {articles.length === 0 ? (
              <div className="text-center py-8">
                <PenTool className="w-10 h-10 mx-auto text-dark-muted mb-2" />
                <p className="text-dark-muted">Aucun article. Générez des pages piliers pour commencer.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {articles.map(article => (
                  <div key={article.id} className="flex items-center justify-between p-3 rounded-lg border border-dark-border hover:border-primary/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-white truncate">{article.title}</h4>
                        <Badge variant={article.status === 'published' ? 'success' : article.status === 'draft' ? 'warning' : 'secondary'} size="sm">
                          {article.status === 'published' ? 'Publié' : article.status === 'draft' ? 'Brouillon' : article.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-dark-muted">
                        {article.word_count && <span>{article.word_count} mots</span>}
                        {article.created_at && <span>{new Date(article.created_at).toLocaleDateString('fr-FR')}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {article.wp_post_id && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`https://${site.domain}/?p=${article.wp_post_id}`, '_blank')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`https://${site.domain}/wp-admin/post.php?post=${article.wp_post_id}&action=edit`, '_blank')}
                          >
                            <PenTool className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
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

  // Entity map for transforming raw site data
  const [entityMap, setEntityMap] = useState({});

  // Load entities early if we have a selected site from props
  useEffect(() => {
    if (propSelectedSite && Object.keys(entityMap).length === 0) {
      supabase.from('entities').select('id, name').then(({ data }) => {
        const map = {};
        (data || []).forEach(e => { map[e.id] = e.name; });
        setEntityMap(map);
      });
    }
  }, [propSelectedSite]);

  // Use prop if provided, otherwise use internal state
  // Transform raw site data to include computed fields (entity name, focus string)
  const selectedSite = (() => {
    const rawSite = propSelectedSite || internalSelectedSite;
    if (!rawSite) return null;

    // If site already has computed entity name, return as-is
    if (rawSite.entity && typeof rawSite.entity === 'string' && rawSite.entity.length < 50) {
      return rawSite;
    }

    // Transform raw site from sidebar
    return {
      ...rawSite,
      id: rawSite.id,
      alias: rawSite.mcp_alias || rawSite.alias,
      domain: rawSite.domain,
      entity: entityMap[rawSite.entity_id] || rawSite.entity_id || 'Non assigné',
      focus: Array.isArray(rawSite.seo_focus)
        ? rawSite.seo_focus.join(' • ')
        : (rawSite.seo_focus || rawSite.focus || ''),
      status: rawSite.is_active ? 'active' : (rawSite.status || 'inactive'),
    };
  })();
  const setSelectedSite = propSelectedSite ? () => {} : setInternalSelectedSite;

  const loadSites = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sitesData, keywordsData, quickWinsData, gscData, entitiesData] = await Promise.all([
        sitesApi.getAll(),
        keywordsApi.getAll(),
        import('../lib/supabase').then(m => m.quickWinsApi.getAll()),
        gscApi.getPositionsBySite().catch(() => ({})),
        supabase.from('entities').select('id, name').then(r => r.data || [])
      ]);

      // Map entity IDs to names
      const entityMapLocal = {};
      entitiesData.forEach(e => { entityMapLocal[e.id] = e.name; });
      setEntityMap(entityMapLocal); // Also save to state for use in site transform

      const statsPerSite = {};
      keywordsData.forEach(kw => {
        if (kw.site_id) {
          if (!statsPerSite[kw.site_id]) {
            statsPerSite[kw.site_id] = { keywords: 0, volume: 0, positions: [], hasPosition: 0 };
          }
          statsPerSite[kw.site_id].keywords += 1;
          statsPerSite[kw.site_id].volume += (kw.search_volume || 0);
          if (kw.current_position && kw.current_position > 0) {
            statsPerSite[kw.site_id].positions.push(kw.current_position);
            statsPerSite[kw.site_id].hasPosition += 1;
          }
        }
      });

      const quickWinsPerSite = {};
      quickWinsData.forEach(qw => {
        if (qw.site_id && qw.status === 'pending') {
          quickWinsPerSite[qw.site_id] = (quickWinsPerSite[qw.site_id] || 0) + 1;
        }
      });

      const mappedSites = sitesData.map(site => {
        const stats = statsPerSite[site.id] || { keywords: 0, volume: 0, positions: [], hasPosition: 0 };
        const gsc = gscData[site.id] || {};

        // Calculer la position moyenne depuis les keywords si pas de données GSC
        const avgFromKeywords = stats.positions.length > 0
          ? Math.round(stats.positions.reduce((a, b) => a + b, 0) / stats.positions.length * 10) / 10
          : null;

        return {
          id: site.id,
          alias: site.mcp_alias,
          domain: site.domain,
          entity: entityMapLocal[site.entity_id] || site.entity_id || 'Non assigné',
          focus: Array.isArray(site.seo_focus) ? site.seo_focus.join(' • ') : (site.seo_focus || ''),
          status: site.is_active ? 'active' : 'inactive',
          keywords: stats.keywords,
          keywordsWithPosition: stats.hasPosition,
          volume: stats.volume,
          quickWins: quickWinsPerSite[site.id] || 0,
          articles: site.total_articles || 0,
          avgPosition: gsc.avgPosition || avgFromKeywords,
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
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Volume</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Pos. Moy.</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Clics</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">QW</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Statut</th>
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
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-dark-muted">{site.alias}</span>
                            {site.focus && <span className="text-xs text-primary truncate max-w-[150px]">{site.focus}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={entityColors[site.entity] || 'secondary'}>{site.entity || '-'}</Badge>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="text-white">{site.keywords}</div>
                      {site.keywordsWithPosition > 0 && (
                        <div className="text-xs text-dark-muted">{site.keywordsWithPosition} avec pos.</div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center text-white">
                      {site.volume > 0 ? site.volume.toLocaleString() : '-'}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {site.avgPosition ? (
                        <Badge variant={site.avgPosition <= 10 ? 'success' : site.avgPosition <= 20 ? 'warning' : 'danger'}>
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
                        <span className="text-dark-muted">0</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {site.keywords === 0 ? (
                        <Badge variant="danger" size="sm">À analyser</Badge>
                      ) : site.avgPosition === null ? (
                        <Badge variant="warning" size="sm">Sync requis</Badge>
                      ) : site.avgPosition <= 10 ? (
                        <Badge variant="success" size="sm">Page 1</Badge>
                      ) : site.avgPosition <= 20 ? (
                        <Badge variant="warning" size="sm">Page 2</Badge>
                      ) : (
                        <Badge variant="danger" size="sm">Page 3+</Badge>
                      )}
                    </td>
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
