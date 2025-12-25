import { useState } from 'react';
import { Search, Filter, Download, TrendingUp, TrendingDown, Target, AlertCircle } from 'lucide-react';
import { Card, Badge, Button } from '../components/common';

const KEYWORDS_DATA = [
  { keyword: 'diagnostic immobilier paris', site: 'srat.fr', volume: 2400, difficulty: 45, position: 8, prevPosition: 12, intent: 'transactional', quickWin: false },
  { keyword: 'formation diagnostiqueur immobilier', site: 'pro-formation', volume: 1900, difficulty: 38, position: 5, prevPosition: 7, intent: 'commercial', quickWin: false },
  { keyword: 'maprimeadapt 2025', site: 'srat.fr', volume: 3200, difficulty: 28, position: 3, prevPosition: 6, intent: 'informational', quickWin: false },
  { keyword: 'aide adaptation logement senior', site: 'bien-vieillir', volume: 890, difficulty: 22, position: 12, prevPosition: 18, intent: 'informational', quickWin: true },
  { keyword: 'audit energetique obligatoire', site: 'srat-energies', volume: 1600, difficulty: 52, position: 15, prevPosition: 14, intent: 'informational', quickWin: true },
  { keyword: 'certification qualiopi formation', site: 'annuaire-qualiopi', volume: 720, difficulty: 35, position: 4, prevPosition: 5, intent: 'commercial', quickWin: false },
  { keyword: 'assurance chien prix', site: 'assurance-animal', volume: 2100, difficulty: 48, position: 18, prevPosition: 22, intent: 'transactional', quickWin: true },
  { keyword: 'dpe obligatoire location', site: 'srat-energies', volume: 4500, difficulty: 55, position: 9, prevPosition: 11, intent: 'informational', quickWin: false },
  { keyword: 'ppt copropriete', site: '3pt', volume: 1100, difficulty: 32, position: 6, prevPosition: 8, intent: 'informational', quickWin: false },
  { keyword: 'diagnostic amiante avant travaux', site: 'srat.fr', volume: 980, difficulty: 41, position: 11, prevPosition: 15, intent: 'transactional', quickWin: true },
];

const intentColors = {
  informational: 'info',
  transactional: 'success',
  commercial: 'warning',
  navigational: 'primary',
};

const intentLabels = {
  informational: 'Info',
  transactional: 'Trans.',
  commercial: 'Comm.',
  navigational: 'Nav.',
};

export default function Keywords() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIntent, setFilterIntent] = useState('all');
  const [showQuickWins, setShowQuickWins] = useState(false);

  const filteredKeywords = KEYWORDS_DATA.filter(kw => {
    const matchesSearch = kw.keyword.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIntent = filterIntent === 'all' || kw.intent === filterIntent;
    const matchesQuickWin = !showQuickWins || kw.quickWin;
    return matchesSearch && matchesIntent && matchesQuickWin;
  });

  const getDifficultyColor = (diff) => {
    if (diff < 30) return 'text-success';
    if (diff < 50) return 'text-warning';
    return 'text-danger';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Keywords Suivis</h2>
          <p className="text-dark-muted mt-1">2,847 keywords sur 15 sites</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" icon={Download}>Exporter</Button>
          <Button icon={Search}>Rechercher Keywords</Button>
        </div>
      </div>

      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
            <input
              type="text"
              placeholder="Rechercher un keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-lg pl-10 pr-4 py-2 text-white placeholder:text-dark-muted focus:outline-none focus:border-primary"
            />
          </div>
          <select
            value={filterIntent}
            onChange={(e) => setFilterIntent(e.target.value)}
            className="bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
          >
            <option value="all">Tous les intents</option>
            <option value="informational">Informationnel</option>
            <option value="transactional">Transactionnel</option>
            <option value="commercial">Commercial</option>
          </select>
          <button
            onClick={() => setShowQuickWins(!showQuickWins)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showQuickWins
                ? 'bg-warning/20 border-warning text-warning'
                : 'border-dark-border text-dark-muted hover:border-warning hover:text-warning'
            }`}
          >
            <Target className="w-4 h-4" />
            Quick Wins
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Keyword</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Site</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Volume</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Difficulté</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Position</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Évolution</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Intent</th>
              </tr>
            </thead>
            <tbody>
              {filteredKeywords.map((kw, index) => {
                const positionChange = kw.prevPosition - kw.position;
                return (
                  <tr key={index} className="border-b border-dark-border/50 hover:bg-dark-border/30">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{kw.keyword}</span>
                        {kw.quickWin && (
                          <Target className="w-4 h-4 text-warning" title="Quick Win" />
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-dark-muted">{kw.site}</td>
                    <td className="py-4 px-4 text-center text-white">{kw.volume.toLocaleString()}</td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-2 bg-dark-border rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${kw.difficulty < 30 ? 'bg-success' : kw.difficulty < 50 ? 'bg-warning' : 'bg-danger'}`}
                            style={{ width: `${kw.difficulty}%` }}
                          />
                        </div>
                        <span className={`text-sm ${getDifficultyColor(kw.difficulty)}`}>{kw.difficulty}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Badge variant={kw.position <= 3 ? 'success' : kw.position <= 10 ? 'primary' : 'warning'}>
                        {kw.position}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className={`flex items-center justify-center gap-1 ${positionChange > 0 ? 'text-success' : positionChange < 0 ? 'text-danger' : 'text-dark-muted'}`}>
                        {positionChange > 0 ? (
                          <>
                            <TrendingUp className="w-4 h-4" />
                            <span>+{positionChange}</span>
                          </>
                        ) : positionChange < 0 ? (
                          <>
                            <TrendingDown className="w-4 h-4" />
                            <span>{positionChange}</span>
                          </>
                        ) : (
                          <span>-</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Badge variant={intentColors[kw.intent]} size="sm">
                        {intentLabels[kw.intent]}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
