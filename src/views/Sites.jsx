import { useState, useEffect } from 'react';
import { ExternalLink, Search, Plus, MoreVertical, RefreshCw, Loader2, CloudDownload, Zap, X, TrendingUp, TrendingDown, Target, FileText, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, Badge, Button } from '../components/common';
import { sitesApi, keywordsApi, gscApi, supabase } from '../lib/supabase';
import { n8nApi } from '../lib/n8n';

// Site Detail Panel Component
function SiteDetailPanel({ site, onClose }) {
  const [keywords, setKeywords] = useState([]);
  const [pages, setPages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (site?.id) {
      loadSiteData();
    }
  }, [site?.id]);

  const loadSiteData = async () => {
    setIsLoading(true);
    try {
      // Charger keywords et pages du site
      const [kwData, pagesData] = await Promise.all([
        supabase.from('keywords').select('*').eq('site_id', site.id).order('current_position', { ascending: true }).limit(20),
        supabase.from('pages').select('*').eq('site_id', site.id).order('updated_at', { ascending: false }).limit(10)
      ]);

      setKeywords(kwData.data || []);
      setPages(pagesData.data || []);
    } catch (err) {
      console.error('Error loading site data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getPositionColor = (pos) => {
    if (!pos) return 'text-dark-muted';
    if (pos <= 3) return 'text-success';
    if (pos <= 10) return 'text-info';
    if (pos <= 20) return 'text-warning';
    return 'text-danger';
  };

  const getPositionChange = (kw) => {
    if (!kw.previous_position || !kw.current_position) return null;
    return kw.previous_position - kw.current_position;
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary font-bold text-xl">
              {(site.alias || site.domain || '?')[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{site.domain}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-dark-muted text-sm">{site.alias}</span>
                <Badge variant={entityColors[site.entity] || 'secondary'}>{site.entity}</Badge>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-dark-border rounded-lg">
            <X className="w-5 h-5 text-dark-muted" />
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-5 gap-4 p-6 border-b border-dark-border bg-dark-bg/50">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{site.keywords || 0}</div>
            <div className="text-xs text-dark-muted">Keywords</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${site.avgPosition ? getPositionColor(site.avgPosition) : 'text-dark-muted'}`}>
              {site.avgPosition || '-'}
            </div>
            <div className="text-xs text-dark-muted">Position Moy.</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-info">{site.clicks?.toLocaleString() || 0}</div>
            <div className="text-xs text-dark-muted">Clics (28j)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">{site.quickWins || 0}</div>
            <div className="text-xs text-dark-muted">Quick Wins</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{site.articles || 0}</div>
            <div className="text-xs text-dark-muted">Articles</div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              {/* Keywords */}
              <div>
                <h3 className="text-sm font-medium text-dark-muted mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4" /> Keywords ({keywords.length})
                </h3>
                {keywords.length === 0 ? (
                  <p className="text-dark-muted text-sm">Aucun keyword suivi</p>
                ) : (
                  <div className="space-y-2">
                    {keywords.slice(0, 10).map(kw => {
                      const change = getPositionChange(kw);
                      return (
                        <div key={kw.id} className="flex items-center justify-between p-2 bg-dark-bg rounded-lg">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white truncate">{kw.keyword}</div>
                            <div className="text-xs text-dark-muted">
                              Vol: {kw.search_volume?.toLocaleString() || '-'}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {change !== null && change !== 0 && (
                              <span className={`flex items-center text-xs ${change > 0 ? 'text-success' : 'text-danger'}`}>
                                {change > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                {Math.abs(change)}
                              </span>
                            )}
                            <span className={`font-medium ${getPositionColor(kw.current_position)}`}>
                              {kw.current_position || '-'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {keywords.length > 10 && (
                      <p className="text-xs text-dark-muted text-center mt-2">
                        +{keywords.length - 10} autres keywords
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Pages */}
              <div>
                <h3 className="text-sm font-medium text-dark-muted mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Pages auditees ({pages.length})
                </h3>
                {pages.length === 0 ? (
                  <p className="text-dark-muted text-sm">Aucune page auditee</p>
                ) : (
                  <div className="space-y-2">
                    {pages.map(page => (
                      <div key={page.id} className="flex items-center justify-between p-2 bg-dark-bg rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white truncate">{page.title || page.slug}</div>
                          <div className="text-xs text-dark-muted truncate">{page.slug}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-dark-muted">{page.word_count || 0} mots</span>
                          {page.seo_score !== null && (
                            <Badge variant={page.seo_score >= 80 ? 'success' : page.seo_score >= 50 ? 'warning' : 'danger'} size="sm">
                              {page.seo_score}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-dark-border bg-dark-bg/50">
          <div className="text-xs text-dark-muted">
            Derniere sync: {site.lastSync ? new Date(site.lastSync).toLocaleDateString('fr-FR') : 'Jamais'}
          </div>
          <div className="flex gap-2">
            <a href={`https://${site.domain}`} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="sm">
                <ExternalLink className="w-4 h-4 mr-1" /> Visiter
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

const entityColors = {
  'SRAT': 'primary',
  'PRO FORMATION': 'success',
  'METIS': 'info',
  'Client': 'warning',
  'Cabinet': 'secondary',
};

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
      // Charger sites, keywords, quick wins et GSC en parallele
      const [sitesData, keywordsData, quickWinsData, gscData] = await Promise.all([
        sitesApi.getAll(),
        keywordsApi.getAll(),
        import('../lib/supabase').then(m => m.quickWinsApi.getAll()),
        gscApi.getPositionsBySite().catch(() => ({}))
      ]);

      // Calculer les stats par site
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

      // Compter les quick wins par site
      const quickWinsPerSite = {};
      quickWinsData.forEach(qw => {
        if (qw.site_id && qw.status === 'pending') {
          quickWinsPerSite[qw.site_id] = (quickWinsPerSite[qw.site_id] || 0) + 1;
        }
      });

      // Mapper les données Supabase vers le format attendu
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

  // Synchroniser GSC via n8n
  const syncGSC = async () => {
    setIsSyncingGSC(true);
    try {
      const result = await n8nApi.syncGSC();
      if (result.success) {
        // Recharger après un délai pour laisser le workflow s'exécuter
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

  // Synchroniser les stats WordPress de tous les sites
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
      // Recharger les sites après la sync
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

  // Sync automatique au premier chargement (après que les sites soient chargés)
  useEffect(() => {
    if (sites.length > 0 && !isSyncing && syncStatus.lastSync === null) {
      // Lancer la sync en arrière-plan après 1 seconde
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
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSites.map((site) => (
                  <tr
                    key={site.id || site.alias}
                    className="border-b border-dark-border/50 hover:bg-dark-border/30 cursor-pointer"
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
                            <a href={`https://${site.domain}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3 h-3 text-dark-muted hover:text-primary" />
                            </a>
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
                    <td className="py-4 px-4 text-center">
                      <button className="p-2 rounded-lg hover:bg-dark-border">
                        <MoreVertical className="w-4 h-4 text-dark-muted" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Site Detail Panel */}
      {selectedSite && (
        <SiteDetailPanel site={selectedSite} onClose={() => setSelectedSite(null)} />
      )}
    </div>
  );
}
