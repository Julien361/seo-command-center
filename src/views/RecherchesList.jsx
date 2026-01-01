import { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, TrendingUp, FileText, ExternalLink, Loader2, ChevronDown, ChevronUp, RefreshCw, Play } from 'lucide-react';
import Card from '../components/common/Card';
import { supabase } from '../lib/supabase';
import { n8nApi } from '../lib/n8n';

export default function RecherchesList({ site, onBack }) {
  const [researches, setResearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [launching, setLaunching] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!site?.id) return;
    loadResearches();
  }, [site?.id]);

  const loadResearches = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('market_research')
        .select('*')
        .eq('site_id', site.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResearches(data || []);
    } catch (err) {
      console.error('Error loading researches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchResearch = async () => {
    if (!site) return;
    setLaunching(true);
    setSuccess(null);

    try {
      const seoFocus = Array.isArray(site.seo_focus) ? site.seo_focus : [site.seo_focus || ''];
      const niche = seoFocus[0] || '';

      const result = await n8nApi.triggerWebhook('claude-seo-research', {
        keyword_principal: niche,
        niche: niche,
        site_alias: site.mcp_alias,
        site_id: site.id
      });

      if (result?.success !== false) {
        setSuccess('Analyse lancee ! Rafraichis dans 1-2 min.');
        setTimeout(() => {
          loadResearches();
          setSuccess(null);
        }, 5000);
      }
    } catch (err) {
      console.error('Launch error:', err);
    } finally {
      setLaunching(false);
    }
  };

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'market_analysis':
        return <BookOpen className="w-4 h-4 text-info" />;
      case 'trends_analysis':
        return <TrendingUp className="w-4 h-4 text-success" />;
      case 'sources_resources':
        return <FileText className="w-4 h-4 text-warning" />;
      default:
        return <BookOpen className="w-4 h-4 text-dark-muted" />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'market_analysis':
        return 'Analyse marche';
      case 'trends_analysis':
        return 'Tendances';
      case 'sources_resources':
        return 'Sources';
      default:
        return type;
    }
  };

  const getTypeBg = (type) => {
    switch (type) {
      case 'market_analysis':
        return 'bg-info/10 text-info';
      case 'trends_analysis':
        return 'bg-success/10 text-success';
      case 'sources_resources':
        return 'bg-warning/10 text-warning';
      default:
        return 'bg-dark-border text-dark-muted';
    }
  };

  // Group by research_type
  const grouped = researches.reduce((acc, r) => {
    const type = r.research_type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(r);
    return acc;
  }, {});

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
            <h1 className="text-2xl font-bold text-white">Recherches</h1>
            <p className="text-dark-muted">{researches.length} analyses pour {site?.mcp_alias}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {success && (
            <span className="text-success text-sm">{success}</span>
          )}
          <button
            onClick={loadResearches}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-border hover:bg-dark-muted/20 text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleLaunchResearch}
            disabled={launching}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-info text-white hover:opacity-90 transition-colors disabled:opacity-50"
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
          <div className="text-2xl font-bold text-info">{grouped.market_analysis?.length || 0}</div>
          <div className="text-sm text-dark-muted">Analyses marche</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-success">{grouped.trends_analysis?.length || 0}</div>
          <div className="text-sm text-dark-muted">Tendances</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-warning">{grouped.sources_resources?.length || 0}</div>
          <div className="text-sm text-dark-muted">Sources</div>
        </Card>
      </div>

      {/* Research List */}
      {researches.length === 0 ? (
        <Card className="p-8 text-center">
          <BookOpen className="w-12 h-12 text-dark-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Aucune analyse</h3>
          <p className="text-dark-muted mb-4">Lancez une analyse de marche pour ce site</p>
          <button
            onClick={handleLaunchResearch}
            disabled={launching}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-info text-white hover:opacity-90 transition-colors disabled:opacity-50"
          >
            {launching ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyse...</>
            ) : (
              <><Play className="w-4 h-4" /> Lancer l'analyse</>
            )}
          </button>
        </Card>
      ) : (
        <div className="space-y-4">
          {researches.map((research) => (
            <Card key={research.id} className="overflow-hidden">
              {/* Header */}
              <div
                className="p-4 cursor-pointer hover:bg-dark-border/30 transition-colors"
                onClick={() => toggleExpand(research.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(research.research_type)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-xs rounded ${getTypeBg(research.research_type)}`}>
                          {getTypeLabel(research.research_type)}
                        </span>
                        <span className="text-white font-medium">{research.niche || research.keyword}</span>
                      </div>
                      <div className="text-sm text-dark-muted mt-1">
                        {new Date(research.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        {research.citations?.length > 0 && (
                          <span className="ml-2">• {research.citations.length} sources</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {expanded[research.id] ? (
                    <ChevronUp className="w-5 h-5 text-dark-muted" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-dark-muted" />
                  )}
                </div>
              </div>

              {/* Content (expanded) */}
              {expanded[research.id] && (
                <div className="border-t border-dark-border">
                  {/* Main content */}
                  <div className="p-4">
                    <div className="prose prose-invert prose-sm max-w-none">
                      <div
                        className="text-dark-muted whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{
                          __html: research.content
                            ?.replace(/^# (.+)$/gm, '<h2 class="text-lg font-bold text-white mt-4 mb-2">$1</h2>')
                            .replace(/^## (.+)$/gm, '<h3 class="text-md font-semibold text-white mt-3 mb-1">$1</h3>')
                            .replace(/^### (.+)$/gm, '<h4 class="text-sm font-medium text-white mt-2 mb-1">$1</h4>')
                            .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
                            .replace(/^\- (.+)$/gm, '<li class="ml-4">$1</li>')
                            .replace(/^\d+\. (.+)$/gm, '<li class="ml-4">$1</li>')
                            || ''
                        }}
                      />
                    </div>
                  </div>

                  {/* Citations */}
                  {research.citations?.length > 0 && (
                    <div className="border-t border-dark-border p-4 bg-dark-bg/50">
                      <h4 className="text-sm font-medium text-white mb-2">Sources ({research.citations.length})</h4>
                      <div className="flex flex-wrap gap-2">
                        {research.citations.slice(0, 10).map((url, idx) => {
                          let domain = url;
                          try {
                            domain = new URL(url).hostname.replace('www.', '');
                          } catch {}
                          return (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-dark-border text-dark-muted hover:text-white hover:bg-dark-muted/30 transition-colors"
                            >
                              {domain}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          );
                        })}
                        {research.citations.length > 10 && (
                          <span className="text-xs text-dark-muted">+{research.citations.length - 10} autres</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
