import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Plus, CheckCircle, Clock, Target, FileText, Link2, Image, Code, Zap, ArrowUp, ArrowDown, Minus, Filter, Calendar, Edit2, Trash2 } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { sitesApi, supabase } from '../../lib/supabase';

// Improvement types
const improvementTypes = {
  content_update: { label: 'Mise a jour contenu', icon: FileText, color: 'text-info' },
  content_expansion: { label: 'Enrichissement', icon: FileText, color: 'text-info' },
  title_optimization: { label: 'Optimisation titre', icon: Target, color: 'text-primary' },
  meta_optimization: { label: 'Optimisation meta', icon: Code, color: 'text-primary' },
  internal_linking: { label: 'Maillage interne', icon: Link2, color: 'text-warning' },
  image_optimization: { label: 'Optimisation images', icon: Image, color: 'text-success' },
  speed_optimization: { label: 'Performance', icon: Zap, color: 'text-danger' },
  schema_markup: { label: 'Schema markup', icon: Code, color: 'text-purple-400' },
  featured_snippet: { label: 'Position 0', icon: Target, color: 'text-yellow-400' },
  new_content: { label: 'Nouveau contenu', icon: FileText, color: 'text-success' },
};

// Status configuration
const statusConfig = {
  planned: { label: 'Planifie', color: 'bg-dark-muted', textColor: 'text-dark-muted' },
  in_progress: { label: 'En cours', color: 'bg-warning', textColor: 'text-warning' },
  completed: { label: 'Termine', color: 'bg-success', textColor: 'text-success' },
  measuring: { label: 'Mesure en cours', color: 'bg-info', textColor: 'text-info' },
};

// Impact indicator
function ImpactIndicator({ before, after, metric = 'position' }) {
  if (before === null || after === null) return <span className="text-dark-muted">-</span>;

  const diff = metric === 'position' ? before - after : after - before;
  const isPositive = diff > 0;
  const isNeutral = diff === 0;

  return (
    <div className={`flex items-center gap-1 ${isNeutral ? 'text-dark-muted' : isPositive ? 'text-success' : 'text-danger'}`}>
      {isNeutral ? (
        <Minus className="w-3 h-3" />
      ) : isPositive ? (
        <ArrowUp className="w-3 h-3" />
      ) : (
        <ArrowDown className="w-3 h-3" />
      )}
      <span className="font-medium">
        {isPositive ? '+' : ''}{diff.toFixed(metric === 'position' ? 1 : 0)}
        {metric === 'traffic' ? '%' : ''}
      </span>
    </div>
  );
}

// Improvement card
function ImprovementCard({ improvement, onEdit, onDelete, onUpdateStatus }) {
  const type = improvementTypes[improvement.improvement_type] || improvementTypes.content_update;
  const status = statusConfig[improvement.status] || statusConfig.planned;
  const Icon = type.icon;

  const hasResults = improvement.position_after !== null || improvement.traffic_change !== null;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg bg-dark-border`}>
            <Icon className={`w-4 h-4 ${type.color}`} />
          </div>
          <div>
            <Badge variant={improvement.status === 'completed' ? 'success' : improvement.status === 'in_progress' ? 'warning' : 'secondary'} size="sm">
              {status.label}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onEdit(improvement)} className="p-1.5 hover:bg-dark-border rounded text-dark-muted hover:text-white">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(improvement.id)} className="p-1.5 hover:bg-dark-border rounded text-dark-muted hover:text-danger">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <h4 className="text-white font-medium mb-1">{improvement.title}</h4>
      <p className="text-sm text-dark-muted mb-3">{improvement.description}</p>

      {/* Target info */}
      <div className="text-xs text-dark-muted mb-3">
        <span className="text-primary">{improvement.target_url || improvement.target_keyword}</span>
        {improvement.sites?.mcp_alias && (
          <span className="ml-2">• {improvement.sites.mcp_alias}</span>
        )}
      </div>

      {/* Results */}
      {hasResults && (
        <div className="grid grid-cols-2 gap-3 p-3 bg-dark-border/30 rounded-lg mb-3">
          <div>
            <p className="text-xs text-dark-muted mb-1">Position</p>
            <div className="flex items-center gap-2">
              <span className="text-white">{improvement.position_before?.toFixed(1) || '-'}</span>
              <ArrowUp className="w-3 h-3 text-dark-muted rotate-90" />
              <span className="text-white">{improvement.position_after?.toFixed(1) || '-'}</span>
              <ImpactIndicator before={improvement.position_before} after={improvement.position_after} metric="position" />
            </div>
          </div>
          <div>
            <p className="text-xs text-dark-muted mb-1">Trafic</p>
            <ImpactIndicator before={0} after={improvement.traffic_change} metric="traffic" />
          </div>
        </div>
      )}

      {/* Dates */}
      <div className="flex items-center justify-between text-xs text-dark-muted">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {new Date(improvement.created_at).toLocaleDateString('fr-FR')}
        </span>
        {improvement.completed_at && (
          <span className="flex items-center gap-1 text-success">
            <CheckCircle className="w-3 h-3" />
            {new Date(improvement.completed_at).toLocaleDateString('fr-FR')}
          </span>
        )}
      </div>

      {/* Status actions */}
      {improvement.status !== 'completed' && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-dark-border">
          {improvement.status === 'planned' && (
            <Button size="sm" variant="secondary" className="flex-1" onClick={() => onUpdateStatus(improvement.id, 'in_progress')}>
              <Clock className="w-3 h-3 mr-1" />
              Demarrer
            </Button>
          )}
          {improvement.status === 'in_progress' && (
            <Button size="sm" className="flex-1" onClick={() => onUpdateStatus(improvement.id, 'completed')}>
              <CheckCircle className="w-3 h-3 mr-1" />
              Terminer
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

// Add/Edit improvement modal
function ImprovementModal({ improvement, sites, onClose, onSave }) {
  const [formData, setFormData] = useState({
    site_id: improvement?.site_id || '',
    improvement_type: improvement?.improvement_type || 'content_update',
    title: improvement?.title || '',
    description: improvement?.description || '',
    target_url: improvement?.target_url || '',
    target_keyword: improvement?.target_keyword || '',
    position_before: improvement?.position_before || '',
    position_after: improvement?.position_after || '',
    traffic_change: improvement?.traffic_change || '',
    status: improvement?.status || 'planned',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title) return;
    onSave({
      ...improvement,
      ...formData,
      position_before: formData.position_before ? parseFloat(formData.position_before) : null,
      position_after: formData.position_after ? parseFloat(formData.position_after) : null,
      traffic_change: formData.traffic_change ? parseFloat(formData.traffic_change) : null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-auto py-8" onClick={onClose}>
      <Card className="w-full max-w-lg p-6 my-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-white mb-4">
          {improvement ? 'Modifier l\'amelioration' : 'Nouvelle amelioration'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-dark-muted mb-1">Type *</label>
              <select
                value={formData.improvement_type}
                onChange={(e) => setFormData({ ...formData, improvement_type: e.target.value })}
                className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
              >
                {Object.entries(improvementTypes).map(([key, config]) => (
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

          <div>
            <label className="block text-sm text-dark-muted mb-1">Titre *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Enrichissement article MaPrimeAdapt"
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-dark-muted mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-dark-muted mb-1">URL cible</label>
              <input
                type="text"
                value={formData.target_url}
                onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                placeholder="https://..."
                className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-dark-muted mb-1">Keyword cible</label>
              <input
                type="text"
                value={formData.target_keyword}
                onChange={(e) => setFormData({ ...formData, target_keyword: e.target.value })}
                className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
              />
            </div>
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

          {/* Results section for completed items */}
          {(improvement || formData.status === 'completed') && (
            <div className="pt-4 border-t border-dark-border">
              <h4 className="text-sm font-medium text-white mb-3">Resultats</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-dark-muted mb-1">Position avant</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.position_before}
                    onChange={(e) => setFormData({ ...formData, position_before: e.target.value })}
                    className="w-full px-3 py-2 bg-dark-border border border-dark-border rounded text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-dark-muted mb-1">Position apres</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.position_after}
                    onChange={(e) => setFormData({ ...formData, position_after: e.target.value })}
                    className="w-full px-3 py-2 bg-dark-border border border-dark-border rounded text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-dark-muted mb-1">Trafic (%)</label>
                  <input
                    type="number"
                    value={formData.traffic_change}
                    onChange={(e) => setFormData({ ...formData, traffic_change: e.target.value })}
                    placeholder="+15"
                    className="w-full px-3 py-2 bg-dark-border border border-dark-border rounded text-white text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" onClick={onClose}>Annuler</Button>
            <Button type="submit">{improvement ? 'Modifier' : 'Creer'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function Ameliorations() {
  const [improvements, setImprovements] = useState([]);
  const [sites, setSites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingImprovement, setEditingImprovement] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedSiteId, setSelectedSiteId] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      const sitesData = await sitesApi.getAll();
      setSites(sitesData || []);

      const { data, error } = await supabase
        .from('improvements')
        .select('*, sites(mcp_alias, domain)')
        .order('created_at', { ascending: false });

      if (!error) {
        setImprovements(data || []);
      }
    } catch (err) {
      console.error('Error loading improvements:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (improvementData) => {
    try {
      if (improvementData.id) {
        const { error } = await supabase
          .from('improvements')
          .update(improvementData)
          .eq('id', improvementData.id);

        if (!error) {
          setImprovements(improvements.map(i => i.id === improvementData.id ? { ...i, ...improvementData } : i));
        }
      } else {
        const { data, error } = await supabase
          .from('improvements')
          .insert([improvementData])
          .select('*, sites(mcp_alias, domain)')
          .single();

        if (!error && data) {
          setImprovements([data, ...improvements]);
        }
      }
    } catch (err) {
      console.error('Error saving improvement:', err);
    }
    setShowModal(false);
    setEditingImprovement(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette amelioration ?')) return;

    try {
      const { error } = await supabase
        .from('improvements')
        .delete()
        .eq('id', id);

      if (!error) {
        setImprovements(improvements.filter(i => i.id !== id));
      }
    } catch (err) {
      console.error('Error deleting improvement:', err);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const updateData = {
        status: newStatus,
        ...(newStatus === 'completed' ? { completed_at: new Date().toISOString() } : {}),
      };

      const { error } = await supabase
        .from('improvements')
        .update(updateData)
        .eq('id', id);

      if (!error) {
        setImprovements(improvements.map(i => i.id === id ? { ...i, ...updateData } : i));
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // Filter improvements
  const filteredImprovements = improvements.filter(i => {
    if (statusFilter !== 'all' && i.status !== statusFilter) return false;
    if (typeFilter !== 'all' && i.improvement_type !== typeFilter) return false;
    if (selectedSiteId !== 'all' && i.site_id !== selectedSiteId) return false;
    return true;
  });

  // Stats
  const stats = {
    total: improvements.length,
    planned: improvements.filter(i => i.status === 'planned').length,
    inProgress: improvements.filter(i => i.status === 'in_progress').length,
    completed: improvements.filter(i => i.status === 'completed').length,
    avgPositionGain: (() => {
      const withResults = improvements.filter(i => i.position_before && i.position_after);
      if (withResults.length === 0) return 0;
      const totalGain = withResults.reduce((sum, i) => sum + (i.position_before - i.position_after), 0);
      return totalGain / withResults.length;
    })(),
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
          <h1 className="text-2xl font-bold text-white">Ameliorations</h1>
          <p className="text-dark-muted mt-1">Suivez vos actions d'optimisation et leur impact</p>
        </div>
        <Button onClick={() => { setEditingImprovement(null); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle amelioration
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-sm text-dark-muted">Total</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-dark-muted/10">
              <Clock className="w-5 h-5 text-dark-muted" />
            </div>
            <div>
              <div className="text-2xl font-bold text-dark-muted">{stats.planned}</div>
              <div className="text-sm text-dark-muted">Planifiees</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <TrendingUp className="w-5 h-5 text-warning" />
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">{stats.inProgress}</div>
              <div className="text-sm text-dark-muted">En cours</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <div className="text-2xl font-bold text-success">{stats.completed}</div>
              <div className="text-sm text-dark-muted">Terminees</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info/10">
              <TrendingUp className="w-5 h-5 text-info" />
            </div>
            <div>
              <div className="text-2xl font-bold text-info">
                {stats.avgPositionGain > 0 ? '+' : ''}{stats.avgPositionGain.toFixed(1)}
              </div>
              <div className="text-sm text-dark-muted">Gain moyen</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex gap-2">
            {['all', 'planned', 'in_progress', 'completed'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm ${statusFilter === status ? 'bg-primary text-white' : 'bg-dark-border text-dark-muted hover:text-white'}`}
              >
                {status === 'all' ? 'Tous' : statusConfig[status]?.label}
              </button>
            ))}
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
          >
            <option value="all">Tous les types</option>
            {Object.entries(improvementTypes).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
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

      {/* Improvements grid */}
      {filteredImprovements.length === 0 ? (
        <Card className="p-12 text-center">
          <TrendingUp className="w-12 h-12 mx-auto text-dark-muted mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Aucune amelioration</h3>
          <p className="text-dark-muted mb-6">Commencez a suivre vos actions d'optimisation</p>
          <Button onClick={() => { setEditingImprovement(null); setShowModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle amelioration
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filteredImprovements.map(improvement => (
            <ImprovementCard
              key={improvement.id}
              improvement={improvement}
              onEdit={(i) => { setEditingImprovement(i); setShowModal(true); }}
              onDelete={handleDelete}
              onUpdateStatus={handleUpdateStatus}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <ImprovementModal
          improvement={editingImprovement}
          sites={sites}
          onClose={() => { setShowModal(false); setEditingImprovement(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
