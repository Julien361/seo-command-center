import { useState, useEffect } from 'react';
import {
  ExternalLink, Search, Plus, MoreVertical, RefreshCw, Loader2, CloudDownload, Zap,
  ArrowLeft, TrendingUp, TrendingDown, Target, FileText, ArrowUp, ArrowDown,
  Globe, MousePointer, Eye, BarChart3, Link2, AlertTriangle, CheckCircle, XCircle,
  Calendar, Clock, Layers, Award, Activity, PieChart, Edit3, Trash2, Settings
} from 'lucide-react';
import { Card, Badge, Button } from '../components/common';
import { sitesApi, keywordsApi, gscApi, supabase } from '../lib/supabase';
import { n8nApi } from '../lib/n8n';

const entityColors = {
  'SRAT': 'primary',
  'PRO FORMATION': 'success',
  'METIS': 'info',
  'Client': 'warning',
  'Cabinet': 'secondary',
};

// Stat Card Component
function StatCard({ icon: Icon, value, label, subValue, color = 'primary', trend }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg bg-${color}/10`}>
          <Icon className={`w-5 h-5 text-${color}`} />
        </div>
        {trend !== undefined && trend !== 0 && (
          <div className={`flex items-center gap-1 text-xs ${trend > 0 ? 'text-success' : 'text-danger'}`}>
            {trend > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-sm text-dark-muted">{label}</div>
        {subValue && <div className="text-xs text-dark-muted mt-1">{subValue}</div>}
      </div>
    </Card>
  );
}

// Site Detail View - Full page component
function SiteDetailView({ site, onBack, onRefresh }) {
  const [isLoading, setIsLoading] = useState(true);
  const [keywords, setKeywords] = useState([]);
  const [pages, setPages] = useState([]);
  const [quickWins, setQuickWins] = useState([]);
  const [backlinks, setBacklinks] = useState([]);
  const [gscData, setGscData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isAuditing, setIsAuditing] = useState(false);

  useEffect(() => {
    if (site?.id) {
      loadAllData();
    }
  }, [site?.id]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [kwRes, pagesRes, qwRes, blRes, gscRes, alertsRes] = await Promise.all([
        supabase.from('keywords').select('*').eq('site_id', site.id).order('current_position', { ascending: true, nullsFirst: false }),
        supabase.from('pages').select('*').eq('site_id', site.id).order('updated_at', { ascending: false }),
        supabase.from('quick_wins').select('*, keywords(keyword, search_volume)').eq('site_id', site.id).order('priority_score', { ascending: false }),
        supabase.from('backlinks').select('*').eq('site_id', site.id).order('first_seen_at', { ascending: false }).limit(50),
        supabase.from('gsc_keyword_history').select('*').eq('site_id', site.id).order('date', { ascending: false }).limit(100),
        supabase.from('alerts').select('*').eq('site_id', site.id).is('read_at', null).order('created_at', { ascending: false }).limit(10)
      ]);

      setKeywords(kwRes.data || []);
      setPages(pagesRes.data || []);
      setQuickWins(qwRes.data || []);
      setBacklinks(blRes.data || []);
      setGscData(gscRes.data || []);
      setAlerts(alertsRes.data || []);
    } catch (err) {
      console.error('Error loading site data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTechnicalAudit = async () => {
    if (!confirm(`Lancer un audit technique sur ${site.domain} avec Firecrawl ?\n\nCela analysera jusqu'a 10 pages du site.`)) {
      return;
    }
    setIsAuditing(true);
    try {
      const result = await n8nApi.triggerWebhook('technical-audit', {
        site_alias: site.alias,
        max_pages: 10
      });
      if (result.success !== false) {
        alert('Audit technique lance ! Les resultats seront disponibles dans ~30 secondes.');
        setTimeout(loadAllData, 30000);
      } else {
        alert('Erreur: ' + (result.error || 'Echec'));
      }
    } catch (err) {
      alert('Erreur: ' + err.message);
    } finally {
      setIsAuditing(false);
    }
  };

  const getPositionColor = (pos) => {
    if (!pos) return 'text-dark-muted';
    if (pos <= 3) return 'text-success';
    if (pos <= 10) return 'text-info';
    if (pos <= 20) return 'text-warning';
    return 'text-danger';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 50) return 'warning';
    return 'danger';
  };

  // Calculate stats
  const stats = {
    totalKeywords: keywords.length,
    rankedKeywords: keywords.filter(k => k.current_position && k.current_position <= 100).length,
    top3: keywords.filter(k => k.current_position && k.current_position <= 3).length,
    top10: keywords.filter(k => k.current_position && k.current_position <= 10).length,
    top20: keywords.filter(k => k.current_position && k.current_position <= 20).length,
    avgPosition: keywords.filter(k => k.current_position).length > 0
      ? (keywords.filter(k => k.current_position).reduce((sum, k) => sum + k.current_position, 0) / keywords.filter(k => k.current_position).length).toFixed(1)
      : '-',
    totalVolume: keywords.reduce((sum, k) => sum + (k.search_volume || 0), 0),
    totalPages: pages.length,
    auditedPages: pages.filter(p => p.seo_score !== null).length,
    avgSeoScore: pages.filter(p => p.seo_score !== null).length > 0
      ? Math.round(pages.filter(p => p.seo_score !== null).reduce((sum, p) => sum + p.seo_score, 0) / pages.filter(p => p.seo_score !== null).length)
      : '-',
    quickWinsCount: quickWins.filter(qw => qw.status === 'pending').length,
    backlinksCount: backlinks.length,
    dofollowLinks: backlinks.filter(b => b.link_type === 'dofollow').length,
    alertsCount: alerts.length
  };

  // GSC aggregated data
  const gscStats = gscData.reduce((acc, row) => {
    acc.clicks += row.clicks || 0;
    acc.impressions += row.impressions || 0;
    return acc;
  }, { clicks: 0, impressions: 0 });
  gscStats.ctr = gscStats.impressions > 0 ? ((gscStats.clicks / gscStats.impressions) * 100).toFixed(2) : 0;

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: PieChart },
    { id: 'keywords', label: `Keywords (${stats.totalKeywords})`, icon: Target },
    { id: 'pages', label: `Pages (${stats.totalPages})`, icon: FileText },
    { id: 'quickwins', label: `Quick Wins (${stats.quickWinsCount})`, icon: Zap },
    { id: 'backlinks', label: `Backlinks (${stats.backlinksCount})`, icon: Link2 },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center text-primary font-bold text-2xl">
            {(site.alias || site.domain || '?')[0].toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{site.domain}</h1>
              <a href={`https://${site.domain}`} target="_blank" rel="noopener noreferrer" className="text-dark-muted hover:text-primary">
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-dark-muted">{site.alias}</span>
              <Badge variant={entityColors[site.entity] || 'secondary'}>{site.entity}</Badge>
              {site.focus && <span className="text-sm text-dark-muted">• {site.focus}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={loadAllData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="secondary" onClick={handleTechnicalAudit} disabled={isAuditing}>
            <Activity className={`w-4 h-4 mr-2 ${isAuditing ? 'animate-spin' : ''}`} />
            {isAuditing ? 'Audit...' : 'Audit Technique'}
          </Button>
          <Button variant="ghost">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Alerts Banner */}
      {stats.alertsCount > 0 && (
        <Card className="p-4 border-warning/30 bg-warning/5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <span className="text-white font-medium">{stats.alertsCount} alerte{stats.alertsCount > 1 ? 's' : ''} non lue{stats.alertsCount > 1 ? 's' : ''}</span>
            <div className="flex-1" />
            <Button variant="ghost" size="sm">Voir les alertes</Button>
          </div>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-6 gap-4">
        <StatCard icon={Target} value={stats.totalKeywords} label="Keywords suivis" subValue={`${stats.rankedKeywords} positionnés`} color="primary" />
        <StatCard icon={Award} value={stats.top10} label="Top 10" subValue={`${stats.top3} en top 3`} color="success" />
        <StatCard icon={BarChart3} value={stats.avgPosition} label="Position moyenne" color="info" />
        <StatCard icon={MousePointer} value={gscStats.clicks.toLocaleString()} label="Clics GSC" subValue={`CTR: ${gscStats.ctr}%`} color="info" />
        <StatCard icon={Eye} value={gscStats.impressions.toLocaleString()} label="Impressions" color="secondary" />
        <StatCard icon={Zap} value={stats.quickWinsCount} label="Quick Wins" subValue="Opportunités P11-20" color="warning" />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={FileText} value={stats.totalPages} label="Pages" subValue={`${stats.auditedPages} auditées`} color="primary" />
        <StatCard icon={CheckCircle} value={stats.avgSeoScore} label="Score SEO moyen" color={typeof stats.avgSeoScore === 'number' ? getScoreColor(stats.avgSeoScore) : 'secondary'} />
        <StatCard icon={Link2} value={stats.backlinksCount} label="Backlinks" subValue={`${stats.dofollowLinks} dofollow`} color="info" />
        <StatCard icon={Globe} value={stats.totalVolume.toLocaleString()} label="Volume total" subValue="Recherches/mois" color="success" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-dark-border pb-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'text-primary border-primary'
                : 'text-dark-muted border-transparent hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 gap-6">
          {/* Top Keywords */}
          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-dark-border flex items-center justify-between">
              <h3 className="font-medium text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Top Keywords
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setActiveTab('keywords')}>Voir tout</Button>
            </div>
            <div className="divide-y divide-dark-border/50">
              {keywords.slice(0, 8).map(kw => {
                const change = kw.previous_position && kw.current_position
                  ? kw.previous_position - kw.current_position
                  : null;
                return (
                  <div key={kw.id} className="p-3 hover:bg-dark-border/30 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      kw.current_position <= 3 ? 'bg-success/20 text-success' :
                      kw.current_position <= 10 ? 'bg-info/20 text-info' :
                      kw.current_position <= 20 ? 'bg-warning/20 text-warning' :
                      'bg-dark-border text-dark-muted'
                    }`}>
                      {kw.current_position || '-'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{kw.keyword}</div>
                      <div className="text-xs text-dark-muted">
                        Vol: {kw.search_volume?.toLocaleString() || '-'} • Diff: {kw.difficulty || '-'}
                      </div>
                    </div>
                    {change !== null && change !== 0 && (
                      <div className={`flex items-center gap-1 text-xs ${change > 0 ? 'text-success' : 'text-danger'}`}>
                        {change > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        {Math.abs(change)}
                      </div>
                    )}
                  </div>
                );
              })}
              {keywords.length === 0 && (
                <div className="p-8 text-center text-dark-muted">
                  Aucun keyword suivi
                </div>
              )}
            </div>
          </Card>

          {/* Recent Pages */}
          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-dark-border flex items-center justify-between">
              <h3 className="font-medium text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Pages Recentes
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setActiveTab('pages')}>Voir tout</Button>
            </div>
            <div className="divide-y divide-dark-border/50">
              {pages.slice(0, 8).map(page => (
                <div key={page.id} className="p-3 hover:bg-dark-border/30 flex items-center gap-3">
                  {page.seo_score !== null ? (
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold bg-${getScoreColor(page.seo_score)}/20 text-${getScoreColor(page.seo_score)}`}>
                      {page.seo_score}
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm bg-dark-border text-dark-muted">
                      -
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{page.title || page.slug || 'Sans titre'}</div>
                    <div className="text-xs text-dark-muted truncate">
                      {page.word_count || 0} mots • {page.slug || '/'}
                    </div>
                  </div>
                  {page.wp_url && (
                    <a href={page.wp_url} target="_blank" rel="noopener noreferrer" className="text-dark-muted hover:text-primary">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
              {pages.length === 0 && (
                <div className="p-8 text-center text-dark-muted">
                  <p>Aucune page auditée</p>
                  <Button variant="secondary" size="sm" className="mt-2" onClick={handleTechnicalAudit}>
                    Lancer un audit
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Wins */}
          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-dark-border flex items-center justify-between">
              <h3 className="font-medium text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-warning" />
                Quick Wins
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setActiveTab('quickwins')}>Voir tout</Button>
            </div>
            <div className="divide-y divide-dark-border/50">
              {quickWins.filter(qw => qw.status === 'pending').slice(0, 5).map(qw => (
                <div key={qw.id} className="p-3 hover:bg-dark-border/30 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold bg-warning/20 text-warning">
                    {qw.current_position || '-'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{qw.keywords?.keyword || qw.keyword_id}</div>
                    <div className="text-xs text-dark-muted">
                      Vol: {qw.keywords?.search_volume?.toLocaleString() || '-'} • Score: {qw.priority_score || '-'}
                    </div>
                  </div>
                  <Badge variant="warning" size="sm">P{qw.current_position}</Badge>
                </div>
              ))}
              {quickWins.filter(qw => qw.status === 'pending').length === 0 && (
                <div className="p-8 text-center text-dark-muted">
                  Aucun quick win détecté
                </div>
              )}
            </div>
          </Card>

          {/* Backlinks */}
          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-dark-border flex items-center justify-between">
              <h3 className="font-medium text-white flex items-center gap-2">
                <Link2 className="w-4 h-4 text-info" />
                Backlinks Recents
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setActiveTab('backlinks')}>Voir tout</Button>
            </div>
            <div className="divide-y divide-dark-border/50">
              {backlinks.slice(0, 5).map(bl => (
                <div key={bl.id} className="p-3 hover:bg-dark-border/30 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    bl.domain_rating >= 50 ? 'bg-success/20 text-success' :
                    bl.domain_rating >= 30 ? 'bg-warning/20 text-warning' :
                    'bg-dark-border text-dark-muted'
                  }`}>
                    {bl.domain_rating || '-'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{bl.source_domain}</div>
                    <div className="text-xs text-dark-muted truncate">
                      {bl.anchor_text || 'Pas d\'ancre'} • {bl.link_type || 'unknown'}
                    </div>
                  </div>
                  <Badge variant={bl.link_type === 'dofollow' ? 'success' : 'secondary'} size="sm">
                    {bl.link_type || '?'}
                  </Badge>
                </div>
              ))}
              {backlinks.length === 0 && (
                <div className="p-8 text-center text-dark-muted">
                  Aucun backlink enregistré
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'keywords' && (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-border bg-dark-bg/50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Keyword</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Position</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Évolution</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Volume</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Difficulté</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Intent</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Quick Win</th>
                </tr>
              </thead>
              <tbody>
                {keywords.map(kw => {
                  const change = kw.previous_position && kw.current_position
                    ? kw.previous_position - kw.current_position
                    : null;
                  return (
                    <tr key={kw.id} className="border-b border-dark-border/50 hover:bg-dark-border/30">
                      <td className="py-3 px-4">
                        <div className="text-white">{kw.keyword}</div>
                        {kw.target_url && <div className="text-xs text-dark-muted truncate max-w-xs">{kw.target_url}</div>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-bold ${getPositionColor(kw.current_position)}`}>
                          {kw.current_position || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {change !== null && change !== 0 ? (
                          <span className={`flex items-center justify-center gap-1 ${change > 0 ? 'text-success' : 'text-danger'}`}>
                            {change > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                            {Math.abs(change)}
                          </span>
                        ) : (
                          <span className="text-dark-muted">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center text-white">{kw.search_volume?.toLocaleString() || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        {kw.difficulty ? (
                          <Badge variant={kw.difficulty < 30 ? 'success' : kw.difficulty < 60 ? 'warning' : 'danger'}>
                            {kw.difficulty}
                          </Badge>
                        ) : (
                          <span className="text-dark-muted">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {kw.intent ? (
                          <Badge variant="secondary">{kw.intent}</Badge>
                        ) : (
                          <span className="text-dark-muted">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {kw.is_quick_win ? (
                          <CheckCircle className="w-5 h-5 text-success mx-auto" />
                        ) : (
                          <span className="text-dark-muted">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {keywords.length === 0 && (
            <div className="p-12 text-center text-dark-muted">
              Aucun keyword suivi pour ce site
            </div>
          )}
        </Card>
      )}

      {activeTab === 'pages' && (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-border bg-dark-bg/50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Page</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Score SEO</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Mots</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Title</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">H1</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Meta Desc</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pages.map(page => (
                  <tr key={page.id} className="border-b border-dark-border/50 hover:bg-dark-border/30">
                    <td className="py-3 px-4">
                      <div className="text-white truncate max-w-xs">{page.title || 'Sans titre'}</div>
                      <div className="text-xs text-dark-muted truncate max-w-xs">{page.slug || '/'}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {page.seo_score !== null ? (
                        <Badge variant={getScoreColor(page.seo_score)}>{page.seo_score}</Badge>
                      ) : (
                        <span className="text-dark-muted">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={page.word_count >= 1000 ? 'text-success' : page.word_count >= 300 ? 'text-white' : 'text-warning'}>
                        {page.word_count || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {page.meta_title ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-success" />
                            <span className="text-xs text-dark-muted">{page.meta_title.length}/60</span>
                          </>
                        ) : (
                          <XCircle className="w-4 h-4 text-danger" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {page.h1 ? (
                        <CheckCircle className="w-4 h-4 text-success mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-danger mx-auto" />
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {page.meta_description ? (
                        <div className="flex items-center justify-center gap-1">
                          <CheckCircle className="w-4 h-4 text-success" />
                          <span className="text-xs text-dark-muted">{page.meta_description.length}</span>
                        </div>
                      ) : (
                        <XCircle className="w-4 h-4 text-danger mx-auto" />
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {page.wp_url && (
                        <a href={page.wp_url} target="_blank" rel="noopener noreferrer" className="text-dark-muted hover:text-primary">
                          <ExternalLink className="w-4 h-4 mx-auto" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages.length === 0 && (
            <div className="p-12 text-center text-dark-muted">
              <p>Aucune page auditée</p>
              <Button variant="secondary" className="mt-4" onClick={handleTechnicalAudit} disabled={isAuditing}>
                {isAuditing ? 'Audit en cours...' : 'Lancer un audit technique'}
              </Button>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'quickwins' && (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-border bg-dark-bg/50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Keyword</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Position</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Volume</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Score Priorité</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Statut</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Action recommandée</th>
                </tr>
              </thead>
              <tbody>
                {quickWins.map(qw => (
                  <tr key={qw.id} className="border-b border-dark-border/50 hover:bg-dark-border/30">
                    <td className="py-3 px-4 text-white">{qw.keywords?.keyword || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="warning">{qw.current_position || '-'}</Badge>
                    </td>
                    <td className="py-3 px-4 text-center text-white">{qw.keywords?.search_volume?.toLocaleString() || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-primary">{qw.priority_score || '-'}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={qw.status === 'pending' ? 'warning' : qw.status === 'done' ? 'success' : 'secondary'}>
                        {qw.status || 'pending'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-dark-muted text-sm">{qw.recommended_action || 'Optimiser le contenu'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {quickWins.length === 0 && (
            <div className="p-12 text-center text-dark-muted">
              Aucun quick win détecté pour ce site
            </div>
          )}
        </Card>
      )}

      {activeTab === 'backlinks' && (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-border bg-dark-bg/50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Source</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">DR</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Ancre</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Page cible</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Découvert</th>
                </tr>
              </thead>
              <tbody>
                {backlinks.map(bl => (
                  <tr key={bl.id} className="border-b border-dark-border/50 hover:bg-dark-border/30">
                    <td className="py-3 px-4">
                      <a href={bl.source_url} target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary flex items-center gap-1">
                        {bl.source_domain}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-bold ${
                        bl.domain_rating >= 50 ? 'text-success' :
                        bl.domain_rating >= 30 ? 'text-warning' :
                        'text-dark-muted'
                      }`}>
                        {bl.domain_rating || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={bl.link_type === 'dofollow' ? 'success' : 'secondary'}>
                        {bl.link_type || '?'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-dark-muted truncate max-w-xs">{bl.anchor_text || '-'}</td>
                    <td className="py-3 px-4 text-dark-muted truncate max-w-xs">{bl.target_url || '/'}</td>
                    <td className="py-3 px-4 text-center text-dark-muted text-sm">
                      {bl.first_seen_at ? new Date(bl.first_seen_at).toLocaleDateString('fr-FR') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {backlinks.length === 0 && (
            <div className="p-12 text-center text-dark-muted">
              Aucun backlink enregistré pour ce site
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// Main Sites List Component
export default function Sites({ onNavigate }) {
  const [sites, setSites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingGSC, setIsSyncingGSC] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ done: 0, total: 0, lastSync: null });
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEntity, setFilterEntity] = useState('all');
  const [selectedSite, setSelectedSite] = useState(null);

  const loadSites = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sitesData, keywordsData, quickWinsData, gscData] = await Promise.all([
        sitesApi.getAll(),
        keywordsApi.getAll(),
        import('../lib/supabase').then(m => m.quickWinsApi.getAll()),
        gscApi.getPositionsBySite().catch(() => ({}))
      ]);

      const statsPerSite = {};
      keywordsData.forEach(kw => {
        if (kw.site_id) {
          if (!statsPerSite[kw.site_id]) {
            statsPerSite[kw.site_id] = { keywords: 0, volume: 0 };
          }
          statsPerSite[kw.site_id].keywords += 1;
          statsPerSite[kw.site_id].volume += (kw.search_volume || 0);
        }
      });

      const quickWinsPerSite = {};
      quickWinsData.forEach(qw => {
        if (qw.site_id && qw.status === 'pending') {
          quickWinsPerSite[qw.site_id] = (quickWinsPerSite[qw.site_id] || 0) + 1;
        }
      });

      const mappedSites = sitesData.map(site => {
        const stats = statsPerSite[site.id] || { keywords: 0, volume: 0 };
        const gsc = gscData[site.id] || {};

        return {
          id: site.id,
          alias: site.mcp_alias,
          domain: site.domain,
          entity: site.entity_id,
          focus: site.seo_focus || '',
          status: site.is_active ? 'active' : 'inactive',
          keywords: stats.keywords,
          volume: stats.volume,
          quickWins: quickWinsPerSite[site.id] || 0,
          articles: site.total_articles || 0,
          avgPosition: gsc.avgPosition || null,
          clicks: gsc.totalClicks || 0,
          impressions: gsc.totalImpressions || 0,
          priority: site.priority || 3,
          lastSync: site.last_monitored_at,
        };
      });
      setSites(mappedSites);
    } catch (err) {
      console.error('Erreur chargement sites:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const syncGSC = async () => {
    setIsSyncingGSC(true);
    try {
      const result = await n8nApi.syncGSC();
      if (result.success) {
        setTimeout(loadSites, 5000);
      } else {
        setError('Erreur sync GSC: ' + result.error);
      }
    } catch (err) {
      setError('Erreur sync GSC: ' + err.message);
    } finally {
      setIsSyncingGSC(false);
    }
  };

  const syncAllSites = async () => {
    setIsSyncing(true);
    setSyncStatus({ done: 0, total: 0, lastSync: null });

    try {
      const allSites = await sitesApi.getAll();
      const sitesWithWP = allSites.filter(s => s.wp_api_url && s.wp_username && s.wp_app_password);
      setSyncStatus(prev => ({ ...prev, total: sitesWithWP.length }));

      for (let i = 0; i < sitesWithWP.length; i++) {
        const site = sitesWithWP[i];
        await sitesApi.syncSiteStats(site);
        setSyncStatus(prev => ({ ...prev, done: i + 1 }));
      }

      setSyncStatus(prev => ({ ...prev, lastSync: new Date() }));
      await loadSites();
    } catch (err) {
      console.error('Sync error:', err);
      setError('Erreur lors de la synchronisation');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadSites();
  }, []);

  useEffect(() => {
    if (sites.length > 0 && !isSyncing && syncStatus.lastSync === null) {
      const timer = setTimeout(() => {
        syncAllSites();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [sites.length]);

  const entities = [...new Set(sites.map(s => s.entity).filter(Boolean))];

  const filteredSites = sites.filter(site => {
    const matchesSearch = (site.domain?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (site.alias?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesEntity = filterEntity === 'all' || site.entity === filterEntity;
    return matchesSearch && matchesEntity;
  });

  // If a site is selected, show the detail view
  if (selectedSite) {
    return (
      <SiteDetailView
        site={selectedSite}
        onBack={() => setSelectedSite(null)}
        onRefresh={loadSites}
      />
    );
  }

  // Otherwise show the sites list
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Sites du Portfolio</h2>
          <p className="text-dark-muted mt-1">
            {isLoading ? 'Chargement...' : `${sites.length} site${sites.length > 1 ? 's' : ''} WordPress`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            icon={isSyncingGSC ? Loader2 : Zap}
            onClick={syncGSC}
            disabled={isSyncingGSC || isLoading}
            className={isSyncingGSC ? 'animate-pulse' : ''}
            title="Synchronise les positions depuis Google Search Console"
          >
            {isSyncingGSC ? 'Sync GSC...' : 'Sync GSC'}
          </Button>
          <Button
            variant="secondary"
            icon={isSyncing ? Loader2 : CloudDownload}
            onClick={syncAllSites}
            disabled={isSyncing || isLoading}
            className={isSyncing ? 'animate-pulse' : ''}
          >
            {isSyncing
              ? `Sync ${syncStatus.done}/${syncStatus.total}`
              : syncStatus.lastSync
                ? 'Re-synchroniser'
                : 'Sync WordPress'
            }
          </Button>
          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={loadSites}
            disabled={isLoading}
          >
            {isLoading ? 'Chargement...' : 'Actualiser'}
          </Button>
          <Button icon={Plus} onClick={() => onNavigate && onNavigate('add-site')}>
            Ajouter un site
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 text-danger">
          Erreur: {error}
        </div>
      )}

      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
            <input
              type="text"
              placeholder="Rechercher un site..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-lg pl-10 pr-4 py-2 text-white placeholder:text-dark-muted focus:outline-none focus:border-primary"
            />
          </div>
          <select
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            className="bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
          >
            <option value="all">Toutes les entités</option>
            {entities.map(entity => (
              <option key={entity} value={entity}>{entity}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filteredSites.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-dark-muted">Aucun site trouvé</p>
            <Button
              className="mt-4"
              icon={Plus}
              onClick={() => onNavigate && onNavigate('add-site')}
            >
              Ajouter votre premier site
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Site</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Entité</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Keywords</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Pos. Moy.</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Clics GSC</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Quick Wins</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Articles</th>
                </tr>
              </thead>
              <tbody>
                {filteredSites.map((site) => (
                  <tr
                    key={site.id || site.alias}
                    className="border-b border-dark-border/50 hover:bg-dark-border/30 cursor-pointer transition-colors"
                    onClick={() => setSelectedSite(site)}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary font-bold">
                          {(site.alias || site.domain || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{site.domain}</span>
                            <ExternalLink className="w-3 h-3 text-dark-muted" />
                          </div>
                          <span className="text-xs text-dark-muted">{site.alias}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={entityColors[site.entity] || 'secondary'}>{site.entity || '-'}</Badge>
                    </td>
                    <td className="py-4 px-4 text-center text-white">{site.keywords}</td>
                    <td className="py-4 px-4 text-center">
                      {site.avgPosition ? (
                        <Badge variant={site.avgPosition <= 10 ? 'success' : site.avgPosition <= 30 ? 'warning' : 'secondary'}>
                          {site.avgPosition}
                        </Badge>
                      ) : (
                        <span className="text-dark-muted">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center text-white">
                      {site.clicks > 0 ? site.clicks.toLocaleString() : '-'}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {site.quickWins > 0 ? (
                        <Badge variant="warning">{site.quickWins}</Badge>
                      ) : (
                        <span className="text-dark-muted">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center text-white">{site.articles}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
