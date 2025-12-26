import { useState, useEffect } from 'react';
import { Link2, ArrowRight, Plus, Trash2, CheckCircle, AlertTriangle, ExternalLink, Search, Filter, RefreshCw, Target, FileText, Lightbulb } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { sitesApi, supabase } from '../../lib/supabase';
import { n8nApi } from '../../lib/n8n';

// Link status configuration
const linkStatus = {
  suggested: { label: 'Suggere', color: 'bg-info', textColor: 'text-info' },
  approved: { label: 'Approuve', color: 'bg-success', textColor: 'text-success' },
  implemented: { label: 'Implemente', color: 'bg-primary', textColor: 'text-primary' },
  rejected: { label: 'Rejete', color: 'bg-dark-muted', textColor: 'text-dark-muted' },
};

// Suggestion card
function SuggestionCard({ suggestion, onApprove, onReject, onImplement }) {
  const status = linkStatus[suggestion.status] || linkStatus.suggested;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <Badge variant={suggestion.status === 'suggested' ? 'info' : suggestion.status === 'approved' ? 'success' : 'secondary'} size="sm">
          {status.label}
        </Badge>
        <span className="text-xs text-dark-muted">
          Score: <span className="text-primary font-medium">{suggestion.relevance_score || 85}%</span>
        </span>
      </div>

      <div className="space-y-3">
        {/* Source page */}
        <div>
          <p className="text-xs text-dark-muted mb-1">Page source</p>
          <p className="text-white text-sm truncate" title={suggestion.source_url}>
            {suggestion.source_title || suggestion.source_url}
          </p>
        </div>

        {/* Arrow */}
        <div className="flex items-center justify-center">
          <ArrowRight className="w-5 h-5 text-primary" />
        </div>

        {/* Target page */}
        <div>
          <p className="text-xs text-dark-muted mb-1">Page cible</p>
          <p className="text-white text-sm truncate" title={suggestion.target_url}>
            {suggestion.target_title || suggestion.target_url}
          </p>
        </div>

        {/* Anchor text suggestion */}
        {suggestion.anchor_text && (
          <div className="p-2 bg-dark-border/50 rounded">
            <p className="text-xs text-dark-muted mb-1">Ancre suggeree</p>
            <p className="text-primary text-sm font-medium">"{suggestion.anchor_text}"</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4 pt-3 border-t border-dark-border">
        {suggestion.status === 'suggested' && (
          <>
            <Button size="sm" className="flex-1" onClick={() => onApprove(suggestion.id)}>
              <CheckCircle className="w-3 h-3 mr-1" />
              Approuver
            </Button>
            <Button variant="secondary" size="sm" onClick={() => onReject(suggestion.id)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </>
        )}
        {suggestion.status === 'approved' && (
          <Button size="sm" className="flex-1" onClick={() => onImplement(suggestion.id)}>
            <Link2 className="w-3 h-3 mr-1" />
            Marquer implemente
          </Button>
        )}
        {suggestion.status === 'implemented' && (
          <span className="text-success text-sm flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            Lien ajoute
          </span>
        )}
      </div>
    </Card>
  );
}

// Page link analysis
function PageLinkCard({ page, incomingLinks, outgoingLinks }) {
  const [expanded, setExpanded] = useState(false);

  const inCount = incomingLinks?.length || 0;
  const outCount = outgoingLinks?.length || 0;

  // Determine health status
  let healthStatus = 'good';
  let healthMessage = 'Bon maillage';
  if (inCount === 0) {
    healthStatus = 'danger';
    healthMessage = 'Page orpheline';
  } else if (inCount < 3) {
    healthStatus = 'warning';
    healthMessage = 'Peu de liens entrants';
  }
  if (outCount === 0) {
    healthStatus = healthStatus === 'good' ? 'warning' : healthStatus;
    healthMessage = healthStatus === 'danger' ? 'Page orpheline sans liens sortants' : 'Aucun lien sortant';
  }

  return (
    <Card className="overflow-hidden">
      <div
        className="p-4 cursor-pointer hover:bg-dark-border/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-medium truncate">{page.title || page.url}</h4>
            <p className="text-xs text-dark-muted truncate">{page.url}</p>
          </div>
          <div className="flex items-center gap-4 ml-4">
            <div className="text-center">
              <div className="text-lg font-bold text-info">{inCount}</div>
              <div className="text-xs text-dark-muted">Entrants</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-primary">{outCount}</div>
              <div className="text-xs text-dark-muted">Sortants</div>
            </div>
            <Badge
              variant={healthStatus === 'good' ? 'success' : healthStatus === 'warning' ? 'warning' : 'danger'}
              size="sm"
            >
              {healthMessage}
            </Badge>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-dark-border pt-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Incoming links */}
            <div>
              <h5 className="text-sm font-medium text-dark-muted mb-2 flex items-center gap-1">
                <ArrowRight className="w-3 h-3 rotate-180" />
                Liens entrants ({inCount})
              </h5>
              {inCount === 0 ? (
                <p className="text-xs text-danger">Aucun lien entrant - page orpheline</p>
              ) : (
                <div className="space-y-1">
                  {incomingLinks.slice(0, 5).map((link, i) => (
                    <p key={i} className="text-xs text-dark-muted truncate">
                      {link.source_url}
                    </p>
                  ))}
                  {inCount > 5 && <p className="text-xs text-dark-muted">+{inCount - 5} autres</p>}
                </div>
              )}
            </div>

            {/* Outgoing links */}
            <div>
              <h5 className="text-sm font-medium text-dark-muted mb-2 flex items-center gap-1">
                <ArrowRight className="w-3 h-3" />
                Liens sortants ({outCount})
              </h5>
              {outCount === 0 ? (
                <p className="text-xs text-warning">Aucun lien sortant</p>
              ) : (
                <div className="space-y-1">
                  {outgoingLinks.slice(0, 5).map((link, i) => (
                    <p key={i} className="text-xs text-dark-muted truncate">
                      {link.target_url}
                    </p>
                  ))}
                  {outCount > 5 && <p className="text-xs text-dark-muted">+{outCount - 5} autres</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

// Add link modal
function AddLinkModal({ sites, pages, onClose, onSave }) {
  const [formData, setFormData] = useState({
    site_id: '',
    source_url: '',
    target_url: '',
    anchor_text: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.source_url || !formData.target_url) return;
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <Card className="w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-white mb-4">Ajouter un lien interne</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-dark-muted mb-1">Site</label>
            <select
              value={formData.site_id}
              onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
            >
              <option value="">Tous les sites</option>
              {sites.map(site => (
                <option key={site.id} value={site.id}>{site.mcp_alias || site.domain}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-dark-muted mb-1">Page source *</label>
            <input
              type="text"
              value={formData.source_url}
              onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
              placeholder="https://example.com/page-source"
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-dark-muted mb-1">Page cible *</label>
            <input
              type="text"
              value={formData.target_url}
              onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
              placeholder="https://example.com/page-cible"
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-dark-muted mb-1">Texte d'ancre</label>
            <input
              type="text"
              value={formData.anchor_text}
              onChange={(e) => setFormData({ ...formData, anchor_text: e.target.value })}
              placeholder="Texte du lien..."
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" onClick={onClose}>Annuler</Button>
            <Button type="submit">Ajouter</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function LiensInternes() {
  const [sites, setSites] = useState([]);
  const [links, setLinks] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [pages, setPages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSiteId, setSelectedSiteId] = useState('all');
  const [activeTab, setActiveTab] = useState('suggestions');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load sites
      const sitesData = await sitesApi.getAll();
      setSites(sitesData || []);

      // Load internal links
      const { data: linksData, error: linksError } = await supabase
        .from('internal_links')
        .select('*')
        .order('created_at', { ascending: false });

      if (!linksError) {
        setLinks(linksData || []);

        // Separate suggestions (status = suggested/approved) from implemented
        setSuggestions((linksData || []).filter(l => ['suggested', 'approved'].includes(l.status)));
      }

      // Load pages for analysis
      const { data: pagesData } = await supabase
        .from('pages')
        .select('*')
        .order('title', { ascending: true });

      setPages(pagesData || []);

    } catch (err) {
      console.error('Error loading internal links:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const { error } = await supabase
        .from('internal_links')
        .update({ status: 'approved' })
        .eq('id', id);

      if (!error) {
        setSuggestions(suggestions.map(s => s.id === id ? { ...s, status: 'approved' } : s));
        setLinks(links.map(l => l.id === id ? { ...l, status: 'approved' } : l));
      }
    } catch (err) {
      console.error('Error approving suggestion:', err);
    }
  };

  const handleReject = async (id) => {
    try {
      const { error } = await supabase
        .from('internal_links')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (!error) {
        setSuggestions(suggestions.filter(s => s.id !== id));
        setLinks(links.map(l => l.id === id ? { ...l, status: 'rejected' } : l));
      }
    } catch (err) {
      console.error('Error rejecting suggestion:', err);
    }
  };

  const handleImplement = async (id) => {
    try {
      const { error } = await supabase
        .from('internal_links')
        .update({ status: 'implemented', implemented_at: new Date().toISOString() })
        .eq('id', id);

      if (!error) {
        setSuggestions(suggestions.filter(s => s.id !== id));
        setLinks(links.map(l => l.id === id ? { ...l, status: 'implemented' } : l));
      }
    } catch (err) {
      console.error('Error marking as implemented:', err);
    }
  };

  const handleAddLink = async (linkData) => {
    try {
      const { data, error } = await supabase
        .from('internal_links')
        .insert([{
          ...linkData,
          status: 'implemented',
          implemented_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (!error && data) {
        setLinks([data, ...links]);
      }
    } catch (err) {
      console.error('Error adding link:', err);
    }
    setShowAddModal(false);
  };

  const handleGenerateSuggestions = async () => {
    const site = selectedSiteId !== 'all' ? sites.find(s => s.id === selectedSiteId) : null;

    if (!site) {
      alert('Veuillez d\'abord sélectionner un site');
      return;
    }

    if (!confirm(`Générer des suggestions de liens internes pour ${site.domain} ?\n\nCette opération analyse votre contenu pour trouver des opportunités de maillage.`)) {
      return;
    }

    setIsGenerating(true);
    try {
      const result = await n8nApi.triggerWebhook('internal-links', {
        site_alias: site.mcp_alias,
        site_id: site.id
      });

      if (result.success) {
        alert(`Analyse lancée pour ${site.domain} ! Les suggestions apparaîtront dans quelques minutes.`);
        setTimeout(loadData, 5000);
      } else {
        alert('Erreur: ' + result.error);
      }
    } catch (err) {
      alert('Erreur: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Filter by site
  const filteredSuggestions = selectedSiteId === 'all'
    ? suggestions
    : suggestions.filter(s => s.site_id === selectedSiteId);

  const filteredLinks = selectedSiteId === 'all'
    ? links.filter(l => l.status === 'implemented')
    : links.filter(l => l.status === 'implemented' && l.site_id === selectedSiteId);

  // Get incoming/outgoing links for each page
  const getIncomingLinks = (pageUrl) => links.filter(l => l.target_url === pageUrl && l.status === 'implemented');
  const getOutgoingLinks = (pageUrl) => links.filter(l => l.source_url === pageUrl && l.status === 'implemented');

  // Stats
  const stats = {
    totalLinks: links.filter(l => l.status === 'implemented').length,
    suggestions: suggestions.filter(s => s.status === 'suggested').length,
    approved: suggestions.filter(s => s.status === 'approved').length,
    orphanPages: pages.filter(p => getIncomingLinks(p.url).length === 0).length,
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
          <h1 className="text-2xl font-bold text-white">Liens Internes</h1>
          <p className="text-dark-muted mt-1">Optimisez votre maillage interne</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleGenerateSuggestions} disabled={isGenerating}>
            <Lightbulb className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-pulse' : ''}`} />
            {isGenerating ? 'Génération...' : 'Generer suggestions'}
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un lien
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Link2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.totalLinks}</div>
              <div className="text-sm text-dark-muted">Liens implementes</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info/10">
              <Lightbulb className="w-5 h-5 text-info" />
            </div>
            <div>
              <div className="text-2xl font-bold text-info">{stats.suggestions}</div>
              <div className="text-sm text-dark-muted">Suggestions</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <div className="text-2xl font-bold text-success">{stats.approved}</div>
              <div className="text-sm text-dark-muted">Approuves</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-danger/10">
              <AlertTriangle className="w-5 h-5 text-danger" />
            </div>
            <div>
              <div className="text-2xl font-bold text-danger">{stats.orphanPages}</div>
              <div className="text-sm text-dark-muted">Pages orphelines</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('suggestions')}
              className={`px-4 py-2 rounded-lg text-sm ${activeTab === 'suggestions' ? 'bg-primary text-white' : 'bg-dark-border text-dark-muted hover:text-white'}`}
            >
              Suggestions ({stats.suggestions + stats.approved})
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-4 py-2 rounded-lg text-sm ${activeTab === 'analysis' ? 'bg-primary text-white' : 'bg-dark-border text-dark-muted hover:text-white'}`}
            >
              Analyse des pages
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg text-sm ${activeTab === 'all' ? 'bg-primary text-white' : 'bg-dark-border text-dark-muted hover:text-white'}`}
            >
              Tous les liens ({stats.totalLinks})
            </button>
          </div>
          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
          >
            <option value="all">Tous les sites</option>
            {sites.map(site => (
              <option key={site.id} value={site.id}>{site.mcp_alias || site.domain}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Content based on active tab */}
      {activeTab === 'suggestions' && (
        <>
          {filteredSuggestions.length === 0 ? (
            <Card className="p-12 text-center">
              <Lightbulb className="w-12 h-12 mx-auto text-dark-muted mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Aucune suggestion</h3>
              <p className="text-dark-muted mb-6">Generez des suggestions de liens internes basees sur votre contenu</p>
              <Button onClick={handleGenerateSuggestions} disabled={isGenerating}>
                <Lightbulb className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-pulse' : ''}`} />
                {isGenerating ? 'Génération...' : 'Generer des suggestions'}
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {filteredSuggestions.map(suggestion => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onImplement={handleImplement}
                />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'analysis' && (
        <>
          {pages.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-dark-muted mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Aucune page</h3>
              <p className="text-dark-muted">Ajoutez des pages pour analyser votre maillage</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {pages
                .filter(p => selectedSiteId === 'all' || p.site_id === selectedSiteId)
                .map(page => (
                  <PageLinkCard
                    key={page.id}
                    page={page}
                    incomingLinks={getIncomingLinks(page.url)}
                    outgoingLinks={getOutgoingLinks(page.url)}
                  />
                ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'all' && (
        <Card className="overflow-hidden">
          {filteredLinks.length === 0 ? (
            <div className="p-12 text-center">
              <Link2 className="w-12 h-12 mx-auto text-dark-muted mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Aucun lien</h3>
              <p className="text-dark-muted">Commencez a ajouter des liens internes</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-border bg-dark-border/30">
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Source</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted"></th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Cible</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Ancre</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLinks.map(link => (
                    <tr key={link.id} className="border-b border-dark-border hover:bg-dark-border/30">
                      <td className="py-3 px-4">
                        <span className="text-white text-sm truncate block max-w-xs">{link.source_url}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <ArrowRight className="w-4 h-4 text-primary mx-auto" />
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-white text-sm truncate block max-w-xs">{link.target_url}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-primary text-sm">{link.anchor_text || '-'}</span>
                      </td>
                      <td className="py-3 px-4 text-dark-muted text-sm">
                        {link.implemented_at ? new Date(link.implemented_at).toLocaleDateString('fr-FR') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Add modal */}
      {showAddModal && (
        <AddLinkModal
          sites={sites}
          pages={pages}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddLink}
        />
      )}
    </div>
  );
}
