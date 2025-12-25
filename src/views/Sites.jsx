import { useState } from 'react';
import { ExternalLink, Search, Plus, TrendingUp, TrendingDown, MoreVertical } from 'lucide-react';
import { Card, Badge, Button } from '../components/common';

const SITES_DATA = [
  { alias: 'srat', domain: 'srat.fr', entity: 'SRAT', focus: 'MaPrimeAdapt AMO', status: 'active', keywords: 245, articles: 34, avgPos: 12.4, trend: 'up', traffic: '2.4K' },
  { alias: 'srat-energies', domain: 'srat-energies.fr', entity: 'SRAT', focus: 'Audit énergétique', status: 'active', keywords: 156, articles: 21, avgPos: 18.7, trend: 'down', traffic: '890' },
  { alias: 'pro-formation', domain: 'formation-diagnostiqueur-immobilier.net', entity: 'PRO FORMATION', focus: 'E-learning diagnostic', status: 'active', keywords: 312, articles: 45, avgPos: 8.2, trend: 'up', traffic: '5.1K' },
  { alias: 'pro-formation-re', domain: 'pro-formation.re', entity: 'PRO FORMATION', focus: 'Formation DOM-TOM', status: 'active', keywords: 78, articles: 12, avgPos: 24.5, trend: 'up', traffic: '340' },
  { alias: 'metis-digital', domain: 'metis-digital.click', entity: 'METIS', focus: 'Agence digitale', status: 'active', keywords: 87, articles: 8, avgPos: 22.1, trend: 'down', traffic: '450' },
  { alias: 'bien-vieillir', domain: 'bien-vieillir.solutions', entity: 'METIS', focus: 'Lead gen MaPrimeAdapt', status: 'active', keywords: 189, articles: 28, avgPos: 15.6, trend: 'up', traffic: '1.8K' },
  { alias: 'annuaire-qualiopi', domain: 'annuairequaliopi.fr', entity: 'METIS', focus: 'Annuaire formations', status: 'active', keywords: 423, articles: 156, avgPos: 11.3, trend: 'neutral', traffic: '3.2K' },
  { alias: 'assurance-animal', domain: 'monassuranceanimal.fr', entity: 'METIS', focus: 'Assurance animaux', status: 'active', keywords: 234, articles: 42, avgPos: 16.8, trend: 'up', traffic: '1.2K' },
  { alias: 'digne-infos', domain: 'digne-infos.fr', entity: 'METIS', focus: 'News local (04)', status: 'active', keywords: 67, articles: 89, avgPos: 28.4, trend: 'neutral', traffic: '560' },
  { alias: '3pt', domain: 'plan-pluriannuel-de-travaux-3pt.fr', entity: 'Cabinet', focus: 'PPT copropriétés', status: 'active', keywords: 145, articles: 19, avgPos: 14.2, trend: 'up', traffic: '780' },
];

const entityColors = {
  'SRAT': 'primary',
  'PRO FORMATION': 'success',
  'METIS': 'info',
  'Client': 'warning',
  'Cabinet': 'secondary',
};

export default function Sites() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEntity, setFilterEntity] = useState('all');

  const entities = [...new Set(SITES_DATA.map(s => s.entity))];

  const filteredSites = SITES_DATA.filter(site => {
    const matchesSearch = site.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.alias.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEntity = filterEntity === 'all' || site.entity === filterEntity;
    return matchesSearch && matchesEntity;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Sites du Portfolio</h2>
          <p className="text-dark-muted mt-1">Gérez vos 15 sites WordPress</p>
        </div>
        <Button icon={Plus}>Ajouter un site</Button>
      </div>

      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
            <input
              type="text"
              placeholder="Rechercher un site..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-lg pl-10 pr-4 py-2 text-white placeholder:text-dark-muted focus:outline-none focus:border-primary"
            />
          </div>
          <select
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            className="bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
          >
            <option value="all">Toutes les entités</option>
            {entities.map(entity => (
              <option key={entity} value={entity}>{entity}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Site</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Entité</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Focus</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Keywords</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Articles</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Pos. Moy.</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Traffic</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSites.map((site) => (
                <tr key={site.alias} className="border-b border-dark-border/50 hover:bg-dark-border/30">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary font-bold">
                        {site.alias[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{site.domain}</span>
                          <a href={`https://${site.domain}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3 h-3 text-dark-muted hover:text-primary" />
                          </a>
                        </div>
                        <span className="text-xs text-dark-muted">{site.alias}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant={entityColors[site.entity]}>{site.entity}</Badge>
                  </td>
                  <td className="py-4 px-4 text-dark-muted text-sm">{site.focus}</td>
                  <td className="py-4 px-4 text-center text-white">{site.keywords}</td>
                  <td className="py-4 px-4 text-center text-white">{site.articles}</td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-white">{site.avgPos}</span>
                      {site.trend === 'up' && <TrendingUp className="w-4 h-4 text-success" />}
                      {site.trend === 'down' && <TrendingDown className="w-4 h-4 text-danger" />}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center text-white">{site.traffic}</td>
                  <td className="py-4 px-4 text-center">
                    <button className="p-2 rounded-lg hover:bg-dark-border">
                      <MoreVertical className="w-4 h-4 text-dark-muted" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
