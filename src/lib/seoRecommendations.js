/**
 * SEO Recommendations Engine
 * Génère des recommandations contextuelles basées sur la phase actuelle du site
 */

import { WORKFLOWS } from './n8n';

// Types de recommandations
export const RECOMMENDATION_TYPES = {
  IMMEDIATE: 'immediate',     // À faire maintenant
  NEXT_STEP: 'next_step',     // Prochaine étape logique
  OPTIMIZATION: 'optimization', // Optimisation possible
  OPPORTUNITY: 'opportunity',  // Opportunité détectée
  WARNING: 'warning'          // Point d'attention
};

// Priorités
export const PRIORITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

/**
 * Génère les recommandations pour la phase Discovery
 */
function getDiscoveryRecommendations(stats, site) {
  const recommendations = [];

  if (stats.keywords === 0) {
    recommendations.push({
      type: RECOMMENDATION_TYPES.IMMEDIATE,
      priority: PRIORITY.HIGH,
      title: 'Lancez votre première recherche de keywords',
      description: `Démarrez avec un keyword seed lié à "${site.seo_focus || site.domain}"`,
      action: 'Lancer WF0-Cascade',
      workflow: WORKFLOWS.WF0_CASCADE,
      estimatedCost: 0.15,
      impact: 'Découvrir 50-200 keywords pertinents'
    });
  } else if (stats.keywords < 20) {
    recommendations.push({
      type: RECOMMENDATION_TYPES.NEXT_STEP,
      priority: PRIORITY.HIGH,
      title: `Enrichir la base de keywords (${stats.keywords}/20)`,
      description: 'Ajoutez des keywords seed complémentaires pour diversifier',
      action: 'Lancer WF1-DataForSEO',
      workflow: WORKFLOWS.WF1_DATAFORSEO,
      estimatedCost: 0.05,
      impact: `+${20 - stats.keywords} keywords minimum`
    });

    recommendations.push({
      type: RECOMMENDATION_TYPES.OPPORTUNITY,
      priority: PRIORITY.MEDIUM,
      title: 'Extraire les "People Also Ask"',
      description: 'Les PAA révèlent les vraies questions des utilisateurs',
      action: 'Lancer PAA Extraction',
      workflow: WORKFLOWS.PAA_EXTRACTION,
      estimatedCost: 0.02,
      impact: '+10-30 questions à cibler'
    });
  }

  return recommendations;
}

/**
 * Génère les recommandations pour la phase Analysis
 */
function getAnalysisRecommendations(stats, site) {
  const recommendations = [];

  if (stats.competitors === 0) {
    recommendations.push({
      type: RECOMMENDATION_TYPES.IMMEDIATE,
      priority: PRIORITY.HIGH,
      title: 'Analysez vos concurrents',
      description: 'Identifiez qui se positionne sur vos keywords cibles',
      action: 'Lancer WF2-Perplexity + WF3-Firecrawl',
      workflow: WORKFLOWS.WF2_PERPLEXITY,
      estimatedCost: 0.12,
      impact: 'Identifier 5-10 concurrents + leurs stratégies'
    });
  } else if (stats.competitors < 3) {
    recommendations.push({
      type: RECOMMENDATION_TYPES.NEXT_STEP,
      priority: PRIORITY.MEDIUM,
      title: `Compléter l'analyse concurrentielle (${stats.competitors}/3)`,
      description: 'Analysez plus de concurrents pour une vue complète',
      action: 'Lancer WF3-Firecrawl',
      workflow: WORKFLOWS.WF3_FIRECRAWL,
      estimatedCost: 0.10,
      impact: 'Scraper le contenu des concurrents restants'
    });
  }

  // Toujours recommander la synthèse si on a des données
  if (stats.keywords >= 20 && stats.competitors >= 1) {
    recommendations.push({
      type: RECOMMENDATION_TYPES.OPTIMIZATION,
      priority: PRIORITY.MEDIUM,
      title: 'Générer une synthèse stratégique',
      description: 'Consolidez toutes les données en insights actionnables',
      action: 'Lancer WF4-Synthesis',
      workflow: WORKFLOWS.WF4_SYNTHESIS,
      estimatedCost: 0.05,
      impact: 'Rapport stratégique complet'
    });
  }

  return recommendations;
}

/**
 * Génère les recommandations pour la phase Structure
 */
function getStructureRecommendations(stats, site) {
  const recommendations = [];

  if (stats.clusters === 0) {
    recommendations.push({
      type: RECOMMENDATION_TYPES.IMMEDIATE,
      priority: PRIORITY.HIGH,
      title: 'Créez votre premier cocon sémantique',
      description: 'Structurez vos keywords en cocons pour un maillage optimal',
      action: 'Lancer WF6-Clustering',
      workflow: WORKFLOWS.WF6_CLUSTERING,
      estimatedCost: 0,
      impact: 'Architecture SEO solide avec page pilier + satellites'
    });

    recommendations.push({
      type: RECOMMENDATION_TYPES.OPPORTUNITY,
      priority: PRIORITY.MEDIUM,
      title: 'Définir l\'architecture du site',
      description: 'Planifiez la structure des URLs et le maillage interne',
      action: 'Lancer WF-SETUP-3',
      workflow: WORKFLOWS.COCON_BUILDER,
      estimatedCost: 0.10,
      impact: 'Structure technique optimisée'
    });
  } else {
    // On a des cocons, suggérer d'en créer plus ou de les compléter
    recommendations.push({
      type: RECOMMENDATION_TYPES.NEXT_STEP,
      priority: PRIORITY.MEDIUM,
      title: `Développer les cocons existants (${stats.clusters})`,
      description: 'Chaque cocon devrait avoir 4-6 articles satellites',
      action: 'Voir les cocons',
      link: '/clusters',
      impact: 'Renforcer l\'autorité thématique'
    });
  }

  return recommendations;
}

/**
 * Génère les recommandations pour la phase Creation
 */
function getCreationRecommendations(stats, site) {
  const recommendations = [];

  if (stats.articles.total === 0) {
    recommendations.push({
      type: RECOMMENDATION_TYPES.IMMEDIATE,
      priority: PRIORITY.HIGH,
      title: 'Rédigez votre premier article pilier',
      description: 'Commencez par l\'article principal de votre cocon (3000+ mots)',
      action: 'Générer un brief',
      workflow: WORKFLOWS.CONTENT_BRIEF,
      estimatedCost: 0.03,
      impact: 'Article optimisé Position 0'
    });
  } else {
    const inProgress = stats.articles.draft + stats.articles.writing;

    if (inProgress > 0) {
      recommendations.push({
        type: RECOMMENDATION_TYPES.NEXT_STEP,
        priority: PRIORITY.HIGH,
        title: `${inProgress} article(s) en cours`,
        description: 'Finalisez les articles en cours avant d\'en créer de nouveaux',
        action: 'Voir les articles',
        link: '/articles',
        impact: 'Éviter la dispersion'
      });
    }

    if (stats.articles.review > 0) {
      recommendations.push({
        type: RECOMMENDATION_TYPES.IMMEDIATE,
        priority: PRIORITY.HIGH,
        title: `${stats.articles.review} article(s) à relire`,
        description: 'Des articles attendent votre validation',
        action: 'Relire et valider',
        link: '/articles?status=review',
        impact: 'Débloquer la publication'
      });
    }

    // Pipeline automatique
    recommendations.push({
      type: RECOMMENDATION_TYPES.OPTIMIZATION,
      priority: PRIORITY.MEDIUM,
      title: 'Automatiser la création',
      description: 'Utilisez le pipeline pour générer brief + article automatiquement',
      action: 'Lancer Article Pipeline',
      workflow: WORKFLOWS.ARTICLE_PIPELINE,
      estimatedCost: 0.15,
      impact: 'Article complet en 5 minutes'
    });
  }

  return recommendations;
}

/**
 * Génère les recommandations pour la phase Publication
 */
function getPublicationRecommendations(stats, site) {
  const recommendations = [];
  const pendingPublication = stats.articles.review + stats.articles.draft;

  if (pendingPublication > 0) {
    recommendations.push({
      type: RECOMMENDATION_TYPES.IMMEDIATE,
      priority: PRIORITY.HIGH,
      title: `Publiez ${pendingPublication} article(s)`,
      description: 'Des articles sont prêts à être publiés sur WordPress',
      action: 'Publier sur WordPress',
      workflow: WORKFLOWS.WP_PUBLISHER,
      estimatedCost: 0,
      impact: 'Contenu visible par Google'
    });
  }

  if (stats.articles.published > 0 && stats.articles.published < 5) {
    recommendations.push({
      type: RECOMMENDATION_TYPES.NEXT_STEP,
      priority: PRIORITY.MEDIUM,
      title: 'Atteindre la masse critique',
      description: 'Publiez au moins 5 articles pour que Google prenne le site au sérieux',
      action: 'Continuer la création',
      impact: `+${5 - stats.articles.published} articles nécessaires`
    });
  }

  // Planification
  recommendations.push({
    type: RECOMMENDATION_TYPES.OPTIMIZATION,
    priority: PRIORITY.LOW,
    title: 'Planifier les publications',
    description: 'Espacez les publications pour un rythme régulier',
    action: 'Voir le calendrier',
    link: '/calendar',
    impact: 'Régularité appréciée par Google'
  });

  return recommendations;
}

/**
 * Génère les recommandations pour la phase Monitoring
 */
function getMonitoringRecommendations(stats, site) {
  const recommendations = [];

  // Quick wins prioritaires
  if (stats.quickWins > 0) {
    recommendations.push({
      type: RECOMMENDATION_TYPES.OPPORTUNITY,
      priority: PRIORITY.HIGH,
      title: `${stats.quickWins} Quick Win(s) détectés !`,
      description: 'Ces pages sont proches de la page 1 - effort minimal pour résultat maximal',
      action: 'Voir les Quick Wins',
      link: '/quick-wins',
      impact: 'Passage en page 1 avec quelques optimisations'
    });
  }

  // Suivi GSC
  if (stats.trackingHistory === 0) {
    recommendations.push({
      type: RECOMMENDATION_TYPES.WARNING,
      priority: PRIORITY.HIGH,
      title: 'Configurer le tracking GSC',
      description: 'Connectez Google Search Console pour suivre vos positions',
      action: 'Lancer GSC Sync',
      workflow: WORKFLOWS.GSC_SYNC,
      estimatedCost: 0,
      impact: 'Visibilité sur vos performances'
    });
  } else {
    recommendations.push({
      type: RECOMMENDATION_TYPES.OPTIMIZATION,
      priority: PRIORITY.LOW,
      title: 'Synchroniser les positions',
      description: 'Mettez à jour vos données GSC',
      action: 'Lancer GSC Sync',
      workflow: WORKFLOWS.GSC_SYNC,
      estimatedCost: 0,
      impact: 'Données fraîches'
    });
  }

  // Position monitor
  recommendations.push({
    type: RECOMMENDATION_TYPES.NEXT_STEP,
    priority: PRIORITY.MEDIUM,
    title: 'Surveiller les positions clés',
    description: 'Configurez des alertes sur vos keywords prioritaires',
    action: 'Lancer Position Monitor',
    workflow: WORKFLOWS.POSITION_MONITOR,
    estimatedCost: 0,
    impact: 'Alertes en cas de changement'
  });

  // Backlinks
  recommendations.push({
    type: RECOMMENDATION_TYPES.OPTIMIZATION,
    priority: PRIORITY.LOW,
    title: 'Analyser les backlinks',
    description: 'Surveillez votre profil de liens',
    action: 'Analyser backlinks',
    link: '/backlinks',
    impact: 'Identifier opportunités de netlinking'
  });

  return recommendations;
}

/**
 * Génère toutes les recommandations pour un site
 */
export function generateRecommendations(phaseResult, site) {
  const { phaseNumber, stats } = phaseResult;
  let recommendations = [];

  // Recommandations de la phase actuelle
  switch (phaseNumber) {
    case 1:
      recommendations = getDiscoveryRecommendations(stats, site);
      break;
    case 2:
      recommendations = getAnalysisRecommendations(stats, site);
      break;
    case 3:
      recommendations = getStructureRecommendations(stats, site);
      break;
    case 4:
      recommendations = getCreationRecommendations(stats, site);
      break;
    case 5:
      recommendations = getPublicationRecommendations(stats, site);
      break;
    case 6:
      recommendations = getMonitoringRecommendations(stats, site);
      break;
  }

  // Ajouter des recommandations cross-phase si pertinent
  if (phaseNumber >= 3 && stats.quickWins > 0) {
    recommendations.push({
      type: RECOMMENDATION_TYPES.OPPORTUNITY,
      priority: PRIORITY.HIGH,
      title: `🎯 ${stats.quickWins} Quick Wins disponibles`,
      description: 'Opportunités de passage rapide en page 1',
      action: 'Exploiter les Quick Wins',
      link: '/quick-wins',
      impact: 'ROI rapide'
    });
  }

  // Trier par priorité
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations;
}

/**
 * Génère un plan d'action pour atteindre la Position 0
 */
export function generatePosition0Roadmap(phaseResult, site) {
  const { phaseNumber, stats } = phaseResult;

  const roadmap = {
    currentStatus: `Phase ${phaseNumber} - ${phaseResult.currentPhase.nameFr}`,
    targetKeywords: [],
    steps: [],
    estimatedTimeToRank: null,
    requiredInvestment: 0
  };

  // Étapes restantes
  if (phaseNumber <= 1) {
    roadmap.steps.push({
      step: 1,
      name: 'Recherche de keywords',
      status: phaseNumber === 1 ? 'in_progress' : 'pending',
      actions: ['Lancer WF0-Cascade avec keyword seed'],
      cost: 0.15
    });
  }

  if (phaseNumber <= 2) {
    roadmap.steps.push({
      step: 2,
      name: 'Analyse concurrentielle',
      status: phaseNumber === 2 ? 'in_progress' : phaseNumber > 2 ? 'completed' : 'pending',
      actions: ['Analyser top 5 concurrents', 'Identifier leurs featured snippets'],
      cost: 0.12
    });
  }

  if (phaseNumber <= 3) {
    roadmap.steps.push({
      step: 3,
      name: 'Architecture des cocons',
      status: phaseNumber === 3 ? 'in_progress' : phaseNumber > 3 ? 'completed' : 'pending',
      actions: ['Créer 1-2 cocons sémantiques', 'Définir maillage interne'],
      cost: 0.10
    });
  }

  if (phaseNumber <= 4) {
    roadmap.steps.push({
      step: 4,
      name: 'Création de contenu',
      status: phaseNumber === 4 ? 'in_progress' : phaseNumber > 4 ? 'completed' : 'pending',
      actions: ['Rédiger articles piliers (3000+ mots)', 'Rédiger satellites (1500 mots)', 'Optimiser pour Position 0'],
      cost: 0.50
    });
  }

  if (phaseNumber <= 5) {
    roadmap.steps.push({
      step: 5,
      name: 'Publication',
      status: phaseNumber === 5 ? 'in_progress' : phaseNumber > 5 ? 'completed' : 'pending',
      actions: ['Publier sur WordPress', 'Soumettre sitemap à Google'],
      cost: 0
    });
  }

  roadmap.steps.push({
    step: 6,
    name: 'Monitoring & Optimisation',
    status: phaseNumber === 6 ? 'in_progress' : 'pending',
    actions: ['Suivre positions GSC', 'Optimiser Quick Wins', 'Ajuster contenu selon SERP'],
    cost: 0
  });

  // Calculer l'investissement restant
  roadmap.requiredInvestment = roadmap.steps
    .filter(s => s.status !== 'completed')
    .reduce((sum, s) => sum + s.cost, 0);

  // Estimation du temps
  const remainingSteps = roadmap.steps.filter(s => s.status !== 'completed').length;
  if (remainingSteps <= 2) {
    roadmap.estimatedTimeToRank = '1-2 mois';
  } else if (remainingSteps <= 4) {
    roadmap.estimatedTimeToRank = '2-4 mois';
  } else {
    roadmap.estimatedTimeToRank = '4-6 mois';
  }

  return roadmap;
}

export default {
  RECOMMENDATION_TYPES,
  PRIORITY,
  generateRecommendations,
  generatePosition0Roadmap
};
