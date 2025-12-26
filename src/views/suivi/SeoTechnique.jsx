import { useState, useEffect } from 'react';
import { Settings, Gauge, AlertTriangle, CheckCircle, XCircle, Clock, FileX, Search, RefreshCw, ExternalLink, ChevronDown, ChevronRight, Zap, Image, LayoutGrid } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { sitesApi, supabase } from '../../lib/supabase';
import { n8nApi } from '../../lib/n8n';

// Core Web Vitals thresholds
const cwvThresholds = {
  lcp: { good: 2500, poor: 4000, unit: 's', name: 'LCP', fullName: 'Largest Contentful Paint', icon: Image },
  fid: { good: 100, poor: 300, unit: 'ms', name: 'FID', fullName: 'First Input Delay', icon: Zap },
  cls: { good: 0.1, poor: 0.25, unit: '', name: 'CLS', fullName: 'Cumulative Layout Shift', icon: LayoutGrid },
  ttfb: { good: 800, poor: 1800, unit: 'ms', name: 'TTFB', fullName: 'Time to First Byte', icon: Clock },
  fcp: { good: 1800, poor: 3000, unit: 'ms', name: 'FCP', fullName: 'First Contentful Paint', icon: Gauge },
};

// Get status color based on value and thresholds
function getStatusColor(value, metric) {
  const threshold = cwvThresholds[metric];
  if (!threshold) return 'text-dark-muted';
  if (value <= threshold.good) return 'text-success';
  if (value <= threshold.poor) return 'text-warning';
  return 'text-danger';
}

function getStatusBg(value, metric) {
  const threshold = cwvThresholds[metric];
  if (!threshold) return 'bg-dark-muted/10';
  if (value <= threshold.good) return 'bg-success/10';
  if (value <= threshold.poor) return 'bg-warning/10';
  return 'bg-danger/10';
}

// CWV Metric Card
function CWVCard({ metric, value, previousValue }) {
  const config = cwvThresholds[metric];
  if (!config) return null;

  const Icon = config.icon;
  const color = getStatusColor(value, metric);
  const bgColor = getStatusBg(value, metric);

  const formatValue = (v) => {
    if (metric === 'lcp') return (v / 1000).toFixed(2);
    if (metric === 'cls') return v.toFixed(3);
    return Math.round(v);
  };

  const change = previousValue ? value - previousValue : 0;
  const isImprovement = change < 0;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        {previousValue && change !== 0 && (
          <span className={`text-xs ${isImprovement ? 'text-success' : 'text-danger'}`}>
            {isImprovement ? '↓' : '↑'} {Math.abs(change).toFixed(metric === 'cls' ? 3 : 0)}{config.unit}
          </span>
        )}
      </div>
      <div className={`text-2xl font-bold ${color}`}>
        {formatValue(value)}{config.unit}
      </div>
      <div className="text-sm text-dark-muted mt-1">{config.name}</div>
      <div className="text-xs text-dark-muted">{config.fullName}</div>

      {/* Threshold bar */}
      <div className="mt-3 flex gap-1">
        <div className="flex-1 h-1.5 rounded-full bg-success" title={`Bon: < ${config.good}${config.unit}`} />
        <div className="flex-1 h-1.5 rounded-full bg-warning" title={`A ameliorer`} />
        <div className="flex-1 h-1.5 rounded-full bg-danger" title={`Mauvais: > ${config.poor}${config.unit}`} />
      </div>
    </Card>
  );
}

// Issue type configuration
const issueTypes = {
  error_404: { label: 'Erreur 404', icon: FileX, color: 'text-danger', severity: 'high' },
  error_500: { label: 'Erreur 500', icon: XCircle, color: 'text-danger', severity: 'critical' },
  slow_page: { label: 'Page lente', icon: Clock, color: 'text-warning', severity: 'medium' },
  not_indexed: { label: 'Non indexee', icon: Search, color: 'text-warning', severity: 'medium' },
  redirect_chain: { label: 'Chaine de redirections', icon: AlertTriangle, color: 'text-warning', severity: 'medium' },
  missing_meta: { label: 'Meta manquante', icon: AlertTriangle, color: 'text-info', severity: 'low' },
  duplicate_title: { label: 'Titre duplique', icon: AlertTriangle, color: 'text-info', severity: 'low' },
  missing_alt: { label: 'Alt manquant', icon: Image, color: 'text-info', severity: 'low' },
};

// Issue row
function IssueRow({ issue, onResolve }) {
  const config = issueTypes[issue.issue_type] || issueTypes.error_404;
  const Icon = config.icon;

  return (
    <tr className="border-b border-dark-border hover:bg-dark-border/30 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${config.color}`} />
          <span className="text-white">{config.label}</span>
        </div>
      </td>
      <td className="py-3 px-4">
        <a
          href={issue.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline text-sm truncate block max-w-xs"
        >
          {issue.url}
        </a>
      </td>
      <td className="py-3 px-4 text-dark-muted text-sm">
        {issue.sites?.mcp_alias || issue.sites?.domain || '-'}
      </td>
      <td className="py-3 px-4">
        <Badge
          variant={config.severity === 'critical' ? 'danger' : config.severity === 'high' ? 'danger' : config.severity === 'medium' ? 'warning' : 'secondary'}
          size="sm"
        >
          {config.severity === 'critical' ? 'Critique' : config.severity === 'high' ? 'Haute' : config.severity === 'medium' ? 'Moyenne' : 'Basse'}
        </Badge>
      </td>
      <td className="py-3 px-4 text-dark-muted text-sm">
        {new Date(issue.detected_at).toLocaleDateString('fr-FR')}
      </td>
      <td className="py-3 px-4">
        <Button variant="secondary" size="sm" onClick={() => onResolve(issue.id)}>
          <CheckCircle className="w-3 h-3 mr-1" />
          Resolu
        </Button>
      </td>
    </tr>
  );
}

// Site health card
function SiteHealthCard({ site, cwv, issues }) {
  const [expanded, setExpanded] = useState(false);

  const siteIssues = issues.filter(i => i.site_id === site.id);
  const criticalCount = siteIssues.filter(i => ['error_404', 'error_500'].includes(i.issue_type)).length;

  // Calculate health score (simplified)
  let healthScore = 100;
  healthScore -= criticalCount * 10;
  healthScore -= siteIssues.length * 2;
  if (cwv?.lcp > cwvThresholds.lcp.poor) healthScore -= 15;
  if (cwv?.cls > cwvThresholds.cls.poor) healthScore -= 10;
  healthScore = Math.max(0, Math.min(100, healthScore));

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-success';
    if (score >= 50) return 'text-warning';
    return 'text-danger';
  };

  return (
    <Card className="overflow-hidden">
      <div
        className="p-4 cursor-pointer hover:bg-dark-border/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold ${getScoreColor(healthScore)} bg-dark-border`}>
              {healthScore}
            </div>
            <div>
              <h4 className="text-white font-medium">{site.mcp_alias || site.domain}</h4>
              <p className="text-sm text-dark-muted">{siteIssues.length} problemes detectes</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {criticalCount > 0 && (
              <Badge variant="danger" size="sm">{criticalCount} critiques</Badge>
            )}
            {expanded ? <ChevronDown className="w-4 h-4 text-dark-muted" /> : <ChevronRight className="w-4 h-4 text-dark-muted" />}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-dark-border pt-4">
          {/* CWV mini display */}
          {cwv && (
            <div className="grid grid-cols-5 gap-2 mb-4">
              {Object.entries(cwvThresholds).map(([key, config]) => (
                <div key={key} className="text-center p-2 bg-dark-border/30 rounded">
                  <div className={`text-sm font-bold ${getStatusColor(cwv[key] || 0, key)}`}>
                    {key === 'lcp' ? ((cwv[key] || 0) / 1000).toFixed(1) : key === 'cls' ? (cwv[key] || 0).toFixed(2) : Math.round(cwv[key] || 0)}
                  </div>
                  <div className="text-xs text-dark-muted">{config.name}</div>
                </div>
              ))}
            </div>
          )}

          {/* Issues list */}
          {siteIssues.length > 0 ? (
            <div className="space-y-2">
              {siteIssues.slice(0, 5).map(issue => {
                const config = issueTypes[issue.issue_type] || issueTypes.error_404;
                const Icon = config.icon;
                return (
                  <div key={issue.id} className="flex items-center gap-2 text-sm">
                    <Icon className={`w-4 h-4 ${config.color}`} />
                    <span className="text-dark-muted">{config.label}:</span>
                    <span className="text-white truncate">{issue.url}</span>
                  </div>
                );
              })}
              {siteIssues.length > 5 && (
                <p className="text-sm text-dark-muted">+{siteIssues.length - 5} autres problemes</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-success flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Aucun probleme detecte
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

export default function SeoTechnique() {
  const [sites, setSites] = useState([]);
  const [issues, setIssues] = useState([]);
  const [cwvData, setCwvData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSiteId, setSelectedSiteId] = useState('all');
  const [issueTypeFilter, setIssueTypeFilter] = useState('all');
  const [isAuditing, setIsAuditing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load sites
      const sitesData = await sitesApi.getAll();
      setSites(sitesData || []);

      // Load technical SEO issues
      const { data: issuesData, error: issuesError } = await supabase
        .from('technical_seo')
        .select('*, sites(mcp_alias, domain)')
        .eq('status', 'open')
        .order('detected_at', { ascending: false });

      if (!issuesError) {
        setIssues(issuesData || []);
      }

      // Load CWV data (mock for now - would come from PageSpeed API via n8n)
      const mockCwv = {};
      sitesData?.forEach(site => {
        mockCwv[site.id] = {
          lcp: 2000 + Math.random() * 3000,
          fid: 50 + Math.random() * 200,
          cls: Math.random() * 0.3,
          ttfb: 500 + Math.random() * 1500,
          fcp: 1000 + Math.random() * 2500,
        };
      });
      setCwvData(mockCwv);

    } catch (err) {
      console.error('Error loading technical SEO data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async (issueId) => {
    try {
      const { error } = await supabase
        .from('technical_seo')
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('id', issueId);

      if (!error) {
        setIssues(issues.filter(i => i.id !== issueId));
      }
    } catch (err) {
      console.error('Error resolving issue:', err);
    }
  };

  const handleRunAudit = async () => {
    const site = selectedSiteId !== 'all' ? sites.find(s => s.id === selectedSiteId) : null;

    const targetSites = site ? [site] : sites;
    const siteNames = targetSites.map(s => s.domain).join(', ');

    if (!confirm(`Lancer un audit technique pour ${site ? site.domain : 'tous les sites'} ?\n\nCela analysera les Core Web Vitals, erreurs 404/500, et problèmes d'indexation.`)) {
      return;
    }

    setIsAuditing(true);
    try {
      const result = await n8nApi.triggerWebhook('technical-audit', {
        site_alias: site?.mcp_alias || 'all',
        site_ids: targetSites.map(s => s.id)
      });

      if (result.success) {
        alert(`Audit technique lancé pour ${siteNames} ! Les résultats seront disponibles dans quelques minutes.`);
        setTimeout(loadData, 10000);
      } else {
        alert('Erreur: ' + result.error);
      }
    } catch (err) {
      alert('Erreur: ' + err.message);
    } finally {
      setIsAuditing(false);
    }
  };

  // Filter issues
  const filteredIssues = issues.filter(i => {
    if (selectedSiteId !== 'all' && i.site_id !== selectedSiteId) return false;
    if (issueTypeFilter !== 'all' && i.issue_type !== issueTypeFilter) return false;
    return true;
  });

  // Calculate global CWV averages
  const avgCwv = sites.length > 0 ? {
    lcp: Object.values(cwvData).reduce((sum, d) => sum + (d?.lcp || 0), 0) / sites.length,
    fid: Object.values(cwvData).reduce((sum, d) => sum + (d?.fid || 0), 0) / sites.length,
    cls: Object.values(cwvData).reduce((sum, d) => sum + (d?.cls || 0), 0) / sites.length,
    ttfb: Object.values(cwvData).reduce((sum, d) => sum + (d?.ttfb || 0), 0) / sites.length,
    fcp: Object.values(cwvData).reduce((sum, d) => sum + (d?.fcp || 0), 0) / sites.length,
  } : {};

  // Stats
  const stats = {
    totalIssues: issues.length,
    critical: issues.filter(i => ['error_404', 'error_500'].includes(i.issue_type)).length,
    sitesWithIssues: new Set(issues.map(i => i.site_id)).size,
    healthySites: sites.length - new Set(issues.map(i => i.site_id)).size,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">SEO Technique</h1>
          <p className="text-dark-muted mt-1">Core Web Vitals, erreurs et indexation</p>
        </div>
        <Button onClick={handleRunAudit} disabled={isAuditing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isAuditing ? 'animate-spin' : ''}`} />
          {isAuditing ? 'Audit...' : 'Lancer un audit'}
        </Button>
      </div>

      {/* Core Web Vitals */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Core Web Vitals (moyenne)</h3>
        <div className="grid grid-cols-5 gap-4">
          <CWVCard metric="lcp" value={avgCwv.lcp || 0} />
          <CWVCard metric="fid" value={avgCwv.fid || 0} />
          <CWVCard metric="cls" value={avgCwv.cls || 0} />
          <CWVCard metric="ttfb" value={avgCwv.ttfb || 0} />
          <CWVCard metric="fcp" value={avgCwv.fcp || 0} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-danger/10">
              <AlertTriangle className="w-5 h-5 text-danger" />
            </div>
            <div>
              <div className="text-2xl font-bold text-danger">{stats.totalIssues}</div>
              <div className="text-sm text-dark-muted">Problemes detectes</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-danger/10">
              <XCircle className="w-5 h-5 text-danger" />
            </div>
            <div>
              <div className="text-2xl font-bold text-danger">{stats.critical}</div>
              <div className="text-sm text-dark-muted">Erreurs critiques</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <Settings className="w-5 h-5 text-warning" />
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">{stats.sitesWithIssues}</div>
              <div className="text-sm text-dark-muted">Sites avec problemes</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <div className="text-2xl font-bold text-success">{stats.healthySites}</div>
              <div className="text-sm text-dark-muted">Sites sains</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Site health overview */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Sante des sites</h3>
        <div className="grid grid-cols-2 gap-4">
          {sites.map(site => (
            <SiteHealthCard
              key={site.id}
              site={site}
              cwv={cwvData[site.id]}
              issues={issues}
            />
          ))}
        </div>
      </div>

      {/* Issues table */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-dark-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Problemes detectes</h3>
          <div className="flex gap-2">
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="px-3 py-1.5 bg-dark-border border border-dark-border rounded text-white text-sm"
            >
              <option value="all">Tous les sites</option>
              {sites.map(site => (
                <option key={site.id} value={site.id}>{site.mcp_alias || site.domain}</option>
              ))}
            </select>
            <select
              value={issueTypeFilter}
              onChange={(e) => setIssueTypeFilter(e.target.value)}
              className="px-3 py-1.5 bg-dark-border border border-dark-border rounded text-white text-sm"
            >
              <option value="all">Tous les types</option>
              {Object.entries(issueTypes).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredIssues.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle className="w-12 h-12 mx-auto text-success mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Aucun probleme</h3>
            <p className="text-dark-muted">Tous vos sites sont en bonne sante technique</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-border bg-dark-border/30">
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">URL</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Site</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Severite</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Detecte</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIssues.map(issue => (
                    <IssueRow key={issue.id} issue={issue} onResolve={handleResolve} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-dark-border text-sm text-dark-muted">
              {filteredIssues.length} problemes affiches
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
