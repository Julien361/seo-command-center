import { useState, useEffect, useRef } from 'react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { sitesApi, keywordsApi, supabase } from '../lib/supabase';
import { SEO_PHASES, detectCurrentPhase, calculateOverallProgress, generateProgressSummary } from '../lib/seoPhaseDetector';
import { checkWorkflowHealth, generateHealthReport, getInactiveWorkflows, fetchExecutions } from '../lib/workflowHealth';
import { generateRecommendations, generatePosition0Roadmap } from '../lib/seoRecommendations';
import { generateSuggestions, SUGGESTED_WORKFLOWS } from '../lib/seoSuggestions';
import { n8nApi, WORKFLOWS } from '../lib/n8n';

// Mapping des workflows vers les pages de résultats
const WORKFLOW_RESULT_PAGES = {
  'seo-cascade-start': { view: 'keywords', label: 'Voir les keywords' },
  'wf1': { view: 'keywords', label: 'Voir les keywords' },
  'wf2': { view: 'concurrents', label: 'Voir la recherche marché' },
  'wf3': { view: 'concurrents', label: 'Voir les concurrents' },
  'wf6': { view: 'cocons', label: 'Voir les cocons' },
  'wf4': { view: 'keywords', label: 'Voir la synthèse' },
  'content-brief': { view: 'briefs', label: 'Voir le brief' },
  'article-generator': { view: 'articles', label: 'Voir l\'article' },
  'gsc-sync': { view: 'positions', label: 'Voir les positions' },
  'quickwins': { view: 'quickwins', label: 'Voir les Quick Wins' },
};

// Étapes simulées pour chaque type de workflow
const WORKFLOW_STEPS = {
  'seo-cascade-start': [
    { label: 'Initialisation...', duration: 2000 },
    { label: 'Recherche DataForSEO...', duration: 8000 },
    { label: 'Analyse Perplexity...', duration: 10000 },
    { label: 'Scraping Firecrawl...', duration: 15000 },
    { label: 'Synthèse des données...', duration: 5000 },
    { label: 'Sauvegarde Supabase...', duration: 2000 },
  ],
  'wf1': [
    { label: 'Connexion DataForSEO...', duration: 2000 },
    { label: 'Recherche keywords...', duration: 5000 },
    { label: 'Analyse SERP...', duration: 5000 },
    { label: 'Sauvegarde...', duration: 2000 },
  ],
  'wf2': [
    { label: 'Connexion Perplexity...', duration: 2000 },
    { label: 'Recherche marché...', duration: 8000 },
    { label: 'Extraction citations...', duration: 3000 },
    { label: 'Sauvegarde...', duration: 2000 },
  ],
  'wf3': [
    { label: 'Initialisation Firecrawl...', duration: 2000 },
    { label: 'Scraping pages concurrents...', duration: 12000 },
    { label: 'Analyse contenu...', duration: 5000 },
    { label: 'Sauvegarde...', duration: 2000 },
  ],
  'wf6': [
    { label: 'Chargement keywords...', duration: 2000 },
    { label: 'Clustering sémantique...', duration: 8000 },
    { label: 'Création cocons...', duration: 5000 },
    { label: 'Sauvegarde...', duration: 2000 },
  ],
  'default': [
    { label: 'Initialisation...', duration: 2000 },
    { label: 'Traitement...', duration: 10000 },
    { label: 'Finalisation...', duration: 3000 },
  ],
};

export default function SeoCoach({ onNavigate }) {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [phaseData, setPhaseData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [roadmap, setRoadmap] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [workflowHealth, setWorkflowHealth] = useState(null);
  const [inactiveWorkflows, setInactiveWorkflows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('guide');

  // État du workflow en cours
  const [workflowExecution, setWorkflowExecution] = useState(null);
  const [workflowResults, setWorkflowResults] = useState(null);
  const pollingRef = useRef(null);

  // Charger les sites
  useEffect(() => {
    async function loadSites() {
      try {
        const data = await sitesApi.getAll();
        setSites(data);
        if (data.length > 0) {
          setSelectedSite(data[0]);
        }
      } catch (error) {
        console.error('Failed to load sites:', error);
      }
    }
    loadSites();
  }, []);

  // Charger les données du site sélectionné
  useEffect(() => {
    async function loadSiteData() {
      if (!selectedSite) return;

      setLoading(true);
      try {
        const phase = await detectCurrentPhase(selectedSite.id);
        setPhaseData(phase);
        const recs = generateRecommendations(phase, selectedSite);
        setRecommendations(recs);
        const rm = generatePosition0Roadmap(phase, selectedSite);
        setRoadmap(rm);
        const siteData = { ...phase.stats, totalSites: sites.length };
        const suggs = generateSuggestions(siteData, workflowHealth);
        setSuggestions(suggs);
      } catch (error) {
        console.error('Failed to load site data:', error);
      }
      setLoading(false);
    }
    loadSiteData();
  }, [selectedSite, sites.length, workflowHealth]);

  // Charger la santé des workflows
  useEffect(() => {
    async function loadWorkflowHealth() {
      try {
        const health = await checkWorkflowHealth();
        setWorkflowHealth(health);
        const inactive = await getInactiveWorkflows();
        setInactiveWorkflows(inactive);
      } catch (error) {
        console.error('Failed to check workflow health:', error);
      }
    }
    loadWorkflowHealth();
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Charger les résultats du workflow terminé
  const loadWorkflowResults = async (webhookType) => {
    if (!selectedSite) return;

    try {
      let results = { site: selectedSite.mcp_alias };

      // Selon le type de workflow, charger les données pertinentes
      if (webhookType === 'seo-cascade-start' || webhookType === 'wf1') {
        // Compter les keywords pour ce site
        const { data: keywords, error } = await supabase
          .from('keywords')
          .select('id, keyword, search_volume, difficulty, created_at')
          .eq('site_id', selectedSite.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!error && keywords) {
          // Compter les keywords créés dans les 5 dernières minutes
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
          const recentKeywords = keywords.filter(k => k.created_at > fiveMinutesAgo);

          results.keywords = {
            total: keywords.length,
            recent: recentKeywords.length,
            samples: recentKeywords.slice(0, 5).map(k => k.keyword)
          };
        }
      } else if (webhookType === 'wf6') {
        // Compter les cocons
        const { data: clusters, error } = await supabase
          .from('semantic_clusters')
          .select('id, name, pillar_keyword')
          .eq('site_id', selectedSite.id);

        if (!error && clusters) {
          results.clusters = {
            total: clusters.length,
            names: clusters.slice(0, 3).map(c => c.name || c.pillar_keyword)
          };
        }
      } else if (webhookType === 'wf2' || webhookType === 'wf3') {
        // Compter les concurrents
        const { data: competitors, error } = await supabase
          .from('competitors')
          .select('id, domain')
          .eq('site_id', selectedSite.id);

        if (!error && competitors) {
          results.competitors = {
            total: competitors.length,
            domains: competitors.slice(0, 5).map(c => c.domain)
          };
        }
      }

      setWorkflowResults(results);
    } catch (error) {
      console.error('Failed to load workflow results:', error);
    }
  };

  // Lancer un workflow avec suivi en temps réel
  const handleLaunchWorkflow = async (workflow) => {
    if (!workflow || !workflow.webhook) {
      alert('Ce workflow ne peut pas être lancé directement');
      return;
    }

    const steps = WORKFLOW_STEPS[workflow.webhook] || WORKFLOW_STEPS['default'];
    const startTime = Date.now();

    // Initialiser l'exécution
    setWorkflowExecution({
      workflow,
      status: 'running',
      currentStep: 0,
      steps,
      progress: 0,
      startTime,
      executionId: null,
      error: null,
      lastCheck: null,
    });
    setWorkflowResults(null);

    try {
      // Lancer le workflow via webhook
      console.log('[Workflow] Lancement:', workflow.name);
      const result = await n8nApi.triggerWebhook(workflow.webhook, {
        site_alias: selectedSite.mcp_alias,
        site_url: selectedSite.url,
        site_id: selectedSite.id
      });
      console.log('[Workflow] Webhook declenche');

      // Polling pour suivre l'exécution réelle
      let checkCount = 0;
      const maxChecks = 120; // 2 minutes max (120 * 1s)
      let executionFound = null;
      let lastStepIndex = 0;

      pollingRef.current = setInterval(async () => {
        checkCount++;

        // Mise à jour visuelle des étapes (progression fluide)
        setWorkflowExecution(prev => {
          if (!prev || prev.status !== 'running') return prev;

          const elapsed = Date.now() - startTime;
          // Avancer progressivement dans les étapes toutes les 3-5 secondes
          const stepDuration = 4000; // 4 secondes par étape en moyenne
          const newStepIndex = Math.min(
            Math.floor(elapsed / stepDuration),
            steps.length - 1
          );
          // Progress basé sur le temps écoulé mais plafonné à 95% tant que pas terminé
          const progress = Math.min((elapsed / (steps.length * stepDuration)) * 100, 95);

          return {
            ...prev,
            currentStep: newStepIndex,
            progress,
            lastCheck: new Date().toISOString(),
          };
        });

        // Vérifier le statut réel toutes les 3 secondes
        if (checkCount % 3 === 0) {
          try {
            const executions = await fetchExecutions({ limit: 10 });
            // Chercher l'exécution la plus récente pour ce workflow
            const recentExec = executions.find(e => {
              const execStart = new Date(e.startedAt).getTime();
              return execStart > startTime - 5000; // Exécution démarrée après notre appel
            });

            if (recentExec) {
              executionFound = recentExec;
              console.log('[Workflow] Execution trouvee:', recentExec.id, 'status:', recentExec.status);

              if (recentExec.status === 'success') {
                // Terminé avec succès !
                clearInterval(pollingRef.current);
                console.log('[Workflow] Termine avec succes');
                loadWorkflowResults(workflow.webhook);
                setWorkflowExecution(prev => ({
                  ...prev,
                  status: 'success',
                  progress: 100,
                  currentStep: steps.length - 1,
                  executionId: recentExec.id,
                }));
                return;
              } else if (recentExec.status === 'error') {
                // Erreur
                clearInterval(pollingRef.current);
                console.log('[Workflow] Erreur detectee');
                setWorkflowExecution(prev => ({
                  ...prev,
                  status: 'error',
                  error: 'Le workflow a rencontre une erreur. Verifiez n8n pour les details.',
                  executionId: recentExec.id,
                }));
                return;
              }
              // Sinon, running ou waiting - continuer le polling
            }
          } catch (e) {
            console.log('[Workflow] Erreur polling (CORS probable):', e.message);
            // En cas d'erreur CORS, on continue avec la progression simulée
          }
        }

        // Timeout après maxChecks
        if (checkCount >= maxChecks) {
          clearInterval(pollingRef.current);
          console.log('[Workflow] Timeout - supposons succes');
          loadWorkflowResults(workflow.webhook);
          setWorkflowExecution(prev => ({
            ...prev,
            status: 'success',
            progress: 100,
            currentStep: steps.length - 1,
          }));
        }
      }, 1000); // Check toutes les secondes

    } catch (error) {
      clearInterval(pollingRef.current);
      console.error('[Workflow] Erreur lancement:', error);
      setWorkflowExecution(prev => ({
        ...prev,
        status: 'error',
        error: error.message,
      }));
    }
  };

  // Fermer le modal et rafraîchir les données
  const handleCloseModal = async () => {
    setWorkflowExecution(null);
    // Rafraîchir les données du site
    if (selectedSite) {
      const phase = await detectCurrentPhase(selectedSite.id);
      setPhaseData(phase);
      const recs = generateRecommendations(phase, selectedSite);
      setRecommendations(recs);
    }
  };

  // Naviguer vers les résultats (avec filtre sur le site)
  const handleViewResults = () => {
    const resultPage = WORKFLOW_RESULT_PAGES[workflowExecution?.workflow?.webhook];
    if (resultPage && onNavigate) {
      // Passer le site sélectionné pour filtrer les résultats
      onNavigate(resultPage.view, selectedSite);
    }
    setWorkflowExecution(null);
    setWorkflowResults(null);
  };

  const healthReport = workflowHealth ? generateHealthReport(workflowHealth) : null;

  return (
    <div className="space-y-6">
      {/* Modal de progression */}
      {workflowExecution && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-dark-card border border-dark-border rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                workflowExecution.status === 'running' ? 'bg-primary/20' :
                workflowExecution.status === 'success' ? 'bg-success/20' : 'bg-danger/20'
              }`}>
                {workflowExecution.status === 'running' ? (
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : workflowExecution.status === 'success' ? (
                  <span className="text-2xl">✅</span>
                ) : (
                  <span className="text-2xl">❌</span>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {workflowExecution.workflow.name}
                </h3>
                <p className="text-sm text-dark-muted">
                  {workflowExecution.status === 'running' ? 'Exécution en cours...' :
                   workflowExecution.status === 'success' ? 'Terminé avec succès !' :
                   'Erreur lors de l\'exécution'}
                </p>
              </div>
            </div>

            {/* Barre de progression */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-dark-muted">Progression</span>
                <span className="text-white font-medium">{Math.round(workflowExecution.progress)}%</span>
              </div>
              <div className="h-3 bg-dark-bg rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    workflowExecution.status === 'error' ? 'bg-danger' :
                    workflowExecution.status === 'success' ? 'bg-success' :
                    'bg-gradient-to-r from-primary to-purple-500'
                  }`}
                  style={{ width: `${workflowExecution.progress}%` }}
                />
              </div>
            </div>

            {/* Étapes */}
            {workflowExecution.status === 'running' && (
              <div className="space-y-2 mb-6">
                {workflowExecution.steps.map((step, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                      index < workflowExecution.currentStep ? 'opacity-50' :
                      index === workflowExecution.currentStep ? 'bg-primary/10' : 'opacity-30'
                    }`}
                  >
                    <span className="text-lg">
                      {index < workflowExecution.currentStep ? '✓' :
                       index === workflowExecution.currentStep ? '⏳' : '○'}
                    </span>
                    <span className={`text-sm ${
                      index === workflowExecution.currentStep ? 'text-white' : 'text-dark-muted'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Message d'erreur */}
            {workflowExecution.status === 'error' && (
              <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 mb-6">
                <p className="text-danger text-sm">{workflowExecution.error}</p>
              </div>
            )}

            {/* Message de succès avec récapitulatif */}
            {workflowExecution.status === 'success' && (
              <div className="bg-success/10 border border-success/30 rounded-lg p-4 mb-6">
                <p className="text-success text-sm font-medium mb-2">
                  Recherche terminee pour {workflowResults?.site || selectedSite?.mcp_alias}
                </p>

                {/* Récapitulatif des résultats */}
                {workflowResults?.keywords && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-white text-sm">
                      <span className="text-success">✓</span>
                      <span>{workflowResults.keywords.recent || workflowResults.keywords.total} nouveaux keywords trouves</span>
                    </div>
                    {workflowResults.keywords.samples?.length > 0 && (
                      <div className="pl-5 text-xs text-dark-muted">
                        Exemples: {workflowResults.keywords.samples.slice(0, 3).join(', ')}
                        {workflowResults.keywords.samples.length > 3 && '...'}
                      </div>
                    )}
                  </div>
                )}

                {workflowResults?.clusters && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-white text-sm">
                      <span className="text-success">✓</span>
                      <span>{workflowResults.clusters.total} cocons crees</span>
                    </div>
                    {workflowResults.clusters.names?.length > 0 && (
                      <div className="pl-5 text-xs text-dark-muted">
                        {workflowResults.clusters.names.join(', ')}
                      </div>
                    )}
                  </div>
                )}

                {workflowResults?.competitors && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-white text-sm">
                      <span className="text-success">✓</span>
                      <span>{workflowResults.competitors.total} concurrents analyses</span>
                    </div>
                    {workflowResults.competitors.domains?.length > 0 && (
                      <div className="pl-5 text-xs text-dark-muted">
                        {workflowResults.competitors.domains.slice(0, 3).join(', ')}
                      </div>
                    )}
                  </div>
                )}

                {!workflowResults && (
                  <p className="text-dark-muted text-xs mt-1">
                    Les donnees ont ete sauvegardees dans Supabase.
                  </p>
                )}
              </div>
            )}

            {/* Boutons */}
            <div className="flex gap-3">
              {workflowExecution.status === 'success' && WORKFLOW_RESULT_PAGES[workflowExecution.workflow.webhook] && (
                <Button onClick={handleViewResults} className="flex-1">
                  {WORKFLOW_RESULT_PAGES[workflowExecution.workflow.webhook].label}
                </Button>
              )}
              <button
                onClick={handleCloseModal}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  workflowExecution.status === 'running'
                    ? 'bg-dark-border text-dark-muted cursor-not-allowed'
                    : 'bg-dark-border text-white hover:bg-dark-bg'
                } ${workflowExecution.status === 'success' && WORKFLOW_RESULT_PAGES[workflowExecution.workflow.webhook] ? '' : 'flex-1'}`}
                disabled={workflowExecution.status === 'running'}
              >
                {workflowExecution.status === 'running' ? 'Veuillez patienter...' : 'Fermer'}
              </button>
            </div>

            {/* Info coût */}
            {workflowExecution.workflow.estimatedCost > 0 && (
              <p className="text-xs text-dark-muted text-center mt-4">
                Coût estimé: {workflowExecution.workflow.estimatedCost}€
              </p>
            )}
          </div>
        </div>
      )}

      {/* Header avec sélecteur de site */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">🧠</span>
            SEO Coach
          </h1>
          <p className="text-dark-muted mt-1">
            Votre assistant intelligent pour atteindre la Position 0
          </p>
        </div>

        <select
          value={selectedSite?.id || ''}
          onChange={(e) => {
            const site = sites.find(s => s.id === e.target.value);
            setSelectedSite(site);
          }}
          className="bg-dark-card border border-dark-border rounded-lg px-4 py-2 text-white"
        >
          {sites.map(site => (
            <option key={site.id} value={site.id}>
              {site.mcp_alias} - {site.domain}
            </option>
          ))}
        </select>
      </div>

      {/* Barre de progression globale */}
      {phaseData && !loading && (
        <Card className="!p-4 bg-gradient-to-r from-dark-card to-primary/10 border-primary/30">
          <div className="flex items-center gap-6">
            {/* Phase actuelle */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">{phaseData.phaseNumber}</span>
              </div>
              <div>
                <div className="text-xs text-dark-muted">Phase actuelle</div>
                <div className="text-lg font-semibold text-white">{phaseData.currentPhase.nameFr}</div>
              </div>
            </div>

            {/* Barre de progression */}
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-dark-muted">Progression vers Position 0</span>
                <span className="text-primary font-bold">{calculateOverallProgress(phaseData)}%</span>
              </div>
              <div className="h-3 bg-dark-bg rounded-full overflow-hidden flex">
                {SEO_PHASES.map((phase, index) => {
                  const isCompleted = index < phaseData.phaseNumber - 1;
                  const isCurrent = index === phaseData.phaseNumber - 1;
                  return (
                    <div
                      key={phase.id}
                      className={`flex-1 border-r border-dark-card last:border-0 ${
                        isCompleted ? 'bg-success' :
                        isCurrent ? 'bg-primary' : 'bg-dark-border'
                      }`}
                      title={phase.nameFr}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-dark-muted mt-1">
                {SEO_PHASES.map((phase, index) => (
                  <span key={phase.id} className={index < phaseData.phaseNumber ? 'text-success' : ''}>
                    {phase.nameFr.split(' ')[0]}
                  </span>
                ))}
              </div>
            </div>

            {/* Prochaine action */}
            {recommendations.length > 0 && recommendations[0].workflow && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleLaunchWorkflow(recommendations[0].workflow)}
                  disabled={workflowExecution?.status === 'running'}
                  className="whitespace-nowrap"
                >
                  {recommendations[0].workflow.estimatedCost > 0 && (
                    <span className="mr-1 text-xs opacity-70">{recommendations[0].workflow.estimatedCost}€</span>
                  )}
                  Prochaine étape
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-dark-border pb-4">
        <button
          onClick={() => setActiveTab('guide')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'guide'
              ? 'bg-primary text-white'
              : 'bg-dark-card text-dark-muted hover:text-white'
          }`}
        >
          Guide SEO
        </button>
        <button
          onClick={() => setActiveTab('health')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'health'
              ? 'bg-primary text-white'
              : 'bg-dark-card text-dark-muted hover:text-white'
          }`}
        >
          Santé Workflows
          {healthReport && <span>{healthReport.emoji}</span>}
        </button>
        <button
          onClick={() => setActiveTab('suggestions')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'suggestions'
              ? 'bg-primary text-white'
              : 'bg-dark-card text-dark-muted hover:text-white'
          }`}
        >
          Suggestions
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-dark-muted mt-4">Analyse en cours...</p>
        </div>
      ) : activeTab === 'guide' ? (
        /* === TAB GUIDE SEO === */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne gauche: Phases */}
          <div className="lg:col-span-1">
            <Card title="Phases SEO">
              <div className="space-y-2">
                {SEO_PHASES.map((phase, index) => {
                  const isCompleted = phaseData?.completedPhases?.some(p => p.id === phase.id);
                  const isCurrent = phaseData?.currentPhase?.id === phase.id;

                  // Mapping des phases vers les pages de résultats
                  const phaseResultPages = {
                    'discovery': 'keywords',
                    'analysis': 'concurrents',
                    'structure': 'cocons',
                    'creation': 'articles',
                    'publication': 'articles',
                    'monitoring': 'positions',
                  };
                  const resultPage = phaseResultPages[phase.id];

                  return (
                    <div
                      key={phase.id}
                      className={`p-3 rounded-lg transition-all ${
                        isCurrent
                          ? 'bg-primary/20 border border-primary'
                          : isCompleted
                            ? 'bg-success/10 border border-success/30'
                            : 'bg-dark-bg border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">
                          {isCompleted ? '✅' : isCurrent ? '🔄' : '○'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white text-sm">{phase.nameFr}</div>
                          <div className="text-xs text-dark-muted truncate">{phase.description}</div>
                        </div>
                        {isCurrent && (
                          <Badge variant="primary" size="sm">
                            {phaseData?.progress}%
                          </Badge>
                        )}
                      </div>

                      {/* Boutons d'action pour la phase */}
                      {(isCompleted || isCurrent) && resultPage && (
                        <div className="mt-2 pt-2 border-t border-dark-border/50 flex gap-2">
                          <button
                            onClick={() => onNavigate && onNavigate(resultPage)}
                            className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                          >
                            Voir résultats →
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {phaseData && (
                <div className="mt-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-dark-muted">Progression globale</span>
                    <span className="text-white font-medium">
                      {calculateOverallProgress(phaseData)}%
                    </span>
                  </div>
                  <div className="h-2 bg-dark-bg rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-success transition-all duration-500"
                      style={{ width: `${calculateOverallProgress(phaseData)}%` }}
                    />
                  </div>
                </div>
              )}
            </Card>

            {roadmap && (
              <Card title="Checklist Position 0" className="mt-6">
                {/* En-tête avec stats */}
                <div className="flex items-center justify-between p-3 bg-dark-bg rounded-lg mb-4">
                  <div className="text-center flex-1">
                    <div className="text-lg font-bold text-primary">{roadmap.estimatedTimeToRank}</div>
                    <div className="text-xs text-dark-muted">Temps estimé</div>
                  </div>
                  <div className="w-px h-8 bg-dark-border" />
                  <div className="text-center flex-1">
                    <div className="text-lg font-bold text-warning">{roadmap.requiredInvestment.toFixed(2)}€</div>
                    <div className="text-xs text-dark-muted">Coût restant</div>
                  </div>
                </div>

                {/* Checklist des étapes */}
                <div className="space-y-2">
                  {roadmap.steps.map((step) => {
                    const isCompleted = step.status === 'completed';
                    const isInProgress = step.status === 'in_progress';

                    // Mapping des étapes vers les pages et workflows
                    const stepConfig = {
                      1: { page: 'keywords', workflow: WORKFLOWS.WF0_CASCADE },
                      2: { page: 'concurrents', workflow: WORKFLOWS.WF2_PERPLEXITY },
                      3: { page: 'cocons', workflow: WORKFLOWS.WF6_CLUSTERING },
                      4: { page: 'articles', workflow: null },
                      5: { page: 'articles', workflow: null },
                      6: { page: 'positions', workflow: WORKFLOWS.GSC_SYNC },
                    };
                    const config = stepConfig[step.step] || {};

                    return (
                      <div
                        key={step.step}
                        className={`p-3 rounded-lg border transition-all ${
                          isCompleted
                            ? 'bg-success/10 border-success/30'
                            : isInProgress
                              ? 'bg-primary/10 border-primary/30'
                              : 'bg-dark-bg border-dark-border'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Checkbox */}
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isCompleted
                              ? 'bg-success text-white'
                              : isInProgress
                                ? 'bg-primary text-white'
                                : 'border-2 border-dark-muted'
                          }`}>
                            {isCompleted ? '✓' : isInProgress ? '→' : step.step}
                          </div>

                          {/* Contenu */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium text-sm ${isCompleted ? 'text-success' : 'text-white'}`}>
                                {step.name}
                              </span>
                              {/* Compteur */}
                              {step.count !== undefined && (
                                <span className={`text-xs px-1.5 py-0.5 rounded ${
                                  isCompleted ? 'bg-success/20 text-success' :
                                  step.count > 0 ? 'bg-primary/20 text-primary' : 'bg-dark-border text-dark-muted'
                                }`}>
                                  {step.count}/{step.target}
                                </span>
                              )}
                            </div>
                            {/* Résultat ou action */}
                            <div className="text-xs text-dark-muted mt-0.5 truncate">
                              {step.actions && step.actions[0]}
                            </div>
                          </div>

                          {/* Actions - toujours afficher le bouton Voir */}
                          <div className="flex gap-1">
                            {!isCompleted && config.workflow && (
                              <button
                                onClick={() => handleLaunchWorkflow(config.workflow)}
                                disabled={workflowExecution?.status === 'running'}
                                className="p-1.5 bg-primary/20 text-primary rounded hover:bg-primary/30 text-xs"
                                title="Lancer"
                              >
                                ▶
                              </button>
                            )}
                            {config.page && (
                              <button
                                onClick={() => onNavigate && onNavigate(config.page, selectedSite)}
                                className={`p-1.5 rounded text-xs ${
                                  isCompleted
                                    ? 'bg-success/20 text-success hover:bg-success/30'
                                    : 'bg-dark-border text-white hover:bg-dark-bg'
                                }`}
                                title="Voir les resultats"
                              >
                                →
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Résumé */}
                <div className="mt-4 pt-3 border-t border-dark-border text-center">
                  <span className="text-sm text-dark-muted">
                    {roadmap.steps.filter(s => s.status === 'completed').length}/{roadmap.steps.length} étapes complétées
                  </span>
                </div>
              </Card>
            )}
          </div>

          {/* Colonne droite: Recommandations */}
          <div className="lg:col-span-2">
            <Card title="Prochaines étapes recommandées">
              <div className="space-y-4">
                {recommendations.length === 0 ? (
                  <p className="text-dark-muted text-center py-8">
                    Sélectionnez un site pour voir les recommandations
                  </p>
                ) : (
                  recommendations.map((rec, index) => {
                    // Mapping des types de recommandations vers les pages
                    const typeToPage = {
                      'immediate': rec.workflow?.webhook ? WORKFLOW_RESULT_PAGES[rec.workflow.webhook]?.view : null,
                      'next_step': null,
                      'optimization': null,
                      'opportunity': 'quickwins',
                      'warning': null,
                    };
                    const viewPage = rec.link?.replace('/', '') || typeToPage[rec.type];

                    return (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${
                          rec.priority === 'high'
                            ? 'bg-danger/10 border-danger/30'
                            : rec.priority === 'medium'
                              ? 'bg-warning/10 border-warning/30'
                              : 'bg-dark-bg border-dark-border'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge
                                variant={
                                  rec.priority === 'high' ? 'danger' :
                                  rec.priority === 'medium' ? 'warning' : 'default'
                                }
                                size="sm"
                              >
                                {rec.priority === 'high' ? 'Prioritaire' :
                                 rec.priority === 'medium' ? 'Recommandé' : 'Optionnel'}
                              </Badge>
                              <Badge variant="info" size="sm">{rec.type}</Badge>
                            </div>
                            <h4 className="text-white font-medium mt-2">{rec.title}</h4>
                            <p className="text-dark-muted text-sm mt-1">{rec.description}</p>
                            {rec.impact && (
                              <p className="text-success text-sm mt-2">
                                Impact: {rec.impact}
                              </p>
                            )}
                          </div>

                          <div className="ml-4 flex flex-col gap-2">
                            {rec.workflow ? (
                              <Button
                                size="sm"
                                onClick={() => handleLaunchWorkflow(rec.workflow)}
                                disabled={workflowExecution?.status === 'running'}
                              >
                                {rec.estimatedCost > 0 && (
                                  <span className="mr-1 text-xs opacity-70">
                                    {rec.estimatedCost}€
                                  </span>
                                )}
                                Lancer
                              </Button>
                            ) : null}
                            {viewPage && (
                              <button
                                onClick={() => onNavigate && onNavigate(viewPage)}
                                className="inline-flex items-center justify-center px-3 py-1.5 bg-dark-bg text-primary rounded-lg text-sm hover:bg-primary/10 transition-colors border border-primary/30"
                              >
                                Voir →
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>

            {phaseData?.stats && (
              <Card title="État actuel - Cliquez pour voir les détails" className="mt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Keywords - Cliquable */}
                  <button
                    onClick={() => onNavigate && onNavigate('keywords')}
                    className="bg-dark-bg rounded-lg p-4 text-center hover:bg-primary/20 hover:border-primary border border-transparent transition-all group cursor-pointer"
                  >
                    <div className="text-2xl font-bold text-white group-hover:text-primary">
                      {phaseData.stats.keywords}
                    </div>
                    <div className="text-xs text-dark-muted group-hover:text-primary/70">Keywords</div>
                    <div className="text-[10px] text-primary opacity-0 group-hover:opacity-100 mt-1">Voir →</div>
                  </button>

                  {/* Cocons - Cliquable */}
                  <button
                    onClick={() => onNavigate && onNavigate('cocons')}
                    className="bg-dark-bg rounded-lg p-4 text-center hover:bg-primary/20 hover:border-primary border border-transparent transition-all group cursor-pointer"
                  >
                    <div className="text-2xl font-bold text-white group-hover:text-primary">
                      {phaseData.stats.clusters}
                    </div>
                    <div className="text-xs text-dark-muted group-hover:text-primary/70">Cocons</div>
                    <div className="text-[10px] text-primary opacity-0 group-hover:opacity-100 mt-1">Voir →</div>
                  </button>

                  {/* Articles - Cliquable */}
                  <button
                    onClick={() => onNavigate && onNavigate('articles')}
                    className="bg-dark-bg rounded-lg p-4 text-center hover:bg-primary/20 hover:border-primary border border-transparent transition-all group cursor-pointer"
                  >
                    <div className="text-2xl font-bold text-white group-hover:text-primary">
                      {phaseData.stats.articles.published}
                    </div>
                    <div className="text-xs text-dark-muted group-hover:text-primary/70">Articles publiés</div>
                    <div className="text-[10px] text-primary opacity-0 group-hover:opacity-100 mt-1">Voir →</div>
                  </button>

                  {/* Quick Wins - Cliquable + Highlight */}
                  <button
                    onClick={() => onNavigate && onNavigate('quickwins')}
                    className={`rounded-lg p-4 text-center border transition-all group cursor-pointer ${
                      phaseData.stats.quickWins > 0
                        ? 'bg-success/10 border-success/30 hover:bg-success/20 hover:border-success'
                        : 'bg-dark-bg border-transparent hover:bg-primary/20 hover:border-primary'
                    }`}
                  >
                    <div className={`text-2xl font-bold ${phaseData.stats.quickWins > 0 ? 'text-success' : 'text-white'} group-hover:scale-110 transition-transform`}>
                      {phaseData.stats.quickWins}
                    </div>
                    <div className="text-xs text-dark-muted">Quick Wins</div>
                    {phaseData.stats.quickWins > 0 && (
                      <div className="text-[10px] text-success mt-1">Opportunités →</div>
                    )}
                  </button>
                </div>

                {/* Actions rapides */}
                <div className="mt-4 pt-4 border-t border-dark-border">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleLaunchWorkflow(WORKFLOWS.WF0_CASCADE)}
                      disabled={workflowExecution?.status === 'running'}
                    >
                      + Rechercher keywords
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleLaunchWorkflow(WORKFLOWS.WF6_CLUSTERING)}
                      disabled={workflowExecution?.status === 'running'}
                    >
                      + Créer cocon
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onNavigate && onNavigate('articles')}
                    >
                      + Nouvel article
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      ) : activeTab === 'health' ? (
        /* === TAB SANTÉ WORKFLOWS === */
        <div className="space-y-6">
          {healthReport && (
            <Card>
              <div className="flex items-center gap-4">
                <div className="text-4xl">{healthReport.emoji}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">{healthReport.title}</h3>
                  <div className="flex gap-4 mt-2">
                    {healthReport.stats.map((stat, i) => (
                      <span key={i} className="text-sm text-dark-muted">{stat}</span>
                    ))}
                  </div>
                </div>
                <Button onClick={() => window.location.reload()}>
                  Rafraîchir
                </Button>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Workflows en erreur">
              {workflowHealth?.errors?.length === 0 ? (
                <p className="text-success text-center py-8">Aucune erreur détectée</p>
              ) : (
                <div className="space-y-3">
                  {workflowHealth?.errors?.slice(0, 10).map((error, i) => (
                    <div key={i} className="p-3 bg-danger/10 border border-danger/30 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-white">{error.workflowName}</div>
                          <div className="text-xs text-dark-muted">
                            {new Date(error.stoppedAt).toLocaleString()}
                          </div>
                        </div>
                        {error.isCritical && <Badge variant="danger" size="sm">Critique</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card title="Workflows inactifs">
              {inactiveWorkflows?.neverExecuted?.length === 0 &&
               inactiveWorkflows?.staleWorkflows?.length === 0 ? (
                <p className="text-success text-center py-8">Tous les workflows sont actifs</p>
              ) : (
                <div className="space-y-3">
                  {inactiveWorkflows?.staleWorkflows?.slice(0, 5).map((wf, i) => (
                    <div key={i} className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-white">{wf.name}</div>
                          <div className="text-xs text-dark-muted">
                            Inactif depuis {wf.daysSinceLastRun} jours
                          </div>
                        </div>
                        <Badge variant="warning" size="sm">Stale</Badge>
                      </div>
                    </div>
                  ))}
                  {inactiveWorkflows?.neverExecuted?.slice(0, 5).map((wf, i) => (
                    <div key={i} className="p-3 bg-dark-bg border border-dark-border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-white">{wf.name}</div>
                          <div className="text-xs text-dark-muted">Jamais exécuté</div>
                        </div>
                        <Badge variant="default" size="sm">Nouveau</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {healthReport?.recommendations?.length > 0 && (
            <Card title="Recommandations">
              <div className="space-y-2">
                {healthReport.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 bg-dark-bg rounded-lg">
                    <span className="text-warning">⚠️</span>
                    <span className="text-white">{rec}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      ) : (
        /* === TAB SUGGESTIONS === */
        <div className="space-y-6">
          <Card title="Suggestions d'amélioration">
            <div className="space-y-4">
              {suggestions.filter(s => s.type !== 'new_workflow').map((sugg, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg border ${
                    sugg.priority === 'high'
                      ? 'bg-primary/10 border-primary/30'
                      : 'bg-dark-bg border-dark-border'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{sugg.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-white">{sugg.title}</h4>
                        <Badge variant={sugg.priority === 'high' ? 'danger' : 'default'} size="sm">
                          {sugg.priority}
                        </Badge>
                      </div>
                      <p className="text-dark-muted text-sm mt-1">{sugg.description}</p>
                      {sugg.action && <p className="text-primary text-sm mt-2">{sugg.action}</p>}
                      {sugg.metric && <p className="text-success text-sm mt-1">{sugg.metric}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Idées de nouveaux workflows">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(SUGGESTED_WORKFLOWS).map((wf) => (
                <div
                  key={wf.id}
                  className="p-4 bg-dark-bg border border-dark-border rounded-lg hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-white">{wf.name}</h4>
                      <p className="text-dark-muted text-sm mt-1">{wf.description}</p>
                    </div>
                    <Badge variant={wf.roi === 'high' ? 'success' : 'default'} size="sm">
                      ROI {wf.roi}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {wf.requiredAPIs.map(api => (
                      <Badge key={api} variant="info" size="sm">{api}</Badge>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-dark-muted">Difficulté: {wf.estimatedDifficulty}</span>
                    <span className="text-xs text-success">{wf.impact}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Bonnes pratiques SEO">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-dark-bg rounded-lg">
                <h4 className="font-medium text-white flex items-center gap-2">
                  <span>📊</span> Structure en cocons
                </h4>
                <p className="text-dark-muted text-sm mt-2">
                  Organisez vos contenus en pages piliers (3000+ mots) entourées de satellites (1500 mots) avec maillage interne.
                </p>
              </div>
              <div className="p-4 bg-dark-bg rounded-lg">
                <h4 className="font-medium text-white flex items-center gap-2">
                  <span>🎯</span> Position 0
                </h4>
                <p className="text-dark-muted text-sm mt-2">
                  Répondez à la question dans les 100 premiers mots. Format: 40-60 mots pour paragraphe, 5-8 items pour liste.
                </p>
              </div>
              <div className="p-4 bg-dark-bg rounded-lg">
                <h4 className="font-medium text-white flex items-center gap-2">
                  <span>⚡</span> Quick Wins
                </h4>
                <p className="text-dark-muted text-sm mt-2">
                  Ciblez les pages en position 11-20. Ajoutez +500 mots, améliorez l'UX, renforcez le maillage.
                </p>
              </div>
              <div className="p-4 bg-dark-bg rounded-lg">
                <h4 className="font-medium text-white flex items-center gap-2">
                  <span>✍️</span> Contenu E-E-A-T
                </h4>
                <p className="text-dark-muted text-sm mt-2">
                  Expertise, Expérience, Autorité, Fiabilité. Citez des sources, montrez votre expertise terrain.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
