import { ArrowUpRight, Zap } from 'lucide-react';
import { Card, Badge, Button } from '../common';

const QUICK_WINS_DATA = [
  { keyword: 'diagnostic immobilier paris', site: 'srat.fr', position: 12, volume: 2400, difficulty: 35, potential: 'high' },
  { keyword: 'formation diagnostiqueur immobilier', site: 'pro-formation', position: 11, volume: 1900, difficulty: 28, potential: 'high' },
  { keyword: 'aide adaptation logement senior', site: 'bien-vieillir', position: 14, volume: 890, difficulty: 22, potential: 'medium' },
  { keyword: 'maprimeadapt conditions', site: 'srat.fr', position: 15, volume: 720, difficulty: 31, potential: 'high' },
  { keyword: 'audit energetique obligatoire', site: 'srat-energies', position: 13, volume: 1600, difficulty: 38, potential: 'medium' },
];

const potentialColors = {
  high: 'success',
  medium: 'warning',
  low: 'danger',
};

export default function QuickWinsTable() {
  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-warning" />
          Quick Wins Detectées
        </div>
      }
      action={
        <Button variant="outline" size="sm" icon={ArrowUpRight}>
          Optimiser
        </Button>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-border">
              <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Keyword</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Site</th>
              <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Position</th>
              <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Volume</th>
              <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Difficulté</th>
              <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Potentiel</th>
            </tr>
          </thead>
          <tbody>
            {QUICK_WINS_DATA.map((item, index) => (
              <tr key={index} className="border-b border-dark-border/50 hover:bg-dark-border/30">
                <td className="py-4 px-4">
                  <span className="font-medium text-white">{item.keyword}</span>
                </td>
                <td className="py-4 px-4 text-dark-muted">{item.site}</td>
                <td className="py-4 px-4 text-center">
                  <Badge variant="warning">{item.position}</Badge>
                </td>
                <td className="py-4 px-4 text-center text-white">{item.volume.toLocaleString()}</td>
                <td className="py-4 px-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-16 h-2 bg-dark-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success rounded-full"
                        style={{ width: `${100 - item.difficulty}%` }}
                      />
                    </div>
                    <span className="text-sm text-dark-muted">{item.difficulty}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <Badge variant={potentialColors[item.potential]}>
                    {item.potential === 'high' ? 'Élevé' : item.potential === 'medium' ? 'Moyen' : 'Faible'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
