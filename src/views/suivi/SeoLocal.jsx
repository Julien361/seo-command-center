import { useState, useEffect } from 'react';
import { MapPin, Star, Building2, Phone, Globe, Clock, MessageSquare, Plus, ExternalLink, Check, X, Edit2, Trash2, RefreshCw } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { sitesApi, supabase } from '../../lib/supabase';

// Citation sources
const citationSources = [
  { name: 'Google Business Profile', icon: '🔍', priority: 1 },
  { name: 'Pages Jaunes', icon: '📒', priority: 2 },
  { name: 'Yelp', icon: '⭐', priority: 3 },
  { name: 'TripAdvisor', icon: '🦉', priority: 4 },
  { name: 'Facebook', icon: '📘', priority: 5 },
  { name: 'Apple Maps', icon: '🍎', priority: 6 },
  { name: 'Bing Places', icon: '🔷', priority: 7 },
  { name: 'Mappy', icon: '🗺️', priority: 8 },
];

// Review card
function ReviewCard({ review }) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-dark-border flex items-center justify-center text-white font-medium">
          {review.author_name?.charAt(0) || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white font-medium">{review.author_name || 'Anonyme'}</span>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map(star => (
                <Star
                  key={star}
                  className={`w-3 h-3 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-dark-muted'}`}
                />
              ))}
            </div>
          </div>
          <p className="text-dark-muted text-sm mt-1 line-clamp-2">{review.text}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-dark-muted">
            <span>{new Date(review.created_at).toLocaleDateString('fr-FR')}</span>
            <span>{review.source || 'Google'}</span>
          </div>
          {review.reply && (
            <div className="mt-3 pl-3 border-l-2 border-primary">
              <p className="text-sm text-dark-muted">
                <span className="text-primary">Reponse:</span> {review.reply}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// Business location card
function LocationCard({ location, onEdit }) {
  const completeness = calculateCompleteness(location);

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-white font-medium">{location.business_name}</h3>
            <p className="text-sm text-dark-muted">{location.sites?.mcp_alias || location.sites?.domain}</p>
          </div>
        </div>
        <button
          onClick={() => onEdit(location)}
          className="p-1.5 hover:bg-dark-border rounded text-dark-muted hover:text-white"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>

      {/* Completeness bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-dark-muted">Completude du profil</span>
          <span className={completeness >= 80 ? 'text-success' : completeness >= 50 ? 'text-warning' : 'text-danger'}>
            {completeness}%
          </span>
        </div>
        <div className="h-2 bg-dark-border rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${completeness >= 80 ? 'bg-success' : completeness >= 50 ? 'bg-warning' : 'bg-danger'}`}
            style={{ width: `${completeness}%` }}
          />
        </div>
      </div>

      {/* NAP Info */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-dark-muted" />
          <span className={location.address ? 'text-white' : 'text-dark-muted italic'}>
            {location.address || 'Adresse non renseignee'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-dark-muted" />
          <span className={location.phone ? 'text-white' : 'text-dark-muted italic'}>
            {location.phone || 'Telephone non renseigne'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-dark-muted" />
          <span className={location.website ? 'text-white' : 'text-dark-muted italic'}>
            {location.website || 'Site web non renseigne'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-dark-muted" />
          <span className={location.hours ? 'text-white' : 'text-dark-muted italic'}>
            {location.hours ? 'Horaires configures' : 'Horaires non renseignes'}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-dark-border">
        <div className="text-center">
          <div className="text-lg font-bold text-white">{location.review_count || 0}</div>
          <div className="text-xs text-dark-muted">Avis</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-warning flex items-center justify-center gap-1">
            <Star className="w-4 h-4 fill-warning" />
            {location.avg_rating?.toFixed(1) || '-'}
          </div>
          <div className="text-xs text-dark-muted">Note</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-success">{location.citations_count || 0}</div>
          <div className="text-xs text-dark-muted">Citations</div>
        </div>
      </div>
    </Card>
  );
}

// Calculate profile completeness
function calculateCompleteness(location) {
  const fields = [
    'business_name',
    'address',
    'phone',
    'website',
    'hours',
    'description',
    'category',
    'photos_count',
  ];

  const filled = fields.filter(f => {
    if (f === 'photos_count') return location[f] > 0;
    return !!location[f];
  }).length;

  return Math.round((filled / fields.length) * 100);
}

// Citation status row
function CitationRow({ citation, source }) {
  const statusConfig = {
    verified: { color: 'text-success', icon: Check, label: 'Verifie' },
    pending: { color: 'text-warning', icon: Clock, label: 'En attente' },
    error: { color: 'text-danger', icon: X, label: 'Erreur NAP' },
    missing: { color: 'text-dark-muted', icon: X, label: 'Absent' },
  };

  const status = statusConfig[citation?.status] || statusConfig.missing;
  const Icon = status.icon;

  return (
    <tr className="border-b border-dark-border hover:bg-dark-border/30 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{source.icon}</span>
          <span className="text-white">{source.name}</span>
        </div>
      </td>
      <td className="py-3 px-4">
        <div className={`flex items-center gap-1 ${status.color}`}>
          <Icon className="w-4 h-4" />
          <span className="text-sm">{status.label}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-dark-muted text-sm">
        {citation?.last_checked
          ? new Date(citation.last_checked).toLocaleDateString('fr-FR')
          : '-'}
      </td>
      <td className="py-3 px-4 text-right">
        {citation?.url ? (
          <a
            href={citation.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
          >
            Voir <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <Button size="sm" variant="secondary">
            <Plus className="w-3 h-3 mr-1" />
            Ajouter
          </Button>
        )}
      </td>
    </tr>
  );
}

// Location modal
function LocationModal({ location, sites, onClose, onSave }) {
  const [formData, setFormData] = useState({
    site_id: location?.site_id || '',
    business_name: location?.business_name || '',
    address: location?.address || '',
    city: location?.city || '',
    postal_code: location?.postal_code || '',
    phone: location?.phone || '',
    website: location?.website || '',
    category: location?.category || '',
    description: location?.description || '',
    hours: location?.hours || '',
    gbp_url: location?.gbp_url || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.business_name || !formData.site_id) return;
    onSave({ ...location, ...formData });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-auto py-8" onClick={onClose}>
      <Card className="w-full max-w-2xl p-6 my-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-white mb-4">
          {location ? 'Modifier l\'etablissement' : 'Ajouter un etablissement'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-dark-muted mb-1">Site *</label>
              <select
                value={formData.site_id}
                onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
                required
              >
                <option value="">Selectionner un site</option>
                {sites.map(site => (
                  <option key={site.id} value={site.id}>{site.mcp_alias || site.domain}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-dark-muted mb-1">Nom de l'etablissement *</label>
              <input
                type="text"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-dark-muted mb-1">Adresse</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-dark-muted mb-1">Ville</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-dark-muted mb-1">Code postal</label>
              <input
                type="text"
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-dark-muted mb-1">Telephone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-dark-muted mb-1">Site web</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-dark-muted mb-1">Categorie</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="Ex: Diagnostic immobilier"
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-dark-muted mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-dark-muted mb-1">URL Google Business Profile</label>
            <input
              type="url"
              value={formData.gbp_url}
              onChange={(e) => setFormData({ ...formData, gbp_url: e.target.value })}
              placeholder="https://g.page/..."
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" onClick={onClose}>Annuler</Button>
            <Button type="submit">{location ? 'Modifier' : 'Ajouter'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function SeoLocal() {
  const [locations, setLocations] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [citations, setCitations] = useState([]);
  const [sites, setSites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [selectedLocationId, setSelectedLocationId] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load sites
      const sitesData = await sitesApi.getAll();
      setSites(sitesData || []);

      // Load local SEO data
      const { data: localData, error } = await supabase
        .from('local_seo')
        .select('*, sites(mcp_alias, domain)');

      if (!error) {
        setLocations(localData || []);
      }

      // TODO: Load reviews from dedicated table when available
      // For now using mock data
      setReviews([]);
      setCitations([]);

    } catch (err) {
      console.error('Error loading local SEO data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (locationData) => {
    try {
      if (locationData.id) {
        // Update
        const { error } = await supabase
          .from('local_seo')
          .update(locationData)
          .eq('id', locationData.id);

        if (!error) {
          setLocations(locations.map(l => l.id === locationData.id ? locationData : l));
        }
      } else {
        // Insert
        const { data, error } = await supabase
          .from('local_seo')
          .insert([locationData])
          .select('*, sites(mcp_alias, domain)')
          .single();

        if (!error && data) {
          setLocations([...locations, data]);
        }
      }
    } catch (err) {
      console.error('Error saving location:', err);
    }
    setShowModal(false);
    setEditingLocation(null);
  };

  // Stats
  const stats = {
    locations: locations.length,
    avgRating: locations.length > 0
      ? (locations.reduce((sum, l) => sum + (l.avg_rating || 0), 0) / locations.filter(l => l.avg_rating).length).toFixed(1)
      : '-',
    totalReviews: locations.reduce((sum, l) => sum + (l.review_count || 0), 0),
    citations: locations.reduce((sum, l) => sum + (l.citations_count || 0), 0),
  };

  const selectedLocation = selectedLocationId !== 'all'
    ? locations.find(l => l.id === selectedLocationId)
    : null;

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
          <h1 className="text-2xl font-bold text-white">SEO Local</h1>
          <p className="text-dark-muted mt-1">Google Business Profile et citations NAP</p>
        </div>
        <Button onClick={() => { setEditingLocation(null); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un etablissement
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.locations}</div>
              <div className="text-sm text-dark-muted">Etablissements</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <Star className="w-5 h-5 text-warning" />
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">{stats.avgRating}</div>
              <div className="text-sm text-dark-muted">Note moyenne</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info/10">
              <MessageSquare className="w-5 h-5 text-info" />
            </div>
            <div>
              <div className="text-2xl font-bold text-info">{stats.totalReviews}</div>
              <div className="text-sm text-dark-muted">Avis total</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <Globe className="w-5 h-5 text-success" />
            </div>
            <div>
              <div className="text-2xl font-bold text-success">{stats.citations}</div>
              <div className="text-sm text-dark-muted">Citations</div>
            </div>
          </div>
        </Card>
      </div>

      {locations.length === 0 ? (
        <Card className="p-12 text-center">
          <MapPin className="w-12 h-12 mx-auto text-dark-muted mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Aucun etablissement</h3>
          <p className="text-dark-muted mb-6">Ajoutez vos etablissements pour suivre votre SEO local</p>
          <Button onClick={() => { setEditingLocation(null); setShowModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un etablissement
          </Button>
        </Card>
      ) : (
        <>
          {/* Locations grid */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Vos etablissements</h3>
            <div className="grid grid-cols-2 gap-4">
              {locations.map(location => (
                <LocationCard
                  key={location.id}
                  location={location}
                  onEdit={(l) => { setEditingLocation(l); setShowModal(true); }}
                />
              ))}
            </div>
          </div>

          {/* Citations check */}
          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b border-dark-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Verification des citations</h3>
                <p className="text-sm text-dark-muted">Coherence NAP sur les annuaires</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  className="px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white text-sm"
                >
                  <option value="all">Tous les etablissements</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.business_name}</option>
                  ))}
                </select>
                <Button variant="secondary" size="sm">
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Verifier
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-border bg-dark-border/30">
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Source</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Statut</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Derniere verification</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-dark-muted">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {citationSources.map(source => (
                    <CitationRow
                      key={source.name}
                      source={source}
                      citation={citations.find(c => c.source === source.name)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Recent reviews */}
          {reviews.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Derniers avis</h3>
                <Button variant="secondary" size="sm">
                  Voir tous les avis
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {reviews.slice(0, 4).map(review => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <LocationModal
          location={editingLocation}
          sites={sites}
          onClose={() => { setShowModal(false); setEditingLocation(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
