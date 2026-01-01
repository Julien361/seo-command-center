import { useState, useEffect } from 'react';
import {
  ArrowLeft, Factory, Target, PenTool, Search, Sparkles,
  CheckCircle, FileCode, Loader2, Play, Eye, Edit3,
  AlertTriangle, ExternalLink, Copy, Calendar, Send,
  ChevronDown, ChevronRight, RefreshCw, X, Plus, Link,
  FileText, Circle, HelpCircle, Trash2, ArrowRight
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

// Content types with icons
const CONTENT_TYPES = {
  pilier: { label: 'Page Mère (Pilier)', icon: Target, color: 'text-purple-500', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30', words: '3000+' },
  fille: { label: 'Page Fille', icon: Circle, color: 'text-blue-500', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30', words: '1500-2000' },
  article: { label: 'Article Support', icon: FileText, color: 'text-green-500', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30', words: '800-1500' }
};

export default function ContentFactory({ site, onBack }) {
  // Step state: 'architecture' | 'create' | 'running' | 'result'
  const [step, setStep] = useState('architecture');

  // Architecture state
  const [cocons, setCocons] = useState([]);
  const [selectedCocon, setSelectedCocon] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);
  const [loadingCocons, setLoadingCocons] = useState(true);

  // New cocon creation
  const [showNewCocon, setShowNewCocon] = useState(false);
  const [newCoconData, setNewCoconData] = useState({
    name: '',
    main_keyword: '',
    filles: ['', '', '', ''],
    paa_questions: ['', '', '', '', '']
  });

  // Brief state
  const [brief, setBrief] = useState({
    keyword: '',
    secondary_keywords: [],
    content_type: 'article',
    paa_questions: [],
    competitors: [],
    site: site,
    cocon_id: null,
    internal_links: []
  });

  // Keywords and competitors from DB
  const [competitors, setCompetitors] = useState([]);

  // Factory state
  const [isRunning, setIsRunning] = useState(false);
  const [agentStatus, setAgentStatus] = useState({});
  const [agentResults, setAgentResults] = useState({});
  const [expandedAgent, setExpandedAgent] = useState(null);

  // Result state
  const [finalResult, setFinalResult] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  // Publication state
  const [publishing, setPublishing] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');

  // Load cocons and competitors
  useEffect(() => {
    if (!site?.id) return;
    loadData();
  }, [site?.id]);

  const loadData = async () => {
    setLoadingCocons(true);
    try {
      const [coconsRes, compRes] = await Promise.all([
        supabase
          .from('semantic_clusters')
          .select('*, cluster_satellites(*), articles(*)')
          .eq('site_id', site.id)
          .order('created_at', { ascending: false }),
        supabase.from('competitors').select('*').eq('site_id', site.id)
      ]);

      // Enrich cocons with article status
      const enrichedCocons = (coconsRes.data || []).map(cocon => {
        const pillarArticle = cocon.articles?.find(a => a.content_type === 'pilier');
        const filleArticles = cocon.articles?.filter(a => a.content_type === 'fille') || [];
        const supportArticles = cocon.articles?.filter(a => a.content_type === 'article') || [];

        return {
          ...cocon,
          pillar_done: !!pillarArticle,
          pillar_article: pillarArticle,
          filles: cocon.cluster_satellites?.map((sat, idx) => ({
            id: sat.id,
            keyword: sat.keyword || `Fille ${idx + 1}`,
            article: filleArticles.find(a => a.main_keyword === sat.keyword),
            done: !!filleArticles.find(a => a.main_keyword === sat.keyword)
          })) || [],
          support_articles: supportArticles,
          paa_questions: cocon.paa_questions || []
        };
      });

      setCocons(enrichedCocons);
      setCompetitors(compRes.data || []);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoadingCocons(false);
    }
  };

  // Generate architecture with Claude
  const generateArchitecture = async () => {
    if (!newCoconData.main_keyword) {
      alert('Entrez un keyword principal');
      return;
    }

    setLoadingCocons(true);
    try {
      const prompt = `Tu es un expert SEO. Génère une architecture de cocon sémantique pour:
Keyword principal: ${newCoconData.main_keyword}
Site: ${site.mcp_alias}

Réponds en JSON:
{
  "name": "Nom du cocon",
  "main_keyword": "${newCoconData.main_keyword}",
  "filles": ["keyword fille 1", "keyword fille 2", "keyword fille 3", "keyword fille 4"],
  "paa_questions": ["Question PAA 1 ?", "Question PAA 2 ?", "Question PAA 3 ?", "Question PAA 4 ?", "Question PAA 5 ?"],
  "suggested_articles": ["article support 1", "article support 2", "article support 3"]
}`;

      const result = await claudeApi.generateKeywordSeeds({ ...site, seo_focus: [prompt] });
      // Parse if needed
      if (typeof result === 'object' && result.filles) {
        setNewCoconData(prev => ({
          ...prev,
          name: result.name || newCoconData.main_keyword,
          filles: result.filles || prev.filles,
          paa_questions: result.paa_questions || prev.paa_questions
        }));
      }
    } catch (err) {
      console.error('Error generating architecture:', err);
    } finally {
      setLoadingCocons(false);
    }
  };

  // Save new cocon to database
  const saveNewCocon = async () => {
    if (!newCoconData.main_keyword || !newCoconData.name) {
      alert('Remplissez le nom et le keyword principal');
      return;
    }

    try {
      // Create semantic cluster
      const { data: cluster, error: clusterError } = await supabase
        .from('semantic_clusters')
        .insert({
          site_id: site.id,
          name: newCoconData.name,
          main_keyword: newCoconData.main_keyword,
          paa_questions: newCoconData.paa_questions.filter(Boolean),
          status: 'draft'
        })
        .select()
        .single();

      if (clusterError) throw clusterError;

      // Create satellites (filles)
      const satellites = newCoconData.filles
        .filter(Boolean)
        .map(keyword => ({
          cluster_id: cluster.id,
          keyword,
          link_type: 'bidirectional'
        }));

      if (satellites.length > 0) {
        await supabase.from('cluster_satellites').insert(satellites);
      }

      // Reload and select new cocon
      await loadData();
      setShowNewCocon(false);
      setNewCoconData({ name: '', main_keyword: '', filles: ['', '', '', ''], paa_questions: ['', '', '', '', ''] });

    } catch (err) {
      console.error('Error saving cocon:', err);
      alert('Erreur: ' + err.message);
    }
  };

  // Select a page to create
  const selectPageToCreate = (cocon, type, keyword = null, paaQuestions = []) => {
    setSelectedCocon(cocon);
    setSelectedPage({ type, keyword: keyword || cocon.main_keyword });

    // Build internal links from existing pages in cocon
    const internalLinks = [];
    if (type !== 'pilier' && cocon.pillar_done) {
      internalLinks.push({
        type: 'pilier',
        keyword: cocon.main_keyword,
        url: cocon.pillar_article?.slug || ''
      });
    }
    cocon.filles?.filter(f => f.done).forEach(f => {
      if (f.keyword !== keyword) {
        internalLinks.push({
          type: 'fille',
          keyword: f.keyword,
          url: f.article?.slug || ''
        });
      }
    });

    setBrief({
      keyword: keyword || cocon.main_keyword,
      secondary_keywords: type === 'pilier' ? cocon.filles?.map(f => f.keyword) || [] : [],
      content_type: type,
      paa_questions: paaQuestions.length > 0 ? paaQuestions : cocon.paa_questions || [],
      competitors: competitors,
      site: site,
      cocon_id: cocon.id,
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
    if (!brief.keyword) {
      alert('Veuillez sélectionner un keyword');
      return;
    }

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

  // Save article to database
  const saveArticle = async (status = 'draft') => {
    if (!finalResult?.success) return;

    try {
      const articleData = {
        site_id: site.id,
        cluster_id: brief.cocon_id,
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
        scheduled_at: scheduledDate || null,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('articles')
        .insert(articleData)
        .select()
        .single();

      if (error) throw error;

      alert(`Article sauvegardé${status === 'scheduled' ? ' et programmé' : ''} !`);

      // Reload cocons to update status
      await loadData();
      setStep('architecture');
      setFinalResult(null);

      return data;
    } catch (err) {
      console.error('Save error:', err);
      alert('Erreur de sauvegarde: ' + err.message);
    }
  };

  // Render agent status icon
  const renderAgentIcon = (agentId) => {
    const status = agentStatus[agentId];
    if (status === 'running') {
      return <Loader2 className="w-5 h-5 animate-spin text-warning" />;
    }
    if (status === 'completed') {
      return <CheckCircle className="w-5 h-5 text-success" />;
    }
    return null;
  };

  // Loading state
  if (loadingCocons && step === 'architecture') {
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
            if (step === 'architecture') {
              onBack();
            } else {
              setStep('architecture');
              setFinalResult(null);
            }
          }}
          className="p-2 rounded-lg hover:bg-dark-border text-dark-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Factory className="w-6 h-6 text-primary" />
            Content Factory
          </h1>
          <p className="text-dark-muted">
            {step === 'architecture' && 'Choisissez ou créez un cocon sémantique'}
            {step === 'create' && `Création: ${CONTENT_TYPES[brief.content_type]?.label} - ${brief.keyword}`}
            {step === 'running' && 'Génération en cours...'}
            {step === 'result' && 'Contenu généré - Validation'}
          </p>
        </div>
      </div>

      {/* Step 1: Architecture */}
      {step === 'architecture' && (
        <>
          {/* Create new cocon */}
          <Card className="p-4">
            <button
              onClick={() => setShowNewCocon(!showNewCocon)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Créer un nouveau cocon</h3>
                  <p className="text-sm text-dark-muted">Définir une nouvelle architecture Mère/Filles/Articles</p>
                </div>
              </div>
              {showNewCocon ? <ChevronDown className="w-5 h-5 text-dark-muted" /> : <ChevronRight className="w-5 h-5 text-dark-muted" />}
            </button>

            {showNewCocon && (
              <div className="mt-4 pt-4 border-t border-dark-border space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-dark-muted mb-1">Nom du cocon</label>
                    <input
                      type="text"
                      value={newCoconData.name}
                      onChange={(e) => setNewCoconData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Assurance Chat"
                      className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-dark-muted mb-1">Keyword Mère (Pilier)</label>
                    <input
                      type="text"
                      value={newCoconData.main_keyword}
                      onChange={(e) => setNewCoconData(prev => ({ ...prev, main_keyword: e.target.value }))}
                      placeholder="Ex: assurance chat"
                      className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>

                {/* Filles */}
                <div>
                  <label className="block text-sm text-dark-muted mb-2">Pages Filles (4-6 recommandées)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {newCoconData.filles.map((fille, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Circle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <input
                          type="text"
                          value={fille}
                          onChange={(e) => {
                            const updated = [...newCoconData.filles];
                            updated[idx] = e.target.value;
                            setNewCoconData(prev => ({ ...prev, filles: updated }));
                          }}
                          placeholder={`Fille ${idx + 1}`}
                          className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-white text-sm"
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setNewCoconData(prev => ({ ...prev, filles: [...prev.filles, ''] }))}
                    className="mt-2 text-xs text-primary hover:text-primary/80"
                  >
                    + Ajouter une fille
                  </button>
                </div>

                {/* PAA Questions */}
                <div>
                  <label className="block text-sm text-dark-muted mb-2">
                    <HelpCircle className="w-4 h-4 inline mr-1" />
                    Questions PAA (People Also Ask)
                  </label>
                  <div className="space-y-2">
                    {newCoconData.paa_questions.map((paa, idx) => (
                      <input
                        key={idx}
                        type="text"
                        value={paa}
                        onChange={(e) => {
                          const updated = [...newCoconData.paa_questions];
                          updated[idx] = e.target.value;
                          setNewCoconData(prev => ({ ...prev, paa_questions: updated }));
                        }}
                        placeholder={`Question ${idx + 1} ?`}
                        className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-white text-sm"
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => setNewCoconData(prev => ({ ...prev, paa_questions: [...prev.paa_questions, ''] }))}
                    className="mt-2 text-xs text-primary hover:text-primary/80"
                  >
                    + Ajouter une question
                  </button>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowNewCocon(false)}
                    className="px-4 py-2 text-dark-muted hover:text-white"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={saveNewCocon}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                  >
                    Créer le cocon
                  </button>
                </div>
              </div>
            )}
          </Card>

          {/* Existing cocons */}
          {cocons.length === 0 ? (
            <Card className="p-8 text-center">
              <Target className="w-12 h-12 text-purple-500/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Aucun cocon sémantique</h3>
              <p className="text-dark-muted">Créez votre premier cocon pour commencer à générer du contenu structuré.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Cocons existants ({cocons.length})</h2>

              {cocons.map((cocon) => (
                <Card key={cocon.id} className="overflow-hidden">
                  {/* Cocon header */}
                  <div className="p-4 bg-gradient-to-r from-purple-500/10 to-transparent">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/20">
                          <Target className="w-6 h-6 text-purple-500" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{cocon.name}</h3>
                          <p className="text-sm text-purple-400">{cocon.main_keyword}</p>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-dark-muted">
                          {cocon.pillar_done ? '1' : '0'}/1 Mère • {cocon.filles?.filter(f => f.done).length || 0}/{cocon.filles?.length || 0} Filles
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Visual tree structure */}
                  <div className="p-4 space-y-3">
                    {/* Page Mère (Pilier) */}
                    <div
                      onClick={() => !cocon.pillar_done && selectPageToCreate(cocon, 'pilier')}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        cocon.pillar_done
                          ? 'bg-success/5 border-success/30'
                          : 'bg-purple-500/5 border-purple-500/30 cursor-pointer hover:bg-purple-500/10'
                      }`}
                    >
                      <Target className={`w-5 h-5 ${cocon.pillar_done ? 'text-success' : 'text-purple-500'}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">Page Mère</span>
                          <span className="text-xs text-dark-muted">3000+ mots</span>
                        </div>
                        <span className="text-sm text-purple-400">{cocon.main_keyword}</span>
                      </div>
                      {cocon.pillar_done ? (
                        <CheckCircle className="w-5 h-5 text-success" />
                      ) : (
                        <button className="px-3 py-1 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600">
                          Créer
                        </button>
                      )}
                    </div>

                    {/* Pages Filles */}
                    <div className="ml-6 space-y-2">
                      <div className="text-xs text-dark-muted uppercase flex items-center gap-2">
                        <div className="w-4 h-px bg-dark-border"></div>
                        Pages Filles ({cocon.filles?.length || 0})
                      </div>
                      {cocon.filles?.map((fille, idx) => (
                        <div
                          key={fille.id || idx}
                          onClick={() => !fille.done && selectPageToCreate(cocon, 'fille', fille.keyword)}
                          className={`flex items-center gap-3 p-2 rounded-lg border transition-all ${
                            fille.done
                              ? 'bg-success/5 border-success/20'
                              : 'bg-blue-500/5 border-blue-500/20 cursor-pointer hover:bg-blue-500/10'
                          }`}
                        >
                          <div className="w-4 h-px bg-blue-500/30"></div>
                          <Circle className={`w-4 h-4 ${fille.done ? 'text-success' : 'text-blue-500'}`} />
                          <span className={`flex-1 text-sm ${fille.done ? 'text-dark-muted' : 'text-white'}`}>
                            {fille.keyword}
                          </span>
                          <span className="text-xs text-dark-muted">1500-2000</span>
                          {fille.done ? (
                            <CheckCircle className="w-4 h-4 text-success" />
                          ) : (
                            <button className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">
                              Créer
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Articles Support */}
                    <div className="ml-6 mt-3">
                      <div
                        onClick={() => selectPageToCreate(cocon, 'article', '', cocon.paa_questions)}
                        className="flex items-center gap-3 p-2 rounded-lg border border-dashed border-green-500/30 bg-green-500/5 cursor-pointer hover:bg-green-500/10 transition-all"
                      >
                        <div className="w-4 h-px bg-green-500/30"></div>
                        <FileText className="w-4 h-4 text-green-500" />
                        <span className="flex-1 text-sm text-dark-muted">
                          + Ajouter un article support
                        </span>
                        <span className="text-xs text-dark-muted">800-1500</span>
                      </div>
                      {cocon.support_articles?.length > 0 && (
                        <div className="mt-2 ml-6 text-xs text-dark-muted">
                          {cocon.support_articles.length} article(s) créé(s)
                        </div>
                      )}
                    </div>

                    {/* PAA Questions */}
                    {cocon.paa_questions?.length > 0 && (
                      <div className="ml-6 mt-3 p-3 bg-dark-bg rounded-lg">
                        <div className="flex items-center gap-2 text-xs text-dark-muted mb-2">
                          <HelpCircle className="w-4 h-4" />
                          PAA Questions ({cocon.paa_questions.length})
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {cocon.paa_questions.slice(0, 3).map((q, idx) => (
                            <span key={idx} className="px-2 py-1 bg-dark-card rounded text-xs text-dark-muted">
                              {q.length > 40 ? q.substring(0, 40) + '...' : q}
                            </span>
                          ))}
                          {cocon.paa_questions.length > 3 && (
                            <span className="px-2 py-1 bg-dark-card rounded text-xs text-dark-muted">
                              +{cocon.paa_questions.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Step 2: Create Brief */}
      {step === 'create' && (
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
              <p className="text-dark-muted">{brief.keyword} • {CONTENT_TYPES[brief.content_type]?.words} mots</p>
            </div>
          </div>

          {/* Keyword edit */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-dark-muted mb-1">Keyword principal</label>
              <input
                type="text"
                value={brief.keyword}
                onChange={(e) => setBrief(prev => ({ ...prev, keyword: e.target.value }))}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-dark-muted mb-1">Keywords secondaires</label>
              <input
                type="text"
                value={brief.secondary_keywords.join(', ')}
                onChange={(e) => setBrief(prev => ({
                  ...prev,
                  secondary_keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean)
                }))}
                placeholder="Séparés par des virgules"
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>

          {/* PAA Questions */}
          <div className="mb-4">
            <label className="block text-sm text-dark-muted mb-2">
              <HelpCircle className="w-4 h-4 inline mr-1" />
              Questions PAA à intégrer
            </label>
            <div className="flex flex-wrap gap-2">
              {brief.paa_questions.map((q, idx) => (
                <span key={idx} className="flex items-center gap-1 px-2 py-1 bg-dark-bg rounded text-sm text-white">
                  {q.length > 50 ? q.substring(0, 50) + '...' : q}
                  <button
                    onClick={() => setBrief(prev => ({
                      ...prev,
                      paa_questions: prev.paa_questions.filter((_, i) => i !== idx)
                    }))}
                    className="text-dark-muted hover:text-danger ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Internal Links */}
          {brief.internal_links.length > 0 && (
            <div className="mb-4 p-3 bg-info/5 border border-info/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-info mb-2">
                <Link className="w-4 h-4" />
                Maillage interne suggéré
              </div>
              <div className="flex flex-wrap gap-2">
                {brief.internal_links.map((link, idx) => (
                  <span key={idx} className="px-2 py-1 bg-dark-bg rounded text-xs text-white flex items-center gap-1">
                    <ArrowRight className="w-3 h-3 text-info" />
                    {link.keyword}
                    <span className="text-dark-muted">({link.type})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Competitors */}
          <div className="mb-6 p-3 bg-dark-bg rounded-lg">
            <div className="flex items-center gap-2 text-sm text-dark-muted">
              <CheckCircle className="w-4 h-4 text-success" />
              {competitors.length} concurrent(s) validé(s) seront analysés
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <button
              onClick={() => setStep('architecture')}
              className="px-4 py-2 text-dark-muted hover:text-white"
            >
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

      {/* Step 3: Running */}
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
                    ) : (
                      'En attente...'
                    )}
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
                    className={`p-4 flex items-center justify-between cursor-pointer hover:bg-dark-border/30 transition-colors ${
                      status === 'running' ? 'bg-warning/5' : status === 'completed' ? 'bg-success/5' : ''
                    }`}
                    onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
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
                    {result && (
                      isExpanded ? <ChevronDown className="w-5 h-5 text-dark-muted" /> : <ChevronRight className="w-5 h-5 text-dark-muted" />
                    )}
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

      {/* Step 4: Result */}
      {step === 'result' && finalResult?.success && (
        <>
          {/* Metrics */}
          <Card className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
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

          {/* Content Preview */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                {editMode ? 'Modifier' : 'Aperçu'}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(editedContent || finalResult.finalContent);
                    alert('Copié !');
                  }}
                  className="p-2 rounded-lg hover:bg-dark-border text-dark-muted"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className={`p-2 rounded-lg ${editMode ? 'bg-primary text-white' : 'hover:bg-dark-border text-dark-muted'}`}
                >
                  {editMode ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-dark-bg rounded-lg">
              <div>
                <label className="text-xs text-dark-muted">Meta Title</label>
                <p className="text-white text-sm">{finalResult.metadata.title}</p>
              </div>
              <div>
                <label className="text-xs text-dark-muted">Meta Description</label>
                <p className="text-white text-sm">{finalResult.metadata.description}</p>
              </div>
            </div>

            {editMode ? (
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-96 bg-dark-bg border border-dark-border rounded-lg p-4 text-white font-mono text-sm"
              />
            ) : (
              <div className="h-96 overflow-auto p-4 bg-dark-bg rounded-lg">
                <div className="whitespace-pre-wrap text-sm text-white">
                  {editedContent || finalResult.finalContent}
                </div>
              </div>
            )}
          </Card>

          {/* Publication */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Publication</h2>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm text-dark-muted mb-2">Programmer (optionnel)</label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full bg-dark-card border border-dark-border rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div className="flex items-end gap-3">
                <button
                  onClick={() => saveArticle('draft')}
                  className="px-4 py-2 bg-dark-border text-white rounded-lg hover:bg-dark-muted/30"
                >
                  Brouillon
                </button>
                <button
                  onClick={() => saveArticle(scheduledDate ? 'scheduled' : 'published')}
                  disabled={publishing}
                  className="flex items-center gap-2 px-6 py-2 bg-success text-white rounded-lg font-medium hover:bg-success/90 disabled:opacity-50"
                >
                  {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {scheduledDate ? 'Programmer' : 'Sauvegarder'}
                </button>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
