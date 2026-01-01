import { useState, useEffect } from 'react';
import { ArrowLeft, Zap, TrendingUp, Target, Loader2, ExternalLink, RefreshCw, MousePointer } from 'lucide-react';
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
      // Query GSC keyword history for positions 11-30 (page 2-3 = quick win territory)
      const { data, error } = await supabase
        .from('gsc_keyword_history')
        .select('*')
        .eq('site_id', site.id)
        .gte('position', 11)
        .lte('position', 30)
        .gte('impressions', 3)  // At least 3 impressions to be relevant
        .order('impressions', { ascending: false });

      if (error) throw error;

      // Deduplicate by keyword (keep highest impressions)
      const uniqueKeywords = {};
      (data || []).forEach(kw => {
        const key = kw.keyword.toLowerCase();
        if (!uniqueKeywords[key] || uniqueKeywords[key].impressions < kw.impressions) {
          uniqueKeywords[key] = kw;
        }
      });

      setQuickwins(Object.values(uniqueKeywords).sort((a, b) => b.impressions - a.impressions));
    } catch (err) {
      console.error('Error loading quick wins:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityScore = (kw) => {
    // Score = Impressions / Position (higher = better opportunity)
    if (!kw.position) return 0;
    return Math.round((kw.impressions || 0) / kw.position * 10);
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
          <p className="text-dark-muted">{quickwins.length} opportunites P11-30 (GSC) pour {site?.mcp_alias}</p>
        </div>
      </div>

      {/* Explanation */}
      <Card className="p-4 bg-warning/5 border-warning/30">
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-white font-medium mb-1">Qu'est-ce qu'un Quick Win ?</h3>
            <p className="text-sm text-dark-muted">
              Keywords en position 11-30 (pages 2-3) avec des impressions dans Google Search Console.
              Un petit effort d'optimisation peut les faire passer en page 1 !
            </p>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-warning">{quickwins.length}</div>
          <div className="text-sm text-dark-muted">Opportunites</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-white">
            {quickwins.reduce((sum, kw) => sum + (kw.impressions || 0), 0).toLocaleString()}
          </div>
          <div className="text-sm text-dark-muted">Impressions</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-info">
            {quickwins.reduce((sum, kw) => sum + (kw.clicks || 0), 0).toLocaleString()}
          </div>
          <div className="text-sm text-dark-muted">Clics</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-success">
            {quickwins.filter(kw => kw.position <= 15).length}
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
              <th className="text-center px-4 py-3 text-sm font-medium text-dark-muted">Position</th>
              <th className="text-center px-4 py-3 text-sm font-medium text-dark-muted">Impressions</th>
              <th className="text-center px-4 py-3 text-sm font-medium text-dark-muted">Clics</th>
              <th className="text-center px-4 py-3 text-sm font-medium text-dark-muted">Priorite</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-dark-muted">Page</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-border">
            {quickwins.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-dark-muted">
                  <div className="space-y-2">
                    <p>Aucun quick win detecte dans Google Search Console.</p>
                    <p className="text-xs">Les quick wins sont des keywords en position 11-30 avec des impressions.</p>
                  </div>
                </td>
              </tr>
            ) : (
              quickwins.map((kw) => {
                const priority = getPriorityScore(kw);
                const pagePath = kw.page_url ? new URL(kw.page_url).pathname : '';
                return (
                  <tr key={kw.id} className="hover:bg-dark-border/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-warning flex-shrink-0" />
                        <span className="text-white">{kw.keyword}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-medium ${
                        kw.position <= 15 ? 'text-success' : 'text-warning'
                      }`}>
                        #{Math.round(kw.position)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-white">
                      {kw.impressions?.toLocaleString() || '0'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={kw.clicks > 0 ? 'text-success' : 'text-dark-muted'}>
                        {kw.clicks || '0'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-xs rounded font-medium ${getPriorityClass(priority)}`}>
                        {priority > 0 ? priority : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {kw.page_url && (
                        <a
                          href={kw.page_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-info hover:underline max-w-[200px] truncate"
                          title={kw.page_url}
                        >
                          {pagePath || '/'}
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      )}
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
