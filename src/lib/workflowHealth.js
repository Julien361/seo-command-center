/**
 * Workflow Health Monitor
 * Surveille la santé des workflows n8n et détecte les erreurs
 */

import { WORKFLOWS } from './n8n';

const N8N_BASE_URL = 'https://julien1sikoutris.app.n8n.cloud';
const N8N_API_KEY = import.meta.env.VITE_N8N_API_KEY;

// Statuts des exécutions n8n
export const EXECUTION_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  WAITING: 'waiting',
  CANCELED: 'canceled',
  RUNNING: 'running'
};

// Catégories de workflows pour le reporting
export const WORKFLOW_CATEGORIES = {
  orchestration: { name: 'Orchestration', icon: '🎯', critical: true },
  dataCollection: { name: 'Collecte de données', icon: '📥', critical: true },
  processing: { name: 'Traitement', icon: '⚙️', critical: true },
  content: { name: 'Création de contenu', icon: '✍️', critical: false },
  publishing: { name: 'Publication', icon: '🚀', critical: false },
  monitoring: { name: 'Monitoring', icon: '📊', critical: false },
  utilities: { name: 'Utilitaires', icon: '🔧', critical: false }
};

/**
 * Récupère les dernières exécutions via l'API n8n
 */
export async function fetchExecutions(options = {}) {
  const { limit = 100, status = null, workflowId = null } = options;

  try {
    let url = `${N8N_BASE_URL}/api/v1/executions?limit=${limit}`;
    if (status) url += `&status=${status}`;
    if (workflowId) url += `&workflowId=${workflowId}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${N8N_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`n8n API error: ${response.status}`);
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Failed to fetch executions:', error);
    return [];
  }
}

/**
 * Récupère les détails d'une exécution spécifique
 */
export async function fetchExecutionDetails(executionId) {
  try {
    const response = await fetch(`${N8N_BASE_URL}/api/v1/executions/${executionId}`, {
      headers: {
        'Authorization': `Bearer ${N8N_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`n8n API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch execution details:', error);
    return null;
  }
}

/**
 * Vérifie la santé globale des workflows
 */
export async function checkWorkflowHealth() {
  const executions = await fetchExecutions({ limit: 100 });

  // Filtrer par statut
  const errors = executions.filter(e => e.status === EXECUTION_STATUS.ERROR);
  const waiting = executions.filter(e => e.status === EXECUTION_STATUS.WAITING);
  const running = executions.filter(e => e.status === EXECUTION_STATUS.RUNNING);
  const successes = executions.filter(e => e.status === EXECUTION_STATUS.SUCCESS);

  // Mapper les erreurs avec les infos des workflows
  const errorDetails = errors.map(e => {
    const workflowConfig = Object.values(WORKFLOWS).find(w => w.id === e.workflowId);
    return {
      executionId: e.id,
      workflowId: e.workflowId,
      workflowName: e.workflowName || workflowConfig?.name || 'Unknown',
      category: workflowConfig?.category || 'unknown',
      isCritical: WORKFLOW_CATEGORIES[workflowConfig?.category]?.critical || false,
      status: e.status,
      startedAt: e.startedAt,
      stoppedAt: e.stoppedAt,
      mode: e.mode,
      // L'erreur sera dans les détails si on les récupère
      errorPreview: 'Erreur lors de l\'exécution'
    };
  });

  // Calculer les stats par workflow
  const workflowStats = {};
  executions.forEach(e => {
    if (!workflowStats[e.workflowId]) {
      const config = Object.values(WORKFLOWS).find(w => w.id === e.workflowId);
      workflowStats[e.workflowId] = {
        id: e.workflowId,
        name: e.workflowName || config?.name || 'Unknown',
        category: config?.category,
        total: 0,
        success: 0,
        error: 0,
        lastRun: null,
        successRate: 0
      };
    }
    workflowStats[e.workflowId].total++;
    if (e.status === EXECUTION_STATUS.SUCCESS) workflowStats[e.workflowId].success++;
    if (e.status === EXECUTION_STATUS.ERROR) workflowStats[e.workflowId].error++;
    if (!workflowStats[e.workflowId].lastRun || new Date(e.startedAt) > new Date(workflowStats[e.workflowId].lastRun)) {
      workflowStats[e.workflowId].lastRun = e.startedAt;
    }
  });

  // Calculer les taux de succès
  Object.values(workflowStats).forEach(stat => {
    stat.successRate = stat.total > 0 ? Math.round((stat.success / stat.total) * 100) : 0;
  });

  // Déterminer le statut global
  const criticalErrors = errorDetails.filter(e => e.isCritical);
  let healthStatus = 'healthy';
  if (criticalErrors.length > 0) {
    healthStatus = 'critical';
  } else if (errors.length > 0) {
    healthStatus = 'warning';
  } else if (waiting.length > 3) {
    healthStatus = 'attention';
  }

  return {
    status: healthStatus,
    summary: {
      total: executions.length,
      success: successes.length,
      errors: errors.length,
      waiting: waiting.length,
      running: running.length,
      successRate: executions.length > 0
        ? Math.round((successes.length / executions.length) * 100)
        : 100
    },
    errors: errorDetails,
    criticalErrors,
    waiting: waiting.map(e => ({
      executionId: e.id,
      workflowId: e.workflowId,
      workflowName: e.workflowName,
      startedAt: e.startedAt
    })),
    running: running.map(e => ({
      executionId: e.id,
      workflowId: e.workflowId,
      workflowName: e.workflowName,
      startedAt: e.startedAt
    })),
    workflowStats: Object.values(workflowStats),
    lastChecked: new Date().toISOString()
  };
}

/**
 * Récupère les workflows inactifs ou jamais exécutés
 */
export async function getInactiveWorkflows() {
  const executions = await fetchExecutions({ limit: 200 });

  // Créer un set des workflows qui ont été exécutés
  const executedWorkflowIds = new Set(executions.map(e => e.workflowId));

  // Trouver les workflows configurés mais jamais exécutés
  const neverExecuted = Object.entries(WORKFLOWS)
    .filter(([, config]) => !executedWorkflowIds.has(config.id) && !config.isSubWorkflow)
    .map(([key, config]) => ({
      key,
      ...config,
      status: 'never_executed'
    }));

  // Trouver les workflows pas exécutés depuis longtemps (>7 jours)
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const staleWorkflows = [];
  Object.entries(WORKFLOWS).forEach(([key, config]) => {
    if (config.isSubWorkflow) return;

    const wfExecutions = executions.filter(e => e.workflowId === config.id);
    if (wfExecutions.length === 0) return;

    const lastExecution = wfExecutions.reduce((latest, e) =>
      new Date(e.startedAt) > new Date(latest.startedAt) ? e : latest
    );

    if (new Date(lastExecution.startedAt) < sevenDaysAgo) {
      staleWorkflows.push({
        key,
        ...config,
        lastRun: lastExecution.startedAt,
        daysSinceLastRun: Math.floor((now - new Date(lastExecution.startedAt)) / (24 * 60 * 60 * 1000)),
        status: 'stale'
      });
    }
  });

  return {
    neverExecuted,
    staleWorkflows,
    totalConfigured: Object.keys(WORKFLOWS).filter(k => !WORKFLOWS[k].isSubWorkflow).length
  };
}

/**
 * Génère un rapport de santé formaté
 */
export function generateHealthReport(healthData) {
  const { status, summary, errors, criticalErrors, workflowStats } = healthData;

  const statusEmoji = {
    healthy: '🟢',
    attention: '🟡',
    warning: '🟠',
    critical: '🔴'
  };

  const report = {
    emoji: statusEmoji[status],
    title: status === 'healthy'
      ? 'Tous les workflows fonctionnent correctement'
      : status === 'critical'
        ? `${criticalErrors.length} erreur(s) critique(s) détectée(s)`
        : status === 'warning'
          ? `${errors.length} erreur(s) à vérifier`
          : 'Quelques workflows en attente',
    stats: [
      `${summary.successRate}% de réussite`,
      `${summary.success} succès / ${summary.total} exécutions`,
      summary.running > 0 ? `${summary.running} en cours` : null,
      summary.waiting > 0 ? `${summary.waiting} en attente` : null
    ].filter(Boolean),
    recommendations: []
  };

  // Ajouter des recommandations basées sur les erreurs
  if (errors.length > 0) {
    const errorsByWorkflow = {};
    errors.forEach(e => {
      if (!errorsByWorkflow[e.workflowId]) {
        errorsByWorkflow[e.workflowId] = { count: 0, name: e.workflowName };
      }
      errorsByWorkflow[e.workflowId].count++;
    });

    Object.entries(errorsByWorkflow).forEach(([, info]) => {
      if (info.count >= 3) {
        report.recommendations.push(`${info.name}: ${info.count} erreurs récentes - vérifier la configuration`);
      }
    });
  }

  // Ajouter les workflows avec faible taux de succès
  workflowStats
    .filter(w => w.total >= 5 && w.successRate < 80)
    .forEach(w => {
      report.recommendations.push(`${w.name}: seulement ${w.successRate}% de réussite sur ${w.total} exécutions`);
    });

  return report;
}

/**
 * Relance un workflow en erreur
 */
export async function retryWorkflow(workflowId) {
  const workflowConfig = Object.values(WORKFLOWS).find(w => w.id === workflowId);

  if (!workflowConfig || !workflowConfig.webhook) {
    return { success: false, error: 'Workflow non trouvé ou sans webhook' };
  }

  try {
    const response = await fetch(`${N8N_BASE_URL}/webhook/${workflowConfig.webhook}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ retry: true, timestamp: new Date().toISOString() })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return { success: true, workflowName: workflowConfig.name };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export default {
  EXECUTION_STATUS,
  WORKFLOW_CATEGORIES,
  fetchExecutions,
  fetchExecutionDetails,
  checkWorkflowHealth,
  getInactiveWorkflows,
  generateHealthReport,
  retryWorkflow
};
