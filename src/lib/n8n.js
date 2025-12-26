/**
 * n8n API Integration
 * Permet de déclencher et monitorer les workflows n8n depuis le dashboard
 */

const N8N_BASE_URL = 'https://julien1sikoutris.app.n8n.cloud';

// IDs des workflows principaux
export const WORKFLOWS = {
  // Orchestrateurs
  WF0_CASCADE: 'by6OEOU5xK4BWx9g',           // WF0 - SEO Cascade Starter v4
  WF0_ORCH: 'mS91z9LM22By2ulY',              // WF0-ORCH - SEO Cascade Starter (Orchestrator)

  // Data Collection
  WF1_DATAFORSEO: '6XKZBK8855hj6Urr',        // SEO Keyword & SERP Analysis with DataForSEO
  WF2_PERPLEXITY: 'deaMhuFxshQ23vIs',        // Perplexity SEO Market Research
  WF3_FIRECRAWL: 'FBsfiSLPRygoxV0G',         // WF3: Firecrawl Competitor Deep Dive

  // Processing
  WF4_SYNTHESIS: 'dvTj2fH1YPI2EC4z',         // SEO — WF4: Claude Synthesis
  WF6_CLUSTERING: 'tNkJ8Guzd9jTArwd',        // WF6 - SEO Semantic Clustering v2
  WF7_QUICKWINS: 'iDw93XnHfycbcLJb',         // Quick Wins Scoring v2.3

  // Monitoring
  GSC_SYNC: 'T0jN2MPOw8sTqJ5X',              // WF-GSC-Sync
  POSITION_MONITOR: 'nupR7R6kH9Vdctoq',      // WF-Position-Monitor

  // Content
  ARTICLE_PIPELINE: 'sheJloNkfUqk9u0q',      // WF-Article-Pipeline
  CONTENT_BRIEF: 'dWy2YHSxGH0k4bOU',         // WF-ContentBrief
  ARTICLE_GENERATOR: 'R9Iv0TV5dqxNQMCr',     // Article Generator v2
  WP_PUBLISHER: 'SQfvpLH0jlvh4kd5',          // WF-WordPress-Publisher

  // Utilities
  SUPABASE_ORCH: 'NnlRGQiDMxIKp47H',         // WF-Supabase-Orchestrator
  PAA_EXTRACTION: 'OFx0E2vB3W2rapYe',        // WF-PAA - People Also Ask
  COCON_BUILDER: 'DEJfmARt6NcjqE3S',         // Cocon Sémantique Builder
};

// Catégories de workflows pour l'UI
export const WORKFLOW_CATEGORIES = {
  orchestration: {
    label: 'Orchestration',
    workflows: ['WF0_CASCADE', 'WF0_ORCH'],
    color: 'primary',
  },
  dataCollection: {
    label: 'Collecte de données',
    workflows: ['WF1_DATAFORSEO', 'WF2_PERPLEXITY', 'WF3_FIRECRAWL'],
    color: 'info',
    isPaid: true, // DataForSEO est payant
  },
  processing: {
    label: 'Traitement',
    workflows: ['WF4_SYNTHESIS', 'WF6_CLUSTERING', 'WF7_QUICKWINS'],
    color: 'warning',
  },
  monitoring: {
    label: 'Monitoring',
    workflows: ['GSC_SYNC', 'POSITION_MONITOR'],
    color: 'success',
  },
  content: {
    label: 'Contenu',
    workflows: ['ARTICLE_PIPELINE', 'CONTENT_BRIEF', 'ARTICLE_GENERATOR', 'WP_PUBLISHER'],
    color: 'secondary',
  },
};

// Workflows qui coûtent de l'argent (DataForSEO)
export const PAID_WORKFLOWS = ['WF0_CASCADE', 'WF0_ORCH', 'WF1_DATAFORSEO'];

/**
 * Déclenche un workflow via webhook
 * @param {string} webhookPath - Chemin du webhook (ex: 'wf0', 'gsc-sync')
 * @param {object} data - Données à envoyer
 * @param {boolean} isTest - Mode test (pas d'exécution réelle)
 */
export async function triggerWebhook(webhookPath, data = {}, isTest = false) {
  const url = `${N8N_BASE_URL}/webhook${isTest ? '-test' : ''}/${webhookPath}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Webhook error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error(`[n8n] Webhook error for ${webhookPath}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * API n8n pour le dashboard
 */
export const n8nApi = {
  /**
   * Récupérer la liste des workflows
   * Note: Utilise le MCP n8n-mcp en backend, ici on retourne les constantes
   */
  getWorkflows: () => {
    return Object.entries(WORKFLOWS).map(([key, id]) => ({
      key,
      id,
      name: key.replace(/_/g, ' '),
      isPaid: PAID_WORKFLOWS.includes(key),
    }));
  },

  /**
   * Lancer une analyse SEO complète (WF0)
   * ATTENTION: Coûte de l'argent (DataForSEO)
   * @param {string} seedKeyword - Keyword de départ
   * @param {string} siteAlias - Alias du site (ex: 'srat')
   */
  analyzeKeyword: async (seedKeyword, siteAlias) => {
    return triggerWebhook('wf0', {
      seed_keyword: seedKeyword,
      site_alias: siteAlias,
      source: 'dashboard',
    });
  },

  /**
   * Synchroniser Google Search Console (gratuit)
   * @param {string} siteId - UUID du site dans Supabase
   */
  syncGSC: async (siteId = null) => {
    return triggerWebhook('gsc-sync', {
      site_id: siteId,
      source: 'dashboard',
    });
  },

  /**
   * Recalculer les Quick Wins (gratuit)
   * @param {string} siteId - UUID du site
   */
  recalculateQuickWins: async (siteId) => {
    return triggerWebhook('quick-wins', {
      site_id: siteId,
      source: 'dashboard',
    });
  },

  /**
   * Lancer le monitoring des positions (gratuit)
   */
  monitorPositions: async () => {
    return triggerWebhook('position-monitor', {
      source: 'dashboard',
    });
  },

  /**
   * Générer un brief de contenu
   * @param {string} keyword - Keyword cible
   * @param {string} siteId - UUID du site
   */
  generateContentBrief: async (keyword, siteId) => {
    return triggerWebhook('content-brief', {
      keyword,
      site_id: siteId,
      source: 'dashboard',
    });
  },

  /**
   * Lancer le clustering sémantique (gratuit)
   * @param {string} siteId - UUID du site
   * @param {array} keywords - Liste de keywords à clusteriser
   */
  clusterKeywords: async (siteId, keywords) => {
    return triggerWebhook('clustering', {
      site_id: siteId,
      keywords,
      source: 'dashboard',
    });
  },

  /**
   * Extraire les People Also Ask
   * @param {string} keyword - Keyword à analyser
   */
  extractPAA: async (keyword) => {
    return triggerWebhook('paa', {
      keyword,
      source: 'dashboard',
    });
  },

  /**
   * Opération Supabase via l'orchestrateur
   * @param {string} operation - 'select', 'insert', 'upsert', 'delete'
   * @param {string} table - Nom de la table
   * @param {object} data - Données ou filtres
   */
  supabaseOperation: async (operation, table, data) => {
    return triggerWebhook('supabase-orchestrator', {
      operation,
      table,
      data,
      source: 'dashboard',
    });
  },
};

export default n8nApi;
