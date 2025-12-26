import { useState, useEffect } from 'react';
import { Lightbulb, Plus, Search, Sparkles, TrendingUp, Filter, Check, X, ArrowRight, RefreshCw, MoreVertical, Trash2, FileText } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { sitesApi, supabase } from '../../lib/supabase';

// Source badges
const sourceConfig = {
  paa: { label: 'PAA', color: 'bg-info/20 text-info' },
  trends: { label: 'Trends', color: 'bg-success/20 text-success' },
  competitor: { label: 'Concurrent', color: 'bg-warning/20 text-warning' },
  gap: { label: 'Gap', color: 'bg-primary/20 text-primary' },
  manual: { label: 'Manuel', color: 'bg-dark-muted/20 text-dark-muted' },
  ai: { label: 'IA', color: 'bg-purple-500/20 text-purple-400' },
};

const statusConfig = {
  new: { label: 'Nouveau', color: 'default' },
  approved: { label: 'Approuve', color: 'success' },
  rejected: { label: 'Rejete', color: 'danger' },
  in_progress: { label: 'En cours', color: 'warning' },
  published: { label: 'Publie', color: 'info' },
};

// Idea Card Component
function IdeaCard({ idea, onApprove, onReject, onCreateBrief, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);
  const source = sourceConfig[idea.source] || sourceConfig.manual;
  const status = statusConfig[idea.status] || statusConfig.new;

  return (
    <Card className="p-4 hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${source.color}`}>
              {source.label}
            </span>
            <Badge variant={status.color}>{status.label}</Badge>
          </div>
          <h3 className="font-medium text-white">{idea.title}</h3>
          {idea.keyword && (
            <p className="text-sm text-dark-muted mt-1">
              Keyword: {idea.keyword}
            </p>
          )}
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
                onClick={() => { onCreateBrief(idea); setShowMenu(false); }}
              >
                <FileText className="w-4 h-4" />
                Creer brief
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-dark-border"
                onClick={() => { onDelete(idea); setShowMenu(false); }}
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4 text-sm">
        {idea.search_volume && (
          <div className="flex items-center gap-1 text-dark-muted">
            <TrendingUp className="w-3 h-3" />
            <span>{idea.search_volume.toLocaleString()} vol.</span>
          </div>
        )}
        {idea.difficulty && (
          <div className="flex items-center gap-1 text-dark-muted">
            <span className={`w-2 h-2 rounded-full ${
              idea.difficulty < 30 ? 'bg-success' :
              idea.difficulty < 60 ? 'bg-warning' : 'bg-danger'
            }`} />
            <span>KD {idea.difficulty}</span>
          </div>
        )}
        {idea.priority_score && (
          <div className="flex items-center gap-1 text-primary">
            <Sparkles className="w-3 h-3" />
            <span>Score {idea.priority_score}</span>
          </div>
        )}
      </div>

      {idea.notes && (
        <p className="text-sm text-dark-muted mb-4 line-clamp-2">{idea.notes}</p>
      )}

      {idea.status === 'new' && (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" className="flex-1" onClick={() => onReject(idea)}>
            <X className="w-3 h-3 mr-1" />
            Rejeter
          </Button>
          <Button size="sm" className="flex-1" onClick={() => onApprove(idea)}>
            <Check className="w-3 h-3 mr-1" />
            Approuver
          </Button>
        </div>
      )}

      {idea.status === 'approved' && (
        <Button size="sm" className="w-full" onClick={() => onCreateBrief(idea)}>
          <ArrowRight className="w-3 h-3 mr-1" />
          Creer le brief
        </Button>
      )}
    </Card>
  );
}

// Add Idea Modal
function AddIdeaModal({ isOpen, onClose, sites, onAdd }) {
  const [formData, setFormData] = useState({
    title: '',
    keyword: '',
    site_id: '',
    source: 'manual',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.site_id) return;

    setIsLoading(true);
    try {
      await onAdd(formData);
      setFormData({ title: '', keyword: '', site_id: '', source: 'manual', notes: '' });
      onClose();
    } catch (error) {
      console.error('Error adding idea:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <Card className="w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-6">Nouvelle idee</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-muted mb-2">Site</label>
              <select
                value={formData.site_id}
                onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
                required
              >
                <option value="">Selectionnez un site</option>
                {sites.map(site => (
                  <option key={site.id} value={site.id}>{site.mcp_alias || site.domain}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-muted mb-2">Titre de l'idee</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Guide complet sur..."
                className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white placeholder-dark-muted"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-muted mb-2">Keyword cible</label>
              <input
                type="text"
                value={formData.keyword}
                onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                placeholder="mot-cle principal"
                className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white placeholder-dark-muted"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-muted mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notes supplementaires..."
                rows={3}
                className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white placeholder-dark-muted resize-none"
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

export default function Idees() {
  const [ideas, setIdeas] = useState([]);
  const [sites, setSites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSiteId, setSelectedSiteId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [sitesData] = await Promise.all([sitesApi.getAll()]);
      setSites(sitesData || []);

      const { data: ideasData, error } = await supabase
        .from('content_ideas')
        .select('*, sites(mcp_alias, domain)')
        .order('created_at', { ascending: false });

      if (!error) {
        setIdeas(ideasData || []);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddIdea = async (ideaData) => {
    const { data, error } = await supabase
      .from('content_ideas')
      .insert([{ ...ideaData, status: 'new' }])
      .select()
      .single();

    if (error) throw error;
    setIdeas([data, ...ideas]);
  };

  const handleUpdateStatus = async (idea, status) => {
    const { error } = await supabase
      .from('content_ideas')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', idea.id);

    if (!error) {
      setIdeas(ideas.map(i => i.id === idea.id ? { ...i, status } : i));
    }
  };

  const handleDelete = async (idea) => {
    if (!confirm('Supprimer cette idee ?')) return;

    const { error } = await supabase
      .from('content_ideas')
      .delete()
      .eq('id', idea.id);

    if (!error) {
      setIdeas(ideas.filter(i => i.id !== idea.id));
    }
  };

  const handleCreateBrief = (idea) => {
    // TODO: Navigate to brief creation with idea data
    alert(`Creation du brief pour "${idea.title}"`);
  };

  const handleGenerate = () => {
    // TODO: Trigger n8n workflow for idea generation
    alert('Generation d\'idees via PAA et concurrents (n8n workflow)');
  };

  // Filter ideas
  const filteredIdeas = ideas.filter(idea => {
    const matchesSearch = idea.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          idea.keyword?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSite = selectedSiteId === 'all' || idea.site_id === selectedSiteId;
    const matchesStatus = selectedStatus === 'all' || idea.status === selectedStatus;
    return matchesSearch && matchesSite && matchesStatus;
  });

  // Stats
  const stats = {
    total: ideas.length,
    new: ideas.filter(i => i.status === 'new').length,
    approved: ideas.filter(i => i.status === 'approved').length,
    inProgress: ideas.filter(i => i.status === 'in_progress').length,
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
          <h1 className="text-2xl font-bold text-white">Idees de Contenu</h1>
          <p className="text-dark-muted mt-1">Generez et gerez vos idees d'articles</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={handleGenerate}>
            <Sparkles className="w-4 h-4 mr-2" />
            Generer
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle idee
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-sm text-dark-muted">Total idees</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-info">{stats.new}</div>
          <div className="text-sm text-dark-muted">Nouvelles</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-success">{stats.approved}</div>
          <div className="text-sm text-dark-muted">Approuvees</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-warning">{stats.inProgress}</div>
          <div className="text-sm text-dark-muted">En cours</div>
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
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-primary"
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
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
          >
            <option value="all">Tous les statuts</option>
            <option value="new">Nouveau</option>
            <option value="approved">Approuve</option>
            <option value="in_progress">En cours</option>
            <option value="published">Publie</option>
          </select>
        </div>
      </Card>

      {/* Ideas Grid */}
      {filteredIdeas.length === 0 ? (
        <Card className="p-12 text-center">
          <Lightbulb className="w-12 h-12 mx-auto text-dark-muted mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Aucune idee</h3>
          <p className="text-dark-muted mb-6">Generez des idees ou ajoutez-en manuellement</p>
          <div className="flex gap-3 justify-center">
            <Button variant="ghost" onClick={handleGenerate}>
              <Sparkles className="w-4 h-4 mr-2" />
              Generer des idees
            </Button>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter manuellement
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIdeas.map(idea => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onApprove={(i) => handleUpdateStatus(i, 'approved')}
              onReject={(i) => handleUpdateStatus(i, 'rejected')}
              onCreateBrief={handleCreateBrief}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <AddIdeaModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        sites={sites}
        onAdd={handleAddIdea}
      />
    </div>
  );
}
