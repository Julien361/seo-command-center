import { useState, useEffect } from 'react';
import { FileText, Plus, Edit, Eye, Trash2, ExternalLink, Search, Filter, RefreshCw } from 'lucide-react';
import { Card, Badge, Button } from '../components/common';

// Sites WordPress depuis Supabase
const SITES = [
  { alias: 'srat', domain: 'srat.fr', url: 'https://www.srat.fr' },
  { alias: 'pro-formation', domain: 'formation-diagnostiqueur-immobilier.net', url: 'https://www.formation-diagnostiqueur-immobilier.net' },
  { alias: 'metis-digital', domain: 'metis-digital.click', url: 'https://www.metis-digital.click' },
  { alias: 'srat-energies', domain: 'srat-energies.fr', url: 'https://www.srat-energies.fr' },
  { alias: 'bien-vieillir', domain: 'bien-vieillir.solutions', url: 'https://www.bien-vieillir.solutions' },
  { alias: 'annuaire-qualiopi', domain: 'annuairequaliopi.fr', url: 'https://www.annuairequaliopi.fr' },
  { alias: 'assurance-animal', domain: 'monassuranceanimal.fr', url: 'https://www.monassuranceanimal.fr' },
  { alias: 'diagnostic-13', domain: 'diagnostic-immobilier13.fr', url: 'https://www.diagnostic-immobilier13.fr' },
  { alias: '3pt', domain: 'plan-pluriannuel-de-travaux-3pt.fr', url: 'https://www.plan-pluriannuel-de-travaux-3pt.fr' },
  { alias: 'digne-infos', domain: 'digne-infos.fr', url: 'https://www.digne-infos.fr' },
  { alias: 'actualites-aurillac', domain: 'actualites-aurillac.fr', url: 'https://www.actualites-aurillac.fr' },
  { alias: 'actualites-gap', domain: 'actualites-gap.fr', url: 'https://www.actualites-gap.fr' },
  { alias: 'infos-aubenas', domain: 'infos-aubenas.fr', url: 'https://www.infos-aubenas.fr' },
  { alias: 'manosque-infos', domain: 'manosque-infos.fr', url: 'https://www.manosque-infos.fr' },
  { alias: 'pro-formation-re', domain: 'pro-formation.re', url: 'https://www.pro-formation.re' },
];

// Articles exemple (en prod: via API MCP)
const MOCK_ARTICLES = [
  { id: 1669, site: 'srat', title: 'Remplacer une baignoire : receveur, parois, sièges, barres', status: 'publish', date: '2025-12-25', views: 234 },
  { id: 1658, site: 'srat', title: 'Douche de plain-pied : prix, aides, normes & pose', status: 'publish', date: '2025-12-24', views: 456 },
  { id: 1653, site: 'srat', title: 'GIR 1 à 4 : comment être évalué et obtenir l\'attestation', status: 'publish', date: '2025-12-23', views: 321 },
  { id: 892, site: 'pro-formation', title: 'Formation diagnostiqueur immobilier CPF 2025', status: 'publish', date: '2025-12-22', views: 789 },
  { id: 891, site: 'pro-formation', title: 'Certification DPE : guide complet', status: 'draft', date: '2025-12-21', views: 0 },
  { id: 445, site: 'bien-vieillir', title: 'MaPrimeAdapt 2025 : conditions et montants', status: 'publish', date: '2025-12-20', views: 567 },
  { id: 234, site: 'srat-energies', title: 'Audit énergétique obligatoire : qui est concerné ?', status: 'publish', date: '2025-12-19', views: 432 },
  { id: 123, site: 'annuaire-qualiopi', title: 'Certification Qualiopi : les 7 critères', status: 'publish', date: '2025-12-18', views: 654 },
];

const statusConfig = {
  publish: { label: 'Publié', color: 'success' },
  draft: { label: 'Brouillon', color: 'warning' },
  pending: { label: 'En attente', color: 'info' },
  private: { label: 'Privé', color: 'default' },
};

export default function Articles() {
  const [selectedSite, setSelectedSite] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [articles, setArticles] = useState(MOCK_ARTICLES);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewArticle, setShowNewArticle] = useState(false);

  const filteredArticles = articles.filter(article => {
    const matchesSite = selectedSite === 'all' || article.site === selectedSite;
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSite && matchesSearch;
  });

  const handleRefresh = async () => {
    setIsLoading(true);
    // En prod: appeler MCP wordpress_get_posts
    setTimeout(() => setIsLoading(false), 1000);
  };

  const getSiteInfo = (alias) => SITES.find(s => s.alias === alias);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-info" />
            Articles WordPress
          </h2>
          <p className="text-dark-muted mt-1">Gérez les articles de vos 15 sites</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" icon={RefreshCw} onClick={handleRefresh} loading={isLoading}>
            Actualiser
          </Button>
          <Button icon={Plus} onClick={() => setShowNewArticle(true)}>
            Nouvel article
          </Button>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="text-3xl font-bold text-white">{articles.length}</div>
          <div className="text-sm text-dark-muted">Articles total</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-success">{articles.filter(a => a.status === 'publish').length}</div>
          <div className="text-sm text-dark-muted">Publiés</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-warning">{articles.filter(a => a.status === 'draft').length}</div>
          <div className="text-sm text-dark-muted">Brouillons</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-info">15</div>
          <div className="text-sm text-dark-muted">Sites WordPress</div>
        </Card>
      </div>

      {/* Sélecteur de site */}
      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
            <input
              type="text"
              placeholder="Rechercher un article..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-lg pl-10 pr-4 py-2 text-white placeholder:text-dark-muted focus:outline-none focus:border-primary"
            />
          </div>
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary min-w-[200px]"
          >
            <option value="all">Tous les sites</option>
            {SITES.map(site => (
              <option key={site.alias} value={site.alias}>{site.domain}</option>
            ))}
          </select>
        </div>

        {/* Liste des articles */}
        <div className="space-y-3">
          {filteredArticles.map((article) => {
            const site = getSiteInfo(article.site);
            const status = statusConfig[article.status];

            return (
              <div
                key={`${article.site}-${article.id}`}
                className="flex items-center justify-between p-4 bg-dark-bg rounded-lg hover:bg-dark-border/50 transition-colors"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-2 rounded-lg bg-info/20">
                    <FileText className="w-5 h-5 text-info" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-medium text-white">{article.title}</h4>
                      <Badge variant={status.color} size="sm">{status.label}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-dark-muted">
                      <span className="flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        {site?.domain}
                      </span>
                      <span>ID: {article.id}</span>
                      <span>{article.date}</span>
                      {article.views > 0 && <span>{article.views} vues</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`${site?.url}/?p=${article.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-dark-border text-dark-muted hover:text-white"
                  >
                    <Eye className="w-4 h-4" />
                  </a>
                  <a
                    href={`${site?.url}/wp-admin/post.php?post=${article.id}&action=edit`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-dark-border text-dark-muted hover:text-info"
                  >
                    <Edit className="w-4 h-4" />
                  </a>
                  <button className="p-2 rounded-lg hover:bg-dark-border text-dark-muted hover:text-danger">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Modal Nouvel Article */}
      {showNewArticle && (
        <NewArticleModal
          sites={SITES}
          onClose={() => setShowNewArticle(false)}
          onSubmit={(data) => {
            console.log('Créer article:', data);
            // En prod: appeler MCP wordpress_create_post
            setShowNewArticle(false);
          }}
        />
      )}
    </div>
  );
}

function NewArticleModal({ sites, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    site: 'srat',
    title: '',
    content: '',
    status: 'draft',
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <h3 className="text-xl font-semibold text-white">Nouvel Article</h3>
          <button onClick={onClose} className="text-dark-muted hover:text-white">
            &times;
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-muted mb-2">Site WordPress</label>
            <select
              value={formData.site}
              onChange={(e) => setFormData({ ...formData, site: e.target.value })}
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
            >
              {sites.map(site => (
                <option key={site.alias} value={site.alias}>{site.domain}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-muted mb-2">Titre</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Titre de l'article..."
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white placeholder:text-dark-muted focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-muted mb-2">Contenu</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Contenu HTML de l'article..."
              rows={10}
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white placeholder:text-dark-muted focus:outline-none focus:border-primary font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-muted mb-2">Statut</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
            >
              <option value="draft">Brouillon</option>
              <option value="publish">Publier</option>
              <option value="pending">En attente de relecture</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-dark-border">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={() => onSubmit(formData)}>Créer l'article</Button>
        </div>
      </div>
    </div>
  );
}
