/**
 * SEO Suggestions Engine
 * Analyse les données et suggère des améliorations + nouveaux workflows
 */

import { WORKFLOWS } from './n8n';

// Types de suggestions
export const SUGGESTION_TYPES = {
  NEW_WORKFLOW: 'new_workflow',       // Idée de nouveau workflow
  OPTIMIZATION: 'optimization',       // Optimisation existante
  AUTOMATION: 'automation',           // Automatisation possible
  DATA_INSIGHT: 'data_insight',       // Insight basé sur les données
  BEST_PRACTICE: 'best_practice'      // Bonne pratique SEO
};

// Catalogue des nouveaux workflows suggérés
export const SUGGESTED_WORKFLOWS = {
  FEATURED_SNIPPET_SCRAPER: {
    id: 'featured-snippet-scraper',
    name: 'Featured Snippet Scraper',
    description: 'Analyser automatiquement les featured snippets des concurrents pour les cibler',
    category: 'dataCollection',
    estimatedDifficulty: 'medium',
    requiredAPIs: ['DataForSEO', 'Firecrawl'],
    nodes: [
      'Webhook trigger',
      'DataForSEO SERP check',
      'Filter featured snippets',
      'Firecrawl scrape content',
      'Claude analyze structure',
      'Supabase save'
    ],
    impact: 'Identifier exactement comment structurer le contenu pour capturer les FS',
    roi: 'high'
  },
  DUPLICATE_CHECKER: {
    id: 'duplicate-checker',
    name: 'Cross-Site Duplicate Checker',
    description: 'Détecter le contenu dupliqué entre vos 15 sites WordPress',
    category: 'monitoring',
    estimatedDifficulty: 'easy',
    requiredAPIs: ['WordPress API'],
    nodes: [
      'Schedule trigger (weekly)',
      'Loop through sites',
      'Fetch recent posts',
      'Compare content similarity',
      'Alert if >30% similar',
      'Supabase log'
    ],
    impact: 'Éviter les pénalités Google pour duplicate content',
    roi: 'high'
  },
  POSITION_ALERT: {
    id: 'position-alert',
    name: 'Position Drop Alert',
    description: 'Alerter en temps réel quand une position chute de plus de 3 places',
    category: 'monitoring',
    estimatedDifficulty: 'easy',
    requiredAPIs: ['GSC API', 'Slack/Email'],
    nodes: [
      'Schedule trigger (daily)',
      'GSC fetch positions',
      'Compare with history',
      'Filter drops > 3',
      'Slack notification',
      'Supabase update'
    ],
    impact: 'Réagir rapidement aux changements SERP',
    roi: 'medium'
  },
  BACKLINK_MONITOR: {
    id: 'backlink-monitor',
    name: 'Backlink Monitor',
    description: 'Surveiller les nouveaux et perdus backlinks automatiquement',
    category: 'monitoring',
    estimatedDifficulty: 'medium',
    requiredAPIs: ['DataForSEO Backlinks'],
    nodes: [
      'Schedule trigger (weekly)',
      'DataForSEO backlink check',
      'Compare with previous',
      'Categorize new/lost',
      'Quality scoring',
      'Alert on important changes'
    ],
    impact: 'Protéger le profil de liens et identifier opportunités',
    roi: 'medium'
  },
  CONTENT_DECAY: {
    id: 'content-decay',
    name: 'Content Decay Detector',
    description: 'Détecter les articles qui perdent du trafic et nécessitent une mise à jour',
    category: 'monitoring',
    estimatedDifficulty: 'medium',
    requiredAPIs: ['GA4 API', 'GSC API'],
    nodes: [
      'Schedule trigger (monthly)',
      'GA4 fetch traffic trends',
      'GSC fetch position trends',
      'Calculate decay score',
      'Prioritize updates',
      'Create refresh tasks'
    ],
    impact: 'Maintenir le trafic existant, éviter l\'obsolescence',
    roi: 'high'
  },
  SERP_CHANGES: {
    id: 'serp-changes',
    name: 'SERP Changes Tracker',
    description: 'Tracker les changements SERP (nouveaux concurrents, features)',
    category: 'monitoring',
    estimatedDifficulty: 'medium',
    requiredAPIs: ['DataForSEO SERP'],
    nodes: [
      'Schedule trigger (weekly)',
      'DataForSEO SERP snapshot',
      'Compare with previous',
      'Detect new players',
      'Detect new features',
      'Alert significant changes'
    ],
    impact: 'Anticiper les menaces et opportunités SERP',
    roi: 'medium'
  },
  INTERNAL_LINK_SUGGESTER: {
    id: 'internal-link-suggester',
    name: 'Smart Internal Linking',
    description: 'Suggérer automatiquement des liens internes basés sur le contenu',
    category: 'processing',
    estimatedDifficulty: 'hard',
    requiredAPIs: ['Claude', 'WordPress API'],
    nodes: [
      'Webhook trigger',
      'Fetch all articles',
      'Claude analyze semantic',
      'Find linking opportunities',
      'Score by relevance',
      'Generate suggestions'
    ],
    impact: 'Améliorer le maillage interne sans effort manuel',
    roi: 'high'
  },
  AUTO_IMAGE_ALT: {
    id: 'auto-image-alt',
    name: 'Auto Image Alt Generator',
    description: 'Générer automatiquement les textes alt manquants avec Claude Vision',
    category: 'content',
    estimatedDifficulty: 'medium',
    requiredAPIs: ['Claude Vision', 'WordPress API'],
    nodes: [
      'Schedule or webhook',
      'Scan images without alt',
      'Claude Vision analyze',
      'Generate contextual alt',
      'Update WordPress',
      'Log changes'
    ],
    impact: 'Améliorer l\'accessibilité et le SEO images',
    roi: 'medium'
  }
};

/**
 * Analyse les données du site et génère des suggestions
 */
export function generateSuggestions(siteData, workflowHealth = null) {
  const suggestions = [];

  // === Suggestions basées sur les données ===

  // Quick wins non exploités
  if (siteData.quickWins && siteData.quickWins > 5) {
    suggestions.push({
      type: SUGGESTION_TYPES.DATA_INSIGHT,
      priority: 'high',
      title: `${siteData.quickWins} Quick Wins non exploités`,
      description: 'Ces pages sont en position 11-20 avec un effort minimal pour passer en page 1',
      action: 'Priorisez l\'optimisation de ces pages',
      metric: `ROI potentiel: +${siteData.quickWins * 50}% trafic`,
      icon: '🎯'
    });
  }

  // Pas de cocons mais beaucoup de keywords
  if (siteData.clusters === 0 && siteData.keywords > 20) {
    suggestions.push({
      type: SUGGESTION_TYPES.OPTIMIZATION,
      priority: 'high',
      title: 'Structure sémantique manquante',
      description: `${siteData.keywords} keywords sans organisation en cocons sémantiques`,
      action: 'Créez des cocons pour améliorer l\'autorité thématique',
      icon: '🏗️'
    });
  }

  // Beaucoup d'articles mais peu publiés
  if (siteData.articles) {
    const { total, published } = siteData.articles;
    if (total > 5 && published < total * 0.5) {
      suggestions.push({
        type: SUGGESTION_TYPES.DATA_INSIGHT,
        priority: 'high',
        title: `${total - published} articles non publiés`,
        description: 'Du contenu créé mais pas visible par Google',
        action: 'Publiez les articles en attente pour indexation',
        icon: '📝'
      });
    }
  }

  // === Suggestions de nouveaux workflows ===

  // Toujours suggérer les workflows manquants
  suggestions.push({
    type: SUGGESTION_TYPES.NEW_WORKFLOW,
    priority: 'medium',
    title: 'Featured Snippet Scraper',
    description: SUGGESTED_WORKFLOWS.FEATURED_SNIPPET_SCRAPER.description,
    newWorkflow: SUGGESTED_WORKFLOWS.FEATURED_SNIPPET_SCRAPER,
    icon: '🆕'
  });

  // Si multi-sites, suggérer duplicate checker
  if (siteData.totalSites && siteData.totalSites > 5) {
    suggestions.push({
      type: SUGGESTION_TYPES.NEW_WORKFLOW,
      priority: 'high',
      title: 'Détecteur de contenu dupliqué',
      description: `Avec ${siteData.totalSites} sites, le risque de duplicate content est élevé`,
      newWorkflow: SUGGESTED_WORKFLOWS.DUPLICATE_CHECKER,
      icon: '🔍'
    });
  }

  // Si tracking actif, suggérer position alerts
  if (siteData.trackingHistory && siteData.trackingHistory > 0) {
    suggestions.push({
      type: SUGGESTION_TYPES.NEW_WORKFLOW,
      priority: 'medium',
      title: 'Alertes de perte de position',
      description: 'Soyez notifié quand une position chute significativement',
      newWorkflow: SUGGESTED_WORKFLOWS.POSITION_ALERT,
      icon: '🚨'
    });
  }

  // === Suggestions basées sur la santé des workflows ===

  if (workflowHealth) {
    // Workflows en erreur récurrente
    if (workflowHealth.errors && workflowHealth.errors.length >= 3) {
      const errorWorkflows = [...new Set(workflowHealth.errors.map(e => e.workflowName))];
      suggestions.push({
        type: SUGGESTION_TYPES.OPTIMIZATION,
        priority: 'high',
        title: 'Workflows instables',
        description: `${errorWorkflows.length} workflow(s) en erreur: ${errorWorkflows.slice(0, 2).join(', ')}`,
        action: 'Vérifiez les logs et corrigez les configurations',
        icon: '⚠️'
      });
    }

    // Taux de succès faible
    if (workflowHealth.summary && workflowHealth.summary.successRate < 80) {
      suggestions.push({
        type: SUGGESTION_TYPES.OPTIMIZATION,
        priority: 'high',
        title: 'Taux de succès faible',
        description: `Seulement ${workflowHealth.summary.successRate}% des workflows réussissent`,
        action: 'Auditez les configurations et les credentials',
        icon: '📉'
      });
    }
  }

  // === Best practices générales ===

  suggestions.push({
    type: SUGGESTION_TYPES.BEST_PRACTICE,
    priority: 'low',
    title: 'Automatiser le refresh de contenu',
    description: 'Les contenus de plus de 6 mois devraient être mis à jour',
    newWorkflow: SUGGESTED_WORKFLOWS.CONTENT_DECAY,
    icon: '💡'
  });

  suggestions.push({
    type: SUGGESTION_TYPES.AUTOMATION,
    priority: 'low',
    title: 'Maillage interne intelligent',
    description: 'Laissez l\'IA suggérer les liens internes pertinents',
    newWorkflow: SUGGESTED_WORKFLOWS.INTERNAL_LINK_SUGGESTER,
    icon: '🔗'
  });

  // Trier par priorité
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return suggestions;
}

/**
 * Génère le blueprint d'un nouveau workflow
 */
export function generateWorkflowBlueprint(workflowId) {
  const workflow = SUGGESTED_WORKFLOWS[workflowId.toUpperCase().replace(/-/g, '_')];

  if (!workflow) {
    return null;
  }

  return {
    ...workflow,
    n8nTemplate: {
      name: workflow.name,
      nodes: workflow.nodes.map((node, index) => ({
        id: `node_${index}`,
        name: node,
        type: guessNodeType(node),
        position: [250, 100 + index * 100]
      })),
      connections: workflow.nodes.slice(0, -1).map((_, index) => ({
        source: `node_${index}`,
        target: `node_${index + 1}`
      }))
    },
    implementation: {
      difficulty: workflow.estimatedDifficulty,
      estimatedTime: workflow.estimatedDifficulty === 'easy' ? '1-2h' :
                     workflow.estimatedDifficulty === 'medium' ? '2-4h' : '4-8h',
      requiredSkills: ['n8n', ...workflow.requiredAPIs],
      prerequisites: workflow.requiredAPIs.map(api => `Configure ${api} credentials`)
    }
  };
}

/**
 * Devine le type de node n8n basé sur le nom
 */
function guessNodeType(nodeName) {
  const name = nodeName.toLowerCase();

  if (name.includes('webhook')) return 'n8n-nodes-base.webhook';
  if (name.includes('schedule')) return 'n8n-nodes-base.scheduleTrigger';
  if (name.includes('loop')) return 'n8n-nodes-base.splitInBatches';
  if (name.includes('filter')) return 'n8n-nodes-base.filter';
  if (name.includes('compare')) return 'n8n-nodes-base.compare';
  if (name.includes('slack')) return 'n8n-nodes-base.slack';
  if (name.includes('email')) return 'n8n-nodes-base.emailSend';
  if (name.includes('supabase')) return 'n8n-nodes-base.supabase';
  if (name.includes('claude')) return 'n8n-nodes-base.anthropic';
  if (name.includes('dataforseo')) return 'n8n-nodes-base.httpRequest';
  if (name.includes('firecrawl')) return 'n8n-nodes-base.httpRequest';
  if (name.includes('wordpress') || name.includes('fetch')) return 'n8n-nodes-base.httpRequest';

  return 'n8n-nodes-base.code';
}

/**
 * Calcule le score d'impact d'une suggestion
 */
export function calculateImpactScore(suggestion, siteData) {
  let score = 0;

  // Base sur le type
  switch (suggestion.type) {
    case SUGGESTION_TYPES.DATA_INSIGHT:
      score += 30;
      break;
    case SUGGESTION_TYPES.OPTIMIZATION:
      score += 25;
      break;
    case SUGGESTION_TYPES.NEW_WORKFLOW:
      score += 20;
      break;
    case SUGGESTION_TYPES.AUTOMATION:
      score += 15;
      break;
    case SUGGESTION_TYPES.BEST_PRACTICE:
      score += 10;
      break;
  }

  // Bonus pour priorité haute
  if (suggestion.priority === 'high') score += 20;
  if (suggestion.priority === 'medium') score += 10;

  // Bonus si ROI élevé
  if (suggestion.newWorkflow?.roi === 'high') score += 15;

  return Math.min(score, 100);
}

export default {
  SUGGESTION_TYPES,
  SUGGESTED_WORKFLOWS,
  generateSuggestions,
  generateWorkflowBlueprint,
  calculateImpactScore
};
