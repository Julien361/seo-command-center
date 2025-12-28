import { useState, useEffect } from 'react';
import { Search, Filter, Download, TrendingUp, TrendingDown, Target, AlertCircle, RefreshCw, Loader2, Sparkles } from 'lucide-react';
import { Card, Badge, Button } from '../components/common';
import { keywordsApi, sitesApi } from '../lib/supabase';
import { n8nApi, PAID_WORKFLOWS } from '../lib/n8n';

const intentColors = {
  informational: 'info',
  transactional: 'success',
  commercial: 'warning',
  navigational: 'primary',
};

const intentLabels = {
  informational: 'Info',
  transactional: 'Trans.',
  commercial: 'Comm.',
  navigational: 'Nav.',
};

export default function Keywords() {
  const [keywords, setKeywords] = useState([]);
  const [sites, setSites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIntent, setFilterIntent] = useState('all');
  const [filterSite, setFilterSite] = useState('all');
  const [showQuickWins, setShowQuickWins] = useState(false);
  const [showAnalyzeModal, setShowAnalyzeModal] = useState(false);
  const [analyzeKeyword, setAnalyzeKeyword] = useState('');
  const [analyzeSite, setAnalyzeSite] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    console.log('[Keywords] Chargement des donnees...');
    try {
      const [keywordsData, sitesData] = await Promise.all([
        keywordsApi.getAll(),
        sitesApi.getAll()
      ]);
      console.log('[Keywords] Donnees chargees:', {
        keywords: keywordsData?.length || 0,
        sites: sitesData?.length || 0
      });
      setKeywords(keywordsData || []);
      setSites(sitesData || []);
    } catch (err) {
      console.error('[Keywords] Erreur chargement:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!analyzeKeyword || !analyzeSite) return;

    const confirmMsg = `Analyser "${analyzeKeyword}" ?\n\nCette action utilise DataForSEO (payant).\nCout estime: ~0.05 EUR`;
    if (!confirm(confirmMsg)) return;

    setIsAnalyzing(true);
    try {
      const result = await n8nApi.analyzeKeyword(analyzeKeyword, analyzeSite);
      if (result.success) {
        alert('Analyse lancee ! Les resultats arriveront dans quelques minutes.');
        setShowAnalyzeModal(false);
        setAnalyzeKeyword('');
        // Recharger apres un delai
        setTimeout(loadData, 5000);
      } else {
        alert('Erreur: ' + result.error);
      }
    } catch (err) {
      alert('Erreur: ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const filteredKeywords = keywords.filter(kw => {
    const matchesSearch = (kw.keyword || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIntent = filterIntent === 'all' || kw.intent === filterIntent;
    const matchesSite = filterSite === 'all' || kw.site_id === filterSite;
    const matchesQuickWin = !showQuickWins || kw.is_quick_win;
    return matchesSearch && matchesIntent && matchesSite && matchesQuickWin;
  });

  const getDifficultyColor = (diff) => {
    if (diff < 30) return 'text-success';
    if (diff < 50) return 'text-warning';
    return 'text-danger';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Keywords Suivis</h2>
          <p className="text-dark-muted mt-1">
            {isLoading ? 'Chargement...' : `${keywords.length} keywords sur ${sites.length} sites`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={loadData}
            disabled={isLoading}
          >
            Actualiser
          </Button>
          <Button
            icon={Sparkles}
            onClick={() => setShowAnalyzeModal(true)}
          >
            Analyser Keyword
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 text-danger flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Modal Analyse Keyword */}
      {showAnalyzeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Analyser un Keyword</h3>
            <p className="text-warning text-sm mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Cette action utilise DataForSEO (payant ~0.05 EUR)
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-dark-muted mb-1">Keyword</label>
                <input
                  type="text"
                  value={analyzeKeyword}
                  onChange={(e) => setAnalyzeKeyword(e.target.value)}
                  placeholder="Ex: maprimeadapt conditions"
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-dark-muted mb-1">Site</label>
                <select
                  value={analyzeSite}
                  onChange={(e) => setAnalyzeSite(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white"
                >
                  <option value="">Selectionner un site</option>
                  {sites.map(site => (
                    <option key={site.id} value={site.mcp_alias}>{site.domain}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="secondary" onClick={() => setShowAnalyzeModal(false)}>
                  Annuler
                </Button>
                <Button
                  onClick={handleAnalyze}
                  disabled={!analyzeKeyword || !analyzeSite || isAnalyzing}
                  icon={isAnalyzing ? Loader2 : Sparkles}
                >
                  {isAnalyzing ? 'Analyse...' : 'Lancer l\'analyse'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
            <input
              type="text"
              placeholder="Rechercher un keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-lg pl-10 pr-4 py-2 text-white placeholder:text-dark-muted focus:outline-none focus:border-primary"
            />
          </div>
          <select
            value={filterSite}
            onChange={(e) => setFilterSite(e.target.value)}
            className="bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
          >
            <option value="all">Tous les sites</option>
            {sites.map(site => (
              <option key={site.id} value={site.id}>{site.mcp_alias}</option>
            ))}
          </select>
          <button
            onClick={() => setShowQuickWins(!showQuickWins)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showQuickWins
                ? 'bg-warning/20 border-warning text-warning'
                : 'border-dark-border text-dark-muted hover:border-warning hover:text-warning'
            }`}
          >
            <Target className="w-4 h-4" />
            Quick Wins
          </button>
        </div>

        {/* Stats bar */}
        <div className="mb-4 flex items-center gap-4 text-sm">
          <span className="text-dark-muted">
            Total: <span className="text-white font-medium">{keywords.length}</span> keywords
          </span>
          <span className="text-dark-muted">|</span>
          <span className="text-dark-muted">
            Affiches: <span className="text-white font-medium">{filteredKeywords.length}</span>
          </span>
          {keywords.filter(k => k.search_volume > 0).length > 0 && (
            <>
              <span className="text-dark-muted">|</span>
              <span className="text-dark-muted">
                Avec volume: <span className="text-success font-medium">{keywords.filter(k => k.search_volume > 0).length}</span>
              </span>
            </>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="ml-3 text-dark-muted">Chargement des keywords...</span>
          </div>
        ) : filteredKeywords.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-dark-muted mx-auto mb-4" />
            <p className="text-dark-muted">
              {keywords.length === 0
                ? 'Aucun keyword dans la base. Lancez une analyse depuis le SEO Coach !'
                : `Aucun keyword ne correspond aux filtres (${keywords.length} au total)`}
            </p>
            <Button
              className="mt-4"
              icon={Sparkles}
              onClick={() => setShowAnalyzeModal(true)}
            >
              Analyser un keyword
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Keyword</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-muted">Site</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Volume</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Difficulte</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Position</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-muted">Evolution</th>
                </tr>
              </thead>
              <tbody>
                {filteredKeywords.map((kw) => {
                  const positionChange = (kw.previous_position || 0) - (kw.current_position || 0);
                  const difficulty = kw.difficulty || 0;
                  const volume = kw.search_volume || 0;
                  const position = kw.current_position;
                  const siteName = kw.sites?.mcp_alias || kw.sites?.domain || '-';

                  return (
                    <tr key={kw.id} className="border-b border-dark-border/50 hover:bg-dark-border/30">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{kw.keyword}</span>
                          {kw.is_quick_win && (
                            <Target className="w-4 h-4 text-warning" title="Quick Win" />
                          )}
                          {kw.has_featured_snippet && (
                            <Badge variant="info" size="sm">Snippet</Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-dark-muted">{siteName}</td>
                      <td className="py-4 px-4 text-center text-white">
                        {volume > 0 ? volume.toLocaleString() : '-'}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {difficulty > 0 ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-2 bg-dark-border rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${difficulty < 30 ? 'bg-success' : difficulty < 50 ? 'bg-warning' : 'bg-danger'}`}
                                style={{ width: `${difficulty}%` }}
                              />
                            </div>
                            <span className={`text-sm ${getDifficultyColor(difficulty)}`}>{difficulty}</span>
                          </div>
                        ) : (
                          <span className="text-dark-muted">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {position ? (
                          <Badge variant={position <= 3 ? 'success' : position <= 10 ? 'primary' : 'warning'}>
                            {position}
                          </Badge>
                        ) : (
                          <span className="text-dark-muted">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {positionChange !== 0 ? (
                          <div className={`flex items-center justify-center gap-1 ${positionChange > 0 ? 'text-success' : 'text-danger'}`}>
                            {positionChange > 0 ? (
                              <>
                                <TrendingUp className="w-4 h-4" />
                                <span>+{positionChange}</span>
                              </>
                            ) : (
                              <>
                                <TrendingDown className="w-4 h-4" />
                                <span>{positionChange}</span>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-dark-muted">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
