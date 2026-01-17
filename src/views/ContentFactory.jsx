import { useState, useEffect } from 'react';
import {
  ArrowLeft, Factory, Target, PenTool, Search, Sparkles,
  CheckCircle, FileCode, Loader2, Play, Eye, Edit3,
  AlertTriangle, Copy, Calendar, Send, Brain,
  ChevronDown, ChevronRight, RefreshCw, X, Link,
  FileText, Circle, HelpCircle, ArrowRight, Wand2,
  CalendarDays, Clock, TrendingUp, Zap, Compass,
  Shield, Lightbulb, Users, Square, CheckSquare,
  MessageCircle, List
} from 'lucide-react';
import Card from '../components/common/Card';
import { supabase } from '../lib/supabase';
import { claudeApi } from '../lib/claude';

// Agent configuration - Full pipeline (11 agents)
const AGENTS = [
  { id: 'paaAnalyst', name: 'PAA Analyst', icon: HelpCircle, color: 'text-violet-500', description: 'Génère PAA + format snippet', model: 'Haiku' },
  { id: 'strategist', name: 'Stratège', icon: Target, color: 'text-blue-500', description: 'Crée le brief détaillé', model: 'Sonnet' },
  { id: 'slugGenerator', name: 'URL/Slug', icon: Link, color: 'text-orange-500', description: 'Génère URL optimisée', model: 'Haiku' },
  { id: 'writer', name: 'Rédacteur', icon: PenTool, color: 'text-green-500', description: 'Écrit le contenu', model: 'Sonnet' },
  { id: 'factChecker', name: 'Fact-Checker', icon: CheckCircle, color: 'text-red-500', description: 'Vérifie les faits', model: 'Haiku' },
  { id: 'position0Optimizer', name: 'Position 0', icon: Zap, color: 'text-amber-500', description: 'Optimise snippets', model: 'Sonnet' },
  { id: 'tocGenerator', name: 'Sommaire', icon: FileText, color: 'text-indigo-500', description: 'Génère TOC', model: 'Local' },
  { id: 'humanizer', name: 'Humanizer', icon: Sparkles, color: 'text-purple-500', description: 'Rend naturel', model: 'Sonnet' },
  { id: 'seoEditor', name: 'SEO Editor', icon: Search, color: 'text-yellow-500', description: 'Optimise pour 85+', model: 'Sonnet' },
  { id: 'proofreader', name: 'Relecteur', icon: Eye, color: 'text-pink-500', description: 'Cohérence & fluidité', model: 'Haiku' },
  { id: 'schemaGenerator', name: 'Schema', icon: FileCode, color: 'text-cyan-500', description: 'JSON-LD + HowTo', model: 'Haiku' }
];

// Content types with tone guidance
const CONTENT_TYPES = {
  pilier: {
    label: 'Page Mère',
    icon: Target,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    words: '3000+',
    defaultTone: 'nous',
    toneDescription: 'Ton institutionnel, autorité de marque'
  },
  fille: {
    label: 'Page Fille',
    icon: Circle,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    words: '1500-2000',
    defaultTone: 'neutre',
    toneDescription: 'Ton informatif, expertise technique'
  },
  article: {
    label: 'Article',
    icon: FileText,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    words: '800-1500',
    defaultTone: 'je',
    toneDescription: 'Ton personnel, expertise individuelle'
  }
};

// Tone options
const TONE_OPTIONS = {
  je: { label: 'Je', description: 'Expertise personnelle, storytelling' },
  nous: { label: 'Nous', description: 'Autorité institutionnelle, équipe' },
  neutre: { label: 'Neutre', description: 'Informatif, objectif' }
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

  // SEO Director strategic orientation
  const [seoDirection, setSeoDirection] = useState(null);
  const [loadingDirection, setLoadingDirection] = useState(false);

  // Editorial calendar from Planner agent
  const [editorialCalendar, setEditorialCalendar] = useState(null);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [articlesPerWeek, setArticlesPerWeek] = useState(4);
  const [planningDuration, setPlanningDuration] = useState(8); // weeks
  const [showCalendar, setShowCalendar] = useState(false);

  // Selected page to create
  const [selectedPage, setSelectedPage] = useState(null);

  // Brief for content creation
  const [brief, setBrief] = useState({
    keyword: '',
    secondary_keywords: [],
    content_type: 'article',
    tone: 'je', // je, nous, neutre
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

  // Batch selection state
  const [selectedPages, setSelectedPages] = useState([]); // [{type, keyword, pilierKeyword, ...pageData}]
  const [showClarification, setShowClarification] = useState(false);
  const [clarificationData, setClarificationData] = useState(null);

  // Saved analysis state
  const [savedAnalysis, setSavedAnalysis] = useState(null);
  const [showSavedAnalysisPrompt, setShowSavedAnalysisPrompt] = useState(false);

  // Load saved analysis from localStorage on mount
  useEffect(() => {
    if (!site?.id) return;
    const saved = localStorage.getItem(`analysis_${site.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSavedAnalysis(parsed);
        setShowSavedAnalysisPrompt(true);
      } catch (e) {
        console.error('Error loading saved analysis:', e);
        localStorage.removeItem(`analysis_${site.id}`);
      }
    }
  }, [site?.id]);

  // Save analysis to localStorage
  const saveAnalysisToStorage = (direction, props) => {
    if (!site?.id) return;
    const data = {
      seoDirection: direction,
      proposals: props,
      savedAt: new Date().toISOString(),
      siteAlias: site.mcp_alias
    };
    localStorage.setItem(`analysis_${site.id}`, JSON.stringify(data));
  };

  // Load saved analysis
  const loadSavedAnalysis = () => {
    if (savedAnalysis) {
      setSeoDirection(savedAnalysis.seoDirection);
      setProposals(savedAnalysis.proposals);
      setStep('proposals');
      setShowSavedAnalysisPrompt(false);
    }
  };

  // Clear saved analysis
  const clearSavedAnalysis = () => {
    if (site?.id) {
      localStorage.removeItem(`analysis_${site.id}`);
    }
    setSavedAnalysis(null);
    setShowSavedAnalysisPrompt(false);
  };

  // Toggle page selection
  const togglePageSelection = (type, pilierKeyword, pageData) => {
    const pageId = `${type}-${pageData.keyword}`;
    const isSelected = selectedPages.some(p => `${p.type}-${p.keyword}` === pageId);

    if (isSelected) {
      setSelectedPages(prev => prev.filter(p => `${p.type}-${p.keyword}` !== pageId));
    } else {
      setSelectedPages(prev => [...prev, { type, pilierKeyword, ...pageData }]);
    }
  };

  // Check if page is selected
  const isPageSelected = (type, keyword) => {
    return selectedPages.some(p => p.type === type && p.keyword === keyword);
  };

  // Select all pages from a pilier (pilier + filles + articles)
  const selectCluster = (pilier) => {
    const clusterPages = [];
    // Add pilier
    clusterPages.push({ type: 'pilier', pilierKeyword: pilier.keyword, ...pilier });
    // Add filles
    pilier.filles?.forEach(fille => {
      clusterPages.push({ type: 'fille', pilierKeyword: pilier.keyword, ...fille });
    });
    // Add articles
    pilier.articles?.forEach(article => {
      clusterPages.push({ type: 'article', pilierKeyword: pilier.keyword, ...article });
    });

    // Merge with existing selection (avoid duplicates)
    setSelectedPages(prev => {
      const existingIds = new Set(prev.map(p => `${p.type}-${p.keyword}`));
      const newPages = clusterPages.filter(p => !existingIds.has(`${p.type}-${p.keyword}`));
      return [...prev, ...newPages];
    });
  };

  // Select all pages
  const selectAll = () => {
    const allPages = [];
    proposals?.piliers?.forEach(pilier => {
      allPages.push({ type: 'pilier', pilierKeyword: pilier.keyword, ...pilier });
      pilier.filles?.forEach(fille => {
        allPages.push({ type: 'fille', pilierKeyword: pilier.keyword, ...fille });
      });
      pilier.articles?.forEach(article => {
        allPages.push({ type: 'article', pilierKeyword: pilier.keyword, ...article });
      });
    });
    setSelectedPages(allPages);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedPages([]);
  };

  // Load all analysis data
  useEffect(() => {
    if (!site?.id) return;
    loadAnalysisData();
  }, [site?.id]);

  const loadAnalysisData = async () => {
    try {
      const [kw, comp, research, paa] = await Promise.all([
        supabase.from('keywords').select('*').eq('site_id', site.id).order('search_volume', { ascending: false }).limit(200),
        supabase.from('competitors').select('*').eq('site_id', site.id),
        supabase.from('market_research').select('*').eq('site_id', site.id).limit(10),
        supabase.from('paa_questions').select('*').eq('site_id', site.id).order('position', { ascending: true })
      ]);

      setAnalysisData({
        keywords: kw.data || [],
        competitors: comp.data || [],
        research: research.data || [],
        paaQuestions: paa.data || [],
        loading: false
      });
    } catch (err) {
      console.error('Error loading data:', err);
      setAnalysisData(prev => ({ ...prev, loading: false }));
    }
  };

  // Run full analysis: SEO Director first, then Architect
  const runFullAnalysis = async () => {
    setLoadingProposals(true);
    setLoadingDirection(true);
    setStep('proposals');
    setSeoDirection(null);
    setProposals(null);

    try {
      // Step 1: SEO Director orients the strategy
      let direction = null;
      try {
        direction = await claudeApi.runSeoDirector(site, analysisData, null);
        setSeoDirection(direction);
      } catch (dirErr) {
        console.error('SEO Director error (continuing):', dirErr);
      }
      setLoadingDirection(false);

      // Step 2: Architect uses Director's guidance
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

      // Include Director's guidance in Architect prompt
      const directorGuidance = direction ? `
## DIRECTIVES DU SEO DIRECTOR
- Focus principal: ${direction.strategic_focus?.main_angle || 'Non défini'}
- Positionnement: ${direction.strategic_focus?.positioning || 'Non défini'}
- Ton recommandé: ${direction.strategic_focus?.tone || 'expert'}
- Cible: ${direction.strategic_focus?.target_audience || 'Non défini'}
- À inclure: ${direction.content_guidelines?.must_include?.join(', ') || 'N/A'}
- À éviter: ${direction.content_guidelines?.avoid?.join(', ') || 'N/A'}
- Priorités: ${direction.priorities?.slice(0, 2).map(p => p.action).join(', ') || 'N/A'}
` : '';

      const prompt = `Tu es l'Architecte SEO expert. Tu travailles sous la direction du SEO Director.
${directorGuidance}
Analyse toutes les données et propose une architecture de contenu optimale ALIGNÉE avec les directives ci-dessus.

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

        // Save analysis to localStorage for recovery
        saveAnalysisToStorage(direction, parsed);
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

  // Run SEO Director agent
  const runSeoDirector = async () => {
    setLoadingDirection(true);
    try {
      const direction = await claudeApi.runSeoDirector(site, analysisData, proposals);
      setSeoDirection(direction);
    } catch (err) {
      console.error('SEO Director error:', err);
    } finally {
      setLoadingDirection(false);
    }
  };

  // Run Planner agent
  const runPlanner = async () => {
    if (!proposals) return;
    setLoadingCalendar(true);
    try {
      const calendar = await claudeApi.runPlanner(proposals, {
        articlesPerWeek,
        weeks: planningDuration
      });
      setEditorialCalendar(calendar);
      setShowCalendar(true);
    } catch (err) {
      console.error('Planner error:', err);
    } finally {
      setLoadingCalendar(false);
    }
  };

  // Get PAA questions related to a keyword
  const getPaaForKeyword = (keyword) => {
    if (!keyword || !analysisData.paaQuestions) return [];
    const kwLower = keyword.toLowerCase();
    return analysisData.paaQuestions
      .filter(paa =>
        paa.seed_keyword?.toLowerCase() === kwLower ||
        paa.seed_keyword?.toLowerCase().includes(kwLower) ||
        kwLower.includes(paa.seed_keyword?.toLowerCase() || '')
      )
      .map(paa => paa.question)
      .filter(Boolean);
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

    // Get PAA questions for this keyword
    const relatedPaa = getPaaForKeyword(pageData.keyword);

    setSelectedPage({ type, pilierKeyword, ...pageData });
    setBrief({
      keyword: pageData.keyword,
      secondary_keywords: type === 'pilier'
        ? proposals?.piliers?.find(p => p.keyword === pageData.keyword)?.filles?.map(f => f.keyword) || []
        : [],
      content_type: type,
      tone: CONTENT_TYPES[type]?.defaultTone || 'neutre',
      paa_questions: pageData.paa_questions?.length > 0 ? pageData.paa_questions : relatedPaa,
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

  // Run the factory with SEO Director guidance (Orchestrator pattern)
  const runFactory = async () => {
    if (!brief.keyword) return;

    setStep('running');
    setIsRunning(true);
    setAgentStatus({});
    setAgentResults({});
    setFinalResult(null);

    try {
      // Pass SEO Director guidance to orchestrate all agents
      const result = await claudeApi.runContentFactory(
        brief,
        analysisData.paaQuestions || [],
        handleProgress,
        seoDirection // <-- Inject SEO Director guidance into all agents
      );
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
          {/* Saved Analysis Prompt */}
          {showSavedAnalysisPrompt && savedAnalysis && (
            <Card className="p-4 bg-gradient-to-r from-cyan-500/10 to-cyan-600/5 border-cyan-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20">
                    <Clock className="w-6 h-6 text-cyan-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Analyse précédente trouvée</h3>
                    <p className="text-sm text-cyan-400">
                      {savedAnalysis.siteAlias} - {new Date(savedAnalysis.savedAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p className="text-xs text-dark-muted mt-1">
                      {savedAnalysis.proposals?.piliers?.length || 0} piliers • {savedAnalysis.seoDirection ? 'Directives SEO Director incluses' : 'Sans directives'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={clearSavedAnalysis}
                    className="px-3 py-2 text-dark-muted hover:text-white text-sm"
                  >
                    Ignorer
                  </button>
                  <button
                    onClick={loadSavedAnalysis}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Charger
                  </button>
                </div>
              </div>
            </Card>
          )}

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
                  onClick={runFullAnalysis}
                  className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-500 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition-all shadow-lg"
                >
                  <Compass className="w-6 h-6" />
                  <div className="text-left">
                    <div className="font-semibold">Lancer le SEO Director</div>
                    <div className="text-sm opacity-80">Oriente la stratégie puis propose l'architecture</div>
                  </div>
                  <Brain className="w-5 h-5" />
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
              {loadingDirection ? (
                <>
                  <Compass className="w-16 h-16 text-orange-500 mx-auto mb-4 animate-pulse" />
                  <h2 className="text-xl font-semibold text-white mb-2">Le SEO Director analyse la stratégie...</h2>
                  <p className="text-dark-muted">Définition du focus, positionnement et priorités</p>
                </>
              ) : (
                <>
                  <Brain className="w-16 h-16 text-purple-500 mx-auto mb-4 animate-pulse" />
                  <h2 className="text-xl font-semibold text-white mb-2">L'Architecte construit les propositions...</h2>
                  <p className="text-dark-muted">Architecture alignée avec les directives du Director</p>
                </>
              )}
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mt-6" />
              <div className="flex justify-center gap-4 mt-4">
                <div className={`flex items-center gap-2 ${!loadingDirection ? 'text-success' : 'text-dark-muted'}`}>
                  <Compass className="w-4 h-4" />
                  <span className="text-sm">Director</span>
                  {!loadingDirection && <CheckCircle className="w-4 h-4" />}
                </div>
                <div className="text-dark-muted flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  <span className="text-sm">Architecte</span>
                  {!loadingProposals && <CheckCircle className="w-4 h-4 text-success" />}
                </div>
              </div>
            </Card>
          ) : proposals ? (
            <>
              {/* SEO Director Strategic Vision - Always shown first as the leader */}
              {seoDirection && (
                <Card className="p-4 bg-gradient-to-r from-orange-500/10 to-orange-600/5 border-orange-500/30">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-orange-500/20">
                      <Compass className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Directives du SEO Director</h3>
                      <p className="text-sm text-orange-400">{seoDirection.strategic_focus?.main_angle}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="p-2 bg-dark-bg/50 rounded">
                      <div className="text-dark-muted text-xs mb-1">Positionnement</div>
                      <div className="text-white">{seoDirection.strategic_focus?.positioning?.substring(0, 50) || 'N/A'}...</div>
                    </div>
                    <div className="p-2 bg-dark-bg/50 rounded">
                      <div className="text-dark-muted text-xs mb-1">Cible</div>
                      <div className="text-white flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {seoDirection.strategic_focus?.target_audience || 'N/A'}
                      </div>
                    </div>
                    <div className="p-2 bg-dark-bg/50 rounded">
                      <div className="text-dark-muted text-xs mb-1">Ton</div>
                      <div className="text-white capitalize">{seoDirection.strategic_focus?.tone || 'expert'}</div>
                    </div>
                    <div className="p-2 bg-dark-bg/50 rounded">
                      <div className="text-dark-muted text-xs mb-1">Priorité #1</div>
                      <div className="text-success text-xs">{seoDirection.priorities?.[0]?.action || 'N/A'}</div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Planner Controls */}
              <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-cyan-500" />
                      <h3 className="font-medium text-white">Planner Éditorial</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-dark-muted">Durée:</span>
                        <select
                          value={planningDuration}
                          onChange={(e) => setPlanningDuration(Number(e.target.value))}
                          className="bg-dark-bg border border-dark-border rounded px-2 py-1 text-sm text-white"
                        >
                          <option value={4}>1 mois</option>
                          <option value={8}>2 mois</option>
                          <option value={13}>3 mois</option>
                          <option value={26}>6 mois</option>
                          <option value={52}>1 an</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-dark-muted">Rythme:</span>
                        <select
                          value={articlesPerWeek}
                          onChange={(e) => setArticlesPerWeek(Number(e.target.value))}
                          className="bg-dark-bg border border-dark-border rounded px-2 py-1 text-sm text-white"
                        >
                          <option value={2}>2/sem</option>
                          <option value={3}>3/sem</option>
                          <option value={4}>4/sem</option>
                          <option value={5}>5/sem</option>
                        </select>
                      </div>
                      <button
                        onClick={runPlanner}
                        disabled={loadingCalendar}
                        className="px-3 py-1 bg-cyan-500 text-white text-sm rounded-lg hover:bg-cyan-600 disabled:opacity-50"
                      >
                        {loadingCalendar ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Planifier'}
                      </button>
                    </div>
                  </div>

                  {/* Estimation */}
                  <div className="text-xs text-dark-muted mb-2">
                    → {planningDuration} semaines × {articlesPerWeek}/sem = <span className="text-cyan-400 font-medium">{planningDuration * articlesPerWeek} articles</span>
                  </div>

                  {editorialCalendar ? (
                    <div className="space-y-2 text-sm">
                      <div className="p-2 bg-cyan-500/10 rounded flex justify-between">
                        <span className="text-cyan-400">{editorialCalendar.summary?.total_planned} contenus planifiés</span>
                        <span className="text-white">{editorialCalendar.summary?.duration_weeks} semaines</span>
                      </div>
                      {editorialCalendar.summary?.total_planned < planningDuration * articlesPerWeek && (
                        <div className="p-2 bg-warning/10 rounded text-warning text-xs">
                          ⚠️ Pas assez de contenu proposé. Relancez l'Architecte avec plus de keywords.
                        </div>
                      )}
                      <button
                        onClick={() => setShowCalendar(!showCalendar)}
                        className="text-cyan-400 hover:text-cyan-300 text-xs flex items-center gap-1"
                      >
                        {showCalendar ? 'Masquer' : 'Voir'} le calendrier
                        <ChevronRight className={`w-3 h-3 transition-transform ${showCalendar ? 'rotate-90' : ''}`} />
                      </button>
                    </div>
                  ) : (
                    <p className="text-dark-muted text-sm">Générer le calendrier éditorial sur {planningDuration} semaines</p>
                  )}
              </Card>

              {/* Editorial Calendar Display */}
              {showCalendar && editorialCalendar?.calendar && (
                <Card className="p-4 overflow-x-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-medium flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-cyan-500" />
                      Calendrier Éditorial
                    </h3>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        Mères ({editorialCalendar.summary?.piliers || 0})
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Filles ({editorialCalendar.summary?.filles || 0})
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Articles ({editorialCalendar.summary?.articles || 0})
                      </span>
                      {editorialCalendar.summary?.suggested > 0 && (
                        <span className="flex items-center gap-1 text-warning">
                          <Wand2 className="w-3 h-3" />
                          +{editorialCalendar.summary.suggested} suggérés
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Month Navigation for long calendars */}
                  {editorialCalendar.calendar.length > 8 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {Array.from({ length: Math.ceil(editorialCalendar.calendar.length / 4) }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            document.getElementById(`month-${i}`)?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="px-2 py-1 bg-dark-bg rounded text-xs text-dark-muted hover:text-white hover:bg-dark-border"
                        >
                          Mois {i + 1}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {editorialCalendar.calendar.map((week, wIdx) => (
                      <div
                        key={wIdx}
                        id={wIdx % 4 === 0 ? `month-${Math.floor(wIdx / 4)}` : undefined}
                        className="border border-dark-border rounded-lg overflow-hidden"
                      >
                        <div className="p-2 bg-dark-border/50 flex justify-between items-center">
                          <span className="text-sm font-medium text-white">
                            Semaine {week.week}
                            {wIdx % 4 === 0 && <span className="ml-2 text-cyan-400 text-xs">Mois {Math.floor(wIdx / 4) + 1}</span>}
                          </span>
                          <span className="text-xs text-dark-muted">{week.start_date}</span>
                        </div>
                        <div className="p-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                          {week.publications?.map((pub, pIdx) => (
                            <div
                              key={pIdx}
                              className={`p-2 rounded text-xs ${
                                pub.type === 'pilier' ? 'bg-purple-500/10 border-purple-500/30' :
                                pub.type === 'fille' ? 'bg-blue-500/10 border-blue-500/30' :
                                'bg-green-500/10 border-green-500/30'
                              } border ${pub.is_suggested ? 'border-dashed' : ''}`}
                            >
                              <div className="flex justify-between">
                                <span className="text-dark-muted">{pub.day}</span>
                                {pub.is_suggested && <Wand2 className="w-3 h-3 text-warning" />}
                              </div>
                              <div className="text-white font-medium truncate" title={pub.keyword}>{pub.keyword}</div>
                              <div className="text-dark-muted flex items-center gap-1 mt-1">
                                <span className={`w-2 h-2 rounded-full ${
                                  pub.type === 'pilier' ? 'bg-purple-500' :
                                  pub.type === 'fille' ? 'bg-blue-500' : 'bg-green-500'
                                }`}></span>
                                {pub.cluster}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Suggested Topics */}
                  {editorialCalendar.suggested_topics?.length > 0 && (
                    <div className="mt-4 p-3 bg-warning/5 border border-warning/20 rounded-lg">
                      <h4 className="text-warning text-sm font-medium mb-2 flex items-center gap-1">
                        <Wand2 className="w-4 h-4" />
                        Sujets suggérés pour compléter ({editorialCalendar.suggested_topics.length})
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                        {editorialCalendar.suggested_topics.slice(0, 9).map((topic, idx) => (
                          <div key={idx} className="p-2 bg-dark-bg rounded">
                            <div className="text-white">{topic.keyword}</div>
                            <div className="text-dark-muted">{topic.cluster} - {topic.rationale}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {editorialCalendar.recommendations?.length > 0 && (
                    <div className="mt-4 p-3 bg-info/5 border border-info/20 rounded-lg">
                      <h4 className="text-info text-sm font-medium mb-2 flex items-center gap-1">
                        <Lightbulb className="w-4 h-4" />
                        Recommandations
                      </h4>
                      <ul className="text-sm text-dark-muted space-y-1">
                        {editorialCalendar.recommendations.map((rec, idx) => (
                          <li key={idx}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              )}

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

              {/* Selection toolbar */}
              <Card className="p-3 flex items-center justify-between sticky top-0 z-10 bg-dark-card/95 backdrop-blur">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-dark-muted">
                    {selectedPages.length > 0 ? (
                      <span className="text-primary font-medium">{selectedPages.length} page(s) sélectionnée(s)</span>
                    ) : (
                      'Cochez les pages à créer'
                    )}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAll}
                      className="px-2 py-1 text-xs bg-dark-border text-dark-muted rounded hover:bg-dark-bg hover:text-white"
                    >
                      Tout sélectionner
                    </button>
                    {selectedPages.length > 0 && (
                      <button
                        onClick={clearSelection}
                        className="px-2 py-1 text-xs bg-dark-border text-dark-muted rounded hover:bg-red-500/20 hover:text-red-400"
                      >
                        <X className="w-3 h-3 inline mr-1" />
                        Effacer
                      </button>
                    )}
                  </div>
                </div>
                {selectedPages.length > 0 && (
                  <button
                    onClick={() => {
                      // Check if we have enough info or need clarification
                      const needsClarification = !seoDirection || analysisData.competitors.length === 0;
                      if (needsClarification) {
                        setClarificationData({
                          pages: selectedPages,
                          missingInfo: {
                            noDirection: !seoDirection,
                            noCompetitors: analysisData.competitors.length === 0,
                            noPaa: analysisData.paaQuestions?.length === 0
                          }
                        });
                        setShowClarification(true);
                      } else {
                        // Go directly to batch creation
                        setStep('batch-create');
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg font-medium hover:opacity-90"
                  >
                    <Play className="w-4 h-4" />
                    Créer {selectedPages.length} page(s)
                  </button>
                )}
              </Card>

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
                          {/* Checkbox */}
                          <button
                            onClick={() => togglePageSelection('pilier', pilier.keyword, pilier)}
                            className="p-1 hover:bg-purple-500/20 rounded transition-colors"
                          >
                            {isPageSelected('pilier', pilier.keyword) ? (
                              <CheckSquare className="w-5 h-5 text-purple-500" />
                            ) : (
                              <Square className="w-5 h-5 text-dark-muted hover:text-purple-400" />
                            )}
                          </button>
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
                            onClick={() => selectCluster(pilier)}
                            className="px-3 py-1 text-xs bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30"
                            title="Sélectionner tout le cluster"
                          >
                            <List className="w-3 h-3 inline mr-1" />
                            Cluster
                          </button>
                          <button
                            onClick={() => selectPage('pilier', pilier.keyword, pilier)}
                            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium"
                          >
                            Créer
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
                                className={`flex items-center justify-between p-3 border rounded-lg hover:bg-blue-500/10 transition-all ${
                                  isPageSelected('fille', fille.keyword)
                                    ? 'bg-blue-500/20 border-blue-500/50'
                                    : 'bg-blue-500/5 border-blue-500/20'
                                }`}
                              >
                                <div className="flex items-center gap-2 flex-1">
                                  <button
                                    onClick={() => togglePageSelection('fille', pilier.keyword, fille)}
                                    className="p-0.5 hover:bg-blue-500/20 rounded"
                                  >
                                    {isPageSelected('fille', fille.keyword) ? (
                                      <CheckSquare className="w-4 h-4 text-blue-500" />
                                    ) : (
                                      <Square className="w-4 h-4 text-dark-muted hover:text-blue-400" />
                                    )}
                                  </button>
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
                                className={`flex items-center justify-between p-2 border rounded-lg hover:bg-green-500/10 transition-all ${
                                  isPageSelected('article', article.keyword)
                                    ? 'bg-green-500/20 border-green-500/50'
                                    : 'bg-green-500/5 border-green-500/20'
                                }`}
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <button
                                    onClick={() => togglePageSelection('article', pilier.keyword, article)}
                                    className="p-0.5 hover:bg-green-500/20 rounded flex-shrink-0"
                                  >
                                    {isPageSelected('article', article.keyword) ? (
                                      <CheckSquare className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <Square className="w-4 h-4 text-dark-muted hover:text-green-400" />
                                    )}
                                  </button>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-white text-sm truncate">{article.title_suggestion}</div>
                                    <div className="text-xs text-green-400 truncate">{article.keyword}</div>
                                  </div>
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
                  onClick={runFullAnalysis}
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

            {/* Tone selector */}
            <div>
              <label className="block text-sm text-dark-muted mb-2">Ton du contenu</label>
              <div className="flex gap-2">
                {Object.entries(TONE_OPTIONS).map(([key, option]) => (
                  <button
                    key={key}
                    onClick={() => setBrief(prev => ({ ...prev, tone: key }))}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
                      brief.tone === key
                        ? 'bg-primary text-white'
                        : 'bg-dark-bg text-dark-muted hover:bg-dark-border hover:text-white'
                    }`}
                  >
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs opacity-70">{option.description}</div>
                  </button>
                ))}
              </div>
              <div className="text-xs text-dark-muted mt-1">
                Recommandé pour {CONTENT_TYPES[brief.content_type]?.label}: <span className="text-primary">{TONE_OPTIONS[CONTENT_TYPES[brief.content_type]?.defaultTone]?.label}</span>
              </div>
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

            {/* PAA Questions */}
            <div>
              <label className="text-sm text-dark-muted flex items-center gap-1 mb-2">
                <HelpCircle className="w-4 h-4" />
                Questions PAA pour FAQ ({brief.paa_questions.length} sélectionnées)
              </label>

              {/* Selected PAA */}
              {brief.paa_questions.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {brief.paa_questions.map((q, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-sm flex items-center gap-1 cursor-pointer hover:bg-purple-500/30"
                      onClick={() => setBrief(prev => ({
                        ...prev,
                        paa_questions: prev.paa_questions.filter((_, i) => i !== idx)
                      }))}
                      title="Cliquer pour retirer"
                    >
                      {q.length > 50 ? q.substring(0, 50) + '...' : q}
                      <X className="w-3 h-3" />
                    </span>
                  ))}
                </div>
              )}

              {/* Available PAA suggestions */}
              {analysisData.paaQuestions?.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs text-dark-muted mb-1">
                    PAA disponibles ({analysisData.paaQuestions.filter(p => !brief.paa_questions.includes(p.question)).length}) - cliquer pour ajouter
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                    {analysisData.paaQuestions
                      .filter(p => p.question && !brief.paa_questions.includes(p.question))
                      .slice(0, 20)
                      .map((paa, idx) => (
                        <button
                          key={idx}
                          onClick={() => setBrief(prev => ({
                            ...prev,
                            paa_questions: [...prev.paa_questions, paa.question]
                          }))}
                          className="px-2 py-0.5 bg-dark-bg text-dark-muted rounded text-xs hover:bg-dark-border hover:text-white transition-colors"
                          title={paa.question}
                        >
                          + {paa.question.length > 40 ? paa.question.substring(0, 40) + '...' : paa.question}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

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
              Lancer les 11 agents
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
            <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-3 text-center">
              <div>
                <div className={`text-2xl font-bold ${finalResult.metadata.seoScore >= 85 ? 'text-success' : 'text-warning'}`}>
                  {finalResult.metadata.seoScore || '-'}
                </div>
                <div className="text-xs text-dark-muted">Score SEO</div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${finalResult.metadata.position0Score >= 80 ? 'text-amber-500' : 'text-amber-700'}`}>
                  {finalResult.metadata.position0Score || '-'}
                </div>
                <div className="text-xs text-dark-muted">Position 0</div>
                {finalResult.metadata.answerBoxesAdded > 0 && (
                  <div className="text-xs text-amber-400">{finalResult.metadata.answerBoxesAdded} boxes</div>
                )}
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{finalResult.metadata.wordCount || '-'}</div>
                <div className="text-xs text-dark-muted">Mots</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-success">{finalResult.metadata.factCheckScore || '-'}%</div>
                <div className="text-xs text-dark-muted">Faits OK</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-500">{finalResult.metadata.aiDetection || '-'}%</div>
                <div className="text-xs text-dark-muted">IA Detect</div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${finalResult.metadata.proofreadScore >= 80 ? 'text-pink-500' : 'text-warning'}`}>
                  {finalResult.metadata.proofreadScore || '-'}
                </div>
                <div className="text-xs text-dark-muted">Relecture</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-indigo-500">{finalResult.metadata.hasToc ? '✓' : '-'}</div>
                <div className="text-xs text-dark-muted">Sommaire</div>
                {finalResult.metadata.tocSections > 0 && (
                  <div className="text-xs text-indigo-400">{finalResult.metadata.tocSections} sections</div>
                )}
              </div>
              <div>
                <div className="text-2xl font-bold text-cyan-500">{finalResult.metadata.schemas?.length || 0}</div>
                <div className="text-xs text-dark-muted">Schemas</div>
                {finalResult.metadata.hasHowTo && (
                  <div className="text-xs text-cyan-400">+HowTo</div>
                )}
              </div>
              <div>
                <div className="text-2xl font-bold text-violet-500">{finalResult.metadata.snippetOpportunity || '-'}</div>
                <div className="text-xs text-dark-muted">Snippet %</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400 text-xs uppercase">{finalResult.metadata.snippetFormat || '-'}</div>
                <div className="text-xs text-dark-muted">Format P0</div>
              </div>
            </div>
          </Card>

          {/* Meta Tags - Easy Copy */}
          <Card className="p-4">
            <h3 className="text-sm font-medium text-dark-muted mb-3 flex items-center gap-2">
              <FileCode className="w-4 h-4" />
              Meta Tags (cliquer pour copier)
            </h3>
            <div className="space-y-2">
              <div
                onClick={() => { navigator.clipboard.writeText(finalResult.metadata.slug || ''); }}
                className="p-2 bg-dark-bg rounded cursor-pointer hover:bg-dark-border transition-colors"
              >
                <span className="text-xs text-orange-500">URL/Slug:</span>
                <span className="text-white ml-2">/{finalResult.metadata.slug}</span>
              </div>
              <div
                onClick={() => { navigator.clipboard.writeText(finalResult.metadata.title); }}
                className="p-2 bg-dark-bg rounded cursor-pointer hover:bg-dark-border transition-colors"
              >
                <span className="text-xs text-primary">Title:</span>
                <span className="text-white ml-2">{finalResult.metadata.title}</span>
              </div>
              <div
                onClick={() => { navigator.clipboard.writeText(finalResult.metadata.description); }}
                className="p-2 bg-dark-bg rounded cursor-pointer hover:bg-dark-border transition-colors"
              >
                <span className="text-xs text-primary">Description:</span>
                <span className="text-white ml-2">{finalResult.metadata.description}</span>
              </div>
            </div>
          </Card>

          {/* Internal Links */}
          {finalResult.metadata.internalLinks?.length > 0 && (
            <Card className="p-4">
              <h3 className="text-sm font-medium text-dark-muted mb-3 flex items-center gap-2">
                <Link className="w-4 h-4" />
                Maillage interne suggéré ({finalResult.metadata.internalLinks.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {finalResult.metadata.internalLinks.map((link, idx) => (
                  <div key={idx} className="p-2 bg-info/10 border border-info/20 rounded text-sm">
                    <div className="text-info font-medium">{link.anchor}</div>
                    <div className="text-dark-muted text-xs flex items-center gap-1">
                      <ArrowRight className="w-3 h-3" />
                      {link.target}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Content with Structure View */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">{editMode ? 'Modifier' : 'Contenu'}</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(editedContent);
                    alert('Markdown copié !');
                  }}
                  className="flex items-center gap-1 px-3 py-1 bg-dark-border text-dark-muted rounded-lg hover:bg-dark-card hover:text-white text-sm"
                >
                  <Copy className="w-4 h-4" />
                  Markdown
                </button>
                <button
                  onClick={() => {
                    // Convert Markdown to HTML
                    const html = editedContent
                      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.+?)\*/g, '<em>$1</em>')
                      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
                      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
                      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
                      .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
                      .replace(/^\- (.+)$/gm, '<li>$1</li>')
                      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
                      .replace(/\[LIEN: (.+?) -> (.+?)\]/g, '<a href="#">$1</a>')
                      .split('\n')
                      .map(line => {
                        if (line.startsWith('<h') || line.startsWith('<li')) return line;
                        if (line.trim() === '') return '';
                        return `<p>${line}</p>`;
                      })
                      .filter(line => line !== '')
                      .join('\n');
                    navigator.clipboard.writeText(html);
                    alert('HTML copié !');
                  }}
                  className="flex items-center gap-1 px-3 py-1 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 text-sm"
                >
                  <FileCode className="w-4 h-4" />
                  HTML
                </button>
                <button onClick={() => setEditMode(!editMode)} className={`p-2 rounded-lg ${editMode ? 'bg-primary text-white' : 'hover:bg-dark-border text-dark-muted'}`}>
                  {editMode ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Structure Summary */}
            {!editMode && (
              <div className="mb-4 p-3 bg-dark-bg rounded-lg">
                <h4 className="text-xs text-dark-muted mb-2">Structure détectée:</h4>
                <div className="flex flex-wrap gap-2">
                  {editedContent.match(/^# .+$/gm)?.map((h, i) => (
                    <span key={`h1-${i}`} className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                      H1: {h.replace('# ', '').substring(0, 30)}...
                    </span>
                  ))}
                  {editedContent.match(/^## .+$/gm)?.map((h, i) => (
                    <span key={`h2-${i}`} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                      H2: {h.replace('## ', '').substring(0, 25)}...
                    </span>
                  ))}
                </div>
              </div>
            )}

            {editMode ? (
              <textarea value={editedContent} onChange={(e) => setEditedContent(e.target.value)} className="w-full h-96 bg-dark-bg border border-dark-border rounded-lg p-4 text-white font-mono text-sm" />
            ) : (
              <div className="h-96 overflow-auto p-4 bg-dark-bg rounded-lg text-sm text-white prose prose-invert max-w-none">
                {editedContent.split('\n').map((line, idx) => {
                  // Clean line: remove ** and * for display
                  const cleanLine = (text) => text
                    .replace(/\*\*(.+?)\*\*/g, '$1')
                    .replace(/\*(.+?)\*/g, '$1');

                  if (line.startsWith('# ')) return <h1 key={idx} className="text-xl font-bold text-purple-400 mt-4 mb-2">{cleanLine(line.replace('# ', ''))}</h1>;
                  if (line.startsWith('## ')) return <h2 key={idx} className="text-lg font-semibold text-blue-400 mt-3 mb-2">{cleanLine(line.replace('## ', ''))}</h2>;
                  if (line.startsWith('### ')) return <h3 key={idx} className="text-base font-medium text-green-400 mt-2 mb-1">{cleanLine(line.replace('### ', ''))}</h3>;
                  if (line.startsWith('- ')) return <li key={idx} className="ml-4 text-dark-text">{cleanLine(line.replace('- ', ''))}</li>;
                  if (line.match(/^\d+\. /)) return <li key={idx} className="ml-4 text-dark-text list-decimal">{cleanLine(line.replace(/^\d+\. /, ''))}</li>;
                  if (line.includes('[LIEN:')) return <p key={idx} className="text-info bg-info/10 px-2 py-1 rounded my-1">{line}</p>;
                  if (line.trim() === '') return <br key={idx} />;
                  return <p key={idx} className="text-dark-text my-1">{cleanLine(line)}</p>;
                })}
              </div>
            )}
          </Card>

          {/* Schemas JSON-LD */}
          {finalResult.metadata.schemas?.length > 0 && (
            <Card className="p-4">
              <h3 className="text-sm font-medium text-dark-muted mb-3 flex items-center gap-2">
                <FileCode className="w-4 h-4" />
                Schemas JSON-LD ({finalResult.metadata.schemas.length})
              </h3>
              <div className="space-y-2">
                {finalResult.metadata.schemas.map((schema, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-dark-bg rounded">
                    <span className="text-cyan-400">{schema.type}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(schema.schema, null, 2));
                      }}
                      className="text-xs text-dark-muted hover:text-white flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      Copier
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}

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

      {/* Clarification Modal */}
      {showClarification && clarificationData && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-warning/20">
                <MessageCircle className="w-6 h-6 text-warning" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Avant de commencer...</h2>
                <p className="text-sm text-dark-muted">Quelques informations manquent ou nécessitent confirmation</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {clarificationData.missingInfo.noDirection && (
                <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                  <div className="flex items-center gap-2 text-warning text-sm font-medium mb-1">
                    <AlertTriangle className="w-4 h-4" />
                    Pas de directives SEO Director
                  </div>
                  <p className="text-xs text-dark-muted">
                    Le SEO Director n'a pas encore analysé ce site. Les contenus seront créés sans orientation stratégique.
                  </p>
                </div>
              )}

              {clarificationData.missingInfo.noCompetitors && (
                <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                  <div className="flex items-center gap-2 text-warning text-sm font-medium mb-1">
                    <AlertTriangle className="w-4 h-4" />
                    Pas de concurrents analysés
                  </div>
                  <p className="text-xs text-dark-muted">
                    Sans analyse concurrentielle, le contenu ne pourra pas se différencier efficacement.
                  </p>
                </div>
              )}

              {clarificationData.missingInfo.noPaa && (
                <div className="p-3 bg-info/10 border border-info/30 rounded-lg">
                  <div className="flex items-center gap-2 text-info text-sm font-medium mb-1">
                    <HelpCircle className="w-4 h-4" />
                    Pas de PAA existantes
                  </div>
                  <p className="text-xs text-dark-muted">
                    L'agent PAA Analyst générera ses propres questions (moins précis que les vraies PAA Google).
                  </p>
                </div>
              )}

              <div className="p-3 bg-dark-bg rounded-lg">
                <div className="text-sm text-white mb-2">Pages à créer ({clarificationData.pages.length})</div>
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                  {clarificationData.pages.map((p, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-0.5 rounded text-xs ${
                        p.type === 'pilier' ? 'bg-purple-500/20 text-purple-400' :
                        p.type === 'fille' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-green-500/20 text-green-400'
                      }`}
                    >
                      {p.keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowClarification(false);
                  setClarificationData(null);
                }}
                className="flex-1 px-4 py-2 bg-dark-border text-white rounded-lg hover:bg-dark-bg"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  setShowClarification(false);
                  // Start with first selected page
                  if (clarificationData.pages.length > 0) {
                    const firstPage = clarificationData.pages[0];
                    selectPage(firstPage.type, firstPage.pilierKeyword, firstPage);
                  }
                }}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium"
              >
                Continuer quand même
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
