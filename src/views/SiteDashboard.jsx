import { useState, useEffect } from 'react';
import { Search, FileText, Target, BookOpen, Play, Eye, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import Card from '../components/common/Card';
import { supabase } from '../lib/supabase';
import { n8nApi, WORKFLOWS } from '../lib/n8n';

/**
 * Dashboard ultra-simple pour un site
 * 4 cartes : Keywords, Recherches, Concurrents, Articles
 * Chaque carte : affiche le count + bouton Voir (si data) ou Lancer (si vide)
 */
export default function SiteDashboard({ site, onNavigate }) {
  const [data, setData] = useState({
    keywords: { count: 0, loading: true },
    research: { count: 0, loading: true },
    competitors: { count: 0, loading: true },
    articles: { count: 0, loading: true }
  });
  const [launching, setLaunching] = useState(null);
  const [error, setError] = useState(null);

  // Charger les données du site
  useEffect(() => {
    if (!site?.id) return;
    loadData();
  }, [site?.id]);

  const loadData = async () => {
    if (!site?.id) return;

    try {
      // Charger tout en parallèle
      const [keywords, research, competitors, articles] = await Promise.all([
        supabase.from('keywords').select('id', { count: 'exact', head: true }).eq('site_id', site.id),
        supabase.from('market_research').select('id', { count: 'exact', head: true }).eq('site_id', site.id),
        supabase.from('competitors').select('id', { count: 'exact', head: true }).eq('site_id', site.id),
        supabase.from('articles').select('id', { count: 'exact', head: true }).eq('site_id', site.id)
      ]);

      setData({
        keywords: { count: keywords.count || 0, loading: false },
        research: { count: research.count || 0, loading: false },
        competitors: { count: competitors.count || 0, loading: false },
        articles: { count: articles.count || 0, loading: false }
      });
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Erreur de chargement');
    }
  };

  // Lancer un workflow
  const handleLaunch = async (type) => {
    if (!site) return;

    setLaunching(type);
    setError(null);

    try {
      let result;
      const webhookData = {
        site_alias: site.mcp_alias,
        site_url: site.url,
        site_id: site.id,
        niche: Array.isArray(site.seo_focus) ? site.seo_focus.join('; ') : site.seo_focus || '',
        source: 'seo-command-center'
      };

      switch (type) {
        case 'keywords':
          result = await n8nApi.triggerWebhook('seo-cascade-start', {
            ...webhookData,
            workflow_type: 'keywords_only'
          });
          break;
        case 'research':
          result = await n8nApi.triggerWebhook('claude-seo-research', webhookData);
          break;
        case 'competitors':
          result = await n8nApi.triggerWebhook('competitor-analysis', webhookData);
          break;
        case 'articles':
          // Pas de workflow pour articles, juste navigation
          onNavigate && onNavigate('articles', site);
          return;
      }

      if (result?.success !== false) {
        // Recharger les données après 5s
        setTimeout(loadData, 5000);
      }
    } catch (err) {
      console.error('Launch error:', err);
      setError(`Erreur: ${err.message}`);
    } finally {
      setLaunching(null);
    }
  };

  // Voir les résultats
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
      case 'articles':
        onNavigate('articles', site);
        break;
    }
  };

  // Configuration des cartes
  const cards = [
    {
      id: 'keywords',
      title: 'Keywords',
      icon: Search,
      color: 'primary',
      data: data.keywords,
      description: 'Mots-clés suivis'
    },
    {
      id: 'research',
      title: 'Recherches',
      icon: BookOpen,
      color: 'info',
      data: data.research,
      description: 'Analyses de marché'
    },
    {
      id: 'competitors',
      title: 'Concurrents',
      icon: Target,
      color: 'warning',
      data: data.competitors,
      description: 'Concurrents analysés'
    },
    {
      id: 'articles',
      title: 'Articles',
      icon: FileText,
      color: 'success',
      data: data.articles,
      description: 'Contenus créés'
    }
  ];

  if (!site) {
    return (
      <div className="flex items-center justify-center h-64 text-dark-muted">
        Sélectionnez un site dans le menu
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header du site */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{site.mcp_alias || site.domain}</h1>
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-dark-muted hover:text-primary flex items-center gap-1"
          >
            {site.url}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        {site.seo_focus && (
          <div className="text-right">
            <span className="text-xs text-dark-muted">Focus SEO</span>
            <p className="text-sm text-white max-w-xs truncate">
              {Array.isArray(site.seo_focus) ? site.seo_focus[0] : site.seo_focus}
            </p>
          </div>
        )}
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-danger" />
          <span className="text-danger">{error}</span>
        </div>
      )}

      {/* 4 Cartes principales */}
      <div className="grid grid-cols-2 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          const hasData = card.data.count > 0;
          const isLoading = card.data.loading;
          const isLaunching = launching === card.id;

          return (
            <Card
              key={card.id}
              className={`p-6 transition-all hover:border-${card.color}/50 ${
                hasData ? 'cursor-pointer' : ''
              }`}
              onClick={() => hasData && handleView(card.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-${card.color}/10`}>
                  <Icon className={`w-6 h-6 text-${card.color}`} />
                </div>
                {isLoading ? (
                  <Loader2 className="w-5 h-5 text-dark-muted animate-spin" />
                ) : (
                  <span className="text-3xl font-bold text-white">{card.data.count}</span>
                )}
              </div>

              <h3 className="text-lg font-semibold text-white mb-1">{card.title}</h3>
              <p className="text-sm text-dark-muted mb-4">{card.description}</p>

              {/* Bouton d'action */}
              {hasData ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleView(card.id);
                  }}
                  className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 bg-${card.color}/10 text-${card.color} hover:bg-${card.color}/20`}
                >
                  <Eye className="w-4 h-4" />
                  Voir les résultats
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLaunch(card.id);
                  }}
                  disabled={isLaunching}
                  className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    isLaunching
                      ? 'bg-dark-border text-dark-muted cursor-wait'
                      : `bg-${card.color} text-white hover:opacity-90`
                  }`}
                >
                  {isLaunching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Lancement...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Lancer l'analyse
                    </>
                  )}
                </button>
              )}
            </Card>
          );
        })}
      </div>

      {/* Message d'aide */}
      <div className="text-center text-sm text-dark-muted py-4">
        Cliquez sur une carte pour voir les données ou lancer une analyse
      </div>
    </div>
  );
}
