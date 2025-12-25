import { Globe, Search, TrendingUp, FileText, Target, Zap } from 'lucide-react';
import { StatCard } from '../common';

export default function OverviewStats({ stats }) {
  const statItems = [
    {
      title: 'Sites Actifs',
      value: stats?.totalSites || 15,
      change: '+2 ce mois',
      changeType: 'up',
      icon: Globe,
      color: 'primary',
    },
    {
      title: 'Keywords Suivis',
      value: stats?.totalKeywords?.toLocaleString() || '2,847',
      change: '+156 cette semaine',
      changeType: 'up',
      icon: Search,
      color: 'info',
    },
    {
      title: 'Quick Wins',
      value: stats?.quickWins || 23,
      change: 'Opportunités P2',
      changeType: 'up',
      icon: Target,
      color: 'success',
    },
    {
      title: 'Articles Publiés',
      value: stats?.totalArticles || 187,
      change: '+12 cette semaine',
      changeType: 'up',
      icon: FileText,
      color: 'warning',
    },
    {
      title: 'Position Moyenne',
      value: stats?.avgPosition || '14.2',
      change: '-2.3 vs mois dernier',
      changeType: 'up',
      icon: TrendingUp,
      color: 'success',
    },
    {
      title: 'Workflows Actifs',
      value: stats?.activeWorkflows || 8,
      change: '3 en cours',
      changeType: 'neutral',
      icon: Zap,
      color: 'primary',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {statItems.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}
