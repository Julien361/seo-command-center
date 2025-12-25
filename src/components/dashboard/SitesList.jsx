import { ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, Badge } from '../common';

const SITES_DATA = [
  { alias: 'srat', domain: 'srat.fr', entity: 'SRAT', status: 'active', keywords: 245, avgPos: 12.4, trend: 'up' },
  { alias: 'srat-energies', domain: 'srat-energies.fr', entity: 'SRAT', status: 'active', keywords: 156, avgPos: 18.7, trend: 'down' },
  { alias: 'pro-formation', domain: 'formation-diagnostiqueur-immobilier.net', entity: 'PRO FORMATION', status: 'active', keywords: 312, avgPos: 8.2, trend: 'up' },
  { alias: 'bien-vieillir', domain: 'bien-vieillir.solutions', entity: 'METIS', status: 'active', keywords: 189, avgPos: 15.6, trend: 'up' },
  { alias: 'annuaire-qualiopi', domain: 'annuairequaliopi.fr', entity: 'METIS', status: 'active', keywords: 423, avgPos: 11.3, trend: 'neutral' },
  { alias: 'metis-digital', domain: 'metis-digital.click', entity: 'METIS', status: 'active', keywords: 87, avgPos: 22.1, trend: 'down' },
];

const entityColors = {
  'SRAT': 'primary',
  'PRO FORMATION': 'success',
  'METIS': 'info',
  'Client': 'warning',
};

export default function SitesList({ limit = 6 }) {
  const sites = SITES_DATA.slice(0, limit);

  const TrendIcon = ({ trend }) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-success" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-danger" />;
    return <Minus className="w-4 h-4 text-dark-muted" />;
  };

  return (
    <Card
      title="Sites du Portfolio"
      action={
        <a href="#sites" className="text-sm text-primary hover:text-primary-dark">
          Voir tous
        </a>
      }
    >
      <div className="space-y-3">
        {sites.map((site) => (
          <div
            key={site.alias}
            className="flex items-center justify-between p-4 bg-dark-bg rounded-lg hover:bg-dark-border/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary font-bold">
                {site.alias[0].toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{site.domain}</span>
                  <ExternalLink className="w-3 h-3 text-dark-muted" />
                </div>
                <Badge variant={entityColors[site.entity]} size="sm">
                  {site.entity}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="text-right">
                <p className="text-sm text-dark-muted">Keywords</p>
                <p className="font-semibold text-white">{site.keywords}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-dark-muted">Pos. Moy.</p>
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-white">{site.avgPos}</span>
                  <TrendIcon trend={site.trend} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
