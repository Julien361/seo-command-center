import { Construction } from 'lucide-react';
import Card from '../components/common/Card';

export default function PlaceholderView({ title, description, icon: Icon = Construction }) {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="text-center p-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
          <Icon className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">{title}</h2>
        <p className="text-dark-muted mb-6">{description}</p>
        <div className="flex items-center justify-center gap-2 text-sm text-warning">
          <Construction className="w-4 h-4" />
          <span>En cours de developpement</span>
        </div>
      </Card>
    </div>
  );
}
