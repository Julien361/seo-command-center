import { useState, useEffect } from 'react';
import { FileText, Plus, Copy, Check, Download, Trash2, Edit2, Target, List, Clock, ChevronDown, ChevronRight, Sparkles, RefreshCw } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { sitesApi, supabase } from '../../lib/supabase';

// Brief status
const statusConfig = {
  draft: { label: 'Brouillon', color: 'bg-dark-muted' },
  ready: { label: 'Pret', color: 'bg-success' },
  in_use: { label: 'En cours', color: 'bg-warning' },
  completed: { label: 'Termine', color: 'bg-primary' },
};

// Brief card
function BriefCard({ brief, onView, onEdit, onDelete, onDuplicate }) {
  const status = statusConfig[brief.status] || statusConfig.draft;

  return (
    <Card className="p-4 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => onView(brief)}>
      <div className="flex items-start justify-between mb-3">
        <Badge variant={brief.status === 'ready' ? 'success' : brief.status === 'in_use' ? 'warning' : 'secondary'} size="sm">
          {status.label}
        </Badge>
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <button onClick={() => onDuplicate(brief)} className="p-1.5 hover:bg-dark-border rounded text-dark-muted hover:text-white">
            <Copy className="w-4 h-4" />
          </button>
          <button onClick={() => onEdit(brief)} className="p-1.5 hover:bg-dark-border rounded text-dark-muted hover:text-white">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(brief.id)} className="p-1.5 hover:bg-dark-border rounded text-dark-muted hover:text-danger">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <h4 className="text-white font-medium mb-2 line-clamp-2">{brief.title}</h4>

      <div className="flex items-center gap-2 text-xs text-dark-muted mb-3">
        <Target className="w-3 h-3" />
        <span className="text-primary">{brief.main_keyword}</span>
      </div>

      <div className="flex items-center justify-between text-xs text-dark-muted">
        <span>{brief.sites?.mcp_alias || 'Non assigne'}</span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(brief.created_at).toLocaleDateString('fr-FR')}
        </span>
      </div>
    </Card>
  );
}

// Brief detail/view modal
function BriefViewModal({ brief, onClose, onEdit }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = generateBriefText(brief);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = generateBriefText(brief);
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brief-${brief.main_keyword?.replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-auto py-8" onClick={onClose}>
      <Card className="w-full max-w-3xl p-6 my-auto max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-white">{brief.title}</h3>
            <p className="text-dark-muted mt-1">Keyword: <span className="text-primary">{brief.main_keyword}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleCopy}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
            <Button variant="secondary" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4" />
            </Button>
            <Button size="sm" onClick={() => onEdit(brief)}>
              <Edit2 className="w-4 h-4 mr-1" />
              Modifier
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Meta info */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-dark-border/30 rounded-lg">
              <p className="text-xs text-dark-muted mb-1">Longueur cible</p>
              <p className="text-white font-medium">{brief.target_word_count || 1500} mots</p>
            </div>
            <div className="p-3 bg-dark-border/30 rounded-lg">
              <p className="text-xs text-dark-muted mb-1">Intent</p>
              <p className="text-white font-medium capitalize">{brief.search_intent || 'Informationnel'}</p>
            </div>
            <div className="p-3 bg-dark-border/30 rounded-lg">
              <p className="text-xs text-dark-muted mb-1">Type de contenu</p>
              <p className="text-white font-medium">{brief.content_type || 'Article'}</p>
            </div>
          </div>

          {/* Title suggestions */}
          {brief.title_suggestions && (
            <div>
              <h4 className="text-sm font-medium text-white mb-2">Suggestions de titres (H1)</h4>
              <ul className="space-y-1">
                {brief.title_suggestions.split('\n').filter(t => t.trim()).map((title, i) => (
                  <li key={i} className="text-dark-muted text-sm flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {title}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Structure */}
          {brief.structure && (
            <div>
              <h4 className="text-sm font-medium text-white mb-2">Structure recommandee</h4>
              <div className="p-4 bg-dark-bg rounded-lg">
                <pre className="text-sm text-dark-muted whitespace-pre-wrap font-mono">{brief.structure}</pre>
              </div>
            </div>
          )}

          {/* Secondary keywords */}
          {brief.secondary_keywords && (
            <div>
              <h4 className="text-sm font-medium text-white mb-2">Keywords secondaires</h4>
              <div className="flex flex-wrap gap-2">
                {brief.secondary_keywords.split(',').map((kw, i) => (
                  <span key={i} className="px-2 py-1 bg-dark-border rounded text-sm text-dark-muted">
                    {kw.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Questions to answer */}
          {brief.questions && (
            <div>
              <h4 className="text-sm font-medium text-white mb-2">Questions a repondre (PAA)</h4>
              <ul className="space-y-1">
                {brief.questions.split('\n').filter(q => q.trim()).map((question, i) => (
                  <li key={i} className="text-dark-muted text-sm flex items-start gap-2">
                    <span className="text-info">?</span>
                    {question}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Competitors */}
          {brief.competitors && (
            <div>
              <h4 className="text-sm font-medium text-white mb-2">Concurrents a analyser</h4>
              <ul className="space-y-1">
                {brief.competitors.split('\n').filter(c => c.trim()).map((url, i) => (
                  <li key={i} className="text-primary text-sm truncate">
                    <a href={url.trim()} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {url.trim()}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Notes */}
          {brief.notes && (
            <div>
              <h4 className="text-sm font-medium text-white mb-2">Notes supplementaires</h4>
              <p className="text-dark-muted text-sm">{brief.notes}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// Generate brief text for copy/download
function generateBriefText(brief) {
  let text = `# Brief SEO: ${brief.title}\n\n`;
  text += `**Keyword principal:** ${brief.main_keyword}\n`;
  text += `**Longueur cible:** ${brief.target_word_count || 1500} mots\n`;
  text += `**Intent:** ${brief.search_intent || 'Informationnel'}\n`;
  text += `**Type:** ${brief.content_type || 'Article'}\n\n`;

  if (brief.title_suggestions) {
    text += `## Suggestions de titres\n${brief.title_suggestions}\n\n`;
  }
  if (brief.structure) {
    text += `## Structure\n${brief.structure}\n\n`;
  }
  if (brief.secondary_keywords) {
    text += `## Keywords secondaires\n${brief.secondary_keywords}\n\n`;
  }
  if (brief.questions) {
    text += `## Questions PAA\n${brief.questions}\n\n`;
  }
  if (brief.competitors) {
    text += `## Concurrents\n${brief.competitors}\n\n`;
  }
  if (brief.notes) {
    text += `## Notes\n${brief.notes}\n`;
  }

  return text;
}

// Brief form modal
function BriefFormModal({ brief, sites, onClose, onSave, onGenerate }) {
  const [formData, setFormData] = useState({
    site_id: brief?.site_id || '',
    title: brief?.title || '',
    main_keyword: brief?.main_keyword || '',
    secondary_keywords: brief?.secondary_keywords || '',
    search_intent: brief?.search_intent || 'informational',
    content_type: brief?.content_type || 'article',
    target_word_count: brief?.target_word_count || 1500,
    title_suggestions: brief?.title_suggestions || '',
    structure: brief?.structure || '',
    questions: brief?.questions || '',
    competitors: brief?.competitors || '',
    notes: brief?.notes || '',
    status: brief?.status || 'draft',
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.main_keyword) return;
    onSave({ ...brief, ...formData });
  };

  const handleGenerate = async () => {
    if (!formData.main_keyword) {
      alert('Entrez d\'abord le keyword principal');
      return;
    }
    setIsGenerating(true);
    // TODO: Call n8n workflow to generate brief content
    setTimeout(() => {
      setFormData({
        ...formData,
        title: formData.title || `Guide complet: ${formData.main_keyword}`,
        title_suggestions: `Comment ${formData.main_keyword} : Guide complet 2025\n${formData.main_keyword.charAt(0).toUpperCase() + formData.main_keyword.slice(1)} : Tout ce que vous devez savoir\nLe guide ultime pour ${formData.main_keyword}`,
        structure: `H1: [Titre optimise]\n\nIntroduction (100-150 mots)\n- Accroche\n- Contexte\n- Promesse de valeur\n\nH2: Qu'est-ce que ${formData.main_keyword} ?\n- Definition\n- Contexte\n\nH2: Pourquoi ${formData.main_keyword} est important\n- Avantages\n- Statistiques\n\nH2: Comment ${formData.main_keyword} : etapes\n- H3: Etape 1\n- H3: Etape 2\n- H3: Etape 3\n\nH2: Conseils d'experts\n- Tips pratiques\n\nH2: FAQ\n- Questions PAA\n\nConclusion + CTA`,
        questions: `Qu'est-ce que ${formData.main_keyword} ?\nComment fonctionne ${formData.main_keyword} ?\nQuels sont les avantages de ${formData.main_keyword} ?\nCombien coute ${formData.main_keyword} ?`,
      });
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-auto py-8" onClick={onClose}>
      <Card className="w-full max-w-3xl p-6 my-auto max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">
            {brief ? 'Modifier le brief' : 'Nouveau brief SEO'}
          </h3>
          <Button variant="secondary" size="sm" onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-1" />
            )}
            Generer avec IA
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-dark-muted mb-1">Keyword principal *</label>
              <input
                type="text"
                value={formData.main_keyword}
                onChange={(e) => setFormData({ ...formData, main_keyword: e.target.value })}
                placeholder="Ex: maprimeadapt"
                className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-dark-muted mb-1">Site</label>
              <select
                value={formData.site_id}
                onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
              >
                <option value="">Aucun site</option>
                {sites.map(site => (
                  <option key={site.id} value={site.id}>{site.mcp_alias || site.domain}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-dark-muted mb-1">Titre du brief *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Article pilier MaPrimeAdapt"
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-dark-muted mb-1">Intent</label>
              <select
                value={formData.search_intent}
                onChange={(e) => setFormData({ ...formData, search_intent: e.target.value })}
                className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
              >
                <option value="informational">Informationnel</option>
                <option value="commercial">Commercial</option>
                <option value="transactional">Transactionnel</option>
                <option value="navigational">Navigationnel</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-dark-muted mb-1">Type de contenu</label>
              <select
                value={formData.content_type}
                onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
                className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
              >
                <option value="article">Article</option>
                <option value="guide">Guide complet</option>
                <option value="listicle">Listicle</option>
                <option value="comparison">Comparatif</option>
                <option value="tutorial">Tutoriel</option>
                <option value="faq">FAQ</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-dark-muted mb-1">Longueur cible</label>
              <input
                type="number"
                value={formData.target_word_count}
                onChange={(e) => setFormData({ ...formData, target_word_count: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-dark-muted mb-1">Suggestions de titres (un par ligne)</label>
            <textarea
              value={formData.title_suggestions}
              onChange={(e) => setFormData({ ...formData, title_suggestions: e.target.value })}
              rows={3}
              placeholder="Titre 1&#10;Titre 2&#10;Titre 3"
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white resize-none font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-dark-muted mb-1">Structure recommandee</label>
            <textarea
              value={formData.structure}
              onChange={(e) => setFormData({ ...formData, structure: e.target.value })}
              rows={8}
              placeholder="H1: Titre&#10;&#10;H2: Section 1&#10;- Point 1&#10;- Point 2&#10;&#10;H2: Section 2..."
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white resize-none font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-dark-muted mb-1">Keywords secondaires (separes par virgule)</label>
            <input
              type="text"
              value={formData.secondary_keywords}
              onChange={(e) => setFormData({ ...formData, secondary_keywords: e.target.value })}
              placeholder="keyword1, keyword2, keyword3"
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-dark-muted mb-1">Questions PAA (une par ligne)</label>
            <textarea
              value={formData.questions}
              onChange={(e) => setFormData({ ...formData, questions: e.target.value })}
              rows={4}
              placeholder="Question 1 ?&#10;Question 2 ?&#10;Question 3 ?"
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-dark-muted mb-1">URLs concurrents (une par ligne)</label>
            <textarea
              value={formData.competitors}
              onChange={(e) => setFormData({ ...formData, competitors: e.target.value })}
              rows={3}
              placeholder="https://concurrent1.com/page&#10;https://concurrent2.com/page"
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-dark-muted mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-dark-muted mb-1">Statut</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
            >
              {Object.entries(statusConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="secondary" onClick={onClose}>Annuler</Button>
            <Button type="submit">{brief ? 'Modifier' : 'Creer'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function Briefs() {
  const [briefs, setBriefs] = useState([]);
  const [sites, setSites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedBrief, setSelectedBrief] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSiteId, setSelectedSiteId] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const sitesData = await sitesApi.getAll();
      setSites(sitesData || []);

      // For now, briefs are stored in a simple way
      // In production, create a 'briefs' table
      const { data, error } = await supabase
        .from('content_ideas')
        .select('*, sites(mcp_alias, domain)')
        .eq('type', 'brief')
        .order('created_at', { ascending: false });

      if (!error) {
        setBriefs(data || []);
      }
    } catch (err) {
      console.error('Error loading briefs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (briefData) => {
    try {
      const saveData = {
        ...briefData,
        type: 'brief',
      };

      if (briefData.id) {
        const { error } = await supabase
          .from('content_ideas')
          .update(saveData)
          .eq('id', briefData.id);

        if (!error) {
          setBriefs(briefs.map(b => b.id === briefData.id ? { ...b, ...saveData } : b));
        }
      } else {
        const { data, error } = await supabase
          .from('content_ideas')
          .insert([saveData])
          .select('*, sites(mcp_alias, domain)')
          .single();

        if (!error && data) {
          setBriefs([data, ...briefs]);
        }
      }
    } catch (err) {
      console.error('Error saving brief:', err);
    }
    setShowFormModal(false);
    setSelectedBrief(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce brief ?')) return;

    try {
      const { error } = await supabase
        .from('content_ideas')
        .delete()
        .eq('id', id);

      if (!error) {
        setBriefs(briefs.filter(b => b.id !== id));
      }
    } catch (err) {
      console.error('Error deleting brief:', err);
    }
  };

  const handleDuplicate = async (brief) => {
    const newBrief = {
      ...brief,
      id: undefined,
      title: `${brief.title} (copie)`,
      status: 'draft',
      created_at: undefined,
    };
    await handleSave(newBrief);
  };

  // Filter
  const filteredBriefs = briefs.filter(b => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (selectedSiteId !== 'all' && b.site_id !== selectedSiteId) return false;
    return true;
  });

  // Stats
  const stats = {
    total: briefs.length,
    draft: briefs.filter(b => b.status === 'draft').length,
    ready: briefs.filter(b => b.status === 'ready').length,
    completed: briefs.filter(b => b.status === 'completed').length,
  };

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
          <h1 className="text-2xl font-bold text-white">Briefs SEO</h1>
          <p className="text-dark-muted mt-1">Creez des briefs de contenu optimises pour la Position 0</p>
        </div>
        <Button onClick={() => { setSelectedBrief(null); setShowFormModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau brief
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-sm text-dark-muted">Total briefs</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-dark-muted/10">
              <FileText className="w-5 h-5 text-dark-muted" />
            </div>
            <div>
              <div className="text-2xl font-bold text-dark-muted">{stats.draft}</div>
              <div className="text-sm text-dark-muted">Brouillons</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <FileText className="w-5 h-5 text-success" />
            </div>
            <div>
              <div className="text-2xl font-bold text-success">{stats.ready}</div>
              <div className="text-sm text-dark-muted">Prets</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info/10">
              <FileText className="w-5 h-5 text-info" />
            </div>
            <div>
              <div className="text-2xl font-bold text-info">{stats.completed}</div>
              <div className="text-sm text-dark-muted">Termines</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex gap-2">
            {['all', 'draft', 'ready', 'in_use', 'completed'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm ${statusFilter === status ? 'bg-primary text-white' : 'bg-dark-border text-dark-muted hover:text-white'}`}
              >
                {status === 'all' ? 'Tous' : statusConfig[status]?.label}
              </button>
            ))}
          </div>
          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
          >
            <option value="all">Tous les sites</option>
            {sites.map(site => (
              <option key={site.id} value={site.id}>{site.mcp_alias || site.domain}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Briefs grid */}
      {filteredBriefs.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-dark-muted mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Aucun brief</h3>
          <p className="text-dark-muted mb-6">Creez votre premier brief SEO</p>
          <Button onClick={() => { setSelectedBrief(null); setShowFormModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau brief
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filteredBriefs.map(brief => (
            <BriefCard
              key={brief.id}
              brief={brief}
              onView={(b) => { setSelectedBrief(b); setShowViewModal(true); }}
              onEdit={(b) => { setSelectedBrief(b); setShowFormModal(true); }}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showFormModal && (
        <BriefFormModal
          brief={selectedBrief}
          sites={sites}
          onClose={() => { setShowFormModal(false); setSelectedBrief(null); }}
          onSave={handleSave}
        />
      )}

      {showViewModal && selectedBrief && (
        <BriefViewModal
          brief={selectedBrief}
          onClose={() => { setShowViewModal(false); setSelectedBrief(null); }}
          onEdit={(b) => { setShowViewModal(false); setSelectedBrief(b); setShowFormModal(true); }}
        />
      )}
    </div>
  );
}
