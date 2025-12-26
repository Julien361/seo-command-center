import { useState, useEffect } from 'react';
import { File, FileText, Plus, Link2, Trash2, Edit2, ExternalLink, ChevronDown, ChevronRight, Target, TrendingUp, Eye, Search, Filter } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { sitesApi, supabase } from '../../lib/supabase';

// Page types
const pageTypes = {
  pillar: { label: 'Page Pilier', color: 'bg-primary', icon: FileText, description: 'Page principale du cocon (3000+ mots)' },
  satellite: { label: 'Page Satellite', color: 'bg-info', icon: File, description: 'Page secondaire liee au pilier (1500+ mots)' },
  landing: { label: 'Landing Page', color: 'bg-success', icon: Target, description: 'Page de conversion' },
  category: { label: 'Categorie', color: 'bg-warning', icon: File, description: 'Page de categorie/listing' },
};

// Status configuration
const statusConfig = {
  draft: { label: 'Brouillon', color: 'text-dark-muted' },
  writing: { label: 'Redaction', color: 'text-warning' },
  review: { label: 'Relecture', color: 'text-info' },
  published: { label: 'Publie', color: 'text-success' },
  updating: { label: 'Mise a jour', color: 'text-primary' },
};

// Pillar page with satellites
function PillarCard({ pillar, satellites, onEdit, onDelete, onAddSatellite, onViewPage }) {
  const [expanded, setExpanded] = useState(false);
  const status = statusConfig[pillar.status] || statusConfig.draft;

  return (
    <Card className="overflow-hidden">
      {/* Pillar header */}
      <div
        className="p-4 cursor-pointer hover:bg-dark-border/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-white font-medium">{pillar.title}</h4>
                <Badge variant="primary" size="sm">Pilier</Badge>
              </div>
              <p className="text-sm text-dark-muted mt-1">{pillar.target_keyword}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-dark-muted">
                <span>{pillar.word_count || 0} mots</span>
                <span className={status.color}>{status.label}</span>
                <span>{satellites.length} satellites</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pillar.url && (
              <a
                href={pillar.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="p-1.5 hover:bg-dark-border rounded text-dark-muted hover:text-primary"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(pillar); }}
              className="p-1.5 hover:bg-dark-border rounded text-dark-muted hover:text-white"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            {expanded ? <ChevronDown className="w-5 h-5 text-dark-muted" /> : <ChevronRight className="w-5 h-5 text-dark-muted" />}
          </div>
        </div>
      </div>

      {/* Satellites */}
      {expanded && (
        <div className="border-t border-dark-border">
          {satellites.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-dark-muted text-sm mb-3">Aucune page satellite</p>
              <Button size="sm" variant="secondary" onClick={() => onAddSatellite(pillar.id)}>
                <Plus className="w-3 h-3 mr-1" />
                Ajouter satellite
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-dark-border">
              {satellites.map(sat => {
                const satStatus = statusConfig[sat.status] || statusConfig.draft;
                return (
                  <div key={sat.id} className="p-3 pl-12 flex items-center justify-between hover:bg-dark-border/20">
                    <div className="flex items-center gap-3">
                      <Link2 className="w-4 h-4 text-info" />
                      <div>
                        <p className="text-white text-sm">{sat.title}</p>
                        <p className="text-xs text-dark-muted">{sat.target_keyword}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-dark-muted">{sat.word_count || 0} mots</span>
                      <span className={`text-xs ${satStatus.color}`}>{satStatus.label}</span>
                      <div className="flex items-center gap-1">
                        {sat.url && (
                          <a href={sat.url} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-dark-border rounded text-dark-muted hover:text-primary">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        <button onClick={() => onEdit(sat)} className="p-1 hover:bg-dark-border rounded text-dark-muted hover:text-white">
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button onClick={() => onDelete(sat.id)} className="p-1 hover:bg-dark-border rounded text-dark-muted hover:text-danger">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="p-3 pl-12">
                <Button size="sm" variant="secondary" onClick={() => onAddSatellite(pillar.id)}>
                  <Plus className="w-3 h-3 mr-1" />
                  Ajouter satellite
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// Standalone page card
function PageCard({ page, onEdit, onDelete }) {
  const type = pageTypes[page.page_type] || pageTypes.satellite;
  const status = statusConfig[page.status] || statusConfig.draft;
  const Icon = type.icon;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded ${type.color}/10`}>
            <Icon className={`w-4 h-4 ${type.color.replace('bg-', 'text-')}`} />
          </div>
          <Badge variant="secondary" size="sm">{type.label}</Badge>
        </div>
        <div className="flex items-center gap-1">
          {page.url && (
            <a href={page.url} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-dark-border rounded text-dark-muted hover:text-primary">
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <button onClick={() => onEdit(page)} className="p-1.5 hover:bg-dark-border rounded text-dark-muted hover:text-white">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(page.id)} className="p-1.5 hover:bg-dark-border rounded text-dark-muted hover:text-danger">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <h4 className="text-white font-medium mb-1">{page.title}</h4>
      <p className="text-sm text-primary mb-2">{page.target_keyword}</p>

      <div className="flex items-center justify-between text-xs text-dark-muted">
        <span>{page.word_count || 0} mots</span>
        <span className={status.color}>{status.label}</span>
      </div>
    </Card>
  );
}

// Page form modal
function PageFormModal({ page, pages, sites, onClose, onSave }) {
  const [formData, setFormData] = useState({
    site_id: page?.site_id || '',
    page_type: page?.page_type || 'satellite',
    parent_id: page?.parent_id || '',
    title: page?.title || '',
    target_keyword: page?.target_keyword || '',
    url: page?.url || '',
    word_count: page?.word_count || 0,
    status: page?.status || 'draft',
    meta_title: page?.meta_title || '',
    meta_description: page?.meta_description || '',
    notes: page?.notes || '',
  });

  const pillarPages = pages.filter(p => p.page_type === 'pillar');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title) return;
    onSave({ ...page, ...formData });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-auto py-8" onClick={onClose}>
      <Card className="w-full max-w-lg p-6 my-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-white mb-4">
          {page ? 'Modifier la page' : 'Nouvelle page'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-dark-muted mb-1">Type de page *</label>
              <select
                value={formData.page_type}
                onChange={(e) => setFormData({ ...formData, page_type: e.target.value })}
                className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
              >
                {Object.entries(pageTypes).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-dark-muted mb-1">Site</label>
              <select
                value={formData.site_id}
                onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
              >
                <option value="">Aucun site</option>
                {sites.map(site => (
                  <option key={site.id} value={site.id}>{site.mcp_alias || site.domain}</option>
                ))}
              </select>
            </div>
          </div>

          {formData.page_type === 'satellite' && pillarPages.length > 0 && (
            <div>
              <label className="block text-sm text-dark-muted mb-1">Page pilier parente</label>
              <select
                value={formData.parent_id}
                onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
              >
                <option value="">Aucune (page independante)</option>
                {pillarPages.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm text-dark-muted mb-1">Titre de la page *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Titre H1 de la page"
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-dark-muted mb-1">Keyword cible</label>
            <input
              type="text"
              value={formData.target_keyword}
              onChange={(e) => setFormData({ ...formData, target_keyword: e.target.value })}
              placeholder="Mot-cle principal"
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-dark-muted mb-1">URL</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://..."
                className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-dark-muted mb-1">Nombre de mots</label>
              <input
                type="number"
                value={formData.word_count}
                onChange={(e) => setFormData({ ...formData, word_count: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-dark-muted mb-1">Meta title</label>
            <input
              type="text"
              value={formData.meta_title}
              onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
            />
            <p className="text-xs text-dark-muted mt-1">{formData.meta_title.length}/60 caracteres</p>
          </div>

          <div>
            <label className="block text-sm text-dark-muted mb-1">Meta description</label>
            <textarea
              value={formData.meta_description}
              onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white resize-none"
            />
            <p className="text-xs text-dark-muted mt-1">{formData.meta_description.length}/155 caracteres</p>
          </div>

          <div>
            <label className="block text-sm text-dark-muted mb-1">Statut</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
            >
              {Object.entries(statusConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-dark-muted mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white resize-none"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" onClick={onClose}>Annuler</Button>
            <Button type="submit">{page ? 'Modifier' : 'Creer'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function Pages() {
  const [pages, setPages] = useState([]);
  const [sites, setSites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);
  const [defaultParentId, setDefaultParentId] = useState(null);
  const [selectedSiteId, setSelectedSiteId] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const sitesData = await sitesApi.getAll();
      setSites(sitesData || []);

      const { data, error } = await supabase
        .from('pages')
        .select('*, sites(mcp_alias, domain)')
        .order('created_at', { ascending: false });

      if (!error) {
        setPages(data || []);
      }
    } catch (err) {
      console.error('Error loading pages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (pageData) => {
    try {
      if (pageData.id) {
        const { error } = await supabase
          .from('pages')
          .update(pageData)
          .eq('id', pageData.id);

        if (!error) {
          setPages(pages.map(p => p.id === pageData.id ? { ...p, ...pageData } : p));
        }
      } else {
        const { data, error } = await supabase
          .from('pages')
          .insert([pageData])
          .select('*, sites(mcp_alias, domain)')
          .single();

        if (!error && data) {
          setPages([data, ...pages]);
        }
      }
    } catch (err) {
      console.error('Error saving page:', err);
    }
    setShowFormModal(false);
    setSelectedPage(null);
    setDefaultParentId(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette page ?')) return;

    try {
      const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', id);

      if (!error) {
        setPages(pages.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error('Error deleting page:', err);
    }
  };

  const handleAddSatellite = (pillarId) => {
    setDefaultParentId(pillarId);
    setSelectedPage({ page_type: 'satellite', parent_id: pillarId });
    setShowFormModal(true);
  };

  // Filter pages
  const filteredPages = pages.filter(p => {
    if (selectedSiteId !== 'all' && p.site_id !== selectedSiteId) return false;
    if (typeFilter !== 'all' && p.page_type !== typeFilter) return false;
    if (searchTerm && !p.title?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !p.target_keyword?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Organize pages: pillars with their satellites
  const pillarPages = filteredPages.filter(p => p.page_type === 'pillar');
  const satellitePages = filteredPages.filter(p => p.page_type === 'satellite' && p.parent_id);
  const standalonePages = filteredPages.filter(p => p.page_type !== 'pillar' && !p.parent_id);

  // Stats
  const stats = {
    total: pages.length,
    pillars: pages.filter(p => p.page_type === 'pillar').length,
    satellites: pages.filter(p => p.page_type === 'satellite').length,
    published: pages.filter(p => p.status === 'published').length,
    totalWords: pages.reduce((sum, p) => sum + (p.word_count || 0), 0),
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
          <h1 className="text-2xl font-bold text-white">Pages</h1>
          <p className="text-dark-muted mt-1">Gerez vos pages piliers et satellites</p>
        </div>
        <Button onClick={() => { setSelectedPage(null); setDefaultParentId(null); setShowFormModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle page
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <File className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-sm text-dark-muted">Total pages</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{stats.pillars}</div>
              <div className="text-sm text-dark-muted">Piliers</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info/10">
              <Link2 className="w-5 h-5 text-info" />
            </div>
            <div>
              <div className="text-2xl font-bold text-info">{stats.satellites}</div>
              <div className="text-sm text-dark-muted">Satellites</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <Eye className="w-5 h-5 text-success" />
            </div>
            <div>
              <div className="text-2xl font-bold text-success">{stats.published}</div>
              <div className="text-sm text-dark-muted">Publies</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <TrendingUp className="w-5 h-5 text-warning" />
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">{(stats.totalWords / 1000).toFixed(1)}k</div>
              <div className="text-sm text-dark-muted">Mots total</div>
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
                placeholder="Rechercher une page..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white placeholder-dark-muted"
              />
            </div>
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
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
          >
            <option value="all">Tous les types</option>
            {Object.entries(pageTypes).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Pillar pages with satellites */}
      {pillarPages.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Cocons semantiques</h3>
          <div className="space-y-4">
            {pillarPages.map(pillar => (
              <PillarCard
                key={pillar.id}
                pillar={pillar}
                satellites={satellitePages.filter(s => s.parent_id === pillar.id)}
                onEdit={(p) => { setSelectedPage(p); setShowFormModal(true); }}
                onDelete={handleDelete}
                onAddSatellite={handleAddSatellite}
              />
            ))}
          </div>
        </div>
      )}

      {/* Standalone pages */}
      {standalonePages.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Pages independantes</h3>
          <div className="grid grid-cols-3 gap-4">
            {standalonePages.map(page => (
              <PageCard
                key={page.id}
                page={page}
                onEdit={(p) => { setSelectedPage(p); setShowFormModal(true); }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {filteredPages.length === 0 && (
        <Card className="p-12 text-center">
          <File className="w-12 h-12 mx-auto text-dark-muted mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Aucune page</h3>
          <p className="text-dark-muted mb-6">Creez votre premiere page pilier ou satellite</p>
          <Button onClick={() => { setSelectedPage(null); setShowFormModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle page
          </Button>
        </Card>
      )}

      {/* Form modal */}
      {showFormModal && (
        <PageFormModal
          page={selectedPage}
          pages={pages}
          sites={sites}
          onClose={() => { setShowFormModal(false); setSelectedPage(null); setDefaultParentId(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
