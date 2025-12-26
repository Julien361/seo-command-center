import { useState, useEffect } from 'react';
import { Globe, Save, ArrowLeft, CheckCircle, AlertCircle, Link, Database, BarChart3, Zap, MapPin, Users, MessageSquare, Loader2 } from 'lucide-react';
import { Card, Button } from '../components/common';
import { sitesApi } from '../lib/supabase';

const ENTITIES = [
  { value: 'SRAT', label: 'SRAT' },
  { value: 'PRO FORMATION', label: 'PRO FORMATION' },
  { value: 'METIS', label: 'METIS' },
  { value: 'Client', label: 'Client' },
  { value: 'Cabinet', label: 'Cabinet' },
];

const CONTENT_TONES = [
  { value: 'expert', label: 'Expert / Professionnel' },
  { value: 'pedagogique', label: 'Pédagogique / Accessible' },
  { value: 'journalistique', label: 'Journalistique / Informatif' },
  { value: 'commercial', label: 'Commercial / Persuasif' },
  { value: 'decontracte', label: 'Décontracté / Conversationnel' },
];

const PRIORITIES = [
  { value: 1, label: '1 - Critique (site principal)' },
  { value: 2, label: '2 - Haute priorité' },
  { value: 3, label: '3 - Priorité normale' },
  { value: 4, label: '4 - Basse priorité' },
  { value: 5, label: '5 - Maintenance minimale' },
];

export default function AddSite({ onNavigate }) {
  const [formData, setFormData] = useState({
    alias: '',
    domain: '',
    entity: 'METIS',
    focus: '',
    wpApiUrl: '',
    wpUsername: '',
    wpAppPassword: '',
    gscProperty: '',
    ga4PropertyId: '',
    // Nouveaux champs
    targetAudience: '',
    contentTone: 'expert',
    geographicFocus: '',
    priority: 3,
  });
  const [wpTestStatus, setWpTestStatus] = useState({ status: 'idle', message: '' }); // idle, testing, success, error
  const [articlesCount, setArticlesCount] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Auto-remplissage basé sur le domaine
  useEffect(() => {
    if (formData.domain) {
      const cleanDomain = formData.domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

      // Auto-générer l'alias à partir du domaine si vide
      if (!formData.alias) {
        const autoAlias = cleanDomain
          .replace(/\.[^.]+$/, '') // Enlever l'extension
          .replace(/[^a-z0-9]/gi, '-') // Remplacer les caractères spéciaux
          .toLowerCase();
        setFormData(prev => ({ ...prev, alias: autoAlias }));
      }

      // Auto-remplir GSC Property
      setFormData(prev => ({
        ...prev,
        gscProperty: `sc-domain:${cleanDomain}`,
        wpApiUrl: `https://${cleanDomain}/wp-json/wp/v2`
      }));
    }
  }, [formData.domain]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'priority' ? parseInt(value) : value }));
    setMessage({ type: '', text: '' });
    // Reset WP test si on change les credentials
    if (['wpApiUrl', 'wpUsername', 'wpAppPassword'].includes(name)) {
      setWpTestStatus({ status: 'idle', message: '' });
      setArticlesCount(null);
    }
  };

  // Test de connexion WordPress
  const testWordPressConnection = async () => {
    if (!formData.wpApiUrl || !formData.wpUsername || !formData.wpAppPassword) {
      setWpTestStatus({ status: 'error', message: 'Remplissez tous les champs WordPress' });
      return;
    }

    setWpTestStatus({ status: 'testing', message: 'Test en cours...' });

    try {
      // Test authentification via /users/me
      const authHeader = 'Basic ' + btoa(`${formData.wpUsername}:${formData.wpAppPassword}`);
      const userResponse = await fetch(`${formData.wpApiUrl}/users/me`, {
        headers: { 'Authorization': authHeader }
      });

      if (!userResponse.ok) {
        throw new Error('Identifiants incorrects');
      }

      // Compter les articles
      const postsResponse = await fetch(`${formData.wpApiUrl}/posts?per_page=1`, {
        headers: { 'Authorization': authHeader }
      });

      if (postsResponse.ok) {
        const totalPosts = postsResponse.headers.get('X-WP-Total');
        setArticlesCount(parseInt(totalPosts) || 0);
      }

      setWpTestStatus({ status: 'success', message: 'Connexion réussie !' });
    } catch (error) {
      console.error('WP Test Error:', error);
      setWpTestStatus({
        status: 'error',
        message: error.message === 'Failed to fetch'
          ? 'URL inaccessible ou CORS bloqué'
          : error.message
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      // Si le test WP n'a pas été fait mais les credentials sont remplis, tester d'abord
      if (formData.wpApiUrl && formData.wpUsername && formData.wpAppPassword && wpTestStatus.status !== 'success') {
        await testWordPressConnection();
      }

      // Créer le site avec le comptage d'articles
      await sitesApi.create({
        ...formData,
        articlesCount: articlesCount || 0
      });

      setMessage({ type: 'success', text: 'Site ajouté avec succès !' });

      setTimeout(() => {
        if (onNavigate) onNavigate('sites');
      }, 1500);
    } catch (error) {
      console.error('Erreur:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Erreur lors de l\'ajout du site'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Ajouter un site</h2>
          <p className="text-dark-muted mt-1">Configurez un nouveau site WordPress</p>
        </div>
        {onNavigate && (
          <Button variant="secondary" icon={ArrowLeft} onClick={() => onNavigate('sites')}>
            Retour aux sites
          </Button>
        )}
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section: Informations de base */}
          <div className="flex items-center gap-4 pb-6 border-b border-dark-border">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
              <Globe className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Informations du site</h3>
              <p className="text-sm text-dark-muted">Renseignez les informations de base</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Domaine <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="domain"
                value={formData.domain}
                onChange={handleChange}
                placeholder="ex: mon-site.fr"
                required
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-white placeholder:text-dark-muted focus:outline-none focus:border-primary"
              />
              <p className="text-xs text-dark-muted mt-1">Les autres champs se rempliront automatiquement</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Alias (identifiant court) <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="alias"
                value={formData.alias}
                onChange={handleChange}
                placeholder="ex: mon-site"
                required
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-white placeholder:text-dark-muted focus:outline-none focus:border-primary"
              />
              <p className="text-xs text-dark-muted mt-1">Utilisé pour les commandes CLI et workflows</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Entité <span className="text-danger">*</span>
              </label>
              <select
                name="entity"
                value={formData.entity}
                onChange={handleChange}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
              >
                {ENTITIES.map(entity => (
                  <option key={entity.value} value={entity.value}>{entity.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Focus / Thématique
              </label>
              <input
                type="text"
                name="focus"
                value={formData.focus}
                onChange={handleChange}
                placeholder="ex: E-commerce, Blog, Services..."
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-white placeholder:text-dark-muted focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Section: Stratégie SEO & Contenu */}
          <div className="pt-6 border-t border-dark-border">
            <div className="flex items-center gap-4 pb-4">
              <div className="w-10 h-10 bg-warning/20 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h4 className="text-md font-semibold text-white">Stratégie SEO & Contenu</h4>
                <p className="text-xs text-dark-muted">Personnalisez la génération de contenu</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Audience cible
                </label>
                <input
                  type="text"
                  name="targetAudience"
                  value={formData.targetAudience}
                  onChange={handleChange}
                  placeholder="ex: Propriétaires 50+, Entrepreneurs, Étudiants..."
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-white placeholder:text-dark-muted focus:outline-none focus:border-primary"
                />
                <p className="text-xs text-dark-muted mt-1">Utilisé pour adapter le ton et le vocabulaire</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Ton éditorial
                </label>
                <select
                  name="contentTone"
                  value={formData.contentTone}
                  onChange={handleChange}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                >
                  {CONTENT_TONES.map(tone => (
                    <option key={tone.value} value={tone.value}>{tone.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Zone géographique
                </label>
                <input
                  type="text"
                  name="geographicFocus"
                  value={formData.geographicFocus}
                  onChange={handleChange}
                  placeholder="ex: France, Île-de-France, Marseille (13)..."
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-white placeholder:text-dark-muted focus:outline-none focus:border-primary"
                />
                <p className="text-xs text-dark-muted mt-1">Pour le SEO local et les expressions géolocalisées</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  <Zap className="w-4 h-4 inline mr-1" />
                  Priorité du site
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                >
                  {PRIORITIES.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
                <p className="text-xs text-dark-muted mt-1">Influence l'ordre de traitement des workflows</p>
              </div>
            </div>
          </div>

          {/* Section: WordPress API */}
          <div className="pt-6 border-t border-dark-border">
            <div className="flex items-center gap-4 pb-4">
              <div className="w-10 h-10 bg-info/20 rounded-lg flex items-center justify-center">
                <Link className="w-5 h-5 text-info" />
              </div>
              <div>
                <h4 className="text-md font-semibold text-white">WordPress API</h4>
                <p className="text-xs text-dark-muted">Connexion pour publier des articles</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  URL API REST
                </label>
                <input
                  type="text"
                  name="wpApiUrl"
                  value={formData.wpApiUrl}
                  onChange={handleChange}
                  placeholder="https://site.fr/wp-json/wp/v2"
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-white placeholder:text-dark-muted focus:outline-none focus:border-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Utilisateur WP
                </label>
                <input
                  type="text"
                  name="wpUsername"
                  value={formData.wpUsername}
                  onChange={handleChange}
                  placeholder="admin"
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-white placeholder:text-dark-muted focus:outline-none focus:border-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  App Password
                </label>
                <input
                  type="password"
                  name="wpAppPassword"
                  value={formData.wpAppPassword}
                  onChange={handleChange}
                  placeholder="xxxx xxxx xxxx xxxx"
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-white placeholder:text-dark-muted focus:outline-none focus:border-primary text-sm"
                />
              </div>
            </div>

            {/* Bouton test + statut */}
            <div className="mt-4 flex items-center gap-4">
              <Button
                type="button"
                variant="secondary"
                icon={wpTestStatus.status === 'testing' ? Loader2 : Zap}
                onClick={testWordPressConnection}
                disabled={wpTestStatus.status === 'testing'}
                className={wpTestStatus.status === 'testing' ? 'animate-pulse' : ''}
              >
                {wpTestStatus.status === 'testing' ? 'Test en cours...' : 'Tester la connexion'}
              </Button>

              {wpTestStatus.status === 'success' && (
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle className="w-5 h-5" />
                  <span>{wpTestStatus.message}</span>
                  {articlesCount !== null && (
                    <span className="text-dark-muted ml-2">
                      ({articlesCount} article{articlesCount > 1 ? 's' : ''} existant{articlesCount > 1 ? 's' : ''})
                    </span>
                  )}
                </div>
              )}

              {wpTestStatus.status === 'error' && (
                <div className="flex items-center gap-2 text-danger">
                  <AlertCircle className="w-5 h-5" />
                  <span>{wpTestStatus.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* Section: Intégrations Google */}
          <div className="pt-6 border-t border-dark-border">
            <div className="flex items-center gap-4 pb-4">
              <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-success" />
              </div>
              <div>
                <h4 className="text-md font-semibold text-white">Intégrations Google</h4>
                <p className="text-xs text-dark-muted">Search Console et Analytics</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Google Search Console Property
                </label>
                <input
                  type="text"
                  name="gscProperty"
                  value={formData.gscProperty}
                  onChange={handleChange}
                  placeholder="sc-domain:mon-site.fr"
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-white placeholder:text-dark-muted focus:outline-none focus:border-primary"
                />
                <p className="text-xs text-dark-muted mt-1">Auto-rempli depuis le domaine</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Google Analytics 4 Property ID
                </label>
                <input
                  type="text"
                  name="ga4PropertyId"
                  value={formData.ga4PropertyId}
                  onChange={handleChange}
                  placeholder="123456789"
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-white placeholder:text-dark-muted focus:outline-none focus:border-primary"
                />
                <p className="text-xs text-dark-muted mt-1">ID numérique (pas GA4-xxx)</p>
              </div>
            </div>
          </div>

          {message.text && (
            <div className={`flex items-center gap-2 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-success/10 text-success border border-success/30'
                : 'bg-danger/10 text-danger border border-danger/30'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t border-dark-border">
            {onNavigate && (
              <Button type="button" variant="secondary" onClick={() => onNavigate('sites')}>
                Annuler
              </Button>
            )}
            <Button type="submit" icon={Save} disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer le site'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
