import { useState, useEffect } from 'react';
import { ArrowLeft, Target, ExternalLink, Loader2, RefreshCw, Play, TrendingUp, Users, Link2 } from 'lucide-react';
import Card from '../components/common/Card';
import { supabase } from '../lib/supabase';
import { n8nApi } from '../lib/n8n';

export default function ConcurrentsList({ site, onBack }) {
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!site?.id) return;
    loadCompetitors();
  }, [site?.id]);

  const loadCompetitors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('competitors')
        .select('*')
        .eq('site_id', site.id)
        .order('estimated_traffic', { ascending: false });

      if (error) throw error;
      setCompetitors(data || []);
    } catch (err) {
      console.error('Error loading competitors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchAnalysis = async () => {
    if (!site) return;
    setLaunching(true);
    setSuccess(null);

    try {
      const result = await n8nApi.triggerWebhook('dataforseo-competitor', {
        project_name: site.mcp_alias,
        site_id: site.id,
        site_url: site.url,
        competitor_urls: '',
        analyze_with_ai: true
      });

      if (result?.success !== false) {
        setSuccess('Analyse lancee ! Rafraichis dans 1-2 min.');
        setTimeout(() => {
          loadCompetitors();
          setSuccess(null);
        }, 5000);
      }
    } catch (err) {
      console.error('Launch error:', err);
    } finally {
      setLaunching(false);
    }
  };

  // Stats calculations
  const directCompetitors = competitors.filter(c => c.is_direct_competitor).length;
  const totalTraffic = competitors.reduce((sum, c) => sum + (c.estimated_traffic || 0), 0);
  const avgDA = competitors.length > 0
    ? Math.round(competitors.reduce((sum, c) => sum + (c.domain_authority || 0), 0) / competitors.length)
    : 0;

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-dark-border text-dark-muted hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Concurrents</h1>
            <p className="text-dark-muted">{competitors.length} concurrents pour {site?.mcp_alias}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {success && (
            <span className="text-success text-sm">{success}</span>
          )}
          <button
            onClick={loadCompetitors}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-border hover:bg-dark-muted/20 text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleLaunchAnalysis}
            disabled={launching}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-warning text-white hover:opacity-90 transition-colors disabled:opacity-50"
          >
            {launching ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyse...</>
            ) : (
              <><Play className="w-4 h-4" /> Nouvelle analyse</>
            )}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-warning">{competitors.length}</div>
          <div className="text-sm text-dark-muted">Total concurrents</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-success">{directCompetitors}</div>
          <div className="text-sm text-dark-muted">Directs</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-info">{totalTraffic.toLocaleString()}</div>
          <div className="text-sm text-dark-muted">Traffic estime total</div>
        </Card>
      </div>

      {/* Competitors Table */}
      {competitors.length === 0 ? (
        <Card className="p-8 text-center">
          <Target className="w-12 h-12 text-dark-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Aucun concurrent</h3>
          <p className="text-dark-muted mb-4">Lancez une analyse pour detecter les concurrents</p>
          <button
            onClick={handleLaunchAnalysis}
            disabled={launching}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-warning text-white hover:opacity-90 transition-colors disabled:opacity-50"
          >
            {launching ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyse...</>
            ) : (
              <><Play className="w-4 h-4" /> Lancer l'analyse</>
            )}
          </button>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-dark-border">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-dark-muted">Domaine</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-dark-muted">Type</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-dark-muted">Traffic</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-dark-muted">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {competitors.map((c) => (
                <tr key={c.id} className="hover:bg-dark-border/50">
                  <td className="px-4 py-3">
                    <a
                      href={`https://${c.competitor_domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white hover:text-primary flex items-center gap-2"
                    >
                      <span className="font-medium">{c.competitor_domain}</span>
                      <ExternalLink className="w-3 h-3 text-dark-muted" />
                    </a>
                    {c.competitor_name && c.competitor_name !== c.competitor_domain && (
                      <span className="text-xs text-dark-muted">{c.competitor_name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 text-xs rounded ${
                      c.is_direct_competitor
                        ? 'bg-warning/20 text-warning'
                        : 'bg-dark-border text-dark-muted'
                    }`}>
                      {c.is_direct_competitor ? 'Direct' : 'Indirect'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-medium ${
                      c.estimated_traffic >= 1000 ? 'text-success' :
                      c.estimated_traffic >= 100 ? 'text-warning' : 'text-dark-muted'
                    }`}>
                      {c.estimated_traffic?.toLocaleString() || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-dark-muted line-clamp-2">
                      {c.notes || c.primary_focus || '-'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
