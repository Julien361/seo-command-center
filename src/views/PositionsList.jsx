import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Loader2, Calendar, BarChart3 } from 'lucide-react';
import Card from '../components/common/Card';
import { supabase } from '../lib/supabase';

export default function PositionsList({ site, onBack }) {
  const [history, setHistory] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!site?.id) return;
    loadPositions();
  }, [site?.id]);

  const loadPositions = async () => {
    setLoading(true);
    try {
      // Load keywords with their latest positions
      const { data: kwData, error: kwError } = await supabase
        .from('keywords')
        .select('id, keyword, current_position, previous_position, search_volume')
        .eq('site_id', site.id)
        .not('current_position', 'is', null)
        .order('search_volume', { ascending: false });

      if (kwError) throw kwError;
      setKeywords(kwData || []);

      // Load position history
      const { data: histData, error: histError } = await supabase
        .from('keyword_history')
        .select('*, keywords(keyword)')
        .eq('site_id', site.id)
        .order('tracked_at', { ascending: false })
        .limit(100);

      if (histError) throw histError;
      setHistory(histData || []);
    } catch (err) {
      console.error('Error loading positions:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPositionChange = (kw) => {
    if (!kw.previous_position || !kw.current_position) return null;
    return kw.previous_position - kw.current_position;
  };

  const getChangeIcon = (change) => {
    if (change === null) return <Minus className="w-4 h-4 text-dark-muted" />;
    if (change > 0) return <TrendingUp className="w-4 h-4 text-success" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-danger" />;
    return <Minus className="w-4 h-4 text-dark-muted" />;
  };

  const getChangeText = (change) => {
    if (change === null) return '-';
    if (change > 0) return `+${change}`;
    if (change < 0) return `${change}`;
    return '=';
  };

  const getChangeClass = (change) => {
    if (change === null) return 'text-dark-muted';
    if (change > 0) return 'text-success';
    if (change < 0) return 'text-danger';
    return 'text-dark-muted';
  };

  // Calculate stats
  const gainers = keywords.filter(kw => getPositionChange(kw) > 0).length;
  const losers = keywords.filter(kw => getPositionChange(kw) < 0).length;
  const stable = keywords.filter(kw => getPositionChange(kw) === 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
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
            <BarChart3 className="w-6 h-6 text-cyan-500" />
            Suivi des Positions
          </h1>
          <p className="text-dark-muted">{keywords.length} keywords suivis pour {site?.mcp_alias}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-white">{keywords.length}</div>
          <div className="text-sm text-dark-muted">Suivis</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-success flex items-center justify-center gap-1">
            <TrendingUp className="w-5 h-5" />
            {gainers}
          </div>
          <div className="text-sm text-dark-muted">En hausse</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-danger flex items-center justify-center gap-1">
            <TrendingDown className="w-5 h-5" />
            {losers}
          </div>
          <div className="text-sm text-dark-muted">En baisse</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-dark-muted flex items-center justify-center gap-1">
            <Minus className="w-5 h-5" />
            {stable}
          </div>
          <div className="text-sm text-dark-muted">Stables</div>
        </Card>
      </div>

      {/* Positions table */}
      <Card className="overflow-hidden">
        <table className="w-full">
          <thead className="bg-dark-border">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-dark-muted">Keyword</th>
              <th className="text-center px-4 py-3 text-sm font-medium text-dark-muted">Volume</th>
              <th className="text-center px-4 py-3 text-sm font-medium text-dark-muted">Position</th>
              <th className="text-center px-4 py-3 text-sm font-medium text-dark-muted">Precedente</th>
              <th className="text-center px-4 py-3 text-sm font-medium text-dark-muted">Evolution</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-border">
            {keywords.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-dark-muted">
                  Aucune position trackee. Lancez le monitoring !
                </td>
              </tr>
            ) : (
              keywords.map((kw) => {
                const change = getPositionChange(kw);
                return (
                  <tr key={kw.id} className="hover:bg-dark-border/50">
                    <td className="px-4 py-3">
                      <span className="text-white">{kw.keyword}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-dark-muted">
                      {kw.search_volume?.toLocaleString() || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${
                        kw.current_position <= 3 ? 'text-success' :
                        kw.current_position <= 10 ? 'text-primary' :
                        kw.current_position <= 20 ? 'text-warning' : 'text-danger'
                      }`}>
                        #{kw.current_position}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-dark-muted">
                      {kw.previous_position ? `#${kw.previous_position}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className={`flex items-center justify-center gap-1 ${getChangeClass(change)}`}>
                        {getChangeIcon(change)}
                        <span className="font-medium">{getChangeText(change)}</span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>

      {/* Recent history */}
      {history.length > 0 && (
        <Card className="p-4">
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-500" />
            Historique recent
          </h3>
          <div className="space-y-2 max-h-48 overflow-auto">
            {history.slice(0, 10).map((h) => (
              <div key={h.id} className="flex items-center justify-between text-sm p-2 rounded bg-dark-bg">
                <span className="text-white">{h.keywords?.keyword || 'Keyword'}</span>
                <div className="flex items-center gap-4">
                  <span className="text-dark-muted">
                    {new Date(h.tracked_at).toLocaleDateString('fr-FR')}
                  </span>
                  <span className="text-primary font-medium">#{h.position}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
