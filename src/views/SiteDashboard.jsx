import { useState, useEffect } from 'react';
import {
  Search, FileText, Target, BookOpen, Play, Eye, Loader2,
  ExternalLink, AlertCircle, CheckCircle, RefreshCw,
  Zap, GitBranch, TrendingUp, Send
} from 'lucide-react';
import Card from '../components/common/Card';
import { supabase } from '../lib/supabase';
import { n8nApi } from '../lib/n8n';

/**
 * Dashboard site avec 8 cartes pour Position 0
 */
export default function SiteDashboard({ site, onNavigate }) {
  const [data, setData] = useState({
    keywords: { count: 0, loading: true },
    research: { count: 0, loading: true },
    competitors: { count: 0, loading: true },
    quickwins: { count: 0, loading: true },
    cocons: { count: 0, loading: true },
    articles: { count: 0, loading: true },
    positions: { count: 0, loading: true },
    published: { count: 0, loading: true }
  });
  const [launching, setLaunching] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!site?.id) return;
    loadData();
  }, [site?.id]);

  const loadData = async () => {
    if (!site?.id) return;

    try {
      const [keywords, research, competitors, quickwins, cocons, articles, positions, published] = await Promise.all([
        supabase.from('keywords').select('id', { count: 'exact', head: true }).eq('site_id', site.id),
        supabase.from('market_research').select('id', { count: 'exact', head: true }).eq('site_id', site.id),
        supabase.from('competitors').select('id', { count: 'exact', head: true }).eq('site_id', site.id),
        supabase.from('keywords').select('id', { count: 'exact', head: true }).eq('site_id', site.id).eq('is_quick_win', true),
        supabase.from('semantic_clusters').select('id', { count: 'exact', head: true }).eq('site_id', site.id),
        supabase.from('articles').select('id', { count: 'exact', head: true }).eq('site_id', site.id),
        supabase.from('keyword_history').select('id', { count: 'exact', head: true }).eq('site_id', site.id),
        supabase.from('articles').select('id', { count: 'exact', head: true }).eq('site_id', site.id).not('wp_post_id', 'is', null)
      ]);

      setData({
        keywords: { count: keywords.count || 0, loading: false },
        research: { count: research.count || 0, loading: false },
        competitors: { count: competitors.count || 0, loading: false },
        quickwins: { count: quickwins.count || 0, loading: false },
        cocons: { count: cocons.count || 0, loading: false },
        articles: { count: articles.count || 0, loading: false },
        positions: { count: positions.count || 0, loading: false },
        published: { count: published.count || 0, loading: false }
      });
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Erreur de chargement');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    await loadData();
    setRefreshing(false);
  };

  const handleLaunch = async (type) => {
    if (!site) return;

    setLaunching(type);
    setError(null);
    setSuccess(null);

    try {
      const niche = Array.isArray(site.seo_focus) ? site.seo_focus[0] : site.seo_focus || '';

      // DEBUG: Log site data
      console.log('[SiteDashboard] Site object:', JSON.stringify(site, null, 2));
      console.log('[SiteDashboard] site.url:', site.url);

      // Validation: URL is required for workflows
      if (!site.url) {
        setError('URL du site manquante. Editez le site pour ajouter son URL.');
        setLaunching(null);
        return;
      }

      const webhookData = {
        site_alias: site.mcp_alias,
        site_url: site.url,
        url: site.url, // Add both for compatibility
        site_id: site.id,
        niche: niche,
        site_objective: niche, // Required by WF0
        objective: niche, // Alias for compatibility
        source: 'seo-command-center'
      };

      let result;
      switch (type) {
        case 'keywords':
          // DataForSEO Keywords + Supabase (table: keywords)
          result = await n8nApi.triggerWebhook('dataforseo-keywords', {
            main_keyword: niche,
            keyword: niche,
            niche: niche,
            site_alias: site.mcp_alias,
            site_id: site.id
          });
          break;
        case 'research':
          // Claude Web Search + Supabase (table: market_research)
          result = await n8nApi.triggerWebhook('claude-seo-research', {
            keyword_principal: niche,
            niche: niche,
            site_alias: site.mcp_alias,
            site_id: site.id
          });
          break;
        case 'competitors':
          // DataForSEO Competitor + Supabase (table: competitors)
          result = await n8nApi.triggerWebhook('dataforseo-competitor', {
            project_name: site.mcp_alias,
            site_id: site.id,
            competitor_urls: '',
            analyze_with_ai: true
          });
          break;
        case 'quickwins':
          // Quick Wins Calculator + Supabase (update: keywords.is_quick_win)
          result = await n8nApi.triggerWebhook('quick-wins-calculate', {
            site_id: site.id,
            site_alias: site.mcp_alias,
            min_volume: 100,
            max_difficulty: 40,
            min_position: 11,
            max_position: 30
          });
          break;
        case 'cocons':
          // Semantic Clustering + Supabase (table: semantic_clusters)
          result = await n8nApi.triggerWebhook('semantic-clustering', {
            site_id: site.id,
            site_alias: site.mcp_alias,
            main_keyword: niche,
            niche: niche
          });
          break;
        case 'positions':
          result = await n8nApi.triggerWebhook('position-monitor', webhookData);
          break;
        case 'published':
        case 'articles':
          onNavigate && onNavigate('articles', site);
          setLaunching(null);
          return;
      }

      if (result?.success !== false) {
        setSuccess('Analyse lancee ! Rafraichis dans 1-2 min.');
        setTimeout(() => {
          loadData();
          setSuccess(null);
        }, 10000);
      } else {
        setError(result?.error || 'Erreur lors du lancement');
      }
    } catch (err) {
      console.error('Launch error:', err);
      setError(`Erreur: ${err.message}`);
    } finally {
      setLaunching(null);
    }
  };

  const handleView = (type) => {
    if (!onNavigate) return;
    switch (type) {
      case 'keywords':
        onNavigate('keywords', site);
        break;
      case 'research':
      case 'competitors':
        onNavigate('concurrents', site);
        break;
      case 'quickwins':
        onNavigate('quickwins', site);
        break;
      case 'cocons':
        onNavigate('cocons', site);
        break;
      case 'articles':
      case 'published':
        onNavigate('articles', site);
        break;
      case 'positions':
        onNavigate('positions', site);
        break;
    }
  };

  // 8 cartes en 2 rangées
  const cards = [
    // Rangée 1: Analyse
    { id: 'keywords', title: 'Keywords', icon: Search, color: 'primary', data: data.keywords, description: 'Mots-cles cibles' },
    { id: 'research', title: 'Recherches', icon: BookOpen, color: 'info', data: data.research, description: 'Analyses marche' },
    { id: 'competitors', title: 'Concurrents', icon: Target, color: 'warning', data: data.competitors, description: 'Sites analyses' },
    { id: 'quickwins', title: 'Quick Wins', icon: Zap, color: 'yellow', data: data.quickwins, description: 'Opportunites P11-20' },
    // Rangée 2: Production
    { id: 'cocons', title: 'Cocons', icon: GitBranch, color: 'purple', data: data.cocons, description: 'Clusters semantiques' },
    { id: 'articles', title: 'Articles', icon: FileText, color: 'success', data: data.articles, description: 'Contenus crees' },
    { id: 'positions', title: 'Positions', icon: TrendingUp, color: 'cyan', data: data.positions, description: 'Suivi rankings' },
    { id: 'published', title: 'Publies', icon: Send, color: 'green', data: data.published, description: 'Articles en ligne' }
  ];

  if (!site) {
    return (
      <div className="flex items-center justify-center h-64 text-dark-muted">
        Selectionnez un site dans le menu
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{site.mcp_alias || site.domain}</h1>
          <a href={site.url} target="_blank" rel="noopener noreferrer"
            className="text-sm text-dark-muted hover:text-primary flex items-center gap-1">
            {site.url}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <div className="flex items-center gap-4">
          {site.seo_focus && (
            <div className="text-right hidden md:block">
              <span className="text-xs text-dark-muted">Focus SEO</span>
              <p className="text-sm text-white max-w-xs truncate">
                {Array.isArray(site.seo_focus) ? site.seo_focus[0] : site.seo_focus}
              </p>
            </div>
          )}
          <button onClick={handleRefresh} disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-border hover:bg-dark-muted/20 text-white transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Rafraichir
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-lg p-3 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-danger flex-shrink-0" />
          <span className="text-danger text-sm">{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-success/10 border border-success/30 rounded-lg p-3 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
          <span className="text-success text-sm">{success}</span>
        </div>
      )}

      {/* 8 Cartes - grille 4x2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          const hasData = card.data.count > 0;
          const isLoading = card.data.loading;
          const isLaunching = launching === card.id;

          return (
            <Card
              key={card.id}
              className={`p-4 transition-all hover:border-${card.color}/50 ${hasData ? 'cursor-pointer' : ''}`}
              onClick={() => hasData && handleView(card.id)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg bg-${card.color}/10`}>
                  <Icon className={`w-5 h-5 text-${card.color}`} />
                </div>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 text-dark-muted animate-spin" />
                ) : (
                  <span className="text-2xl font-bold text-white">{card.data.count}</span>
                )}
              </div>

              <h3 className="text-sm font-semibold text-white mb-1">{card.title}</h3>
              <p className="text-xs text-dark-muted mb-3">{card.description}</p>

              {hasData ? (
                <button
                  onClick={(e) => { e.stopPropagation(); handleView(card.id); }}
                  className={`w-full py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 bg-${card.color}/10 text-${card.color} hover:bg-${card.color}/20`}
                >
                  <Eye className="w-3 h-3" />
                  Voir
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); handleLaunch(card.id); }}
                  disabled={isLaunching}
                  className={`w-full py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    isLaunching
                      ? 'bg-dark-border text-dark-muted cursor-wait'
                      : `bg-${card.color} text-white hover:opacity-90`
                  }`}
                >
                  {isLaunching ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> ...</>
                  ) : (
                    <><Play className="w-3 h-3" /> Lancer</>
                  )}
                </button>
              )}
            </Card>
          );
        })}
      </div>

      {/* Légende */}
      <div className="text-center text-xs text-dark-muted pt-2">
        Ligne 1: Analyse | Ligne 2: Production → Cliquez pour voir ou lancer
      </div>
    </div>
  );
}
