import { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { sitesApi } from '../lib/supabase';
import { SEO_PHASES, detectCurrentPhase, calculateOverallProgress, generateProgressSummary } from '../lib/seoPhaseDetector';
import { checkWorkflowHealth, generateHealthReport, getInactiveWorkflows } from '../lib/workflowHealth';
import { generateRecommendations, generatePosition0Roadmap } from '../lib/seoRecommendations';
import { generateSuggestions, SUGGESTED_WORKFLOWS } from '../lib/seoSuggestions';
import { n8nApi, WORKFLOWS } from '../lib/n8n';

export default function SeoCoach() {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [phaseData, setPhaseData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [roadmap, setRoadmap] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [workflowHealth, setWorkflowHealth] = useState(null);
  const [inactiveWorkflows, setInactiveWorkflows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('guide'); // guide, health, suggestions

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
        // Détecter la phase
        const phase = await detectCurrentPhase(selectedSite.id);
        setPhaseData(phase);

        // Générer les recommandations
        const recs = generateRecommendations(phase, selectedSite);
        setRecommendations(recs);

        // Générer la roadmap Position 0
        const rm = generatePosition0Roadmap(phase, selectedSite);
        setRoadmap(rm);

        // Générer les suggestions
        const siteData = {
          ...phase.stats,
          totalSites: sites.length
        };
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

  // Lancer un workflow
  const handleLaunchWorkflow = async (workflow) => {
    if (!workflow || !workflow.webhook) {
      alert('Ce workflow ne peut pas être lancé directement');
      return;
    }

    try {
      const result = await n8nApi.triggerWebhook(workflow.webhook, {
        site_alias: selectedSite.mcp_alias,
        site_url: selectedSite.url,
        site_id: selectedSite.id
      });
      alert(`Workflow ${workflow.name} lancé avec succès!`);
    } catch (error) {
      alert(`Erreur: ${error.message}`);
    }
  };

  const healthReport = workflowHealth ? generateHealthReport(workflowHealth) : null;

  return (
    <div className="space-y-6">
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
          {healthReport && (
            <span>{healthReport.emoji}</span>
          )}
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
            <Card title="Progression SEO">
              <div className="space-y-3">
                {SEO_PHASES.map((phase, index) => {
                  const isCompleted = phaseData?.completedPhases?.some(p => p.id === phase.id);
                  const isCurrent = phaseData?.currentPhase?.id === phase.id;

                  return (
                    <div
                      key={phase.id}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        isCurrent
                          ? 'bg-primary/20 border border-primary'
                          : isCompleted
                            ? 'bg-success/10'
                            : 'bg-dark-bg'
                      }`}
                    >
                      <span className="text-xl">
                        {isCompleted ? '✅' : isCurrent ? '🔄' : '○'}
                      </span>
                      <div className="flex-1">
                        <div className="font-medium text-white">{phase.nameFr}</div>
                        <div className="text-xs text-dark-muted">{phase.description}</div>
                      </div>
                      {isCurrent && (
                        <Badge variant="primary" size="sm">
                          {phaseData?.progress}%
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Barre de progression globale */}
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

            {/* Roadmap Position 0 */}
            {roadmap && (
              <Card title="Roadmap Position 0" className="mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-dark-muted">Temps estimé</span>
                    <Badge variant="info">{roadmap.estimatedTimeToRank}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-dark-muted">Investissement</span>
                    <Badge variant="warning">{roadmap.requiredInvestment.toFixed(2)}€</Badge>
                  </div>

                  <div className="border-t border-dark-border pt-4 mt-4">
                    <div className="text-sm text-dark-muted mb-2">Étapes restantes</div>
                    {roadmap.steps
                      .filter(s => s.status !== 'completed')
                      .slice(0, 3)
                      .map(step => (
                        <div key={step.step} className="flex items-center gap-2 py-1">
                          <span className="text-primary">{step.step}.</span>
                          <span className="text-white text-sm">{step.name}</span>
                        </div>
                      ))
                    }
                  </div>
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
                  recommendations.map((rec, index) => (
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
                          <div className="flex items-center gap-2">
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

                        <div className="ml-4">
                          {rec.workflow ? (
                            <Button
                              size="sm"
                              onClick={() => handleLaunchWorkflow(rec.workflow)}
                            >
                              {rec.estimatedCost > 0 && (
                                <span className="mr-1 text-xs opacity-70">
                                  {rec.estimatedCost}€
                                </span>
                              )}
                              Lancer
                            </Button>
                          ) : rec.link ? (
                            <a
                              href={rec.link}
                              className="inline-flex items-center px-3 py-1.5 bg-dark-card text-white rounded-lg text-sm hover:bg-dark-border transition-colors"
                            >
                              Voir
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Stats du site */}
            {phaseData?.stats && (
              <Card title="État actuel" className="mt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-dark-bg rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-white">
                      {phaseData.stats.keywords}
                    </div>
                    <div className="text-xs text-dark-muted">Keywords</div>
                  </div>
                  <div className="bg-dark-bg rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-white">
                      {phaseData.stats.clusters}
                    </div>
                    <div className="text-xs text-dark-muted">Cocons</div>
                  </div>
                  <div className="bg-dark-bg rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-white">
                      {phaseData.stats.articles.published}
                    </div>
                    <div className="text-xs text-dark-muted">Articles publiés</div>
                  </div>
                  <div className="bg-dark-bg rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-success">
                      {phaseData.stats.quickWins}
                    </div>
                    <div className="text-xs text-dark-muted">Quick Wins</div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      ) : activeTab === 'health' ? (
        /* === TAB SANTÉ WORKFLOWS === */
        <div className="space-y-6">
          {/* Status global */}
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
            {/* Erreurs */}
            <Card title="Workflows en erreur">
              {workflowHealth?.errors?.length === 0 ? (
                <p className="text-success text-center py-8">
                  Aucune erreur détectée
                </p>
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
                        {error.isCritical && (
                          <Badge variant="danger" size="sm">Critique</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Workflows inactifs */}
            <Card title="Workflows inactifs">
              {inactiveWorkflows?.neverExecuted?.length === 0 &&
               inactiveWorkflows?.staleWorkflows?.length === 0 ? (
                <p className="text-success text-center py-8">
                  Tous les workflows sont actifs
                </p>
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
                          <div className="text-xs text-dark-muted">
                            Jamais exécuté
                          </div>
                        </div>
                        <Badge variant="default" size="sm">Nouveau</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Recommandations */}
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
          {/* Suggestions basées sur les données */}
          <Card title="Suggestions d'amélioration">
            <div className="space-y-4">
              {suggestions
                .filter(s => s.type !== 'new_workflow')
                .map((sugg, i) => (
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
                          <Badge
                            variant={sugg.priority === 'high' ? 'danger' : 'default'}
                            size="sm"
                          >
                            {sugg.priority}
                          </Badge>
                        </div>
                        <p className="text-dark-muted text-sm mt-1">{sugg.description}</p>
                        {sugg.action && (
                          <p className="text-primary text-sm mt-2">{sugg.action}</p>
                        )}
                        {sugg.metric && (
                          <p className="text-success text-sm mt-1">{sugg.metric}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </Card>

          {/* Nouveaux workflows suggérés */}
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
                    <Badge
                      variant={wf.roi === 'high' ? 'success' : 'default'}
                      size="sm"
                    >
                      ROI {wf.roi}
                    </Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {wf.requiredAPIs.map(api => (
                      <Badge key={api} variant="info" size="sm">{api}</Badge>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-dark-muted">
                      Difficulté: {wf.estimatedDifficulty}
                    </span>
                    <span className="text-xs text-success">{wf.impact}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Best practices */}
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
