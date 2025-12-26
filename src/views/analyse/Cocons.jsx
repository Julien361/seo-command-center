import { useState, useEffect } from 'react';
import { GitBranch, Plus, ChevronRight, ChevronDown, Search, Filter, MoreVertical, Eye, Edit2, Trash2, ExternalLink } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { clustersApi, sitesApi } from '../../lib/supabase';

// Status colors
const statusColors = {
  draft: 'bg-dark-muted',
  active: 'bg-success',
  archived: 'bg-warning'
};

const statusLabels = {
  draft: 'Brouillon',
  active: 'Actif',
  archived: 'Archive'
};

// Cluster Card Component
function ClusterCard({ cluster, isExpanded, onToggle, onSelect }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-dark-border/50 rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-dark-border/80 transition-colors"
        onClick={onToggle}
      >
        <button className="text-dark-muted hover:text-white">
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-primary" />
            <h3 className="font-medium text-white truncate">{cluster.name}</h3>
          </div>
          <p className="text-sm text-dark-muted truncate mt-0.5">
            Keyword: {cluster.main_keyword}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-medium text-white">{cluster.satellite_count || 0} satellites</div>
            {cluster.avg_position && (
              <div className="text-xs text-dark-muted">Pos. moy: {cluster.avg_position}</div>
            )}
          </div>

          <span className={`w-2 h-2 rounded-full ${statusColors[cluster.status] || statusColors.draft}`} />

          <div className="relative">
            <button
              className="p-1 hover:bg-dark-border rounded text-dark-muted hover:text-white"
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-dark-card border border-dark-border rounded-lg shadow-xl z-10 py-1 min-w-[140px]">
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-dark-muted hover:bg-dark-border hover:text-white"
                  onClick={(e) => { e.stopPropagation(); onSelect(cluster); setShowMenu(false); }}
                >
                  <Eye className="w-4 h-4" />
                  Voir details
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-dark-muted hover:bg-dark-border hover:text-white">
                  <Edit2 className="w-4 h-4" />
                  Modifier
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-dark-border">
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-dark-border p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-dark-muted">Pages du cocon</span>
            <Button size="sm" variant="ghost">
              <Plus className="w-3 h-3 mr-1" />
              Ajouter
            </Button>
          </div>

          {cluster.satellite_count > 0 ? (
            <div className="space-y-2">
              {/* Placeholder for satellites */}
              <div className="text-sm text-dark-muted italic">
                Chargement des satellites...
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-dark-muted">
              <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucun satellite dans ce cocon</p>
              <Button size="sm" variant="ghost" className="mt-2">
                <Plus className="w-3 h-3 mr-1" />
                Creer un satellite
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Mini Mind Map Visualization
function MiniMindMap({ clusters }) {
  if (clusters.length === 0) return null;

  // Take top 5 clusters for visualization
  const topClusters = clusters.slice(0, 5);
  const centerX = 200;
  const centerY = 150;
  const radius = 100;

  return (
    <div className="bg-dark-border/30 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white">Apercu des Cocons</h3>
        <Badge variant="default">{clusters.length} cocons</Badge>
      </div>

      <svg width="100%" height="300" viewBox="0 0 400 300" className="mx-auto">
        {/* Center node */}
        <circle cx={centerX} cy={centerY} r="40" fill="#8b5cf6" fillOpacity="0.3" stroke="#8b5cf6" strokeWidth="2" />
        <text x={centerX} y={centerY} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="12" fontWeight="bold">
          Site
        </text>

        {/* Cluster nodes */}
        {topClusters.map((cluster, i) => {
          const angle = (i * 360 / topClusters.length - 90) * (Math.PI / 180);
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;

          return (
            <g key={cluster.id}>
              {/* Connection line */}
              <line x1={centerX} y1={centerY} x2={x} y2={y} stroke="#475569" strokeWidth="2" />

              {/* Cluster node */}
              <circle cx={x} cy={y} r="30" fill="#1e293b" stroke="#8b5cf6" strokeWidth="2" />

              {/* Cluster name */}
              <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="9">
                {cluster.name.length > 12 ? cluster.name.substring(0, 12) + '...' : cluster.name}
              </text>

              {/* Satellite count */}
              <text x={x} y={y + 12} textAnchor="middle" fill="#64748b" fontSize="8">
                {cluster.satellite_count || 0} sat.
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function Cocons() {
  const [clusters, setClusters] = useState([]);
  const [sites, setSites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [expandedClusters, setExpandedClusters] = useState({});
  const [selectedCluster, setSelectedCluster] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [clustersData, sitesData] = await Promise.all([
        clustersApi.getAll(),
        sitesApi.getAll()
      ]);
      setClusters(clustersData || []);
      setSites(sitesData || []);
    } catch (err) {
      console.error('Error loading clusters:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCluster = (clusterId) => {
    setExpandedClusters(prev => ({
      ...prev,
      [clusterId]: !prev[clusterId]
    }));
  };

  // Filter clusters
  const filteredClusters = clusters.filter(cluster => {
    const matchesSearch = cluster.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cluster.main_keyword?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSite = selectedSiteId === 'all' || cluster.site_id === selectedSiteId;
    const matchesStatus = selectedStatus === 'all' || cluster.status === selectedStatus;
    return matchesSearch && matchesSite && matchesStatus;
  });

  // Group by site
  const clustersBySite = filteredClusters.reduce((acc, cluster) => {
    const site = sites.find(s => s.id === cluster.site_id);
    const siteName = site?.mcp_alias || site?.domain || 'Non assigne';
    if (!acc[siteName]) acc[siteName] = [];
    acc[siteName].push(cluster);
    return acc;
  }, {});

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
          <h1 className="text-2xl font-bold text-white">Cocons Semantiques</h1>
          <p className="text-dark-muted mt-1">Organisez votre contenu en cocons thematiques</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Cocon
        </Button>
      </div>

      {/* Mini Mind Map */}
      <MiniMindMap clusters={filteredClusters} />

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
              <input
                type="text"
                placeholder="Rechercher un cocon..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Tous les sites</option>
            {sites.map(site => (
              <option key={site.id} value={site.id}>{site.mcp_alias || site.domain}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Tous les statuts</option>
            <option value="draft">Brouillon</option>
            <option value="active">Actif</option>
            <option value="archived">Archive</option>
          </select>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-white">{clusters.length}</div>
          <div className="text-sm text-dark-muted">Cocons total</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-success">{clusters.filter(c => c.status === 'active').length}</div>
          <div className="text-sm text-dark-muted">Cocons actifs</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-warning">{clusters.filter(c => c.status === 'draft').length}</div>
          <div className="text-sm text-dark-muted">Brouillons</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-primary">{clusters.reduce((sum, c) => sum + (c.satellite_count || 0), 0)}</div>
          <div className="text-sm text-dark-muted">Satellites total</div>
        </Card>
      </div>

      {/* Clusters List */}
      {error ? (
        <Card className="p-6 text-center">
          <p className="text-danger">{error}</p>
          <Button onClick={loadData} className="mt-4">Reessayer</Button>
        </Card>
      ) : filteredClusters.length === 0 ? (
        <Card className="p-12 text-center">
          <GitBranch className="w-12 h-12 mx-auto text-dark-muted mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Aucun cocon trouve</h3>
          <p className="text-dark-muted mb-6">Creez votre premier cocon semantique pour organiser votre contenu</p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Creer un cocon
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(clustersBySite).map(([siteName, siteClusters]) => (
            <div key={siteName}>
              <h3 className="text-sm font-medium text-dark-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                {siteName}
                <Badge variant="default" className="ml-2">{siteClusters.length}</Badge>
              </h3>
              <div className="space-y-2">
                {siteClusters.map(cluster => (
                  <ClusterCard
                    key={cluster.id}
                    cluster={cluster}
                    isExpanded={expandedClusters[cluster.id]}
                    onToggle={() => toggleCluster(cluster.id)}
                    onSelect={setSelectedCluster}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Cluster Detail Modal */}
      {selectedCluster && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setSelectedCluster(null)}>
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedCluster.name}</h2>
                  <p className="text-dark-muted mt-1">Keyword principal: {selectedCluster.main_keyword}</p>
                </div>
                <button onClick={() => setSelectedCluster(null)} className="text-dark-muted hover:text-white">
                  &times;
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-dark-border/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">{selectedCluster.satellite_count || 0}</div>
                  <div className="text-sm text-dark-muted">Satellites</div>
                </div>
                <div className="bg-dark-border/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">{selectedCluster.avg_position || '-'}</div>
                  <div className="text-sm text-dark-muted">Position moy.</div>
                </div>
                <div className="bg-dark-border/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">{selectedCluster.total_traffic || 0}</div>
                  <div className="text-sm text-dark-muted">Trafic</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Badge variant={selectedCluster.status === 'active' ? 'success' : 'default'}>
                  {statusLabels[selectedCluster.status] || selectedCluster.status}
                </Badge>
                <div className="flex gap-2">
                  <Button variant="ghost">
                    <Edit2 className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter satellite
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
