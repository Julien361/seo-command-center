import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Eye, MousePointer, Users, Clock, RefreshCw, Filter, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { sitesApi, supabase } from '../../lib/supabase';

// Metric card with trend
function MetricCard({ title, value, previousValue, icon: Icon, color, format = 'number' }) {
  const change = previousValue ? ((value - previousValue) / previousValue * 100) : 0;
  const isPositive = change > 0;
  const isNeutral = change === 0;

  const formatValue = (v) => {
    if (format === 'percent') return `${(v * 100).toFixed(2)}%`;
    if (format === 'time') {
      const mins = Math.floor(v / 60);
      const secs = v % 60;
      return `${mins}m ${secs}s`;
    }
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
    return v.toLocaleString();
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-dark-muted">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{formatValue(value)}</p>
          {previousValue !== undefined && (
            <div className={`flex items-center gap-1 mt-1 text-sm ${
              isNeutral ? 'text-dark-muted' : isPositive ? 'text-success' : 'text-danger'
            }`}>
              {isNeutral ? (
                <Minus className="w-3 h-3" />
              ) : isPositive ? (
                <ArrowUp className="w-3 h-3" />
              ) : (
                <ArrowDown className="w-3 h-3" />
              )}
              {Math.abs(change).toFixed(1)}%
            </div>
          )}
        </div>
        <div className={`p-2 rounded-lg ${color.replace('text-', 'bg-')}/10`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </Card>
  );
}

// Simple bar chart
function SimpleBarChart({ data, height = 200 }) {
  if (!data?.length) return null;

  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center">
          <div
            className="w-full bg-primary rounded-t hover:bg-primary/80 transition-colors cursor-pointer"
            style={{ height: `${(d.value / maxValue) * 100}%`, minHeight: d.value > 0 ? 4 : 0 }}
            title={`${d.label}: ${d.value.toLocaleString()}`}
          />
          <span className="text-xs text-dark-muted mt-1 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// Site performance row
function SiteRow({ site, metrics }) {
  const ctrClass = metrics.ctr >= 0.05 ? 'text-success' : metrics.ctr >= 0.02 ? 'text-warning' : 'text-danger';

  return (
    <tr className="border-b border-dark-border hover:bg-dark-border/30 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-dark-border flex items-center justify-center text-sm font-medium text-white">
            {(site.mcp_alias || site.domain)?.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="text-white font-medium">{site.mcp_alias || site.domain}</span>
            <p className="text-xs text-dark-muted">{site.domain}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-right">
        <span className="text-white">{metrics.sessions?.toLocaleString() || '-'}</span>
      </td>
      <td className="py-3 px-4 text-right">
        <span className="text-white">{metrics.pageviews?.toLocaleString() || '-'}</span>
      </td>
      <td className="py-3 px-4 text-right">
        <span className="text-white">{metrics.clicks?.toLocaleString() || '-'}</span>
      </td>
      <td className="py-3 px-4 text-right">
        <span className="text-white">{metrics.impressions?.toLocaleString() || '-'}</span>
      </td>
      <td className="py-3 px-4 text-right">
        <span className={ctrClass}>{metrics.ctr ? `${(metrics.ctr * 100).toFixed(2)}%` : '-'}</span>
      </td>
      <td className="py-3 px-4 text-right">
        <span className="text-white">{metrics.position?.toFixed(1) || '-'}</span>
      </td>
    </tr>
  );
}

export default function Performance() {
  const [sites, setSites] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('28d');
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load sites
      const sitesData = await sitesApi.getAll();
      setSites(sitesData || []);

      // Calculate date range
      const days = dateRange === '7d' ? 7 : dateRange === '28d' ? 28 : 90;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Load GSC data
      const { data: gscData, error: gscError } = await supabase
        .from('gsc_keyword_history')
        .select('*')
        .gte('recorded_at', startDate.toISOString())
        .order('recorded_at', { ascending: true });

      // Load GA4 data if available
      const { data: ga4Data } = await supabase
        .from('ga4_daily')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      // Aggregate metrics by site
      const siteMetrics = {};
      sitesData?.forEach(site => {
        siteMetrics[site.id] = {
          sessions: 0,
          pageviews: 0,
          clicks: 0,
          impressions: 0,
          ctr: 0,
          position: 0,
          positionCount: 0
        };
      });

      // Aggregate GSC data
      gscData?.forEach(row => {
        const siteId = row.site_id;
        if (siteMetrics[siteId]) {
          siteMetrics[siteId].clicks += row.clicks || 0;
          siteMetrics[siteId].impressions += row.impressions || 0;
          if (row.position) {
            siteMetrics[siteId].position += row.position;
            siteMetrics[siteId].positionCount++;
          }
        }
      });

      // Aggregate GA4 data
      ga4Data?.forEach(row => {
        const siteId = row.site_id;
        if (siteMetrics[siteId]) {
          siteMetrics[siteId].sessions += row.sessions || 0;
          siteMetrics[siteId].pageviews += row.pageviews || 0;
        }
      });

      // Calculate averages
      Object.keys(siteMetrics).forEach(siteId => {
        const m = siteMetrics[siteId];
        if (m.impressions > 0) {
          m.ctr = m.clicks / m.impressions;
        }
        if (m.positionCount > 0) {
          m.position = m.position / m.positionCount;
        }
      });

      setMetrics(siteMetrics);

      // Build chart data (daily clicks)
      const dailyData = {};
      gscData?.forEach(row => {
        const date = row.recorded_at?.split('T')[0];
        if (date) {
          if (!dailyData[date]) dailyData[date] = 0;
          dailyData[date] += row.clicks || 0;
        }
      });

      const chartArr = Object.entries(dailyData)
        .map(([date, value]) => ({
          label: new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
          value
        }))
        .slice(-14); // Last 14 days for chart

      setChartData(chartArr);

    } catch (err) {
      console.error('Error loading performance data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate totals
  const totals = Object.values(metrics).reduce((acc, m) => ({
    sessions: acc.sessions + (m.sessions || 0),
    pageviews: acc.pageviews + (m.pageviews || 0),
    clicks: acc.clicks + (m.clicks || 0),
    impressions: acc.impressions + (m.impressions || 0),
  }), { sessions: 0, pageviews: 0, clicks: 0, impressions: 0 });

  totals.ctr = totals.impressions > 0 ? totals.clicks / totals.impressions : 0;

  // Calculate average position
  const positionSum = Object.values(metrics).reduce((sum, m) => sum + (m.position || 0), 0);
  const positionCount = Object.values(metrics).filter(m => m.position > 0).length;
  totals.avgPosition = positionCount > 0 ? positionSum / positionCount : 0;

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
          <h1 className="text-2xl font-bold text-white">Performance</h1>
          <p className="text-dark-muted mt-1">Metriques de trafic et engagement</p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
          >
            <option value="7d">7 derniers jours</option>
            <option value="28d">28 derniers jours</option>
            <option value="90d">90 derniers jours</option>
          </select>
          <Button onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Overview metrics */}
      <div className="grid grid-cols-6 gap-4">
        <MetricCard
          title="Sessions"
          value={totals.sessions}
          icon={Users}
          color="text-primary"
        />
        <MetricCard
          title="Pages vues"
          value={totals.pageviews}
          icon={Eye}
          color="text-info"
        />
        <MetricCard
          title="Clicks GSC"
          value={totals.clicks}
          icon={MousePointer}
          color="text-success"
        />
        <MetricCard
          title="Impressions"
          value={totals.impressions}
          icon={BarChart3}
          color="text-warning"
        />
        <MetricCard
          title="CTR moyen"
          value={totals.ctr}
          icon={TrendingUp}
          color="text-primary"
          format="percent"
        />
        <MetricCard
          title="Position moy."
          value={totals.avgPosition}
          icon={TrendingUp}
          color="text-info"
        />
      </div>

      {/* Clicks chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Evolution des clicks</h3>
        {chartData.length > 0 ? (
          <SimpleBarChart data={chartData} height={200} />
        ) : (
          <div className="text-center py-12 text-dark-muted">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucune donnee disponible</p>
          </div>
        )}
      </Card>

      {/* Sites table */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-dark-border">
          <h3 className="text-lg font-semibold text-white">Performance par site</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border bg-dark-border/30">
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Site</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-dark-muted">Sessions</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-dark-muted">Pages vues</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-dark-muted">Clicks</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-dark-muted">Impressions</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-dark-muted">CTR</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-dark-muted">Position</th>
              </tr>
            </thead>
            <tbody>
              {sites.map(site => (
                <SiteRow
                  key={site.id}
                  site={site}
                  metrics={metrics[site.id] || {}}
                />
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-dark-border text-sm text-dark-muted">
          {sites.length} sites
        </div>
      </Card>
    </div>
  );
}
