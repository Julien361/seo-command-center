import { useState, useEffect } from 'react';
import { Target, Plus, Search, ExternalLink, TrendingUp, TrendingDown, BarChart3, Link, FileText, RefreshCw, MoreVertical, Trash2, Eye, Globe, BookOpen, Quote, ChevronDown, ChevronUp } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { sitesApi, supabase } from '../../lib/supabase';
import { n8nApi } from '../../lib/n8n';

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

// Research Card Component
function ResearchCard({ research, sites }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const site = sites?.find(s => s.id === research.site_id);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'market_analysis': return <BarChart3 className="w-5 h-5 text-primary" />;
      case 'trends_analysis': return <TrendingUp className="w-5 h-5 text-success" />;
      case 'sources_resources': return <BookOpen className="w-5 h-5 text-warning" />;
      default: return <FileText className="w-5 h-5 text-info" />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'market_analysis': return 'Analyse Marche';
      case 'trends_analysis': return 'Tendances & Evolution';
      case 'sources_resources': return 'Sources & Ressources';
      default: return type;
    }
  };

  const citations = research.citations || [];
  const content = research.content || '';
  const preview = content.substring(0, 300);
  const hasMore = content.length > 300;

  return (
    <Card className="p-4 hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-dark-border flex items-center justify-center">
            {getTypeIcon(research.research_type)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="primary">{getTypeLabel(research.research_type)}</Badge>
              {site && (
                <span className="text-sm text-dark-muted">{site.mcp_alias}</span>
              )}
            </div>
            <p className="text-xs text-dark-muted mt-1">
              {new Date(research.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
        {citations.length > 0 && (
          <Badge variant="warning" className="flex items-center gap-1">
            <Quote className="w-3 h-3" />
            {citations.length} sources
          </Badge>
        )}
      </div>

      <div className="text-sm text-white whitespace-pre-wrap">
        {isExpanded ? content : preview}
        {hasMore && !isExpanded && '...'}
      </div>

      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-xs text-primary hover:underline flex items-center gap-1"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3 h-3" />
              Voir moins
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              Voir plus
            </>
          )}
        </button>
      )}

      {citations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-dark-border">
          <div className="flex items-center gap-2 mb-2">
            <Quote className="w-4 h-4 text-warning" />
            <span className="text-sm font-medium text-dark-muted">Sources ({citations.length})</span>
          </div>
          <div className="space-y-2">
            {(isExpanded ? citations : citations.slice(0, 3)).map((citation, idx) => (
              <a
                key={idx}
                href={citation.url || citation}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-primary hover:underline truncate"
              >
                <ExternalLink className="w-3 h-3 inline mr-1" />
                {citation.title || citation.url || citation}
              </a>
            ))}
            {!isExpanded && citations.length > 3 && (
              <span className="text-xs text-dark-muted">
                +{citations.length - 3} autres sources
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

export default function Concurrents({ initialSite }) {
  const [competitors, setCompetitors] = useState([]);
  const [marketResearch, setMarketResearch] = useState([]);
  const [sites, setSites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState(initialSite?.id || 'all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState('research'); // 'research' ou 'competitors'

  // Mettre à jour le filtre si initialSite change
  useEffect(() => {
    if (initialSite?.id) {
      setSelectedSiteId(initialSite.id);
    }
  }, [initialSite]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [sitesData] = await Promise.all([
        sitesApi.getAll()
      ]);

      // Charger les concurrents
      const { data: competitorsData, error: compError } = await supabase
        .from('competitors')
        .select('*, sites(mcp_alias, domain)')
        .order('created_at', { ascending: false });

      if (compError) throw compError;

      // Charger les recherches marché (Claude Web Search)
      const { data: researchData, error: researchError } = await supabase
        .from('market_research')
        .select('*, sites(mcp_alias, domain)')
        .order('created_at', { ascending: false });

      if (researchError) {
        console.warn('Could not load market_research:', researchError);
      }

      setSites(sitesData || []);
      setCompetitors(competitorsData || []);
      setMarketResearch(researchData || []);
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
    const site = sites.find(s => s.id === competitor.site_id);
    if (!site) {
      alert('Site non trouvé');
      return;
    }

    if (!confirm(`Analyser ${competitor.domain} ?\n\nAttention: Cette opération utilise l'API Firecrawl (~0.10€).`)) {
      return;
    }

    try {
      const result = await n8nApi.analyzeCompetitor(
        `https://${competitor.domain}`,
        site.mcp_alias,
        competitor.focus_keyword
      );

      if (result.success) {
        alert(`Analyse de ${competitor.domain} lancée ! Les résultats seront disponibles dans quelques minutes.`);
        // Mettre à jour la date d'analyse
        await supabase
          .from('competitors')
          .update({ last_analyzed_at: new Date().toISOString() })
          .eq('id', competitor.id);
        loadData();
      } else {
        alert('Erreur: ' + result.error);
      }
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  // Filter competitors
  const filteredCompetitors = competitors.filter(competitor => {
    const matchesSearch = competitor.domain.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSite = selectedSiteId === 'all' || competitor.site_id === selectedSiteId;
    return matchesSearch && matchesSite;
  });

  // Filter market research
  const filteredResearch = marketResearch.filter(research => {
    const matchesSearch = (research.content || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (research.research_type || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSite = selectedSiteId === 'all' || research.site_id === selectedSiteId;
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

  // Group research by type
  const researchByType = filteredResearch.reduce((acc, research) => {
    const type = research.research_type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(research);
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
      <div className="grid grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{marketResearch.length}</div>
              <div className="text-sm text-dark-muted">Recherches</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info/10">
              <Target className="w-5 h-5 text-info" />
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
            <div className="p-2 rounded-lg bg-warning/10">
              <Quote className="w-5 h-5 text-warning" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {marketResearch.reduce((sum, r) => sum + (r.citations?.length || 0), 0)}
              </div>
              <div className="text-sm text-dark-muted">Citations</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-danger/10">
              <Link className="w-5 h-5 text-danger" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {competitors.reduce((sum, c) => sum + (c.backlinks_count || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-dark-muted">Backlinks</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('research')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'research'
              ? 'bg-primary text-white'
              : 'bg-dark-card text-dark-muted hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4 inline mr-2" />
          Recherches Marche ({filteredResearch.length})
        </button>
        <button
          onClick={() => setActiveTab('competitors')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'competitors'
              ? 'bg-primary text-white'
              : 'bg-dark-card text-dark-muted hover:text-white'
          }`}
        >
          <Target className="w-4 h-4 inline mr-2" />
          Concurrents ({filteredCompetitors.length})
        </button>
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

      {/* Content based on active tab */}
      {error ? (
        <Card className="p-6 text-center">
          <p className="text-danger">{error}</p>
          <Button onClick={loadData} className="mt-4">Reessayer</Button>
        </Card>
      ) : activeTab === 'research' ? (
        /* Market Research Tab */
        filteredResearch.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-dark-muted mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Aucune recherche marche</h3>
            <p className="text-dark-muted mb-6">Lancez WF2 depuis le SEO Coach pour analyser le marche</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(researchByType).map(([type, researches]) => (
              <div key={type}>
                <h3 className="text-sm font-medium text-dark-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    type === 'market_analysis' ? 'bg-primary' :
                    type === 'trends_analysis' ? 'bg-success' :
                    type === 'sources_resources' ? 'bg-warning' : 'bg-info'
                  }`} />
                  {type === 'market_analysis' ? 'Analyse Marche' :
                   type === 'trends_analysis' ? 'Tendances & Evolution' :
                   type === 'sources_resources' ? 'Sources & Ressources' : type}
                  <Badge variant="default" className="ml-2">{researches.length}</Badge>
                </h3>
                <div className="space-y-4">
                  {researches.map(research => (
                    <ResearchCard key={research.id} research={research} sites={sites} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Competitors Tab */
        filteredCompetitors.length === 0 ? (
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
        )
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
