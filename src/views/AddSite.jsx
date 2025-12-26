import { useState } from 'react';
import { Globe, Save, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
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
    gscProperty: '',
    ga4PropertyId: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

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
          <div className="flex items-center gap-4 pb-6 border-b border-dark-border">
            <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center">
              <Globe className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Informations du site</h3>
              <p className="text-sm text-dark-muted">Renseignez les informations de base</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Alias (identifiant court)
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
              <p className="text-xs text-dark-muted mt-1">Utilisé pour les commandes CLI</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Domaine
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
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Entité
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

          <div className="pt-6 border-t border-dark-border">
            <h4 className="text-md font-semibold text-white mb-4">Intégrations Google (optionnel)</h4>
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
