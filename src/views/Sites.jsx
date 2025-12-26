import { useState, useEffect } from 'react';
import { ExternalLink, Search, Plus, TrendingUp, TrendingDown, MoreVertical, RefreshCw, Loader2, CloudDownload, CheckCircle } from 'lucide-react';
import { Card, Badge, Button } from '../components/common';
import { sitesApi } from '../lib/supabase';

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
  const [syncStatus, setSyncStatus] = useState({ done: 0, total: 0, lastSync: null });
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEntity, setFilterEntity] = useState('all');

  const loadSites = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await sitesApi.getAll();
      // Mapper les données Supabase vers le format attendu
      const mappedSites = data.map(site => ({
        id: site.id,
        alias: site.mcp_alias,
        domain: site.domain,
        entity: site.entity_id,
        focus: site.seo_focus || '',
        status: site.is_active ? 'active' : 'inactive',
        keywords: site.total_keywords_tracked || 0,
        articles: site.total_articles || 0,
        avgPos: site.avg_position || '-',
        trend: site.trend || 'neutral',
        traffic: site.monthly_traffic || 0,
        priority: site.priority || 3,
      }));
      setSites(mappedSites);
    } catch (err) {
      console.error('Erreur chargement sites:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
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
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Focus</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Keywords</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Articles</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Pos. Moy.</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Traffic</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSites.map((site) => (
                  <tr key={site.id || site.alias} className="border-b border-dark-border/50 hover:bg-dark-border/30">
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
                    <td className="py-4 px-4 text-dark-muted text-sm">{site.focus || '-'}</td>
                    <td className="py-4 px-4 text-center text-white">{site.keywords}</td>
                    <td className="py-4 px-4 text-center text-white">{site.articles}</td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-white">{site.avgPos || '-'}</span>
                        {site.trend === 'up' && <TrendingUp className="w-4 h-4 text-success" />}
                        {site.trend === 'down' && <TrendingDown className="w-4 h-4 text-danger" />}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center text-white">{site.traffic}</td>
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
    </div>
  );
}
