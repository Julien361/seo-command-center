import { Play, Pause, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { Card, Badge, Button } from '../common';

const WORKFLOWS_DATA = [
  { id: 'wf0', name: 'WF0 - SEO Cascade Starter', status: 'active', lastRun: '2h ago', executions: 156, successRate: 98 },
  { id: 'wf1', name: 'WF1 - DataForSEO Keywords', status: 'active', lastRun: '30m ago', executions: 423, successRate: 95 },
  { id: 'wf2', name: 'WF2 - Perplexity Research', status: 'active', lastRun: '1h ago', executions: 89, successRate: 92 },
  { id: 'wf3', name: 'WF3 - Firecrawl Scrape', status: 'paused', lastRun: '1d ago', executions: 67, successRate: 88 },
  { id: 'wf6', name: 'WF6 - Clustering', status: 'active', lastRun: '4h ago', executions: 45, successRate: 100 },
  { id: 'wf7', name: 'WF7 - Quick Wins', status: 'running', lastRun: 'Now', executions: 234, successRate: 97 },
];

const statusConfig = {
  active: { color: 'success', icon: CheckCircle, label: 'Actif' },
  paused: { color: 'warning', icon: Pause, label: 'Pause' },
  running: { color: 'info', icon: RefreshCw, label: 'En cours' },
  error: { color: 'danger', icon: XCircle, label: 'Erreur' },
};

export default function WorkflowStatus({ onTrigger }) {
  return (
    <Card
      title="Workflows n8n"
      action={
        <Button variant="primary" size="sm" icon={Play} onClick={() => onTrigger?.('wf0')}>
          Lancer WF0
        </Button>
      }
    >
      <div className="space-y-3">
        {WORKFLOWS_DATA.map((wf) => {
          const config = statusConfig[wf.status];
          const StatusIcon = config.icon;

          return (
            <div
              key={wf.id}
              className="flex items-center justify-between p-4 bg-dark-bg rounded-lg hover:bg-dark-border/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg bg-${config.color}/20`}>
                  <StatusIcon className={`w-5 h-5 text-${config.color} ${wf.status === 'running' ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <p className="font-medium text-white">{wf.name}</p>
                  <div className="flex items-center gap-2 text-sm text-dark-muted">
                    <Clock className="w-3 h-3" />
                    <span>{wf.lastRun}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm text-dark-muted">Exécutions</p>
                  <p className="font-semibold text-white">{wf.executions}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-dark-muted">Succès</p>
                  <p className="font-semibold text-success">{wf.successRate}%</p>
                </div>
                <Badge variant={config.color}>{config.label}</Badge>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
