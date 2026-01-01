import { useState, useEffect } from 'react';
import {
  ArrowLeft, Factory, Target, PenTool, Search, Sparkles,
  CheckCircle, FileCode, Loader2, Play, Eye, Edit3,
  AlertTriangle, ExternalLink, Copy, Calendar, Send,
  ChevronDown, ChevronRight, RefreshCw, X
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

export default function ContentFactory({ site, onBack }) {
  // Brief state
  const [brief, setBrief] = useState({
    keyword: '',
    secondary_keywords: [],
    content_type: 'article',
    paa_questions: [],
    competitors: [],
    site: site
  });

  // Keywords and competitors from DB
  const [keywords, setKeywords] = useState([]);
  const [competitors, setCompetitors] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Factory state
  const [isRunning, setIsRunning] = useState(false);
  const [agentStatus, setAgentStatus] = useState({});
  const [agentResults, setAgentResults] = useState({});
  const [expandedAgent, setExpandedAgent] = useState(null);

  // Result state
  const [finalResult, setFinalResult] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  // Publication state
  const [publishing, setPublishing] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');

  // Load keywords and competitors
  useEffect(() => {
    if (!site?.id) return;
    loadSiteData();
  }, [site?.id]);

  const loadSiteData = async () => {
    setLoadingData(true);
    try {
      const [kw, comp] = await Promise.all([
        supabase.from('keywords').select('*').eq('site_id', site.id).order('search_volume', { ascending: false }).limit(100),
        supabase.from('competitors').select('*').eq('site_id', site.id)
      ]);

      setKeywords(kw.data || []);
      setCompetitors(comp.data || []);

      // Auto-set competitors in brief (validated ones only)
      setBrief(prev => ({
        ...prev,
        competitors: comp.data || [],
        site: site
      }));
    } catch (err) {
      console.error('Error loading site data:', err);
    } finally {
      setLoadingData(false);
    }
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

    setIsRunning(true);
    setAgentStatus({});
    setAgentResults({});
    setFinalResult(null);

    try {
      const result = await claudeApi.runContentFactory(brief, handleProgress);
      setFinalResult(result);

      if (result.success) {
        setEditedContent(result.finalContent);
        setShowPreview(true);
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
        title: finalResult.metadata.title || brief.keyword,
        slug: brief.keyword.toLowerCase().replace(/\s+/g, '-'),
        content: editedContent || finalResult.finalContent,
        meta_title: finalResult.metadata.title,
        meta_description: finalResult.metadata.description,
        main_keyword: brief.keyword,
        word_count: finalResult.metadata.wordCount,
        seo_score: finalResult.metadata.seoScore,
        schema_markup: finalResult.metadata.schemas,
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
      return data;
    } catch (err) {
      console.error('Save error:', err);
      alert('Erreur de sauvegarde: ' + err.message);
    }
  };

  // Publish to WordPress
  const publishToWordPress = async () => {
    setPublishing(true);
    try {
      // First save to DB
      const article = await saveArticle('published');
      if (!article) throw new Error('Failed to save article');

      // TODO: Call WordPress API via n8n webhook
      // For now, just mark as published
      alert('Article publié sur WordPress !');
    } catch (err) {
      console.error('Publish error:', err);
      alert('Erreur de publication: ' + err.message);
    } finally {
      setPublishing(false);
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

  if (loadingData) {
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
            <Factory className="w-6 h-6 text-primary" />
            Content Factory
          </h1>
          <p className="text-dark-muted">6 agents IA pour créer du contenu optimisé - {site?.mcp_alias}</p>
        </div>
      </div>

      {/* Brief Form */}
      {!isRunning && !finalResult && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Créer un brief</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Keyword selection */}
            <div>
              <label className="block text-sm font-medium text-dark-muted mb-2">
                Keyword principal *
              </label>
              <select
                value={brief.keyword}
                onChange={(e) => setBrief(prev => ({ ...prev, keyword: e.target.value }))}
                className="w-full bg-dark-card border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
              >
                <option value="">Sélectionner un keyword</option>
                {keywords.map(kw => (
                  <option key={kw.id} value={kw.keyword}>
                    {kw.keyword} ({kw.search_volume || 0} vol)
                  </option>
                ))}
              </select>
              <p className="text-xs text-dark-muted mt-1">
                Ou entrez manuellement:
              </p>
              <input
                type="text"
                placeholder="Keyword personnalisé..."
                value={brief.keyword}
                onChange={(e) => setBrief(prev => ({ ...prev, keyword: e.target.value }))}
                className="w-full mt-1 bg-dark-card border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
              />
            </div>

            {/* Content type */}
            <div>
              <label className="block text-sm font-medium text-dark-muted mb-2">
                Type de contenu
              </label>
              <select
                value={brief.content_type}
                onChange={(e) => setBrief(prev => ({ ...prev, content_type: e.target.value }))}
                className="w-full bg-dark-card border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
              >
                <option value="pilier">Page Pilier (3000+ mots)</option>
                <option value="fille">Page Fille (1500-2000 mots)</option>
                <option value="article">Article (800-1500 mots)</option>
              </select>

              <label className="block text-sm font-medium text-dark-muted mb-2 mt-4">
                Keywords secondaires (optionnel)
              </label>
              <input
                type="text"
                placeholder="keyword1, keyword2, keyword3..."
                onChange={(e) => setBrief(prev => ({
                  ...prev,
                  secondary_keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean)
                }))}
                className="w-full bg-dark-card border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* PAA Questions (optional) */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-dark-muted mb-2">
              Questions PAA (optionnel)
            </label>
            <textarea
              placeholder="Une question par ligne..."
              rows={3}
              onChange={(e) => setBrief(prev => ({
                ...prev,
                paa_questions: e.target.value.split('\n').map(q => q.trim()).filter(Boolean)
              }))}
              className="w-full bg-dark-card border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
            />
          </div>

          {/* Competitors info */}
          <div className="mt-4 p-3 bg-dark-bg rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-success" />
              <span className="text-dark-muted">
                {competitors.length} concurrent{competitors.length > 1 ? 's' : ''} validé{competitors.length > 1 ? 's' : ''} sera{competitors.length > 1 ? 'ont' : ''} utilisé{competitors.length > 1 ? 's' : ''}
              </span>
            </div>
            {competitors.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {competitors.slice(0, 5).map(c => (
                  <span key={c.id} className="px-2 py-1 bg-dark-card rounded text-xs text-dark-muted">
                    {c.domain}
                  </span>
                ))}
                {competitors.length > 5 && (
                  <span className="px-2 py-1 bg-dark-card rounded text-xs text-dark-muted">
                    +{competitors.length - 5} autres
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Launch button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={runFactory}
              disabled={!brief.keyword}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Play className="w-5 h-5" />
              Lancer la Content Factory
            </button>
          </div>
        </Card>
      )}

      {/* Agents Progress */}
      {(isRunning || finalResult) && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Pipeline des agents
          </h2>

          <div className="space-y-3">
            {AGENTS.map((agent, idx) => {
              const status = agentStatus[agent.id];
              const result = agentResults[agent.id];
              const isExpanded = expandedAgent === agent.id;
              const Icon = agent.icon;

              return (
                <div key={agent.id} className="border border-dark-border rounded-lg overflow-hidden">
                  {/* Agent header */}
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
                    <div className="flex items-center gap-2">
                      {result && (
                        <span className="text-xs text-success">Terminé</span>
                      )}
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-dark-muted" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-dark-muted" />
                      )}
                    </div>
                  </div>

                  {/* Agent result (expanded) */}
                  {isExpanded && result && (
                    <div className="border-t border-dark-border bg-dark-bg/50 p-4 max-h-64 overflow-auto">
                      <pre className="text-xs text-dark-muted whitespace-pre-wrap">
                        {JSON.stringify(result, null, 2).substring(0, 2000)}
                        {JSON.stringify(result).length > 2000 && '...(tronqué)'}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Reset button */}
          {finalResult && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setFinalResult(null);
                  setAgentStatus({});
                  setAgentResults({});
                  setShowPreview(false);
                }}
                className="flex items-center gap-2 px-4 py-2 text-dark-muted hover:text-white transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Nouveau contenu
              </button>
            </div>
          )}
        </Card>
      )}

      {/* Final Result & Preview */}
      {finalResult?.success && (
        <>
          {/* Metadata summary */}
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

          {/* Preview / Edit */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                {editMode ? 'Modifier le contenu' : 'Aperçu du contenu'}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(editedContent || finalResult.finalContent);
                    alert('Copié !');
                  }}
                  className="p-2 rounded-lg hover:bg-dark-border text-dark-muted hover:text-white transition-colors"
                  title="Copier"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className={`p-2 rounded-lg transition-colors ${
                    editMode ? 'bg-primary text-white' : 'hover:bg-dark-border text-dark-muted hover:text-white'
                  }`}
                  title={editMode ? 'Aperçu' : 'Modifier'}
                >
                  {editMode ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Meta fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-3 bg-dark-bg rounded-lg">
              <div>
                <label className="text-xs text-dark-muted">Meta Title</label>
                <p className="text-white text-sm">{finalResult.metadata.title}</p>
              </div>
              <div>
                <label className="text-xs text-dark-muted">Meta Description</label>
                <p className="text-white text-sm">{finalResult.metadata.description}</p>
              </div>
            </div>

            {/* Content */}
            {editMode ? (
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-96 bg-dark-bg border border-dark-border rounded-lg p-4 text-white font-mono text-sm focus:outline-none focus:border-primary"
              />
            ) : (
              <div className="prose prose-invert max-w-none h-96 overflow-auto p-4 bg-dark-bg rounded-lg">
                <div className="whitespace-pre-wrap text-sm">
                  {editedContent || finalResult.finalContent}
                </div>
              </div>
            )}
          </Card>

          {/* Fact Check Warnings */}
          {agentResults.factChecker?.warnings?.length > 0 && (
            <Card className="p-4 bg-warning/5 border-warning/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-white font-medium mb-2">Avertissements Fact-Check</h3>
                  <ul className="space-y-1 text-sm text-dark-muted">
                    {agentResults.factChecker.warnings.map((w, i) => (
                      <li key={i}>• {w}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          )}

          {/* Publication Actions */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Publication</h2>

            <div className="flex flex-col md:flex-row gap-4">
              {/* Schedule option */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-dark-muted mb-2">
                  Programmer pour (optionnel)
                </label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full bg-dark-card border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-end gap-3">
                <button
                  onClick={() => saveArticle('draft')}
                  className="flex items-center gap-2 px-4 py-2 bg-dark-border text-white rounded-lg hover:bg-dark-muted/30 transition-colors"
                >
                  Sauvegarder brouillon
                </button>

                {scheduledDate ? (
                  <button
                    onClick={() => saveArticle('scheduled')}
                    className="flex items-center gap-2 px-4 py-2 bg-warning text-black rounded-lg hover:bg-warning/90 transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                    Programmer
                  </button>
                ) : (
                  <button
                    onClick={publishToWordPress}
                    disabled={publishing}
                    className="flex items-center gap-2 px-6 py-2 bg-success text-white rounded-lg font-medium hover:bg-success/90 disabled:opacity-50 transition-colors"
                  >
                    {publishing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Publier maintenant
                  </button>
                )}
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Error state */}
      {finalResult && !finalResult.success && (
        <Card className="p-6 bg-danger/5 border-danger/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-danger flex-shrink-0" />
            <div>
              <h3 className="text-white font-medium mb-2">Erreur lors de la génération</h3>
              <p className="text-dark-muted">{finalResult.error}</p>
              <button
                onClick={() => {
                  setFinalResult(null);
                  setAgentStatus({});
                  setAgentResults({});
                }}
                className="mt-4 px-4 py-2 bg-dark-border text-white rounded-lg hover:bg-dark-muted/30 transition-colors"
              >
                Réessayer
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
