import { useState, useEffect } from 'react';
import { Play, Pause, CheckCircle, XCircle, Clock, RefreshCw, Settings, Eye, ExternalLink, Loader2, Zap } from 'lucide-react';
import { Card, Badge, Button } from '../components/common';
import { WORKFLOWS, WORKFLOW_CATEGORIES, PAID_WORKFLOWS, triggerWebhook } from '../lib/n8n';

const N8N_BASE_URL = 'https://julien1sikoutris.app.n8n.cloud';

// Mapping des workflows connus avec leurs webhooks
const WEBHOOK_PATHS = {
  WF0_CASCADE: 'wf0',
  GSC_SYNC: 'gsc-sync',
  WF7_QUICKWINS: 'quick-wins',
  POSITION_MONITOR: 'position-monitor',
  CONTENT_BRIEF: 'content-brief',
  WF6_CLUSTERING: 'clustering',
  PAA_EXTRACTION: 'paa',
};

const statusConfig = {
  active: { color: 'success', icon: CheckCircle, label: 'Actif' },
  inactive: { color: 'secondary', icon: Pause, label: 'Inactif' },
  running: { color: 'info', icon: RefreshCw, label: 'En cours' },
  error: { color: 'danger', icon: XCircle, label: 'Erreur' },
};

export default function Workflows() {
  const [workflows, setWorkflows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [runningWorkflows, setRunningWorkflows] = useState(new Set());
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Construire la liste des workflows a partir des constantes
      // En production, on pourrait appeler l'API n8n directement
      const workflowsList = Object.entries(WORKFLOWS).map(([key, id]) => {
        // Trouver la categorie
        let category = 'other';
        for (const [catKey, catData] of Object.entries(WORKFLOW_CATEGORIES)) {
          if (catData.workflows.includes(key)) {
            category = catKey;
            break;
          }
        }

        return {
          key,
          id,
          name: getWorkflowName(key),
          description: getWorkflowDescription(key),
          category,
          isPaid: PAID_WORKFLOWS.includes(key),
          hasWebhook: !!WEBHOOK_PATHS[key],
          webhookPath: WEBHOOK_PATHS[key],
          active: true, // Par defaut actif, sera mis a jour si on a les vraies donnees
        };
      });

      setWorkflows(workflowsList);
    } catch (err) {
      console.error('Erreur chargement workflows:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getWorkflowName = (key) => {
    const names = {
      WF0_CASCADE: 'WF0 - SEO Cascade Starter',
      WF0_ORCH: 'WF0 Orchestrator',
      WF1_DATAFORSEO: 'WF1 - DataForSEO Keywords',
      WF2_PERPLEXITY: 'WF2 - Perplexity Research',
      WF3_FIRECRAWL: 'WF3 - Firecrawl Competitor',
      WF4_SYNTHESIS: 'WF4 - Claude Synthesis',
      WF6_CLUSTERING: 'WF6 - Semantic Clustering',
      WF7_QUICKWINS: 'WF7 - Quick Wins Scoring',
      GSC_SYNC: 'GSC Sync',
      POSITION_MONITOR: 'Position Monitor',
      ARTICLE_PIPELINE: 'Article Pipeline',
      CONTENT_BRIEF: 'Content Brief Generator',
      ARTICLE_GENERATOR: 'Article Generator',
      WP_PUBLISHER: 'WordPress Publisher',
      SUPABASE_ORCH: 'Supabase Orchestrator',
      PAA_EXTRACTION: 'People Also Ask',
      COCON_BUILDER: 'Cocon Semantique Builder',
    };
    return names[key] || key.replace(/_/g, ' ');
  };

  const getWorkflowDescription = (key) => {
    const descriptions = {
      WF0_CASCADE: 'Lance analyse SEO complete (payant)',
      WF0_ORCH: 'Orchestrateur cascade SEO',
      WF1_DATAFORSEO: 'Recherche keywords via DataForSEO',
      WF2_PERPLEXITY: 'Market intelligence avec citations',
      WF3_FIRECRAWL: 'Analyse concurrents (scraping)',
      WF4_SYNTHESIS: 'Consolidation donnees SEO',
      WF6_CLUSTERING: 'Creation cocons semantiques',
      WF7_QUICKWINS: 'Detection opportunites P11-20',
      GSC_SYNC: 'Synchronise Google Search Console',
      POSITION_MONITOR: 'Suivi quotidien des positions',
      ARTICLE_PIPELINE: 'Pipeline creation articles',
      CONTENT_BRIEF: 'Generation briefs optimises P0',
      ARTICLE_GENERATOR: 'Generation articles SEO',
      WP_PUBLISHER: 'Publication WordPress',
      SUPABASE_ORCH: 'Operations base de donnees',
      PAA_EXTRACTION: 'Extraction People Also Ask',
      COCON_BUILDER: 'Construction cocons semantiques',
    };
    return descriptions[key] || '';
  };

  const handleRun = async (workflow) => {
    if (!workflow.hasWebhook) {
      window.open(`${N8N_BASE_URL}/workflow/${workflow.id}`, '_blank');
      return;
    }

    if (workflow.isPaid) {
      const confirm = window.confirm(
        `Executer "${workflow.name}" ?\n\nAttention: Ce workflow utilise des APIs payantes (DataForSEO).`
      );
      if (!confirm) return;
    }

    setRunningWorkflows(prev => new Set([...prev, workflow.id]));

    try {
      const result = await triggerWebhook(workflow.webhookPath, { source: 'dashboard' });
      if (result.success) {
        alert(`Workflow "${workflow.name}" lance avec succes !`);
      } else {
        alert(`Erreur: ${result.error}`);
      }
    } catch (err) {
      alert(`Erreur: ${err.message}`);
    } finally {
      setRunningWorkflows(prev => {
        const next = new Set(prev);
        next.delete(workflow.id);
        return next;
      });
    }
  };

  const openInN8n = (workflowId) => {
    window.open(`${N8N_BASE_URL}/workflow/${workflowId}`, '_blank');
  };

  const filteredWorkflows = workflows.filter(wf => {
    if (filterCategory === 'all') return true;
    return wf.category === filterCategory;
  });

  const stats = {
    total: workflows.length,
    active: workflows.filter(w => w.active).length,
    paid: workflows.filter(w => w.isPaid).length,
    withWebhook: workflows.filter(w => w.hasWebhook).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Workflows n8n</h2>
          <p className="text-dark-muted mt-1">
            {isLoading ? 'Chargement...' : `${workflows.length} workflows configures`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={loadWorkflows}
            disabled={isLoading}
          >
            Actualiser
          </Button>
          <Button
            variant="outline"
            icon={ExternalLink}
            onClick={() => window.open(N8N_BASE_URL, '_blank')}
          >
            Ouvrir n8n
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 text-danger">
          Erreur: {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="text-3xl font-bold text-white">{stats.total}</div>
          <div className="text-sm text-dark-muted">Workflows Total</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-success">{stats.active}</div>
          <div className="text-sm text-dark-muted">Actifs</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-warning">{stats.paid}</div>
          <div className="text-sm text-dark-muted">Payants</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-primary">{stats.withWebhook}</div>
          <div className="text-sm text-dark-muted">Avec Webhook</div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-4 mb-6">
          <span className="text-sm text-dark-muted">Categorie:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
          >
            <option value="all">Toutes</option>
            {Object.entries(WORKFLOW_CATEGORIES).map(([key, cat]) => (
              <option key={key} value={key}>{cat.label}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Workflow</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Categorie</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Type</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkflows.map((wf) => {
                  const isRunning = runningWorkflows.has(wf.id);
                  const categoryInfo = WORKFLOW_CATEGORIES[wf.category];

                  return (
                    <tr key={wf.id} className="border-b border-dark-border/50 hover:bg-dark-border/30">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-${categoryInfo?.color || 'primary'}/20`}>
                            <Zap className={`w-5 h-5 text-${categoryInfo?.color || 'primary'}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-white">{wf.name}</p>
                              {wf.isPaid && (
                                <Badge variant="warning" size="sm">Payant</Badge>
                              )}
                            </div>
                            <p className="text-xs text-dark-muted">{wf.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={categoryInfo?.color || 'secondary'}>
                          {categoryInfo?.label || wf.category}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {wf.hasWebhook ? (
                          <Badge variant="success" size="sm">Webhook</Badge>
                        ) : (
                          <Badge variant="secondary" size="sm">Manuel</Badge>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleRun(wf)}
                            disabled={isRunning}
                            className="p-2 rounded-lg hover:bg-dark-border disabled:opacity-50"
                            title={wf.hasWebhook ? 'Executer' : 'Ouvrir dans n8n'}
                          >
                            {isRunning ? (
                              <Loader2 className="w-4 h-4 text-primary animate-spin" />
                            ) : (
                              <Play className="w-4 h-4 text-success" />
                            )}
                          </button>
                          <button
                            onClick={() => openInN8n(wf.id)}
                            className="p-2 rounded-lg hover:bg-dark-border"
                            title="Ouvrir dans n8n"
                          >
                            <ExternalLink className="w-4 h-4 text-dark-muted" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
