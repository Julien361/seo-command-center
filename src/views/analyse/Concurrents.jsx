import { useState, useEffect } from 'react';
import { Target, Plus, Search, ExternalLink, TrendingUp, TrendingDown, BarChart3, Link, FileText, RefreshCw, MoreVertical, Trash2, Eye, Globe } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { sitesApi, supabase } from '../../lib/supabase';

// Competitor Card Component
function CompetitorCard({ competitor, onAnalyze, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);

  const getDomainRating = (rating) => {
    if (rating >= 50) return { color: 'text-success', label: 'Fort' };
    if (rating >= 30) return { color: 'text-warning', label: 'Moyen' };
    return { color: 'text-danger', label: 'Faible' };
  };

  const rating = getDomainRating(competitor.domain_rating || competitor.trust_flow || 0);

  return (
    <Card className="p-4 hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-dark-border flex items-center justify-center">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-white">{competitor.domain}</h3>
              <a
                href={`https://${competitor.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-dark-muted hover:text-primary"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            {competitor.focus_keyword && (
              <p className="text-sm text-dark-muted mt-0.5">
                Focus: {competitor.focus_keyword}
              </p>
            )}
          </div>
        </div>

        <div className="relative">
          <button
            className="p-1 hover:bg-dark-border rounded text-dark-muted hover:text-white"
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-dark-card border border-dark-border rounded-lg shadow-xl z-10 py-1 min-w-[140px]">
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-dark-muted hover:bg-dark-border hover:text-white"
                onClick={() => { onAnalyze(competitor); setShowMenu(false); }}
              >
                <RefreshCw className="w-4 h-4" />
                Analyser
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-dark-border"
                onClick={() => { onDelete(competitor); setShowMenu(false); }}
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mt-4">
        <div className="text-center">
          <div className={`text-lg font-bold ${rating.color}`}>
            {competitor.domain_rating || competitor.trust_flow || '-'}
          </div>
          <div className="text-xs text-dark-muted">DR/TF</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-white">
            {competitor.organic_traffic ? (competitor.organic_traffic / 1000).toFixed(1) + 'k' : '-'}
          </div>
          <div className="text-xs text-dark-muted">Trafic org.</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-white">
            {competitor.keywords_count || '-'}
          </div>
          <div className="text-xs text-dark-muted">Keywords</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-white">
            {competitor.backlinks_count ? (competitor.backlinks_count / 1000).toFixed(1) + 'k' : '-'}
          </div>
          <div className="text-xs text-dark-muted">Backlinks</div>
        </div>
      </div>

      {competitor.last_analyzed_at && (
        <div className="text-xs text-dark-muted mt-3 pt-3 border-t border-dark-border">
          Derniere analyse: {new Date(competitor.last_analyzed_at).toLocaleDateString('fr-FR')}
        </div>
      )}
    </Card>
  );
}

// Add Competitor Modal
function AddCompetitorModal({ isOpen, onClose, sites, onAdd }) {
  const [domain, setDomain] = useState('');
  const [siteId, setSiteId] = useState('');
  const [focusKeyword, setFocusKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!domain || !siteId) return;

    setIsLoading(true);
    try {
      await onAdd({
        domain: domain.replace(/^https?:\/\//, '').replace(/\/$/, ''),
        site_id: siteId,
        focus_keyword: focusKeyword || null
      });
      setDomain('');
      setFocusKeyword('');
      onClose();
    } catch (error) {
      console.error('Error adding competitor:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <Card className="w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-6">Ajouter un concurrent</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-muted mb-2">Site de reference</label>
              <select
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Selectionnez un site</option>
                {sites.map(site => (
                  <option key={site.id} value={site.id}>{site.mcp_alias || site.domain}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-muted mb-2">Domaine concurrent</label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="exemple.com"
                className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-muted mb-2">Keyword focus (optionnel)</label>
              <input
                type="text"
                value={focusKeyword}
                onChange={(e) => setFocusKeyword(e.target.value)}
                placeholder="mot-cle principal"
                className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? 'Ajout...' : 'Ajouter'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

export default function Concurrents() {
  const [competitors, setCompetitors] = useState([]);
  const [sites, setSites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [sitesData] = await Promise.all([
        sitesApi.getAll()
      ]);

      const { data: competitorsData, error: compError } = await supabase
        .from('competitors')
        .select('*, sites(mcp_alias, domain)')
        .order('created_at', { ascending: false });

      if (compError) throw compError;

      setSites(sitesData || []);
      setCompetitors(competitorsData || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCompetitor = async (competitorData) => {
    const { data, error } = await supabase
      .from('competitors')
      .insert([competitorData])
      .select()
      .single();

    if (error) throw error;
    setCompetitors([data, ...competitors]);
  };

  const handleDeleteCompetitor = async (competitor) => {
    if (!confirm(`Supprimer le concurrent ${competitor.domain} ?`)) return;

    const { error } = await supabase
      .from('competitors')
      .delete()
      .eq('id', competitor.id);

    if (error) {
      console.error('Error deleting:', error);
      return;
    }

    setCompetitors(competitors.filter(c => c.id !== competitor.id));
  };

  const handleAnalyzeCompetitor = async (competitor) => {
    // TODO: Trigger n8n workflow for competitor analysis
    alert(`Analyse du concurrent ${competitor.domain} (via n8n workflow)`);
  };

  // Filter competitors
  const filteredCompetitors = competitors.filter(competitor => {
    const matchesSearch = competitor.domain.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSite = selectedSiteId === 'all' || competitor.site_id === selectedSiteId;
    return matchesSearch && matchesSite;
  });

  // Group by site
  const competitorsBySite = filteredCompetitors.reduce((acc, competitor) => {
    const site = sites.find(s => s.id === competitor.site_id);
    const siteName = site?.mcp_alias || site?.domain || 'Non assigne';
    if (!acc[siteName]) acc[siteName] = [];
    acc[siteName].push(competitor);
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
          <h1 className="text-2xl font-bold text-white">Analyse Concurrents</h1>
          <p className="text-dark-muted mt-1">Surveillez vos concurrents et identifiez les opportunites</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter Concurrent
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{competitors.length}</div>
              <div className="text-sm text-dark-muted">Concurrents</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {competitors.filter(c => (c.domain_rating || 0) >= 50).length}
              </div>
              <div className="text-sm text-dark-muted">DR 50+</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info/10">
              <Link className="w-5 h-5 text-info" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {competitors.reduce((sum, c) => sum + (c.backlinks_count || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-dark-muted">Backlinks total</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <FileText className="w-5 h-5 text-warning" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {competitors.reduce((sum, c) => sum + (c.keywords_count || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-dark-muted">Keywords total</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
              <input
                type="text"
                placeholder="Rechercher un concurrent..."
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

          <Button variant="ghost" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </Card>

      {/* Competitors List */}
      {error ? (
        <Card className="p-6 text-center">
          <p className="text-danger">{error}</p>
          <Button onClick={loadData} className="mt-4">Reessayer</Button>
        </Card>
      ) : filteredCompetitors.length === 0 ? (
        <Card className="p-12 text-center">
          <Target className="w-12 h-12 mx-auto text-dark-muted mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Aucun concurrent</h3>
          <p className="text-dark-muted mb-6">Ajoutez vos concurrents pour les analyser</p>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un concurrent
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(competitorsBySite).map(([siteName, siteCompetitors]) => (
            <div key={siteName}>
              <h3 className="text-sm font-medium text-dark-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                {siteName}
                <Badge variant="default" className="ml-2">{siteCompetitors.length}</Badge>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {siteCompetitors.map(competitor => (
                  <CompetitorCard
                    key={competitor.id}
                    competitor={competitor}
                    onAnalyze={handleAnalyzeCompetitor}
                    onDelete={handleDeleteCompetitor}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <AddCompetitorModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        sites={sites}
        onAdd={handleAddCompetitor}
      />
    </div>
  );
}
