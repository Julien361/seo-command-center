import { useState, useEffect } from 'react';
import { ArrowLeft, Search, TrendingUp, TrendingDown, Minus, ExternalLink, Loader2 } from 'lucide-react';
import Card from '../components/common/Card';
import { supabase } from '../lib/supabase';

export default function KeywordsList({ site, onBack }) {
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!site?.id) return;
    loadKeywords();
  }, [site?.id]);

  const loadKeywords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('keywords')
        .select('*')
        .eq('site_id', site.id)
        .order('search_volume', { ascending: false });

      if (error) throw error;
      setKeywords(data || []);
    } catch (err) {
      console.error('Error loading keywords:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = keywords.filter(kw =>
    kw.keyword?.toLowerCase().includes(search.toLowerCase())
  );

  const getPositionIcon = (pos) => {
    if (!pos || pos > 100) return <Minus className="w-4 h-4 text-dark-muted" />;
    if (pos <= 10) return <TrendingUp className="w-4 h-4 text-success" />;
    if (pos <= 20) return <TrendingUp className="w-4 h-4 text-warning" />;
    return <TrendingDown className="w-4 h-4 text-danger" />;
  };

  const getPositionClass = (pos) => {
    if (!pos || pos > 100) return 'text-dark-muted';
    if (pos <= 3) return 'text-success font-bold';
    if (pos <= 10) return 'text-success';
    if (pos <= 20) return 'text-warning';
    return 'text-danger';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
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
          <h1 className="text-2xl font-bold text-white">Keywords</h1>
          <p className="text-dark-muted">{keywords.length} mots-cles pour {site?.mcp_alias}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
        <input
          type="text"
          placeholder="Rechercher un keyword..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-dark-card border border-dark-border rounded-lg pl-10 pr-4 py-2 text-white placeholder:text-dark-muted focus:outline-none focus:border-primary"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-white">{keywords.length}</div>
          <div className="text-sm text-dark-muted">Total</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-success">
            {keywords.filter(k => k.current_position && k.current_position <= 10).length}
          </div>
          <div className="text-sm text-dark-muted">Top 10</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-warning">
            {keywords.filter(k => k.current_position > 10 && k.current_position <= 20).length}
          </div>
          <div className="text-sm text-dark-muted">P11-20</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-info">
            {keywords.filter(k => k.is_quick_win).length}
          </div>
          <div className="text-sm text-dark-muted">Quick Wins</div>
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
              <th className="text-center px-4 py-3 text-sm font-medium text-dark-muted">Intent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-dark-muted">
                  {search ? 'Aucun resultat' : 'Aucun keyword'}
                </td>
              </tr>
            ) : (
              filtered.map((kw) => (
                <tr key={kw.id} className="hover:bg-dark-border/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {kw.is_quick_win && (
                        <span className="px-1.5 py-0.5 text-xs bg-warning/20 text-warning rounded">QW</span>
                      )}
                      <span className="text-white">{kw.keyword}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-white">
                    {kw.search_volume?.toLocaleString() || '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {getPositionIcon(kw.current_position)}
                      <span className={getPositionClass(kw.current_position)}>
                        {kw.current_position || '-'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`${
                      kw.difficulty < 30 ? 'text-success' :
                      kw.difficulty < 60 ? 'text-warning' : 'text-danger'
                    }`}>
                      {kw.difficulty || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 text-xs rounded bg-dark-border text-dark-muted">
                      {kw.intent || '-'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
