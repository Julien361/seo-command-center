import { useState } from 'react';
import { Play, Pause, CheckCircle, XCircle, Clock, RefreshCw, Settings, Eye, MoreVertical } from 'lucide-react';
import { Card, Badge, Button } from '../components/common';

const WORKFLOWS_DATA = [
  {
    id: 'wf0',
    name: 'WF0 - SEO Cascade Starter',
    description: 'Lance analyse complète SEO',
    status: 'active',
    lastRun: '2025-12-25 10:30',
    nextRun: '2025-12-25 14:00',
    executions: 156,
    successRate: 98,
    avgDuration: '4m 32s',
    trigger: 'Webhook/Manuel',
  },
  {
    id: 'wf1',
    name: 'WF1 - DataForSEO Keywords',
    description: 'Recherche et analyse keywords',
    status: 'active',
    lastRun: '2025-12-25 11:45',
    nextRun: 'On demand',
    executions: 423,
    successRate: 95,
    avgDuration: '2m 15s',
    trigger: 'Sub-workflow',
  },
  {
    id: 'wf2',
    name: 'WF2 - Perplexity Research',
    description: 'Market intelligence avec citations',
    status: 'active',
    lastRun: '2025-12-25 11:00',
    nextRun: 'On demand',
    executions: 89,
    successRate: 92,
    avgDuration: '3m 45s',
    trigger: 'Sub-workflow',
  },
  {
    id: 'wf3',
    name: 'WF3 - Firecrawl Scrape',
    description: 'Analyse concurrents web scraping',
    status: 'paused',
    lastRun: '2025-12-24 15:20',
    nextRun: 'Paused',
    executions: 67,
    successRate: 88,
    avgDuration: '5m 10s',
    trigger: 'Sub-workflow',
  },
  {
    id: 'wf4',
    name: 'WF4 - Synthesis',
    description: 'Consolidation données SEO',
    status: 'active',
    lastRun: '2025-12-25 09:00',
    nextRun: 'On demand',
    executions: 134,
    successRate: 99,
    avgDuration: '1m 20s',
    trigger: 'Sub-workflow',
  },
  {
    id: 'wf6',
    name: 'WF6 - Clustering',
    description: 'Création cocons sémantiques',
    status: 'active',
    lastRun: '2025-12-25 08:00',
    nextRun: 'On demand',
    executions: 45,
    successRate: 100,
    avgDuration: '6m 30s',
    trigger: 'Sub-workflow',
  },
  {
    id: 'wf7',
    name: 'WF7 - Quick Wins',
    description: 'Détection opportunités P2',
    status: 'running',
    lastRun: 'En cours...',
    nextRun: '-',
    executions: 234,
    successRate: 97,
    avgDuration: '2m 50s',
    trigger: 'Cron quotidien',
  },
  {
    id: 'wf-setup-3',
    name: 'WF-SETUP-3 - Architecture',
    description: 'Structure et architecture site',
    status: 'active',
    lastRun: '2025-12-20 14:00',
    nextRun: 'On demand',
    executions: 12,
    successRate: 100,
    avgDuration: '8m 15s',
    trigger: 'Manuel',
  },
];

const statusConfig = {
  active: { color: 'success', icon: CheckCircle, label: 'Actif' },
  paused: { color: 'warning', icon: Pause, label: 'Pause' },
  running: { color: 'info', icon: RefreshCw, label: 'En cours' },
  error: { color: 'danger', icon: XCircle, label: 'Erreur' },
};

export default function Workflows() {
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);

  const handleRun = (workflowId) => {
    console.log('Running workflow:', workflowId);
    // Intégration n8n MCP ici
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Workflows n8n</h2>
          <p className="text-dark-muted mt-1">8 workflows automatisés</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" icon={Eye}>Voir dans n8n</Button>
          <Button icon={Play}>Lancer WF0</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="text-3xl font-bold text-white">8</div>
          <div className="text-sm text-dark-muted">Workflows Total</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-success">6</div>
          <div className="text-sm text-dark-muted">Actifs</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-info">1</div>
          <div className="text-sm text-dark-muted">En cours</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-primary">96.2%</div>
          <div className="text-sm text-dark-muted">Taux de succès</div>
        </Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Workflow</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Statut</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Déclencheur</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Exécutions</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Succès</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Dernière exécution</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {WORKFLOWS_DATA.map((wf) => {
                const config = statusConfig[wf.status];
                const StatusIcon = config.icon;

                return (
                  <tr key={wf.id} className="border-b border-dark-border/50 hover:bg-dark-border/30">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-${config.color}/20`}>
                          <StatusIcon className={`w-5 h-5 text-${config.color} ${wf.status === 'running' ? 'animate-spin' : ''}`} />
                        </div>
                        <div>
                          <p className="font-medium text-white">{wf.name}</p>
                          <p className="text-xs text-dark-muted">{wf.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={config.color}>{config.label}</Badge>
                    </td>
                    <td className="py-4 px-4 text-dark-muted text-sm">{wf.trigger}</td>
                    <td className="py-4 px-4 text-center text-white">{wf.executions}</td>
                    <td className="py-4 px-4 text-center">
                      <span className={wf.successRate >= 95 ? 'text-success' : wf.successRate >= 90 ? 'text-warning' : 'text-danger'}>
                        {wf.successRate}%
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 text-sm text-dark-muted">
                        <Clock className="w-4 h-4" />
                        {wf.lastRun}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleRun(wf.id)}
                          disabled={wf.status === 'running'}
                          className="p-2 rounded-lg hover:bg-dark-border disabled:opacity-50"
                        >
                          <Play className="w-4 h-4 text-success" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-dark-border">
                          <Settings className="w-4 h-4 text-dark-muted" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
