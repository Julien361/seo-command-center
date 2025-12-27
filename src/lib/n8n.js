/**
 * n8n API Integration
 * Permet de déclencher et monitorer les workflows n8n depuis le dashboard
 */

const N8N_BASE_URL = 'https://julien1sikoutris.app.n8n.cloud';

// Configuration détaillée des workflows
export const WORKFLOWS = {
  // === Orchestrateurs ===
  WF0_CASCADE: {
    id: 'by6OEOU5xK4BWx9g',
    name: 'WF0 - SEO Cascade Starter v4',
    webhook: 'seo-cascade-start',
    description: 'Lance une analyse SEO complète (DataForSEO + Perplexity + Firecrawl)',
    category: 'orchestration',
    isPaid: true,
    estimatedCost: 0.15,
  },
  WF0_ORCH: {
    id: 'mS91z9LM22By2ulY',
    name: 'WF0-ORCH - SEO Cascade Starter (Orchestrator)',
    webhook: 'wf0-orch',
    description: 'Orchestrateur principal de la cascade SEO',
    category: 'orchestration',
    isPaid: true,
    estimatedCost: 0.15,
  },

  // === Data Collection ===
  WF1_DATAFORSEO: {
    id: '6XKZBK8855hj6Urr',
    name: 'SEO Keyword & SERP Analysis',
    webhook: 'wf1',
    description: 'Analyse keywords et SERP via DataForSEO',
    category: 'dataCollection',
    isPaid: true,
    estimatedCost: 0.05,
  },
  WF2_PERPLEXITY: {
    id: 'deaMhuFxshQ23vIs',
    name: 'Perplexity SEO Market Research',
    webhook: 'wf2',
    description: 'Recherche marché via Perplexity AI',
    category: 'dataCollection',
    isPaid: true,
    estimatedCost: 0.02,
  },
  WF3_FIRECRAWL: {
    id: 'FBsfiSLPRygoxV0G',
    name: 'Firecrawl Competitor Deep Dive',
    webhook: 'wf3',
    description: 'Analyse approfondie des concurrents',
    category: 'dataCollection',
    isPaid: true,
    estimatedCost: 0.10,
  },
  PAA_EXTRACTION: {
    id: 'OFx0E2vB3W2rapYe',
    name: 'PAA Extraction',
    webhook: 'paa',
    description: 'Extraction des People Also Ask',
    category: 'dataCollection',
    isPaid: true,
    estimatedCost: 0.02,
  },

  // === Processing ===
  WF4_SYNTHESIS: {
    id: 'dvTj2fH1YPI2EC4z',
    name: 'Claude Synthesis',
    webhook: 'wf4',
    description: 'Synthèse des données avec Claude',
    category: 'processing',
    isPaid: true,
    estimatedCost: 0.05,
  },
  WF6_CLUSTERING: {
    id: 'tNkJ8Guzd9jTArwd',
    name: 'SEO Semantic Clustering',
    webhook: 'wf6',
    description: 'Clustering sémantique des keywords',
    category: 'processing',
    isPaid: false,
    estimatedCost: 0,
  },
  WF7_QUICKWINS: {
    id: 'iDw93XnHfycbcLJb',
    name: 'Quick Wins Scoring',
    webhook: null, // Sub-workflow only, pas de webhook direct
    description: 'Détection et scoring des opportunités quick win (sub-workflow)',
    category: 'processing',
    isPaid: false,
    estimatedCost: 0,
    isSubWorkflow: true,
  },
  COCON_BUILDER: {
    id: 'DEJfmARt6NcjqE3S',
    name: 'Cocon Sémantique Builder',
    webhook: 'wf-setup-3',
    description: 'Construction de cocons sémantiques (pages piliers + satellites)',
    category: 'processing',
    isPaid: true,
    estimatedCost: 0.10,
  },

  // === Monitoring ===
  GSC_SYNC: {
    id: 'T0jN2MPOw8sTqJ5X',
    name: 'WF-GSC-Sync',
    webhook: 'gsc-sync',
    description: 'Synchronisation Google Search Console',
    category: 'monitoring',
    isPaid: false,
    estimatedCost: 0,
  },
  POSITION_MONITOR: {
    id: 'nupR7R6kH9Vdctoq',
    name: 'Position Monitor',
    webhook: 'position-monitor',
    description: 'Surveillance des positions SERP',
    category: 'monitoring',
    isPaid: false,
    estimatedCost: 0,
  },

  // === Content Creation ===
  CONTENT_BRIEF: {
    id: 'dWy2YHSxGH0k4bOU',
    name: 'Position 0 Brief Generator',
    webhook: 'content-brief',
    description: 'Génération de brief SEO optimisé Position 0',
    category: 'content',
    isPaid: true,
    estimatedCost: 0.03,
  },
  ARTICLE_GENERATOR: {
    id: 'R9Iv0TV5dqxNQMCr',
    name: 'Article Generator v2',
    webhook: 'article-generator',
    description: 'Génération d\'articles SEO avec ACF',
    category: 'content',
    isPaid: true,
    estimatedCost: 0.10,
  },
  PAGE_GENERATOR: {
    id: 'WAarzRA41J1ucxVO',
    name: 'Page Generator v2',
    webhook: 'page-generator',
    description: 'Génération de pages piliers/satellites',
    category: 'content',
    isPaid: true,
    estimatedCost: 0.10,
  },
  ARTICLE_PIPELINE: {
    id: 'sheJloNkfUqk9u0q',
    name: 'Article Pipeline',
    webhook: 'article-pipeline',
    description: 'Pipeline complet: brief → article → publication',
    category: 'content',
    isPaid: true,
    estimatedCost: 0.15,
  },
  ARTICLE_PLANNER: {
    id: 'MZC8Sg5vRN8BFN51',
    name: 'Article Planner',
    webhook: 'article-planner',
    description: 'Planification des articles',
    category: 'content',
    isPaid: false,
    estimatedCost: 0,
  },

  // === Publishing ===
  WP_PUBLISHER: {
    id: 'SQfvpLH0jlvh4kd5',
    name: 'WordPress Publisher',
    webhook: 'wp-publish',
    description: 'Publication sur WordPress',
    category: 'publishing',
    isPaid: false,
    estimatedCost: 0,
  },
  AUTO_PUBLISHER: {
    id: 'mvlueFPegkqd6Zzx',
    name: 'Article Auto-Publisher',
    webhook: 'auto-publish',
    description: 'Publication automatique programmée',
    category: 'publishing',
    isPaid: false,
    estimatedCost: 0,
  },

  // === Utilities ===
  SUPABASE_ORCH: {
    id: 'NnlRGQiDMxIKp47H',
    name: 'Supabase Orchestrator',
    webhook: 'supabase-orchestrator',
    description: 'Opérations Supabase via workflow',
    category: 'utilities',
    isPaid: false,
    estimatedCost: 0,
  },

  // === Images ===
  IMAGES_OPTIMIZE: {
    id: '6lgJJFCCIAMuoFoE',
    name: 'WF-Images-Optimize',
    webhook: 'images-optimize',
    description: 'Optimisation des images (compression, alt text, WebP)',
    category: 'utilities',
    isPaid: false,
    estimatedCost: 0,
  },
  IMAGES_SCAN: {
    id: 'M7jDtkzUVshB7QRv',
    name: 'WF-Images-Scan',
    webhook: 'images-scan',
    description: 'Scan des images d\'un site WordPress',
    category: 'utilities',
    isPaid: false,
    estimatedCost: 0,
  },

  // === Liens internes ===
  INTERNAL_LINKS: {
    id: 'Nea7YNmY4YGGVmum',
    name: 'WF-Internal-Links',
    webhook: 'internal-links',
    description: 'Génération de suggestions de liens internes',
    category: 'processing',
    isPaid: true,
    estimatedCost: 0.03,
  },

  // === Audits ===
  CONTENT_AUDIT: {
    id: '18HIJ41yGnNLtDIe',
    name: 'WF-Content-Audit',
    webhook: 'content-audit',
    description: 'Audit SEO d\'une page unique',
    category: 'processing',
    isPaid: true,
    estimatedCost: 0.02,
  },
  CONTENT_AUDIT_FULL: {
    id: 'gfNe9WHBUawfDpBa',
    name: 'WF-Content-Audit-Full',
    webhook: 'content-audit-full',
    description: 'Audit SEO complet d\'un site',
    category: 'processing',
    isPaid: true,
    estimatedCost: 0.10,
  },
  TECHNICAL_AUDIT: {
    id: 'EccWXjB7YoUyGmsV',
    name: 'WF-Technical-Audit',
    webhook: 'technical-audit',
    description: 'Audit technique SEO (Core Web Vitals, robots, sitemap)',
    category: 'monitoring',
    isPaid: false,
    estimatedCost: 0,
  },

  // === Backlinks ===
  BACKLINKS_SYNC: {
    id: 'dWXrcejRE9hiV7Nq',
    name: 'WF-Backlinks-Sync',
    webhook: 'backlinks-sync',
    description: 'Synchronisation des backlinks via DataForSEO',
    category: 'dataCollection',
    isPaid: true,
    estimatedCost: 0.20,
  },

  // === Alertes ===
  ALERTS_CHECK: {
    id: 'Pji5AbHtElrg0doQ',
    name: 'WF-Alerts-Check',
    webhook: 'alerts-check',
    description: 'Vérification des alertes SEO (positions, trafic, erreurs)',
    category: 'monitoring',
    isPaid: false,
    estimatedCost: 0,
  },

  // === Calendrier ===
  CALENDAR_OPTIMIZE: {
    id: 'A61sMJh36kmCgHzq',
    name: 'WF-Calendar-Optimize',
    webhook: 'calendar-optimize',
    description: 'Optimisation du calendrier éditorial',
    category: 'content',
    isPaid: false,
    estimatedCost: 0,
  },
};

// Catégories de workflows pour l'UI
export const WORKFLOW_CATEGORIES = {
  orchestration: {
    label: 'Orchestration',
    color: 'primary',
    description: 'Workflows principaux qui orchestrent les autres',
  },
  dataCollection: {
    label: 'Collecte de données',
    color: 'info',
    description: 'Récupération de données SEO externes',
  },
  processing: {
    label: 'Traitement',
    color: 'warning',
    description: 'Analyse et traitement des données',
  },
  monitoring: {
    label: 'Monitoring',
    color: 'success',
    description: 'Surveillance et suivi des positions',
  },
  content: {
    label: 'Création de contenu',
    color: 'secondary',
    description: 'Génération de briefs et articles',
  },
  publishing: {
    label: 'Publication',
    color: 'primary',
    description: 'Publication sur WordPress',
  },
  utilities: {
    label: 'Utilitaires',
    color: 'default',
    description: 'Outils et fonctions diverses',
  },
};

// Liste des workflows payants (pour les warnings)
export const PAID_WORKFLOWS = Object.entries(WORKFLOWS)
  .filter(([_, wf]) => wf.isPaid)
  .map(([key]) => key);

// Liste des workflows gratuits
export const FREE_WORKFLOWS = Object.entries(WORKFLOWS)
  .filter(([_, wf]) => !wf.isPaid)
  .map(([key]) => key);

/**
 * Déclenche un workflow via webhook
 * @param {string} webhookPath - Chemin du webhook (ex: 'wf0', 'gsc-sync')
 * @param {object} data - Données à envoyer
 * @param {boolean} isTest - Mode test (webhook-test)
 */
export async function triggerWebhook(webhookPath, data = {}, isTest = false) {
  const url = `${N8N_BASE_URL}/webhook${isTest ? '-test' : ''}/${webhookPath}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        source: 'seo-command-center',
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Webhook error: ${response.status} - ${errorText}`);
    }

    // Handle empty responses (workflow uses responseNode but takes time)
    const responseText = await response.text();
    if (!responseText || responseText.trim() === '') {
      // Empty response means workflow started but responds asynchronously
      return { success: true, data: { status: 'started', message: 'Workflow démarré (traitement en arrière-plan)' } };
    }

    try {
      const result = JSON.parse(responseText);
      return { success: true, data: result };
    } catch (parseError) {
      // Response is not JSON, return as text
      return { success: true, data: { status: 'started', message: responseText } };
    }
  } catch (error) {
    console.error(`[n8n] Webhook error for ${webhookPath}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Calcule le coût estimé d'un workflow
 */
export function getWorkflowCost(workflowKey) {
  const workflow = WORKFLOWS[workflowKey];
  return workflow?.estimatedCost || 0;
}

/**
 * API n8n pour le dashboard
 */
export const n8nApi = {
  // ===================
  // Informations
  // ===================

  /**
   * Récupérer tous les workflows configurés
   */
  getWorkflows() {
    return Object.entries(WORKFLOWS).map(([key, wf]) => ({
      key,
      ...wf,
    }));
  },

  /**
   * Récupérer les workflows par catégorie
   */
  getWorkflowsByCategory() {
    const result = {};
    Object.entries(WORKFLOW_CATEGORIES).forEach(([catKey, cat]) => {
      result[catKey] = {
        ...cat,
        workflows: Object.entries(WORKFLOWS)
          .filter(([_, wf]) => wf.category === catKey)
          .map(([key, wf]) => ({ key, ...wf })),
      };
    });
    return result;
  },

  /**
   * Récupérer un workflow par clé
   */
  getWorkflow(key) {
    return WORKFLOWS[key] ? { key, ...WORKFLOWS[key] } : null;
  },

  /**
   * Vérifier si un workflow est payant
   */
  isPaidWorkflow(key) {
    return PAID_WORKFLOWS.includes(key);
  },

  // ===================
  // SEO Analysis (PAID)
  // ===================

  /**
   * Analyse SEO complète (WF0 Cascade)
   * ATTENTION: Coûte ~0.15€ (DataForSEO + Perplexity + Firecrawl)
   */
  async analyzeKeyword(seedKeyword, siteAlias, siteUrl, options = {}) {
    return triggerWebhook('seo-cascade-start', {
      url: siteUrl,
      site_objective: seedKeyword,
      site_alias: siteAlias,
      depth: options.depth || 'standard', // 'quick', 'standard', 'deep'
      include_serp: options.includeSERP !== false,
      include_paa: options.includePAA !== false,
      include_competitors: options.includeCompetitors !== false,
    });
  },

  /**
   * Analyse keyword + SERP uniquement (WF1 DataForSEO)
   * ATTENTION: Coûte ~0.05€
   */
  async analyzeKeywordSerp(keyword, siteAlias, options = {}) {
    return triggerWebhook('wf1', {
      keyword,
      site_alias: siteAlias,
      location: options.location || 'France',
      language: options.language || 'fr',
    });
  },

  /**
   * Recherche marché Perplexity (WF2)
   * ATTENTION: Coûte ~0.02€
   */
  async marketResearch(keyword, siteAlias) {
    return triggerWebhook('wf2', {
      keyword,
      site_alias: siteAlias,
    });
  },

  /**
   * Analyse concurrents (WF3 Firecrawl)
   * ATTENTION: Coûte ~0.10€
   */
  async analyzeCompetitor(competitorUrl, siteAlias, keyword = null) {
    return triggerWebhook('wf3', {
      url: competitorUrl,
      site_alias: siteAlias,
      keyword,
    });
  },

  /**
   * Extraire People Also Ask
   * ATTENTION: Coûte ~0.02€
   */
  async extractPAA(keyword, location = 'France') {
    return triggerWebhook('paa', {
      keyword,
      location,
    });
  },

  // ===================
  // Processing (FREE/PAID)
  // ===================

  /**
   * Recalculer les Quick Wins
   * NOTE: WF7 est un sub-workflow, pas de webhook direct
   * Les quick wins sont calculés via WF0 ou directement depuis Supabase
   */
  async recalculateQuickWins(siteId = null) {
    // WF7 n'a pas de webhook - c'est un sub-workflow
    // Pour recalculer, il faudrait soit:
    // 1. Relancer WF0 (seo-cascade-start) qui appelle WF7
    // 2. Ou créer un workflow wrapper avec webhook
    console.warn('WF7 Quick Wins est un sub-workflow sans webhook direct');
    return { success: false, error: 'WF7 est un sub-workflow. Utilisez seo-cascade-start pour une analyse complète.' };
  },

  /**
   * Clustering sémantique (WF6)
   * GRATUIT
   */
  async clusterKeywords(siteId, keywords = null) {
    return triggerWebhook('wf6', {
      site_id: siteId,
      keywords,
    });
  },

  /**
   * Synthèse Claude (WF4)
   * ATTENTION: Coûte ~0.05€
   */
  async synthesize(data, siteAlias) {
    return triggerWebhook('wf4', {
      data,
      site_alias: siteAlias,
    });
  },

  /**
   * Construire un cocon sémantique (pages piliers + satellites)
   * ATTENTION: Coûte ~0.10€
   */
  async buildCocon(siteAlias, mainKeyword) {
    return triggerWebhook('wf-setup-3', {
      site_alias: siteAlias,
      main_keyword: mainKeyword,
    });
  },

  // ===================
  // Monitoring (FREE)
  // ===================

  /**
   * Synchroniser Google Search Console
   * GRATUIT
   */
  async syncGSC(siteId = null) {
    return triggerWebhook('gsc-sync', {
      site_id: siteId,
    });
  },

  /**
   * Lancer le monitoring des positions
   * GRATUIT
   */
  async monitorPositions(siteId = null) {
    return triggerWebhook('position-monitor', {
      site_id: siteId,
    });
  },

  // ===================
  // Content Creation (PAID)
  // ===================

  /**
   * Générer un brief de contenu
   * ATTENTION: Coûte ~0.03€
   */
  async generateBrief(keyword, siteAlias, options = {}) {
    return triggerWebhook('content-brief', {
      keyword,
      site_alias: siteAlias,
      target_snippet_type: options.snippetType || 'paragraph',
      word_count: options.wordCount || 1500,
      search_intent: options.intent || 'informational',
    });
  },

  /**
   * Générer un article à partir d'un brief
   * ATTENTION: Coûte ~0.10€
   */
  async generateArticle(briefId, siteAlias, options = {}) {
    return triggerWebhook('article-generator', {
      brief_id: briefId,
      site_alias: siteAlias,
      humanize: options.humanize !== false,
      include_faq: options.includeFAQ !== false,
    });
  },

  /**
   * Générer une page (pilier ou satellite)
   * ATTENTION: Coûte ~0.10€
   */
  async generatePage(keyword, siteAlias, pageType = 'pillar', options = {}) {
    return triggerWebhook('page-generator', {
      keyword,
      site_alias: siteAlias,
      page_type: pageType, // 'pillar', 'satellite', 'landing'
      cluster_id: options.clusterId,
      word_count: pageType === 'pillar' ? 3000 : 1500,
    });
  },

  /**
   * Pipeline article complet (brief → article → publish)
   * ATTENTION: Coûte ~0.15€
   */
  async runArticlePipeline(keyword, siteAlias, options = {}) {
    return triggerWebhook('article-pipeline', {
      keyword,
      site_alias: siteAlias,
      auto_publish: options.autoPublish || false,
      publish_status: options.publishStatus || 'draft',
    });
  },

  // ===================
  // Publishing (FREE)
  // ===================

  /**
   * Publier sur WordPress
   * GRATUIT
   */
  async publishToWordPress(articleId, siteAlias, options = {}) {
    return triggerWebhook('wp-publish', {
      article_id: articleId,
      site_alias: siteAlias,
      status: options.status || 'draft', // 'draft', 'publish', 'pending'
      categories: options.categories || [],
      tags: options.tags || [],
    });
  },

  /**
   * Planifier une publication automatique
   * GRATUIT
   */
  async schedulePublication(articleId, siteAlias, scheduledDate) {
    return triggerWebhook('auto-publish', {
      article_id: articleId,
      site_alias: siteAlias,
      scheduled_date: scheduledDate,
    });
  },

  // ===================
  // Utilities
  // ===================

  /**
   * Opération Supabase via workflow
   */
  async supabaseOperation(operation, table, data) {
    return triggerWebhook('supabase-orchestrator', {
      operation, // 'select', 'insert', 'upsert', 'delete'
      table,
      data,
    });
  },

  // ===================
  // Images
  // ===================

  /**
   * Optimiser les images
   * GRATUIT (traitement local)
   */
  async optimizeImages(type, siteAlias, imageIds = []) {
    return triggerWebhook('images-optimize', {
      type, // 'compression', 'alt', 'webp', 'all'
      site_alias: siteAlias,
      images: imageIds,
    });
  },

  /**
   * Scanner les images d'un site
   * GRATUIT
   */
  async scanImages(siteAlias, siteUrl) {
    return triggerWebhook('images-scan', {
      site_alias: siteAlias,
      site_url: siteUrl,
    });
  },

  // ===================
  // Liens internes
  // ===================

  /**
   * Générer des suggestions de liens internes
   * ATTENTION: Coûte ~0.03€
   */
  async suggestInternalLinks(siteAlias, siteId) {
    return triggerWebhook('internal-links', {
      site_alias: siteAlias,
      site_id: siteId,
    });
  },

  // ===================
  // Audits
  // ===================

  /**
   * Auditer une page
   * ATTENTION: Coûte ~0.02€
   */
  async auditPage(pageId, url, siteAlias) {
    return triggerWebhook('content-audit', {
      page_id: pageId,
      url,
      site_alias: siteAlias,
    });
  },

  /**
   * Auditer tout un site
   * ATTENTION: Coûte ~0.10€
   */
  async auditSite(siteAlias, siteId) {
    return triggerWebhook('content-audit-full', {
      site_alias: siteAlias,
      site_id: siteId,
    });
  },

  /**
   * Audit technique SEO
   * GRATUIT
   */
  async technicalAudit(siteAlias, siteIds = []) {
    return triggerWebhook('technical-audit', {
      site_alias: siteAlias,
      site_ids: siteIds,
    });
  },

  // ===================
  // Backlinks
  // ===================

  /**
   * Synchroniser les backlinks via DataForSEO
   * ATTENTION: Coûte ~0.20€ par site
   */
  async syncBacklinks(siteAlias, siteId) {
    return triggerWebhook('backlinks-sync', {
      site_alias: siteAlias,
      site_id: siteId,
    });
  },

  // ===================
  // Alertes
  // ===================

  /**
   * Vérifier les alertes SEO
   * GRATUIT
   */
  async checkAlerts(options = {}) {
    return triggerWebhook('alerts-check', {
      check_positions: options.positions !== false,
      check_traffic: options.traffic !== false,
      check_errors: options.errors !== false,
    });
  },

  // ===================
  // Calendrier
  // ===================

  /**
   * Optimiser le calendrier éditorial
   * GRATUIT
   */
  async optimizeCalendar(month, year) {
    return triggerWebhook('calendar-optimize', {
      month,
      year,
    });
  },

  /**
   * Déclencher un workflow par clé
   */
  async trigger(workflowKey, data = {}) {
    const workflow = WORKFLOWS[workflowKey];
    if (!workflow) {
      return { success: false, error: `Workflow inconnu: ${workflowKey}` };
    }
    return triggerWebhook(workflow.webhook, data);
  },

  /**
   * Déclencher un webhook directement par son chemin
   */
  async triggerWebhook(webhookPath, data = {}) {
    return triggerWebhook(webhookPath, data);
  },
};

export default n8nApi;
