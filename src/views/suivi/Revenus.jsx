import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Users, ShoppingCart, CreditCard, Plus, Filter, Calendar, ArrowUp, ArrowDown, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { sitesApi, supabase } from '../../lib/supabase';

// Revenue source types
const sourceTypes = {
  lead: { label: 'Lead', color: 'bg-info', icon: Users },
  sale: { label: 'Vente', color: 'bg-success', icon: ShoppingCart },
  subscription: { label: 'Abonnement', color: 'bg-primary', icon: CreditCard },
  affiliate: { label: 'Affiliation', color: 'bg-warning', icon: DollarSign },
  service: { label: 'Service', color: 'bg-purple-500', icon: DollarSign },
  link_sale: { label: 'Vente de lien', color: 'bg-pink-500', icon: DollarSign },
};

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
};

// Revenue row
function RevenueRow({ revenue, sites, onEdit, onDelete }) {
  const source = sourceTypes[revenue.source_type] || sourceTypes.lead;
  const site = sites.find(s => s.id === revenue.site_id);

  return (
    <tr className="border-b border-dark-border hover:bg-dark-border/30 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${source.color}`} />
          <span className="text-white">{revenue.description || source.label}</span>
        </div>
      </td>
      <td className="py-3 px-4">
        <Badge variant="secondary" size="sm">{source.label}</Badge>
      </td>
      <td className="py-3 px-4 text-dark-muted">
        {site?.mcp_alias || site?.domain || '-'}
      </td>
      <td className="py-3 px-4 text-right">
        <span className="text-success font-medium">{formatCurrency(revenue.amount)}</span>
      </td>
      <td className="py-3 px-4 text-dark-muted">
        {new Date(revenue.date).toLocaleDateString('fr-FR')}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onEdit(revenue)}
            className="p-1.5 hover:bg-dark-border rounded text-dark-muted hover:text-white"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(revenue.id)}
            className="p-1.5 hover:bg-dark-border rounded text-dark-muted hover:text-danger"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// Add/Edit revenue modal
function RevenueModal({ revenue, sites, onClose, onSave }) {
  const [formData, setFormData] = useState({
    source_type: revenue?.source_type || 'lead',
    site_id: revenue?.site_id || '',
    amount: revenue?.amount || '',
    description: revenue?.description || '',
    date: revenue?.date?.split('T')[0] || new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount) return;
    onSave({
      ...revenue,
      ...formData,
      amount: parseFloat(formData.amount),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <Card className="w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-white mb-4">
          {revenue ? 'Modifier le revenu' : 'Ajouter un revenu'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-dark-muted mb-1">Type de source *</label>
            <select
              value={formData.source_type}
              onChange={(e) => setFormData({ ...formData, source_type: e.target.value })}
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
            >
              {Object.entries(sourceTypes).map(([key, config]) => (
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
              <option value="">Aucun site specifique</option>
              {sites.map(site => (
                <option key={site.id} value={site.id}>{site.mcp_alias || site.domain}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-dark-muted mb-1">Montant (EUR) *</label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-dark-muted mb-1">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description du revenu..."
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm text-dark-muted mb-1">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" onClick={onClose}>Annuler</Button>
            <Button type="submit">
              {revenue ? 'Modifier' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

// Site revenue summary card
function SiteRevenueCard({ site, revenues }) {
  const siteRevenues = revenues.filter(r => r.site_id === site.id);
  const total = siteRevenues.reduce((sum, r) => sum + r.amount, 0);
  const thisMonth = siteRevenues.filter(r => {
    const d = new Date(r.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((sum, r) => sum + r.amount, 0);

  if (total === 0) return null;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-dark-border flex items-center justify-center text-sm font-medium text-white">
            {(site.mcp_alias || site.domain)?.charAt(0).toUpperCase()}
          </div>
          <span className="text-white font-medium">{site.mcp_alias || site.domain}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-dark-muted">Total</p>
          <p className="text-lg font-bold text-success">{formatCurrency(total)}</p>
        </div>
        <div>
          <p className="text-xs text-dark-muted">Ce mois</p>
          <p className="text-lg font-bold text-white">{formatCurrency(thisMonth)}</p>
        </div>
      </div>
    </Card>
  );
}

export default function Revenus() {
  const [revenues, setRevenues] = useState([]);
  const [sites, setSites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRevenue, setEditingRevenue] = useState(null);
  const [dateRange, setDateRange] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load sites
      const sitesData = await sitesApi.getAll();
      setSites(sitesData || []);

      // Load revenues
      const { data, error } = await supabase
        .from('revenues')
        .select('*')
        .order('date', { ascending: false });

      if (!error) {
        setRevenues(data || []);
      }
    } catch (err) {
      console.error('Error loading revenues:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (revenueData) => {
    try {
      if (revenueData.id) {
        // Update
        const { error } = await supabase
          .from('revenues')
          .update({
            source_type: revenueData.source_type,
            site_id: revenueData.site_id || null,
            amount: revenueData.amount,
            description: revenueData.description,
            date: revenueData.date,
          })
          .eq('id', revenueData.id);

        if (!error) {
          setRevenues(revenues.map(r => r.id === revenueData.id ? { ...r, ...revenueData } : r));
        }
      } else {
        // Insert
        const { data, error } = await supabase
          .from('revenues')
          .insert([{
            source_type: revenueData.source_type,
            site_id: revenueData.site_id || null,
            amount: revenueData.amount,
            description: revenueData.description,
            date: revenueData.date,
          }])
          .select()
          .single();

        if (!error && data) {
          setRevenues([data, ...revenues]);
        }
      }
    } catch (err) {
      console.error('Error saving revenue:', err);
    }
    setShowModal(false);
    setEditingRevenue(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce revenu ?')) return;

    try {
      const { error } = await supabase
        .from('revenues')
        .delete()
        .eq('id', id);

      if (!error) {
        setRevenues(revenues.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error('Error deleting revenue:', err);
    }
  };

  // Filter revenues
  const filteredRevenues = revenues.filter(r => {
    if (typeFilter !== 'all' && r.source_type !== typeFilter) return false;

    if (dateRange !== 'all') {
      const date = new Date(r.date);
      const now = new Date();
      if (dateRange === 'month') {
        if (date.getMonth() !== now.getMonth() || date.getFullYear() !== now.getFullYear()) return false;
      } else if (dateRange === 'year') {
        if (date.getFullYear() !== now.getFullYear()) return false;
      }
    }

    return true;
  });

  // Calculate stats
  const now = new Date();
  const thisMonth = revenues.filter(r => {
    const d = new Date(r.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const lastMonth = revenues.filter(r => {
    const d = new Date(r.date);
    const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getMonth() === last.getMonth() && d.getFullYear() === last.getFullYear();
  });

  const stats = {
    total: revenues.reduce((sum, r) => sum + r.amount, 0),
    thisMonth: thisMonth.reduce((sum, r) => sum + r.amount, 0),
    lastMonth: lastMonth.reduce((sum, r) => sum + r.amount, 0),
    leads: revenues.filter(r => r.source_type === 'lead').length,
    sales: revenues.filter(r => r.source_type === 'sale').length,
  };

  const monthChange = stats.lastMonth > 0
    ? ((stats.thisMonth - stats.lastMonth) / stats.lastMonth * 100)
    : 0;

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
          <h1 className="text-2xl font-bold text-white">Revenus</h1>
          <p className="text-dark-muted mt-1">Suivi de la monetisation de vos sites</p>
        </div>
        <Button onClick={() => { setEditingRevenue(null); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un revenu
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <DollarSign className="w-5 h-5 text-success" />
            </div>
            <div>
              <div className="text-2xl font-bold text-success">{formatCurrency(stats.total)}</div>
              <div className="text-sm text-dark-muted">Total revenus</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{formatCurrency(stats.thisMonth)}</div>
              <div className="text-sm text-dark-muted flex items-center gap-1">
                Ce mois
                {monthChange !== 0 && (
                  <span className={monthChange > 0 ? 'text-success' : 'text-danger'}>
                    {monthChange > 0 ? '+' : ''}{monthChange.toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info/10">
              <Users className="w-5 h-5 text-info" />
            </div>
            <div>
              <div className="text-2xl font-bold text-info">{stats.leads}</div>
              <div className="text-sm text-dark-muted">Leads</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <ShoppingCart className="w-5 h-5 text-warning" />
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">{stats.sales}</div>
              <div className="text-sm text-dark-muted">Ventes</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Revenue by site */}
      {sites.filter(s => revenues.some(r => r.site_id === s.id)).length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Revenus par site</h3>
          <div className="grid grid-cols-4 gap-4">
            {sites.map(site => (
              <SiteRevenueCard key={site.id} site={site} revenues={revenues} />
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
          >
            <option value="all">Toutes les periodes</option>
            <option value="month">Ce mois</option>
            <option value="year">Cette annee</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
          >
            <option value="all">Tous les types</option>
            {Object.entries(sourceTypes).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Revenues table */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-dark-border">
          <h3 className="text-lg font-semibold text-white">Historique des revenus</h3>
        </div>
        {filteredRevenues.length === 0 ? (
          <div className="p-12 text-center">
            <DollarSign className="w-12 h-12 mx-auto text-dark-muted mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Aucun revenu enregistre</h3>
            <p className="text-dark-muted mb-6">Commencez a suivre vos revenus</p>
            <Button onClick={() => { setEditingRevenue(null); setShowModal(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un revenu
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-border bg-dark-border/30">
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Description</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Site</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-dark-muted">Montant</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Date</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-dark-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRevenues.map(revenue => (
                    <RevenueRow
                      key={revenue.id}
                      revenue={revenue}
                      sites={sites}
                      onEdit={(r) => { setEditingRevenue(r); setShowModal(true); }}
                      onDelete={handleDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-dark-border flex justify-between text-sm text-dark-muted">
              <span>{filteredRevenues.length} revenus</span>
              <span className="text-success font-medium">
                Total: {formatCurrency(filteredRevenues.reduce((sum, r) => sum + r.amount, 0))}
              </span>
            </div>
          </>
        )}
      </Card>

      {/* Modal */}
      {showModal && (
        <RevenueModal
          revenue={editingRevenue}
          sites={sites}
          onClose={() => { setShowModal(false); setEditingRevenue(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
