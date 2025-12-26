import { useState, useEffect } from 'react';
import { Globe, Save, ArrowLeft, CheckCircle, AlertCircle, Link, Database, BarChart3 } from 'lucide-react';
import { Card, Button } from '../components/common';
import { sitesApi } from '../lib/supabase';

const ENTITIES = [
  { value: 'SRAT', label: 'SRAT' },
  { value: 'PRO FORMATION', label: 'PRO FORMATION' },
  { value: 'METIS', label: 'METIS' },
  { value: 'Client', label: 'Client' },
  { value: 'Cabinet', label: 'Cabinet' },
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
  });
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
    setFormData(prev => ({ ...prev, [name]: value }));
    setMessage({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      await sitesApi.create(formData);
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
