import { useState, useEffect } from 'react';
import { ArrowLeft, Zap, TrendingUp, Target, Loader2, ExternalLink } from 'lucide-react';
import Card from '../components/common/Card';
import { supabase } from '../lib/supabase';

export default function QuickWinsList({ site, onBack }) {
  const [quickwins, setQuickwins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!site?.id) return;
    loadQuickWins();
  }, [site?.id]);

  const loadQuickWins = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('keywords')
        .select('*')
        .eq('site_id', site.id)
        .eq('is_quick_win', true)
        .order('search_volume', { ascending: false });

      if (error) throw error;
      setQuickwins(data || []);
    } catch (err) {
      console.error('Error loading quick wins:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityScore = (kw) => {
    // Score = Volume / (Position * Difficulty)
    if (!kw.current_position || !kw.difficulty) return 0;
    return Math.round((kw.search_volume || 0) / (kw.current_position * (kw.difficulty || 1)) * 100);
  };

  const getPriorityClass = (score) => {
    if (score >= 50) return 'text-success bg-success/20';
    if (score >= 20) return 'text-warning bg-warning/20';
    return 'text-info bg-info/20';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-warning animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-dark-border text-dark-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-warning" />
            Quick Wins
          </h1>
          <p className="text-dark-muted">{quickwins.length} opportunites P11-20 pour {site?.mcp_alias}</p>
        </div>
      </div>

      {/* Explanation */}
      <Card className="p-4 bg-warning/5 border-warning/30">
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-white font-medium mb-1">Qu'est-ce qu'un Quick Win ?</h3>
            <p className="text-sm text-dark-muted">
              Keywords en position 11-20 (page 2) avec volume &gt; 100 et difficulte &lt; 40.
              Un petit effort d'optimisation peut les faire passer en page 1 !
            </p>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-warning">{quickwins.length}</div>
          <div className="text-sm text-dark-muted">Opportunites</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-white">
            {quickwins.reduce((sum, kw) => sum + (kw.search_volume || 0), 0).toLocaleString()}
          </div>
          <div className="text-sm text-dark-muted">Volume total</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-success">
            {quickwins.filter(kw => kw.current_position <= 15).length}
          </div>
          <div className="text-sm text-dark-muted">P11-15 (priorite)</div>
        </Card>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <table className="w-full">
          <thead className="bg-dark-border">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-dark-muted">Keyword</th>
              <th className="text-center px-4 py-3 text-sm font-medium text-dark-muted">Volume</th>
              <th className="text-center px-4 py-3 text-sm font-medium text-dark-muted">Position</th>
              <th className="text-center px-4 py-3 text-sm font-medium text-dark-muted">Difficulte</th>
              <th className="text-center px-4 py-3 text-sm font-medium text-dark-muted">Priorite</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-border">
            {quickwins.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-dark-muted">
                  Aucun quick win detecte. Lancez l'analyse !
                </td>
              </tr>
            ) : (
              quickwins.map((kw) => {
                const priority = getPriorityScore(kw);
                return (
                  <tr key={kw.id} className="hover:bg-dark-border/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-warning" />
                        <span className="text-white">{kw.keyword}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-white">
                      {kw.search_volume?.toLocaleString() || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-medium ${
                        kw.current_position <= 15 ? 'text-success' : 'text-warning'
                      }`}>
                        #{kw.current_position}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-success">{kw.difficulty || '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-xs rounded font-medium ${getPriorityClass(priority)}`}>
                        {priority > 0 ? priority : '-'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>

      {/* Actions */}
      {quickwins.length > 0 && (
        <Card className="p-4">
          <h3 className="text-white font-medium mb-3">Actions recommandees</h3>
          <ul className="space-y-2 text-sm text-dark-muted">
            <li className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" />
              Enrichir le contenu des pages ciblant ces keywords (+500 mots)
            </li>
            <li className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" />
              Ameliorer le maillage interne vers ces pages
            </li>
            <li className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" />
              Optimiser les meta titles et descriptions
            </li>
          </ul>
        </Card>
      )}
    </div>
  );
}
