import { useState, useEffect } from 'react';
import { Link, Plus, Search, ExternalLink, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, RefreshCw, Filter, Calendar, Globe, Shield, AlertTriangle } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { sitesApi, supabase } from '../../lib/supabase';

// Backlink Row Component
function BacklinkRow({ backlink }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-success';
      case 'lost': return 'bg-danger';
      case 'new': return 'bg-info';
      default: return 'bg-dark-muted';
    }
  };

  const getDRColor = (dr) => {
    if (dr >= 50) return 'text-success';
    if (dr >= 30) return 'text-warning';
    return 'text-dark-muted';
  };

  return (
    <tr className="border-b border-dark-border hover:bg-dark-border/30 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${getStatusColor(backlink.status)}`} />
          <div>
            <a
              href={backlink.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-primary flex items-center gap-1"
            >
              {backlink.source_domain}
              <ExternalLink className="w-3 h-3" />
            </a>
            <div className="text-xs text-dark-muted truncate max-w-[300px]">
              {backlink.source_url}
            </div>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="text-sm text-dark-muted truncate max-w-[200px]">
          {backlink.target_url || '/'}
        </div>
      </td>
      <td className="py-3 px-4 text-center">
        <span className={`font-medium ${getDRColor(backlink.domain_rating || 0)}`}>
          {backlink.domain_rating || '-'}
        </span>
      </td>
      <td className="py-3 px-4">
        <Badge variant={backlink.link_type === 'dofollow' ? 'success' : 'default'}>
          {backlink.link_type || 'unknown'}
        </Badge>
      </td>
      <td className="py-3 px-4 text-sm text-dark-muted">
        {backlink.anchor_text || '-'}
      </td>
      <td className="py-3 px-4 text-sm text-dark-muted">
        {backlink.first_seen_at ? new Date(backlink.first_seen_at).toLocaleDateString('fr-FR') : '-'}
      </td>
    </tr>
  );
}

// Stats Card Component
function StatsCard({ icon: Icon, value, label, trend, trendValue, color = 'primary' }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg bg-${color}/10`}>
          <Icon className={`w-5 h-5 text-${color}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-success' : 'text-danger'}`}>
            {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {trendValue}
          </div>
        )}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-sm text-dark-muted">{label}</div>
      </div>
    </Card>
  );
}

export default function Backlinks() {
  const [backlinks, setBacklinks] = useState([]);
  const [sites, setSites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [sitesData] = await Promise.all([
        sitesApi.getAll()
      ]);

      const { data: backlinksData, error: blError } = await supabase
        .from('backlinks')
        .select('*, sites(mcp_alias, domain)')
        .order('first_seen_at', { ascending: false });

      if (blError) throw blError;

      setSites(sitesData || []);
      setBacklinks(backlinksData || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats
  const stats = {
    total: backlinks.length,
    active: backlinks.filter(b => b.status === 'active').length,
    new: backlinks.filter(b => b.status === 'new').length,
    lost: backlinks.filter(b => b.status === 'lost').length,
    dofollow: backlinks.filter(b => b.link_type === 'dofollow').length,
    avgDR: backlinks.length > 0
      ? Math.round(backlinks.reduce((sum, b) => sum + (b.domain_rating || 0), 0) / backlinks.length)
      : 0
  };

  // Filter backlinks
  const filteredBacklinks = backlinks.filter(backlink => {
    const matchesSearch =
      backlink.source_domain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      backlink.anchor_text?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSite = selectedSiteId === 'all' || backlink.site_id === selectedSiteId;
    const matchesStatus = selectedStatus === 'all' || backlink.status === selectedStatus;
    const matchesType = selectedType === 'all' || backlink.link_type === selectedType;
    return matchesSearch && matchesSite && matchesStatus && matchesType;
  });

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
          <h1 className="text-2xl font-bold text-white">Backlinks</h1>
          <p className="text-dark-muted mt-1">Suivez votre profil de liens et identifiez les opportunites</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync DataForSEO
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter manuellement
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-6 gap-4">
        <StatsCard
          icon={Link}
          value={stats.total.toLocaleString()}
          label="Total backlinks"
          color="primary"
        />
        <StatsCard
          icon={Shield}
          value={stats.active.toLocaleString()}
          label="Actifs"
          color="success"
        />
        <StatsCard
          icon={TrendingUp}
          value={stats.new.toLocaleString()}
          label="Nouveaux (30j)"
          trend="up"
          trendValue={`+${stats.new}`}
          color="info"
        />
        <StatsCard
          icon={TrendingDown}
          value={stats.lost.toLocaleString()}
          label="Perdus (30j)"
          trend="down"
          trendValue={`-${stats.lost}`}
          color="danger"
        />
        <StatsCard
          icon={Globe}
          value={`${stats.dofollow}`}
          label="Dofollow"
          color="success"
        />
        <StatsCard
          icon={AlertTriangle}
          value={stats.avgDR}
          label="DR moyen"
          color="warning"
        />
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
              <input
                type="text"
                placeholder="Rechercher par domaine ou ancre..."
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
            <option value="active">Actif</option>
            <option value="new">Nouveau</option>
            <option value="lost">Perdu</option>
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Tous les types</option>
            <option value="dofollow">Dofollow</option>
            <option value="nofollow">Nofollow</option>
          </select>
        </div>
      </Card>

      {/* Backlinks Table */}
      {error ? (
        <Card className="p-6 text-center">
          <p className="text-danger">{error}</p>
          <Button onClick={loadData} className="mt-4">Reessayer</Button>
        </Card>
      ) : filteredBacklinks.length === 0 ? (
        <Card className="p-12 text-center">
          <Link className="w-12 h-12 mx-auto text-dark-muted mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Aucun backlink</h3>
          <p className="text-dark-muted mb-6">
            Synchronisez vos backlinks depuis DataForSEO ou ajoutez-les manuellement
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="ghost">
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync DataForSEO
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter manuellement
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-border bg-dark-border/30">
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Source</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Page cible</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">DR</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Ancre</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Decouvert</th>
                </tr>
              </thead>
              <tbody>
                {filteredBacklinks.map(backlink => (
                  <BacklinkRow key={backlink.id} backlink={backlink} />
                ))}
              </tbody>
            </table>
          </div>

          {filteredBacklinks.length > 0 && (
            <div className="px-4 py-3 border-t border-dark-border text-sm text-dark-muted">
              {filteredBacklinks.length} backlinks affiches
            </div>
          )}
        </Card>
      )}

      {/* Info Card */}
      <Card className="p-4 border-info/30 bg-info/5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-white">Synchronisation des backlinks</h4>
            <p className="text-sm text-dark-muted mt-1">
              Les backlinks sont synchronises via l'API DataForSEO. Cette operation consomme des credits API.
              Pour une analyse complete, utilisez le workflow n8n "WF-Backlinks-Sync".
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
