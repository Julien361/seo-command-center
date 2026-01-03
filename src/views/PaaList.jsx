import { useState, useEffect } from 'react';
import {
  ArrowLeft, Search, MessageCircleQuestion, ExternalLink,
  Loader2, CheckCircle, Circle, RefreshCw
} from 'lucide-react';
import Card from '../components/common/Card';
import { supabase } from '../lib/supabase';

export default function PaaList({ site, onBack }) {
  const [paaQuestions, setPaaQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [enriching, setEnriching] = useState(false);
  const [seedKeyword, setSeedKeyword] = useState('');

  useEffect(() => {
    if (!site?.id) return;
    loadPaa();
  }, [site?.id]);

  const loadPaa = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('paa_questions')
        .select('*')
        .eq('site_id', site.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPaaQuestions(data || []);
    } catch (err) {
      console.error('Error loading PAA:', err);
    } finally {
      setLoading(false);
    }
  };

  // Search PAA for a keyword
  const searchPaa = async () => {
    if (!seedKeyword.trim()) return;

    setEnriching(true);
    try {
      const response = await fetch('https://julien1sikoutris.app.n8n.cloud/webhook/paa-enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: seedKeyword.trim(),
          site_id: site.id,
          save_to_db: true
        })
      });

      if (response.ok) {
        // Reload PAA
        await loadPaa();
        setSeedKeyword('');
      } else {
        console.error('PAA search failed');
      }
    } catch (err) {
      console.error('PAA search error:', err);
    } finally {
      setEnriching(false);
    }
  };

  // Group by seed_keyword
  const groupedPaa = paaQuestions.reduce((acc, paa) => {
    const key = paa.seed_keyword || 'Sans keyword';
    if (!acc[key]) acc[key] = [];
    acc[key].push(paa);
    return acc;
  }, {});

  const filteredPaa = paaQuestions.filter(paa =>
    paa.question?.toLowerCase().includes(search.toLowerCase()) ||
    paa.seed_keyword?.toLowerCase().includes(search.toLowerCase())
  );

  const coveredCount = paaQuestions.filter(p => p.is_covered).length;

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
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageCircleQuestion className="w-6 h-6 text-purple-400" />
            People Also Ask
          </h1>
          <p className="text-dark-muted">{paaQuestions.length} questions pour {site?.mcp_alias}</p>
        </div>
      </div>

      {/* Search new PAA */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm text-dark-muted mb-1">Rechercher PAA pour un keyword</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: maprimeadapt conditions"
                value={seedKeyword}
                onChange={(e) => setSeedKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchPaa()}
                className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white placeholder:text-dark-muted focus:outline-none focus:border-primary"
              />
              <button
                onClick={searchPaa}
                disabled={enriching || !seedKeyword.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-dark-border disabled:text-dark-muted text-white rounded-lg transition-colors"
              >
                {enriching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Rechercher
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-white">{paaQuestions.length}</div>
          <div className="text-sm text-dark-muted">Total PAA</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">{Object.keys(groupedPaa).length}</div>
          <div className="text-sm text-dark-muted">Keywords</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-success">{coveredCount}</div>
          <div className="text-sm text-dark-muted">Couvertes</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-warning">{paaQuestions.length - coveredCount}</div>
          <div className="text-sm text-dark-muted">A couvrir</div>
        </Card>
      </div>

      {/* Filter */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
        <input
          type="text"
          placeholder="Filtrer les questions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-dark-card border border-dark-border rounded-lg pl-10 pr-4 py-2 text-white placeholder:text-dark-muted focus:outline-none focus:border-primary"
        />
      </div>

      {/* PAA List grouped by keyword */}
      {paaQuestions.length === 0 ? (
        <Card className="p-8 text-center text-dark-muted">
          <MessageCircleQuestion className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Aucune question PAA pour ce site.</p>
          <p className="text-sm mt-2">Utilisez le champ ci-dessus pour rechercher des PAA.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedPaa).map(([keyword, questions]) => {
            const filteredQuestions = questions.filter(q =>
              q.question?.toLowerCase().includes(search.toLowerCase())
            );
            if (search && filteredQuestions.length === 0) return null;

            return (
              <Card key={keyword} className="overflow-hidden">
                <div className="bg-dark-border px-4 py-2 flex items-center justify-between">
                  <span className="font-medium text-white">{keyword}</span>
                  <span className="text-sm text-purple-400">{questions.length} questions</span>
                </div>
                <div className="divide-y divide-dark-border">
                  {(search ? filteredQuestions : questions).map((paa) => (
                    <div key={paa.id} className="px-4 py-3 hover:bg-dark-border/30">
                      <div className="flex items-start gap-3">
                        {paa.is_covered ? (
                          <CheckCircle className="w-4 h-4 text-success mt-1 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-dark-muted mt-1 shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="text-white">{paa.question}</div>
                          {paa.answer_snippet && (
                            <div className="text-dark-muted text-sm mt-1 line-clamp-2">
                              {paa.answer_snippet}
                            </div>
                          )}
                          {paa.source_domain && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-dark-muted">
                              <ExternalLink className="w-3 h-3" />
                              {paa.source_domain}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
