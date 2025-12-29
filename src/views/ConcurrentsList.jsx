import { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Target, ExternalLink, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import Card from '../components/common/Card';
import { supabase } from '../lib/supabase';

export default function ConcurrentsList({ site, onBack }) {
  const [research, setResearch] = useState([]);
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('research');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (!site?.id) return;
    loadData();
  }, [site?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [researchRes, competitorsRes] = await Promise.all([
        supabase
          .from('market_research')
          .select('*')
          .eq('site_id', site.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('competitors')
          .select('*')
          .eq('site_id', site.id)
          .order('created_at', { ascending: false })
      ]);

      setResearch(researchRes.data || []);
      setCompetitors(competitorsRes.data || []);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-2xl font-bold text-white">Recherches & Concurrents</h1>
          <p className="text-dark-muted">{site?.mcp_alias}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('research')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'research'
              ? 'bg-primary text-white'
              : 'bg-dark-card text-dark-muted hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Recherches ({research.length})
        </button>
        <button
          onClick={() => setActiveTab('competitors')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'competitors'
              ? 'bg-primary text-white'
              : 'bg-dark-card text-dark-muted hover:text-white'
          }`}
        >
          <Target className="w-4 h-4" />
          Concurrents ({competitors.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'research' ? (
        <div className="space-y-4">
          {research.length === 0 ? (
            <Card className="p-8 text-center">
              <BookOpen className="w-12 h-12 text-dark-muted mx-auto mb-4" />
              <p className="text-dark-muted">Aucune recherche de marche</p>
            </Card>
          ) : (
            research.map((r) => (
              <Card key={r.id} className="overflow-hidden">
                <button
                  onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-dark-border/30"
                >
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-xs rounded bg-info/20 text-info">
                        {r.research_type || 'market'}
                      </span>
                      <span className="text-white font-medium">{r.niche || 'Analyse'}</span>
                    </div>
                    <p className="text-sm text-dark-muted mt-1">
                      {new Date(r.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  {expandedId === r.id ? (
                    <ChevronUp className="w-5 h-5 text-dark-muted" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-dark-muted" />
                  )}
                </button>

                {expandedId === r.id && (
                  <div className="p-4 border-t border-dark-border bg-dark-bg/50">
                    <div className="prose prose-invert max-w-none text-sm">
                      {r.content ? (
                        <div className="whitespace-pre-wrap text-dark-muted">
                          {typeof r.content === 'string'
                            ? r.content.substring(0, 2000) + (r.content.length > 2000 ? '...' : '')
                            : JSON.stringify(r.content, null, 2).substring(0, 2000)
                          }
                        </div>
                      ) : (
                        <p className="text-dark-muted">Pas de contenu</p>
                      )}
                    </div>
                    {r.citations && r.citations.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-dark-border">
                        <p className="text-xs text-dark-muted mb-2">Sources:</p>
                        <div className="flex flex-wrap gap-2">
                          {r.citations.slice(0, 5).map((c, i) => (
                            <a
                              key={i}
                              href={c}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Source {i + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {competitors.length === 0 ? (
            <Card className="p-8 text-center">
              <Target className="w-12 h-12 text-dark-muted mx-auto mb-4" />
              <p className="text-dark-muted">Aucun concurrent analyse</p>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <table className="w-full">
                <thead className="bg-dark-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-dark-muted">Domaine</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-dark-muted">Trust Flow</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-dark-muted">Citation Flow</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-dark-muted">Backlinks</th>
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
                          {c.competitor_domain}
                          <ExternalLink className="w-3 h-3 text-dark-muted" />
                        </a>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-medium ${
                          c.trust_flow >= 30 ? 'text-success' :
                          c.trust_flow >= 15 ? 'text-warning' : 'text-dark-muted'
                        }`}>
                          {c.trust_flow || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-white">
                        {c.citation_flow || '-'}
                      </td>
                      <td className="px-4 py-3 text-center text-white">
                        {c.backlinks?.toLocaleString() || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
