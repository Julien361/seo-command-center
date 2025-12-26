import { useState, useEffect } from 'react';
import { LineChart, TrendingUp, TrendingDown, Search, RefreshCw, Filter, Calendar, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { sitesApi, supabase } from '../../lib/supabase';

// Position change indicator
function PositionChange({ before, after }) {
  if (!before || !after) return <span className="text-dark-muted">-</span>;

  const change = before - after;
  if (change > 0) {
    return (
      <span className="flex items-center gap-1 text-success">
        <ArrowUp className="w-3 h-3" />
        +{change.toFixed(1)}
      </span>
    );
  } else if (change < 0) {
    return (
      <span className="flex items-center gap-1 text-danger">
        <ArrowDown className="w-3 h-3" />
        {change.toFixed(1)}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-dark-muted">
      <Minus className="w-3 h-3" />
      0
    </span>
  );
}

// Position badge color
function getPositionColor(position) {
  if (position <= 3) return 'bg-success text-white';
  if (position <= 10) return 'bg-info text-white';
  if (position <= 20) return 'bg-warning text-dark-bg';
  return 'bg-dark-muted text-white';
}

// Keyword Row
function KeywordRow({ keyword, history }) {
  const latestPosition = history[0]?.position || keyword.current_position;
  const previousPosition = history[1]?.position || keyword.previous_position;

  return (
    <tr className="border-b border-dark-border hover:bg-dark-border/30 transition-colors">
      <td className="py-3 px-4">
        <div>
          <span className="text-white font-medium">{keyword.keyword}</span>
          {keyword.sites?.domain && (
            <span className="text-xs text-dark-muted ml-2">{keyword.sites.mcp_alias || keyword.sites.domain}</span>
          )}
        </div>
      </td>
      <td className="py-3 px-4 text-center">
        <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${getPositionColor(latestPosition)}`}>
          {latestPosition ? latestPosition.toFixed(1) : '-'}
        </span>
      </td>
      <td className="py-3 px-4 text-center">
        <PositionChange before={previousPosition} after={latestPosition} />
      </td>
      <td className="py-3 px-4 text-center text-dark-muted">
        {keyword.search_volume?.toLocaleString() || '-'}
      </td>
      <td className="py-3 px-4 text-center text-dark-muted">
        {history.reduce((sum, h) => sum + (h.clicks || 0), 0)}
      </td>
      <td className="py-3 px-4 text-center text-dark-muted">
        {history.reduce((sum, h) => sum + (h.impressions || 0), 0).toLocaleString()}
      </td>
      <td className="py-3 px-4">
        {/* Mini sparkline placeholder */}
        <div className="flex items-end gap-0.5 h-6">
          {history.slice(0, 7).reverse().map((h, i) => (
            <div
              key={i}
              className="w-1.5 bg-primary rounded-sm"
              style={{ height: `${Math.max(10, 100 - (h.position || 50) * 2)}%` }}
            />
          ))}
        </div>
      </td>
    </tr>
  );
}

export default function Positions() {
  const [keywords, setKeywords] = useState([]);
  const [history, setHistory] = useState({});
  const [sites, setSites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSiteId, setSelectedSiteId] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [sitesData] = await Promise.all([sitesApi.getAll()]);
      setSites(sitesData || []);

      // Load tracked keywords
      const { data: keywordsData, error: kwError } = await supabase
        .from('keywords')
        .select('*, sites(mcp_alias, domain)')
        .eq('is_tracked', true)
        .order('current_position', { ascending: true, nullsFirst: false });

      if (!kwError && keywordsData) {
        setKeywords(keywordsData);

        // Load position history from GSC
        const { data: historyData, error: histError } = await supabase
          .from('gsc_keyword_history')
          .select('*')
          .order('recorded_at', { ascending: false });

        if (!histError && historyData) {
          // Group by keyword
          const historyByKeyword = {};
          historyData.forEach(h => {
            const key = h.keyword;
            if (!historyByKeyword[key]) historyByKeyword[key] = [];
            historyByKeyword[key].push(h);
          });
          setHistory(historyByKeyword);
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = () => {
    // TODO: Trigger GSC sync via n8n
    alert('Synchronisation GSC en cours...');
  };

  // Filter keywords
  const filteredKeywords = keywords.filter(kw => {
    const matchesSearch = kw.keyword?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSite = selectedSiteId === 'all' || kw.site_id === selectedSiteId;
    return matchesSearch && matchesSite;
  });

  // Calculate stats
  const stats = {
    total: keywords.length,
    top3: keywords.filter(k => k.current_position && k.current_position <= 3).length,
    top10: keywords.filter(k => k.current_position && k.current_position <= 10).length,
    avgPosition: keywords.length > 0
      ? (keywords.reduce((sum, k) => sum + (k.current_position || 0), 0) / keywords.filter(k => k.current_position).length).toFixed(1)
      : '-'
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Suivi des Positions</h1>
          <p className="text-dark-muted mt-1">Evolution de vos positions dans les SERPs</p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
          >
            <option value="7d">7 derniers jours</option>
            <option value="28d">28 derniers jours</option>
            <option value="3m">3 derniers mois</option>
          </select>
          <Button onClick={handleSync}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync GSC
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <LineChart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-sm text-dark-muted">Keywords suivis</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div>
              <div className="text-2xl font-bold text-success">{stats.top3}</div>
              <div className="text-sm text-dark-muted">Top 3</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info/10">
              <TrendingUp className="w-5 h-5 text-info" />
            </div>
            <div>
              <div className="text-2xl font-bold text-info">{stats.top10}</div>
              <div className="text-sm text-dark-muted">Top 10</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <LineChart className="w-5 h-5 text-warning" />
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">{stats.avgPosition}</div>
              <div className="text-sm text-dark-muted">Position moyenne</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
              <input
                type="text"
                placeholder="Rechercher un keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
          >
            <option value="all">Tous les sites</option>
            {sites.map(site => (
              <option key={site.id} value={site.id}>{site.mcp_alias || site.domain}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Keywords Table */}
      {filteredKeywords.length === 0 ? (
        <Card className="p-12 text-center">
          <LineChart className="w-12 h-12 mx-auto text-dark-muted mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Aucun keyword suivi</h3>
          <p className="text-dark-muted mb-6">
            Activez le suivi sur vos keywords pour voir leur evolution
          </p>
          <Button onClick={handleSync}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Synchroniser depuis GSC
          </Button>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-border bg-dark-border/30">
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Keyword</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Position</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Variation</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Volume</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Clicks</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Impressions</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Tendance</th>
                </tr>
              </thead>
              <tbody>
                {filteredKeywords.map(keyword => (
                  <KeywordRow
                    key={keyword.id}
                    keyword={keyword}
                    history={history[keyword.keyword] || []}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-dark-border text-sm text-dark-muted">
            {filteredKeywords.length} keywords affiches
          </div>
        </Card>
      )}
    </div>
  );
}
