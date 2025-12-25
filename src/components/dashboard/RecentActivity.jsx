import { FileText, Search, TrendingUp, Zap, Globe, CheckCircle } from 'lucide-react';
import { Card } from '../common';

const ACTIVITY_DATA = [
  { icon: FileText, text: 'Article "MaPrimeAdapt 2025" publié sur srat.fr', time: '10 min', type: 'article' },
  { icon: TrendingUp, text: 'Position 3 atteinte pour "diagnostic immobilier paris"', time: '25 min', type: 'rank' },
  { icon: Zap, text: 'WF7 Quick Wins a détecté 5 nouvelles opportunités', time: '1h', type: 'workflow' },
  { icon: Search, text: '45 nouveaux keywords ajoutés pour pro-formation', time: '2h', type: 'keyword' },
  { icon: Globe, text: 'Nouveau site digne-infos.fr ajouté au portfolio', time: '3h', type: 'site' },
  { icon: CheckCircle, text: 'Cocon sémantique "Audit Énergétique" complété', time: '5h', type: 'cluster' },
];

const typeColors = {
  article: 'text-info',
  rank: 'text-success',
  workflow: 'text-warning',
  keyword: 'text-primary',
  site: 'text-secondary',
  cluster: 'text-success',
};

export default function RecentActivity() {
  return (
    <Card title="Activité Récente">
      <div className="space-y-4">
        {ACTIVITY_DATA.map((activity, index) => {
          const Icon = activity.icon;
          return (
            <div key={index} className="flex items-start gap-4">
              <div className={`p-2 rounded-lg bg-dark-border ${typeColors[activity.type]}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-white">{activity.text}</p>
                <p className="text-xs text-dark-muted mt-1">Il y a {activity.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
