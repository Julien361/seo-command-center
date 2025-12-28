/**
 * SEO Phase Detector
 * Détecte automatiquement la phase actuelle de chaque site dans le processus SEO
 */

import { supabase } from './supabase';

// Définition des 6 phases SEO
export const SEO_PHASES = [
  {
    id: 1,
    name: 'Discovery',
    nameFr: 'Découverte',
    description: 'Recherche de keywords seed et analyse du marché',
    icon: '🔍',
    color: 'blue',
    minKeywords: 20
  },
  {
    id: 2,
    name: 'Analysis',
    nameFr: 'Analyse',
    description: 'Analyse des concurrents et recherche Perplexity',
    icon: '📊',
    color: 'purple',
    requiresCompetitors: true,
    requiresResearch: true
  },
  {
    id: 3,
    name: 'Structure',
    nameFr: 'Structure',
    description: 'Création des cocons sémantiques',
    icon: '🏗️',
    color: 'orange',
    minClusters: 1
  },
  {
    id: 4,
    name: 'Creation',
    nameFr: 'Création',
    description: 'Rédaction des articles',
    icon: '✍️',
    color: 'yellow',
    requiresArticles: true
  },
  {
    id: 5,
    name: 'Publication',
    nameFr: 'Publication',
    description: 'Publication sur WordPress',
    icon: '🚀',
    color: 'green',
    requiresPublished: true
  },
  {
    id: 6,
    name: 'Monitoring',
    nameFr: 'Suivi',
    description: 'Suivi des positions et optimisation',
    icon: '📈',
    color: 'teal',
    requiresTracking: true
  }
];

/**
 * Récupère les statistiques d'un site pour la détection de phase
 */
export async function getSiteStats(siteId) {
  const [
    keywordsResult,
    clustersResult,
    articlesResult,
    competitorsResult,
    quickWinsResult,
    historyResult
  ] = await Promise.all([
    // Nombre de keywords
    supabase
      .from('keywords')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteId),

    // Nombre de cocons sémantiques
    supabase
      .from('semantic_clusters')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteId),

    // Articles par statut
    supabase
      .from('articles')
      .select('status')
      .eq('site_id', siteId),

    // Concurrents analysés
    supabase
      .from('competitors')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteId),

    // Quick wins
    supabase
      .from('quick_wins')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteId),

    // Historique de positions (tracking actif)
    supabase
      .from('gsc_keyword_history')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteId)
  ]);

  // Compter les articles par statut
  const articles = articlesResult.data || [];
  const articleStats = {
    total: articles.length,
    draft: articles.filter(a => a.status === 'draft').length,
    writing: articles.filter(a => a.status === 'writing').length,
    review: articles.filter(a => a.status === 'review').length,
    published: articles.filter(a => a.status === 'published').length
  };

  return {
    keywords: keywordsResult.count || 0,
    clusters: clustersResult.count || 0,
    competitors: competitorsResult.count || 0,
    quickWins: quickWinsResult.count || 0,
    trackingHistory: historyResult.count || 0,
    articles: articleStats
  };
}

/**
 * Détecte la phase actuelle d'un site
 */
export async function detectCurrentPhase(siteId) {
  const stats = await getSiteStats(siteId);

  // Phase 1: Discovery - Pas assez de keywords
  if (stats.keywords < 20) {
    return {
      currentPhase: SEO_PHASES[0],
      phaseNumber: 1,
      progress: Math.round((stats.keywords / 20) * 100),
      stats,
      completedPhases: [],
      nextAction: 'Lancez une recherche de keywords avec WF1-DataForSEO',
      blockers: stats.keywords === 0
        ? ['Aucun keyword trouvé - démarrez par une recherche seed']
        : [`Seulement ${stats.keywords} keywords - objectif: 20 minimum`]
    };
  }

  // Phase 2: Analysis - Pas de concurrents analysés
  if (stats.competitors < 3) {
    return {
      currentPhase: SEO_PHASES[1],
      phaseNumber: 2,
      progress: Math.round((stats.competitors / 3) * 100),
      stats,
      completedPhases: [SEO_PHASES[0]],
      nextAction: 'Analysez vos concurrents avec WF2-Perplexity et WF3-Firecrawl',
      blockers: stats.competitors === 0
        ? ['Aucun concurrent analysé']
        : [`Seulement ${stats.competitors} concurrents - objectif: 3 minimum`]
    };
  }

  // Phase 3: Structure - Pas de cocons sémantiques
  if (stats.clusters === 0) {
    return {
      currentPhase: SEO_PHASES[2],
      phaseNumber: 3,
      progress: 0,
      stats,
      completedPhases: [SEO_PHASES[0], SEO_PHASES[1]],
      nextAction: 'Créez votre premier cocon sémantique avec WF6-Clustering',
      blockers: ['Aucun cocon sémantique créé']
    };
  }

  // Phase 4: Creation - Pas d'articles ou seulement des drafts
  if (stats.articles.total === 0 ||
      (stats.articles.published === 0 && stats.articles.review === 0)) {
    const inProgress = stats.articles.draft + stats.articles.writing;
    return {
      currentPhase: SEO_PHASES[3],
      phaseNumber: 4,
      progress: inProgress > 0 ? Math.round((inProgress / (stats.clusters * 5)) * 100) : 0,
      stats,
      completedPhases: [SEO_PHASES[0], SEO_PHASES[1], SEO_PHASES[2]],
      nextAction: stats.articles.total === 0
        ? 'Commencez la rédaction du premier article pilier'
        : `${inProgress} articles en cours de rédaction`,
      blockers: stats.articles.total === 0
        ? ['Aucun article créé']
        : []
    };
  }

  // Phase 5: Publication - Des articles mais pas publiés
  if (stats.articles.published < stats.articles.total * 0.5) {
    const pendingPublication = stats.articles.review + stats.articles.draft + stats.articles.writing;
    return {
      currentPhase: SEO_PHASES[4],
      phaseNumber: 5,
      progress: Math.round((stats.articles.published / stats.articles.total) * 100),
      stats,
      completedPhases: [SEO_PHASES[0], SEO_PHASES[1], SEO_PHASES[2], SEO_PHASES[3]],
      nextAction: `Publiez les ${pendingPublication} articles en attente`,
      blockers: pendingPublication > 5
        ? [`${pendingPublication} articles en attente de publication`]
        : []
    };
  }

  // Phase 6: Monitoring - Tout est publié, on surveille
  return {
    currentPhase: SEO_PHASES[5],
    phaseNumber: 6,
    progress: stats.trackingHistory > 0 ? 100 : 50,
    stats,
    completedPhases: [SEO_PHASES[0], SEO_PHASES[1], SEO_PHASES[2], SEO_PHASES[3], SEO_PHASES[4]],
    nextAction: stats.trackingHistory > 0
      ? 'Continuez le suivi et optimisez les quick wins'
      : 'Configurez le tracking GSC pour suivre vos positions',
    blockers: []
  };
}

/**
 * Calcule le score de progression global d'un site (0-100)
 */
export function calculateOverallProgress(phaseResult) {
  const { phaseNumber, progress } = phaseResult;
  // Chaque phase vaut ~16.7% (100/6)
  const completedPhasesProgress = (phaseNumber - 1) * (100 / 6);
  const currentPhaseProgress = (progress / 100) * (100 / 6);
  return Math.round(completedPhasesProgress + currentPhaseProgress);
}

/**
 * Génère un résumé textuel de la progression
 */
export function generateProgressSummary(phaseResult, siteName) {
  const { currentPhase, phaseNumber, stats, completedPhases } = phaseResult;
  const overallProgress = calculateOverallProgress(phaseResult);

  return {
    headline: `${siteName} est en phase ${phaseNumber}: ${currentPhase.nameFr}`,
    progress: `Progression globale: ${overallProgress}%`,
    summary: [
      `${stats.keywords} keywords découverts`,
      `${stats.competitors} concurrents analysés`,
      `${stats.clusters} cocons sémantiques`,
      `${stats.articles.total} articles (${stats.articles.published} publiés)`,
      stats.quickWins > 0 ? `${stats.quickWins} quick wins à exploiter` : null
    ].filter(Boolean),
    status: phaseNumber >= 5 ? 'advanced' : phaseNumber >= 3 ? 'intermediate' : 'beginner'
  };
}

export default {
  SEO_PHASES,
  getSiteStats,
  detectCurrentPhase,
  calculateOverallProgress,
  generateProgressSummary
};
