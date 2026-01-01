import { useState, useEffect } from 'react';
import {
  ArrowLeft, Factory, Target, PenTool, Search, Sparkles,
  CheckCircle, FileCode, Loader2, Play, Eye, Edit3,
  AlertTriangle, Copy, Calendar, Send, Brain,
  ChevronDown, ChevronRight, RefreshCw, X, Link,
  FileText, Circle, HelpCircle, ArrowRight, Wand2
} from 'lucide-react';
import Card from '../components/common/Card';
import { supabase } from '../lib/supabase';
import { claudeApi } from '../lib/claude';

// Agent configuration
const AGENTS = [
  { id: 'strategist', name: 'Stratège', icon: Target, color: 'text-blue-500', description: 'Crée le brief détaillé' },
  { id: 'writer', name: 'Rédacteur', icon: PenTool, color: 'text-green-500', description: 'Écrit le contenu' },
  { id: 'seoEditor', name: 'SEO Editor', icon: Search, color: 'text-yellow-500', description: 'Optimise pour le SEO' },
  { id: 'humanizer', name: 'Humanizer', icon: Sparkles, color: 'text-purple-500', description: 'Rend naturel' },
  { id: 'factChecker', name: 'Fact-Checker', icon: CheckCircle, color: 'text-red-500', description: 'Vérifie les faits' },
  { id: 'schemaGenerator', name: 'Schema', icon: FileCode, color: 'text-cyan-500', description: 'Génère JSON-LD' }
];

// Content types
const CONTENT_TYPES = {
  pilier: { label: 'Page Mère', icon: Target, color: 'text-purple-500', bgColor: 'bg-purple-500/10', words: '3000+' },
  fille: { label: 'Page Fille', icon: Circle, color: 'text-blue-500', bgColor: 'bg-blue-500/10', words: '1500-2000' },
  article: { label: 'Article', icon: FileText, color: 'text-green-500', bgColor: 'bg-green-500/10', words: '800-1500' }
};

export default function ContentFactory({ site, onBack }) {
  // Step: 'analyze' | 'proposals' | 'create' | 'running' | 'result'
  const [step, setStep] = useState('analyze');

  // Analysis data
  const [analysisData, setAnalysisData] = useState({
    keywords: [],
    competitors: [],
    research: [],
    loading: true
  });

  // Architecture proposals from Architect agent
  const [proposals, setProposals] = useState(null);
  const [loadingProposals, setLoadingProposals] = useState(false);

  // Selected page to create
  const [selectedPage, setSelectedPage] = useState(null);

  // Brief for content creation
  const [brief, setBrief] = useState({
    keyword: '',
    secondary_keywords: [],
    content_type: 'article',
    paa_questions: [],
    competitors: [],
    site: site,
    internal_links: []
  });

  // Factory state
  const [isRunning, setIsRunning] = useState(false);
  const [agentStatus, setAgentStatus] = useState({});
  const [agentResults, setAgentResults] = useState({});
  const [expandedAgent, setExpandedAgent] = useState(null);

  // Result state
  const [finalResult, setFinalResult] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [publishing, setPublishing] = useState(false);

  // Load all analysis data
  useEffect(() => {
    if (!site?.id) return;
    loadAnalysisData();
  }, [site?.id]);

  const loadAnalysisData = async () => {
    try {
      const [kw, comp, research] = await Promise.all([
        supabase.from('keywords').select('*').eq('site_id', site.id).order('search_volume', { ascending: false }).limit(200),
        supabase.from('competitors').select('*').eq('site_id', site.id),
        supabase.from('market_research').select('*').eq('site_id', site.id).limit(10)
      ]);

      setAnalysisData({
        keywords: kw.data || [],
        competitors: comp.data || [],
        research: research.data || [],
        loading: false
      });
    } catch (err) {
      console.error('Error loading data:', err);
      setAnalysisData(prev => ({ ...prev, loading: false }));
    }
  };

  // Run Architect agent to propose architecture
  const runArchitectAgent = async () => {
    setLoadingProposals(true);
    setStep('proposals');

    try {
      // Prepare context for Architect
      const topKeywords = analysisData.keywords.slice(0, 50).map(k => ({
        keyword: k.keyword,
        volume: k.search_volume,
        difficulty: k.difficulty,
        position: k.current_position
      }));

      const competitorDomains = analysisData.competitors.map(c => c.domain).join(', ');

      const researchSummary = analysisData.research.slice(0, 3).map(r =>
        r.content?.substring(0, 500) || ''
      ).join('\n');

      const prompt = `Tu es l'Architecte SEO expert. Analyse toutes les données et propose une architecture de contenu optimale.

## SITE
- Alias: ${site.mcp_alias}
- URL: ${site.url}
- Niche: ${site.seo_focus?.[0] || 'à définir'}

## KEYWORDS ANALYSÉS (${analysisData.keywords.length} total)
${JSON.stringify(topKeywords.slice(0, 30), null, 2)}

## CONCURRENTS VALIDÉS
${competitorDomains || 'Aucun concurrent analysé'}

## RECHERCHES MARCHÉ
${researchSummary || 'Aucune recherche disponible'}

## TA MISSION
Propose une architecture de contenu avec:
1. 2-4 Pages Mères (piliers) basées sur les clusters de keywords à fort volume
2. 3-5 Pages Filles par Mère (sous-thématiques)
3. 2-3 Articles supports par cluster
4. Questions PAA pertinentes pour chaque page

## FORMAT JSON STRICT
{
  "analysis_summary": "Résumé de ton analyse en 2-3 phrases",
  "piliers": [
    {
      "keyword": "keyword principal pilier",
      "title_suggestion": "Titre H1 suggéré",
      "search_volume": 1000,
      "rationale": "Pourquoi ce pilier",
      "filles": [
        {
          "keyword": "keyword fille 1",
          "title_suggestion": "Titre suggéré",
          "search_volume": 500,
          "paa_questions": ["Question 1 ?", "Question 2 ?"]
        }
      ],
      "articles": [
        {
          "keyword": "keyword article",
          "title_suggestion": "Titre suggéré",
          "angle": "Angle éditorial",
          "paa_questions": ["Question ?"]
        }
      ],
      "paa_questions": ["Question PAA pilier 1 ?", "Question PAA pilier 2 ?"]
    }
  ],
  "priority_order": ["keyword pilier 1", "keyword pilier 2"],
  "quick_wins": ["keyword facile 1", "keyword facile 2"],
  "content_gaps": ["sujet non couvert 1", "sujet non couvert 2"]
}`;

      const response = await claudeApi.callClaudeRaw(prompt, { maxTokens: 4096 });

      // Parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setProposals(parsed);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Architect error:', err);
      alert('Erreur lors de l\'analyse: ' + err.message);
      setStep('analyze');
    } finally {
      setLoadingProposals(false);
    }
  };

  // Select a page to create
  const selectPage = (type, pilierKeyword, pageData) => {
    // Find related pages for internal linking
    const internalLinks = [];
    if (type !== 'pilier' && proposals) {
      // Link to pillar
      internalLinks.push({ type: 'pilier', keyword: pilierKeyword });
      // Link to sibling filles
      const pilier = proposals.piliers?.find(p => p.keyword === pilierKeyword);
      pilier?.filles?.forEach(f => {
        if (f.keyword !== pageData.keyword) {
          internalLinks.push({ type: 'fille', keyword: f.keyword });
        }
      });
    }

    setSelectedPage({ type, pilierKeyword, ...pageData });
    setBrief({
      keyword: pageData.keyword,
      secondary_keywords: type === 'pilier'
        ? proposals?.piliers?.find(p => p.keyword === pageData.keyword)?.filles?.map(f => f.keyword) || []
        : [],
      content_type: type,
      paa_questions: pageData.paa_questions || [],
      competitors: analysisData.competitors,
      site: site,
      internal_links: internalLinks
    });
    setStep('create');
  };

  // Handle agent progress
  const handleProgress = (agentId, status, result) => {
    setAgentStatus(prev => ({ ...prev, [agentId]: status }));
    if (result) {
      setAgentResults(prev => ({ ...prev, [agentId]: result }));
    }
  };

  // Run the factory
  const runFactory = async () => {
    if (!brief.keyword) return;

    setStep('running');
    setIsRunning(true);
    setAgentStatus({});
    setAgentResults({});
    setFinalResult(null);

    try {
      const result = await claudeApi.runContentFactory(brief, handleProgress);
      setFinalResult(result);
      if (result.success) {
        setEditedContent(result.finalContent);
        setStep('result');
      }
    } catch (err) {
      console.error('Factory error:', err);
      alert('Erreur: ' + err.message);
    } finally {
      setIsRunning(false);
    }
  };

  // Save article
  const saveArticle = async (status = 'draft') => {
    if (!finalResult?.success) return;

    try {
      const { error } = await supabase.from('articles').insert({
        site_id: site.id,
        title: finalResult.metadata.title || brief.keyword,
        slug: brief.keyword.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        content: editedContent || finalResult.finalContent,
        content_type: brief.content_type,
        meta_title: finalResult.metadata.title,
        meta_description: finalResult.metadata.description,
        main_keyword: brief.keyword,
        word_count: finalResult.metadata.wordCount,
        seo_score: finalResult.metadata.seoScore,
        schema_markup: finalResult.metadata.schemas,
        internal_links: brief.internal_links,
        status: status,
        scheduled_at: scheduledDate || null
      });

      if (error) throw error;
      alert('Article sauvegardé !');

      // Back to proposals
      setStep('proposals');
      setFinalResult(null);
      setSelectedPage(null);
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  // Render agent icon
  const renderAgentIcon = (agentId) => {
    const status = agentStatus[agentId];
    if (status === 'running') return <Loader2 className="w-5 h-5 animate-spin text-warning" />;
    if (status === 'completed') return <CheckCircle className="w-5 h-5 text-success" />;
    return null;
  };

  // Loading state
  if (analysisData.loading) {
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
          onClick={() => {
            if (step === 'analyze') onBack();
            else if (step === 'proposals') setStep('analyze');
            else if (step === 'create') setStep('proposals');
            else if (step === 'result') { setStep('proposals'); setFinalResult(null); }
            else setStep('proposals');
          }}
          className="p-2 rounded-lg hover:bg-dark-border text-dark-muted hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Factory className="w-6 h-6 text-primary" />
            Content Factory
          </h1>
          <p className="text-dark-muted">
            {step === 'analyze' && `${site?.mcp_alias} - Prêt à analyser`}
            {step === 'proposals' && 'Propositions de l\'Architecte IA'}
            {step === 'create' && `Création: ${CONTENT_TYPES[brief.content_type]?.label}`}
            {step === 'running' && 'Génération en cours...'}
            {step === 'result' && 'Validation du contenu'}
          </p>
        </div>
      </div>

      {/* Step 1: Analysis Overview */}
      {step === 'analyze' && (
        <>
          {/* Data summary */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Données disponibles pour l'analyse</h2>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-dark-bg rounded-lg text-center">
                <div className="text-3xl font-bold text-primary">{analysisData.keywords.length}</div>
                <div className="text-sm text-dark-muted">Keywords</div>
              </div>
              <div className="p-4 bg-dark-bg rounded-lg text-center">
                <div className="text-3xl font-bold text-warning">{analysisData.competitors.length}</div>
                <div className="text-sm text-dark-muted">Concurrents</div>
              </div>
              <div className="p-4 bg-dark-bg rounded-lg text-center">
                <div className="text-3xl font-bold text-info">{analysisData.research.length}</div>
                <div className="text-sm text-dark-muted">Recherches marché</div>
              </div>
            </div>

            {analysisData.keywords.length === 0 ? (
              <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
                <p className="text-warning text-sm">
                  Aucun keyword analysé. Lancez d'abord une analyse Keywords depuis le dashboard.
                </p>
              </div>
            ) : (
              <div className="flex justify-center">
                <button
                  onClick={runArchitectAgent}
                  className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition-all shadow-lg"
                >
                  <Brain className="w-6 h-6" />
                  <div className="text-left">
                    <div className="font-semibold">Analyser et proposer l'architecture</div>
                    <div className="text-sm opacity-80">L'IA va analyser toutes vos données</div>
                  </div>
                  <Wand2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </Card>

          {/* Top keywords preview */}
          {analysisData.keywords.length > 0 && (
            <Card className="p-4">
              <h3 className="text-sm font-medium text-dark-muted mb-3">Top Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {analysisData.keywords.slice(0, 15).map((kw, idx) => (
                  <span key={idx} className="px-3 py-1 bg-dark-bg rounded-full text-sm text-white">
                    {kw.keyword}
                    <span className="text-dark-muted ml-2">{kw.search_volume}</span>
                  </span>
                ))}
                {analysisData.keywords.length > 15 && (
                  <span className="px-3 py-1 bg-dark-border rounded-full text-sm text-dark-muted">
                    +{analysisData.keywords.length - 15} autres
                  </span>
                )}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Step 2: Proposals */}
      {step === 'proposals' && (
        <>
          {loadingProposals ? (
            <Card className="p-12 text-center">
              <Brain className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
              <h2 className="text-xl font-semibold text-white mb-2">L'Architecte IA analyse vos données...</h2>
              <p className="text-dark-muted">Analyse des keywords, concurrents et recherches marché</p>
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mt-6" />
            </Card>
          ) : proposals ? (
            <>
              {/* Analysis summary */}
              <Card className="p-4 bg-gradient-to-r from-primary/10 to-purple-600/10 border-primary/30">
                <div className="flex items-start gap-3">
                  <Brain className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-white font-medium mb-1">Analyse de l'Architecte IA</h3>
                    <p className="text-dark-muted text-sm">{proposals.analysis_summary}</p>
                  </div>
                </div>
              </Card>

              {/* Quick wins */}
              {proposals.quick_wins?.length > 0 && (
                <Card className="p-4 bg-success/5 border-success/30">
                  <h3 className="text-success font-medium mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Quick Wins identifiés
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {proposals.quick_wins.map((kw, idx) => (
                      <span key={idx} className="px-2 py-1 bg-success/10 rounded text-sm text-success">{kw}</span>
                    ))}
                  </div>
                </Card>
              )}

              {/* Piliers proposés */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white">
                  Architecture proposée ({proposals.piliers?.length || 0} piliers)
                </h2>

                {proposals.piliers?.map((pilier, pIdx) => (
                  <Card key={pIdx} className="overflow-hidden">
                    {/* Pilier header */}
                    <div className="p-4 bg-gradient-to-r from-purple-500/10 to-transparent border-b border-dark-border">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-purple-500/20 text-purple-500 font-bold">
                            M{pIdx + 1}
                          </div>
                          <div>
                            <h3 className="text-white font-semibold">{pilier.title_suggestion}</h3>
                            <p className="text-sm text-purple-400">{pilier.keyword}</p>
                            {pilier.rationale && (
                              <p className="text-xs text-dark-muted mt-1">{pilier.rationale}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {pilier.search_volume && (
                            <span className="text-sm text-dark-muted">{pilier.search_volume} vol</span>
                          )}
                          <button
                            onClick={() => selectPage('pilier', pilier.keyword, pilier)}
                            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium"
                          >
                            Créer la Mère
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Filles et Articles */}
                    <div className="p-4 space-y-4">
                      {/* Filles */}
                      {pilier.filles?.length > 0 && (
                        <div>
                          <h4 className="text-xs text-dark-muted uppercase mb-2 flex items-center gap-2">
                            <Circle className="w-3 h-3 text-blue-500" />
                            Pages Filles ({pilier.filles.length})
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {pilier.filles.map((fille, fIdx) => (
                              <div
                                key={fIdx}
                                className="flex items-center justify-between p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg hover:bg-blue-500/10 transition-all"
                              >
                                <div className="flex-1">
                                  <div className="text-white text-sm font-medium">{fille.title_suggestion}</div>
                                  <div className="text-xs text-blue-400">{fille.keyword}</div>
                                  {fille.paa_questions?.length > 0 && (
                                    <div className="text-xs text-dark-muted mt-1">
                                      <HelpCircle className="w-3 h-3 inline mr-1" />
                                      {fille.paa_questions.length} PAA
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={() => selectPage('fille', pilier.keyword, fille)}
                                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                                >
                                  Créer
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Articles */}
                      {pilier.articles?.length > 0 && (
                        <div>
                          <h4 className="text-xs text-dark-muted uppercase mb-2 flex items-center gap-2">
                            <FileText className="w-3 h-3 text-green-500" />
                            Articles supports ({pilier.articles.length})
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            {pilier.articles.map((article, aIdx) => (
                              <div
                                key={aIdx}
                                className="flex items-center justify-between p-2 bg-green-500/5 border border-green-500/20 rounded-lg hover:bg-green-500/10 transition-all"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="text-white text-sm truncate">{article.title_suggestion}</div>
                                  <div className="text-xs text-green-400 truncate">{article.keyword}</div>
                                </div>
                                <button
                                  onClick={() => selectPage('article', pilier.keyword, article)}
                                  className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 flex-shrink-0 ml-2"
                                >
                                  Créer
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* PAA du pilier */}
                      {pilier.paa_questions?.length > 0 && (
                        <div className="p-3 bg-dark-bg rounded-lg">
                          <div className="text-xs text-dark-muted mb-2 flex items-center gap-1">
                            <HelpCircle className="w-3 h-3" />
                            PAA Questions pour ce pilier
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {pilier.paa_questions.map((q, qIdx) => (
                              <span key={qIdx} className="px-2 py-1 bg-dark-card rounded text-xs text-dark-muted">
                                {q}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              {/* Content gaps */}
              {proposals.content_gaps?.length > 0 && (
                <Card className="p-4">
                  <h3 className="text-warning font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Opportunités non couvertes
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {proposals.content_gaps.map((gap, idx) => (
                      <span key={idx} className="px-2 py-1 bg-warning/10 rounded text-sm text-warning">{gap}</span>
                    ))}
                  </div>
                </Card>
              )}

              {/* Refresh button */}
              <div className="text-center">
                <button
                  onClick={runArchitectAgent}
                  className="text-dark-muted hover:text-white text-sm flex items-center gap-2 mx-auto"
                >
                  <RefreshCw className="w-4 h-4" />
                  Relancer l'analyse
                </button>
              </div>
            </>
          ) : null}
        </>
      )}

      {/* Step 3: Create Brief */}
      {step === 'create' && selectedPage && (
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className={`p-3 rounded-lg ${CONTENT_TYPES[brief.content_type]?.bgColor}`}>
              {(() => {
                const Icon = CONTENT_TYPES[brief.content_type]?.icon || FileText;
                return <Icon className={`w-6 h-6 ${CONTENT_TYPES[brief.content_type]?.color}`} />;
              })()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{CONTENT_TYPES[brief.content_type]?.label}</h2>
              <p className="text-dark-muted">{selectedPage.title_suggestion}</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Keyword */}
            <div>
              <label className="block text-sm text-dark-muted mb-1">Keyword principal</label>
              <input
                type="text"
                value={brief.keyword}
                onChange={(e) => setBrief(prev => ({ ...prev, keyword: e.target.value }))}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white"
              />
            </div>

            {/* Secondary keywords */}
            {brief.secondary_keywords.length > 0 && (
              <div>
                <label className="block text-sm text-dark-muted mb-1">Keywords secondaires</label>
                <div className="flex flex-wrap gap-2">
                  {brief.secondary_keywords.map((kw, idx) => (
                    <span key={idx} className="px-2 py-1 bg-dark-bg rounded text-sm text-white">{kw}</span>
                  ))}
                </div>
              </div>
            )}

            {/* PAA */}
            {brief.paa_questions.length > 0 && (
              <div>
                <label className="block text-sm text-dark-muted mb-1">
                  <HelpCircle className="w-4 h-4 inline mr-1" />
                  Questions PAA ({brief.paa_questions.length})
                </label>
                <div className="flex flex-wrap gap-2">
                  {brief.paa_questions.map((q, idx) => (
                    <span key={idx} className="px-2 py-1 bg-dark-bg rounded text-sm text-white">{q}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Internal links */}
            {brief.internal_links.length > 0 && (
              <div className="p-3 bg-info/5 border border-info/20 rounded-lg">
                <div className="text-sm text-info mb-2 flex items-center gap-2">
                  <Link className="w-4 h-4" />
                  Maillage interne suggéré
                </div>
                <div className="flex flex-wrap gap-2">
                  {brief.internal_links.map((link, idx) => (
                    <span key={idx} className="px-2 py-1 bg-dark-bg rounded text-xs text-white flex items-center gap-1">
                      <ArrowRight className="w-3 h-3 text-info" />
                      {link.keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Competitors */}
            <div className="p-3 bg-dark-bg rounded-lg text-sm text-dark-muted">
              <CheckCircle className="w-4 h-4 inline mr-2 text-success" />
              {analysisData.competitors.length} concurrent(s) seront analysés
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <button onClick={() => setStep('proposals')} className="px-4 py-2 text-dark-muted hover:text-white">
              Retour
            </button>
            <button
              onClick={runFactory}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90"
            >
              <Play className="w-5 h-5" />
              Lancer les 6 agents
            </button>
          </div>
        </Card>
      )}

      {/* Step 4: Running */}
      {(step === 'running' || step === 'result') && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Pipeline des agents</h2>

          {/* Progress Bar */}
          {(() => {
            const completedCount = Object.values(agentStatus).filter(s => s === 'completed').length;
            const runningAgent = AGENTS.find(a => agentStatus[a.id] === 'running');
            const progress = (completedCount / AGENTS.length) * 100;

            return (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-dark-muted">
                    {runningAgent ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin text-warning" />
                        {runningAgent.name} en cours...
                      </span>
                    ) : finalResult?.success ? (
                      <span className="text-success">Terminé !</span>
                    ) : 'En attente...'}
                  </span>
                  <span className="text-sm font-medium text-white">{completedCount}/{AGENTS.length}</span>
                </div>
                <div className="h-2 bg-dark-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            );
          })()}

          <div className="space-y-3">
            {AGENTS.map((agent) => {
              const status = agentStatus[agent.id];
              const result = agentResults[agent.id];
              const isExpanded = expandedAgent === agent.id;
              const Icon = agent.icon;

              return (
                <div key={agent.id} className="border border-dark-border rounded-lg overflow-hidden">
                  <div
                    className={`p-4 flex items-center justify-between cursor-pointer hover:bg-dark-border/30 ${
                      status === 'running' ? 'bg-warning/5' : status === 'completed' ? 'bg-success/5' : ''
                    }`}
                    onClick={() => result && setExpandedAgent(isExpanded ? null : agent.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-dark-bg ${agent.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{agent.name}</span>
                          {renderAgentIcon(agent.id)}
                        </div>
                        <span className="text-sm text-dark-muted">{agent.description}</span>
                      </div>
                    </div>
                    {result && (isExpanded ? <ChevronDown className="w-5 h-5 text-dark-muted" /> : <ChevronRight className="w-5 h-5 text-dark-muted" />)}
                  </div>
                  {isExpanded && result && (
                    <div className="border-t border-dark-border bg-dark-bg/50 p-4 max-h-64 overflow-auto">
                      <pre className="text-xs text-dark-muted whitespace-pre-wrap">
                        {JSON.stringify(result, null, 2).substring(0, 2000)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Step 5: Result */}
      {step === 'result' && finalResult?.success && (
        <>
          {/* Metrics */}
          <Card className="p-4">
            <div className="grid grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{finalResult.metadata.seoScore || '-'}</div>
                <div className="text-xs text-dark-muted">Score SEO</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{finalResult.metadata.wordCount || '-'}</div>
                <div className="text-xs text-dark-muted">Mots</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-success">{finalResult.metadata.factCheckScore || '-'}%</div>
                <div className="text-xs text-dark-muted">Faits vérifiés</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-500">{finalResult.metadata.aiDetection || '-'}%</div>
                <div className="text-xs text-dark-muted">Détection IA</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-cyan-500">{finalResult.metadata.schemas?.length || 0}</div>
                <div className="text-xs text-dark-muted">Schemas</div>
              </div>
            </div>
          </Card>

          {/* Content */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">{editMode ? 'Modifier' : 'Aperçu'}</h2>
              <div className="flex gap-2">
                <button onClick={() => { navigator.clipboard.writeText(editedContent); alert('Copié !'); }} className="p-2 rounded-lg hover:bg-dark-border text-dark-muted">
                  <Copy className="w-4 h-4" />
                </button>
                <button onClick={() => setEditMode(!editMode)} className={`p-2 rounded-lg ${editMode ? 'bg-primary text-white' : 'hover:bg-dark-border text-dark-muted'}`}>
                  {editMode ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-dark-bg rounded-lg text-sm">
              <div><span className="text-dark-muted">Title:</span> <span className="text-white">{finalResult.metadata.title}</span></div>
              <div><span className="text-dark-muted">Description:</span> <span className="text-white">{finalResult.metadata.description?.substring(0, 80)}...</span></div>
            </div>

            {editMode ? (
              <textarea value={editedContent} onChange={(e) => setEditedContent(e.target.value)} className="w-full h-96 bg-dark-bg border border-dark-border rounded-lg p-4 text-white font-mono text-sm" />
            ) : (
              <div className="h-96 overflow-auto p-4 bg-dark-bg rounded-lg whitespace-pre-wrap text-sm text-white">
                {editedContent}
              </div>
            )}
          </Card>

          {/* Save */}
          <Card className="p-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <input type="datetime-local" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="w-full bg-dark-card border border-dark-border rounded-lg px-4 py-2 text-white" placeholder="Programmer (optionnel)" />
              </div>
              <button onClick={() => saveArticle('draft')} className="px-4 py-2 bg-dark-border text-white rounded-lg">Brouillon</button>
              <button onClick={() => saveArticle(scheduledDate ? 'scheduled' : 'published')} disabled={publishing} className="flex items-center gap-2 px-6 py-2 bg-success text-white rounded-lg font-medium">
                {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Sauvegarder
              </button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
