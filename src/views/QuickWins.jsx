import { useState } from 'react';
import { Target, Zap, ArrowUpRight, FileText, ExternalLink, TrendingUp } from 'lucide-react';
import { Card, Badge, Button, StatCard } from '../components/common';

const QUICK_WINS_DATA = [
  {
    keyword: 'diagnostic immobilier obligatoire vente',
    site: 'srat.fr',
    position: 12,
    volume: 1800,
    difficulty: 32,
    potential: 'high',
    estimatedGain: '+450 visites/mois',
    action: 'Enrichir contenu +800 mots',
  },
  {
    keyword: 'formation diagnostiqueur immobilier cpf',
    site: 'pro-formation',
    position: 11,
    volume: 2100,
    difficulty: 28,
    potential: 'high',
    estimatedGain: '+680 visites/mois',
    action: 'Ajouter section FAQ',
  },
  {
    keyword: 'aide adaptation logement handicap',
    site: 'bien-vieillir',
    position: 14,
    volume: 1200,
    difficulty: 25,
    potential: 'high',
    estimatedGain: '+320 visites/mois',
    action: 'Optimiser meta + H1',
  },
  {
    keyword: 'maprimeadapt conditions eligibilite',
    site: 'srat.fr',
    position: 15,
    volume: 980,
    difficulty: 31,
    potential: 'medium',
    estimatedGain: '+180 visites/mois',
    action: 'Ajouter tableau récapitulatif',
  },
  {
    keyword: 'audit energetique maison ancienne',
    site: 'srat-energies',
    position: 13,
    volume: 890,
    difficulty: 35,
    potential: 'medium',
    estimatedGain: '+210 visites/mois',
    action: 'Ajouter cas pratiques',
  },
  {
    keyword: 'qualiopi organisme formation',
    site: 'annuaire-qualiopi',
    position: 16,
    volume: 1500,
    difficulty: 38,
    potential: 'medium',
    estimatedGain: '+280 visites/mois',
    action: 'Renforcer maillage interne',
  },
  {
    keyword: 'assurance chat senior',
    site: 'assurance-animal',
    position: 18,
    volume: 720,
    difficulty: 22,
    potential: 'high',
    estimatedGain: '+240 visites/mois',
    action: 'Créer comparatif tarifs',
  },
  {
    keyword: 'dpe location meuble',
    site: 'srat-energies',
    position: 19,
    volume: 1100,
    difficulty: 40,
    potential: 'low',
    estimatedGain: '+150 visites/mois',
    action: 'Améliorer Core Web Vitals',
  },
];

const potentialConfig = {
  high: { color: 'success', label: 'Élevé', priority: 1 },
  medium: { color: 'warning', label: 'Moyen', priority: 2 },
  low: { color: 'danger', label: 'Faible', priority: 3 },
};

export default function QuickWins() {
  const [filterPotential, setFilterPotential] = useState('all');

  const filteredWins = QUICK_WINS_DATA
    .filter(win => filterPotential === 'all' || win.potential === filterPotential)
    .sort((a, b) => potentialConfig[a.potential].priority - potentialConfig[b.potential].priority);

  const stats = {
    total: QUICK_WINS_DATA.length,
    high: QUICK_WINS_DATA.filter(w => w.potential === 'high').length,
    medium: QUICK_WINS_DATA.filter(w => w.potential === 'medium').length,
    estimatedTraffic: '+2,510',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Target className="w-8 h-8 text-warning" />
            Quick Wins Détectées
          </h2>
          <p className="text-dark-muted mt-1">Opportunités de gain rapide en page 2</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" icon={Zap}>Lancer WF7</Button>
          <Button icon={ArrowUpRight}>Optimiser tout</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Quick Wins Total"
          value={stats.total}
          icon={Target}
          color="warning"
        />
        <StatCard
          title="Potentiel Élevé"
          value={stats.high}
          icon={TrendingUp}
          color="success"
        />
        <StatCard
          title="Potentiel Moyen"
          value={stats.medium}
          icon={Zap}
          color="warning"
        />
        <StatCard
          title="Trafic Estimé"
          value={stats.estimatedTraffic}
          change="visites/mois"
          changeType="up"
          icon={ArrowUpRight}
          color="primary"
        />
      </div>

      <Card>
        <div className="flex items-center gap-4 mb-6">
          <span className="text-sm text-dark-muted">Filtrer par potentiel:</span>
          {['all', 'high', 'medium', 'low'].map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterPotential(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterPotential === filter
                  ? 'bg-primary text-white'
                  : 'bg-dark-border text-dark-muted hover:text-white'
              }`}
            >
              {filter === 'all' ? 'Tous' : potentialConfig[filter]?.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filteredWins.map((win, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-5 bg-dark-bg rounded-xl border border-dark-border hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start gap-4 flex-1">
                <div className={`p-3 rounded-lg bg-${potentialConfig[win.potential].color}/20`}>
                  <Target className={`w-6 h-6 text-${potentialConfig[win.potential].color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-white">{win.keyword}</h4>
                    <Badge variant={potentialConfig[win.potential].color} size="sm">
                      {potentialConfig[win.potential].label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-dark-muted">
                    <span className="flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />
                      {win.site}
                    </span>
                    <span>Position: <span className="text-warning font-medium">{win.position}</span></span>
                    <span>Volume: <span className="text-white">{win.volume.toLocaleString()}</span></span>
                    <span>Difficulté: <span className="text-success">{win.difficulty}</span></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm text-dark-muted">Action recommandée</p>
                  <p className="text-sm text-white font-medium">{win.action}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-dark-muted">Gain estimé</p>
                  <p className="text-success font-semibold">{win.estimatedGain}</p>
                </div>
                <Button variant="outline" size="sm" icon={FileText}>
                  Optimiser
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
