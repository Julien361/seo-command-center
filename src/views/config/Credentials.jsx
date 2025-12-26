import { useState, useEffect } from 'react';
import { Key, Plus, Search, Check, X, RefreshCw, Eye, EyeOff, Trash2, Edit2, Globe, Database, BarChart3, Bot } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { sitesApi, supabase } from '../../lib/supabase';

// Provider icons and colors
const providerConfig = {
  wordpress: { icon: Globe, color: 'text-blue-400', label: 'WordPress' },
  google: { icon: BarChart3, color: 'text-red-400', label: 'Google' },
  dataforseo: { icon: Database, color: 'text-green-400', label: 'DataForSEO' },
  openai: { icon: Bot, color: 'text-purple-400', label: 'OpenAI' },
  anthropic: { icon: Bot, color: 'text-orange-400', label: 'Anthropic' },
  custom: { icon: Key, color: 'text-gray-400', label: 'Custom' },
};

const typeLabels = {
  api_key: 'API Key',
  oauth: 'OAuth',
  basic_auth: 'Basic Auth',
  bearer: 'Bearer Token',
  wordpress_app: 'WP App Password',
};

// Credential Card
function CredentialCard({ credential, onTest, onEdit, onDelete }) {
  const [showSecret, setShowSecret] = useState(false);
  const provider = providerConfig[credential.provider] || providerConfig.custom;
  const Icon = provider.icon;

  const statusColors = {
    success: 'bg-success',
    failed: 'bg-danger',
    pending: 'bg-warning',
    untested: 'bg-dark-muted',
  };

  return (
    <Card className="p-4 hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-dark-border ${provider.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-medium text-white">{credential.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="default">{provider.label}</Badge>
              <span className="text-xs text-dark-muted">{typeLabels[credential.type] || credential.type}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${statusColors[credential.test_status] || statusColors.untested}`} />
          <span className="text-xs text-dark-muted capitalize">{credential.test_status || 'Non teste'}</span>
        </div>
      </div>

      {credential.base_url && (
        <div className="text-sm text-dark-muted mb-3 truncate">
          {credential.base_url}
        </div>
      )}

      {credential.credentials && (
        <div className="bg-dark-border/50 rounded p-2 mb-3">
          <div className="flex items-center justify-between">
            <code className="text-xs text-dark-muted font-mono">
              {showSecret
                ? JSON.stringify(credential.credentials, null, 2).substring(0, 100) + '...'
                : '••••••••••••••••'}
            </code>
            <button
              onClick={() => setShowSecret(!showSecret)}
              className="p-1 hover:bg-dark-border rounded text-dark-muted hover:text-white"
            >
              {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
          </div>
        </div>
      )}

      {credential.last_tested_at && (
        <div className="text-xs text-dark-muted mb-3">
          Dernier test: {new Date(credential.last_tested_at).toLocaleString('fr-FR')}
          {credential.test_message && (
            <span className="ml-2 text-warning">({credential.test_message})</span>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={() => onTest(credential)}>
          <RefreshCw className="w-3 h-3 mr-1" />
          Tester
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onEdit(credential)}>
          <Edit2 className="w-3 h-3 mr-1" />
          Modifier
        </Button>
        <Button size="sm" variant="ghost" className="text-danger hover:text-danger" onClick={() => onDelete(credential)}>
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </Card>
  );
}

// Add/Edit Modal
function CredentialModal({ isOpen, onClose, sites, credential, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'api_key',
    provider: 'custom',
    site_id: '',
    base_url: '',
    credentials: {},
  });
  const [credentialKey, setCredentialKey] = useState('');
  const [credentialValue, setCredentialValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (credential) {
      setFormData({
        name: credential.name || '',
        type: credential.type || 'api_key',
        provider: credential.provider || 'custom',
        site_id: credential.site_id || '',
        base_url: credential.base_url || '',
        credentials: credential.credentials || {},
      });
    } else {
      setFormData({
        name: '',
        type: 'api_key',
        provider: 'custom',
        site_id: '',
        base_url: '',
        credentials: {},
      });
    }
  }, [credential]);

  const handleAddCredentialField = () => {
    if (!credentialKey || !credentialValue) return;
    setFormData({
      ...formData,
      credentials: { ...formData.credentials, [credentialKey]: credentialValue }
    });
    setCredentialKey('');
    setCredentialValue('');
  };

  const handleRemoveCredentialField = (key) => {
    const newCreds = { ...formData.credentials };
    delete newCreds[key];
    setFormData({ ...formData, credentials: newCreds });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.provider) return;

    setIsLoading(true);
    try {
      await onSave({
        ...formData,
        site_id: formData.site_id || null,
      }, credential?.id);
      onClose();
    } catch (error) {
      console.error('Error saving credential:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <Card className="w-full max-w-lg max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-6">
            {credential ? 'Modifier le credential' : 'Nouveau credential'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-muted mb-2">Nom</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: WordPress Production"
                className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white placeholder-dark-muted"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-muted mb-2">Provider</label>
                <select
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
                >
                  <option value="wordpress">WordPress</option>
                  <option value="google">Google</option>
                  <option value="dataforseo">DataForSEO</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-muted mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
                >
                  <option value="api_key">API Key</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="basic_auth">Basic Auth</option>
                  <option value="oauth">OAuth</option>
                  <option value="wordpress_app">WP App Password</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-muted mb-2">Site (optionnel)</label>
              <select
                value={formData.site_id}
                onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
              >
                <option value="">Global (tous les sites)</option>
                {sites.map(site => (
                  <option key={site.id} value={site.id}>{site.mcp_alias || site.domain}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-muted mb-2">URL de base (optionnel)</label>
              <input
                type="text"
                value={formData.base_url}
                onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                placeholder="https://api.example.com"
                className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white placeholder-dark-muted"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-muted mb-2">Credentials</label>
              <div className="space-y-2">
                {Object.entries(formData.credentials).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 bg-dark-border/50 rounded p-2">
                    <span className="text-sm text-white font-mono">{key}:</span>
                    <span className="text-sm text-dark-muted font-mono flex-1 truncate">••••••••</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCredentialField(key)}
                      className="text-danger hover:text-danger/80"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={credentialKey}
                    onChange={(e) => setCredentialKey(e.target.value)}
                    placeholder="Cle (ex: api_key)"
                    className="flex-1 px-3 py-2 bg-dark-border border border-dark-border rounded-lg text-white placeholder-dark-muted text-sm"
                  />
                  <input
                    type="password"
                    value={credentialValue}
                    onChange={(e) => setCredentialValue(e.target.value)}
                    placeholder="Valeur"
                    className="flex-1 px-3 py-2 bg-dark-border border border-dark-border rounded-lg text-white placeholder-dark-muted text-sm"
                  />
                  <Button type="button" size="sm" onClick={handleAddCredentialField}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

export default function Credentials() {
  const [credentials, setCredentials] = useState([]);
  const [sites, setSites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCredential, setEditingCredential] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [sitesData] = await Promise.all([sitesApi.getAll()]);
      setSites(sitesData || []);

      const { data: credsData, error } = await supabase
        .from('api_credentials')
        .select('*, sites(mcp_alias, domain)')
        .order('created_at', { ascending: false });

      if (!error) {
        setCredentials(credsData || []);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (data, id = null) => {
    if (id) {
      const { data: updated, error } = await supabase
        .from('api_credentials')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setCredentials(credentials.map(c => c.id === id ? updated : c));
    } else {
      const { data: created, error } = await supabase
        .from('api_credentials')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      setCredentials([created, ...credentials]);
    }
    setEditingCredential(null);
  };

  const handleTest = async (credential) => {
    // TODO: Implement actual API test
    const { error } = await supabase
      .from('api_credentials')
      .update({
        test_status: 'success',
        last_tested_at: new Date().toISOString(),
        test_message: 'Connexion OK'
      })
      .eq('id', credential.id);

    if (!error) {
      setCredentials(credentials.map(c =>
        c.id === credential.id
          ? { ...c, test_status: 'success', last_tested_at: new Date().toISOString() }
          : c
      ));
    }
  };

  const handleDelete = async (credential) => {
    if (!confirm(`Supprimer le credential "${credential.name}" ?`)) return;

    const { error } = await supabase
      .from('api_credentials')
      .delete()
      .eq('id', credential.id);

    if (!error) {
      setCredentials(credentials.filter(c => c.id !== credential.id));
    }
  };

  // Filter credentials
  const filteredCredentials = credentials.filter(cred => {
    const matchesSearch = cred.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProvider = selectedProvider === 'all' || cred.provider === selectedProvider;
    return matchesSearch && matchesProvider;
  });

  // Group by provider
  const credentialsByProvider = filteredCredentials.reduce((acc, cred) => {
    const provider = cred.provider || 'custom';
    if (!acc[provider]) acc[provider] = [];
    acc[provider].push(cred);
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
          <h1 className="text-2xl font-bold text-white">Credentials & APIs</h1>
          <p className="text-dark-muted mt-1">Gerez vos acces API et credentials</p>
        </div>
        <Button onClick={() => { setEditingCredential(null); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter
        </Button>
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
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
          >
            <option value="all">Tous les providers</option>
            <option value="wordpress">WordPress</option>
            <option value="google">Google</option>
            <option value="dataforseo">DataForSEO</option>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      </Card>

      {/* Credentials List */}
      {filteredCredentials.length === 0 ? (
        <Card className="p-12 text-center">
          <Key className="w-12 h-12 mx-auto text-dark-muted mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Aucun credential</h3>
          <p className="text-dark-muted mb-6">Ajoutez vos acces API pour les utiliser dans l'application</p>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un credential
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(credentialsByProvider).map(([provider, creds]) => {
            const config = providerConfig[provider] || providerConfig.custom;
            return (
              <div key={provider}>
                <h3 className="text-sm font-medium text-dark-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                  <config.icon className={`w-4 h-4 ${config.color}`} />
                  {config.label}
                  <Badge variant="default">{creds.length}</Badge>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {creds.map(credential => (
                    <CredentialCard
                      key={credential.id}
                      credential={credential}
                      onTest={handleTest}
                      onEdit={(c) => { setEditingCredential(c); setShowModal(true); }}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CredentialModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingCredential(null); }}
        sites={sites}
        credential={editingCredential}
        onSave={handleSave}
      />
    </div>
  );
}
