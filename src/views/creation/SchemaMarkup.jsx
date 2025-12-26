import { useState, useEffect } from 'react';
import { Code, Copy, Check, Plus, Trash2, ChevronDown, ChevronRight, FileJson, HelpCircle, ExternalLink } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { sitesApi, supabase } from '../../lib/supabase';

// Schema types configuration
const schemaTypes = {
  faq: {
    label: 'FAQ',
    description: 'Questions/Reponses pour featured snippets',
    icon: '❓',
    fields: ['questions'],
  },
  howto: {
    label: 'HowTo',
    description: 'Guide etape par etape',
    icon: '📝',
    fields: ['name', 'description', 'steps', 'totalTime'],
  },
  article: {
    label: 'Article',
    description: 'Article de blog ou news',
    icon: '📰',
    fields: ['headline', 'description', 'author', 'datePublished', 'image'],
  },
  localbusiness: {
    label: 'LocalBusiness',
    description: 'Etablissement local',
    icon: '🏢',
    fields: ['name', 'address', 'phone', 'openingHours', 'geo'],
  },
  product: {
    label: 'Product',
    description: 'Produit avec prix et avis',
    icon: '🛍️',
    fields: ['name', 'description', 'price', 'rating', 'availability'],
  },
  breadcrumb: {
    label: 'BreadcrumbList',
    description: 'Fil d\'Ariane',
    icon: '🔗',
    fields: ['items'],
  },
  organization: {
    label: 'Organization',
    description: 'Informations entreprise',
    icon: '🏛️',
    fields: ['name', 'url', 'logo', 'sameAs'],
  },
  review: {
    label: 'Review',
    description: 'Avis client',
    icon: '⭐',
    fields: ['itemReviewed', 'author', 'rating', 'reviewBody'],
  },
};

// FAQ Builder
function FAQBuilder({ data, onChange }) {
  const [questions, setQuestions] = useState(data?.questions || [{ question: '', answer: '' }]);

  const updateQuestions = (newQuestions) => {
    setQuestions(newQuestions);
    onChange({ questions: newQuestions });
  };

  const addQuestion = () => {
    updateQuestions([...questions, { question: '', answer: '' }]);
  };

  const removeQuestion = (index) => {
    updateQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    updateQuestions(updated);
  };

  return (
    <div className="space-y-4">
      {questions.map((q, i) => (
        <div key={i} className="p-4 bg-dark-border/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-dark-muted">Question {i + 1}</span>
            {questions.length > 1 && (
              <button onClick={() => removeQuestion(i)} className="text-dark-muted hover:text-danger">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <input
            type="text"
            value={q.question}
            onChange={(e) => updateQuestion(i, 'question', e.target.value)}
            placeholder="Question..."
            className="w-full px-3 py-2 mb-2 bg-dark-border border border-dark-border rounded text-white placeholder-dark-muted"
          />
          <textarea
            value={q.answer}
            onChange={(e) => updateQuestion(i, 'answer', e.target.value)}
            placeholder="Reponse..."
            rows={2}
            className="w-full px-3 py-2 bg-dark-border border border-dark-border rounded text-white placeholder-dark-muted resize-none"
          />
        </div>
      ))}
      <Button variant="secondary" size="sm" onClick={addQuestion}>
        <Plus className="w-4 h-4 mr-1" />
        Ajouter une question
      </Button>
    </div>
  );
}

// HowTo Builder
function HowToBuilder({ data, onChange }) {
  const [formData, setFormData] = useState({
    name: data?.name || '',
    description: data?.description || '',
    totalTime: data?.totalTime || '',
    steps: data?.steps || [{ name: '', text: '' }],
  });

  const update = (field, value) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange(updated);
  };

  const addStep = () => {
    update('steps', [...formData.steps, { name: '', text: '' }]);
  };

  const removeStep = (index) => {
    update('steps', formData.steps.filter((_, i) => i !== index));
  };

  const updateStep = (index, field, value) => {
    const updated = [...formData.steps];
    updated[index][field] = value;
    update('steps', updated);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-dark-muted mb-1">Titre du guide *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => update('name', e.target.value)}
          placeholder="Comment faire..."
          className="w-full px-3 py-2 bg-dark-border border border-dark-border rounded text-white"
        />
      </div>
      <div>
        <label className="block text-sm text-dark-muted mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => update('description', e.target.value)}
          rows={2}
          className="w-full px-3 py-2 bg-dark-border border border-dark-border rounded text-white resize-none"
        />
      </div>
      <div>
        <label className="block text-sm text-dark-muted mb-1">Duree totale (ex: PT30M)</label>
        <input
          type="text"
          value={formData.totalTime}
          onChange={(e) => update('totalTime', e.target.value)}
          placeholder="PT30M pour 30 minutes"
          className="w-full px-3 py-2 bg-dark-border border border-dark-border rounded text-white"
        />
      </div>
      <div>
        <label className="block text-sm text-dark-muted mb-2">Etapes</label>
        {formData.steps.map((step, i) => (
          <div key={i} className="p-3 bg-dark-border/30 rounded-lg mb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-primary">Etape {i + 1}</span>
              {formData.steps.length > 1 && (
                <button onClick={() => removeStep(i)} className="text-dark-muted hover:text-danger">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <input
              type="text"
              value={step.name}
              onChange={(e) => updateStep(i, 'name', e.target.value)}
              placeholder="Titre de l'etape"
              className="w-full px-3 py-2 mb-2 bg-dark-border border border-dark-border rounded text-white text-sm"
            />
            <textarea
              value={step.text}
              onChange={(e) => updateStep(i, 'text', e.target.value)}
              placeholder="Description de l'etape"
              rows={2}
              className="w-full px-3 py-2 bg-dark-border border border-dark-border rounded text-white text-sm resize-none"
            />
          </div>
        ))}
        <Button variant="secondary" size="sm" onClick={addStep}>
          <Plus className="w-4 h-4 mr-1" />
          Ajouter une etape
        </Button>
      </div>
    </div>
  );
}

// Article Builder
function ArticleBuilder({ data, onChange }) {
  const [formData, setFormData] = useState({
    headline: data?.headline || '',
    description: data?.description || '',
    author: data?.author || '',
    datePublished: data?.datePublished || new Date().toISOString().split('T')[0],
    image: data?.image || '',
  });

  const update = (field, value) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-dark-muted mb-1">Titre de l'article *</label>
        <input
          type="text"
          value={formData.headline}
          onChange={(e) => update('headline', e.target.value)}
          className="w-full px-3 py-2 bg-dark-border border border-dark-border rounded text-white"
        />
      </div>
      <div>
        <label className="block text-sm text-dark-muted mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => update('description', e.target.value)}
          rows={2}
          className="w-full px-3 py-2 bg-dark-border border border-dark-border rounded text-white resize-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-dark-muted mb-1">Auteur</label>
          <input
            type="text"
            value={formData.author}
            onChange={(e) => update('author', e.target.value)}
            className="w-full px-3 py-2 bg-dark-border border border-dark-border rounded text-white"
          />
        </div>
        <div>
          <label className="block text-sm text-dark-muted mb-1">Date de publication</label>
          <input
            type="date"
            value={formData.datePublished}
            onChange={(e) => update('datePublished', e.target.value)}
            className="w-full px-3 py-2 bg-dark-border border border-dark-border rounded text-white"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm text-dark-muted mb-1">URL de l'image</label>
        <input
          type="url"
          value={formData.image}
          onChange={(e) => update('image', e.target.value)}
          placeholder="https://..."
          className="w-full px-3 py-2 bg-dark-border border border-dark-border rounded text-white"
        />
      </div>
    </div>
  );
}

// Generic form for other types
function GenericBuilder({ schemaType, data, onChange }) {
  const [formData, setFormData] = useState(data || {});

  const update = (field, value) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange(updated);
  };

  const fields = schemaTypes[schemaType]?.fields || [];

  return (
    <div className="space-y-4">
      {fields.map(field => (
        <div key={field}>
          <label className="block text-sm text-dark-muted mb-1 capitalize">{field}</label>
          <input
            type="text"
            value={formData[field] || ''}
            onChange={(e) => update(field, e.target.value)}
            className="w-full px-3 py-2 bg-dark-border border border-dark-border rounded text-white"
          />
        </div>
      ))}
    </div>
  );
}

// Generate JSON-LD
function generateJsonLd(type, data) {
  const base = {
    '@context': 'https://schema.org',
  };

  switch (type) {
    case 'faq':
      return {
        ...base,
        '@type': 'FAQPage',
        mainEntity: (data.questions || []).filter(q => q.question && q.answer).map(q => ({
          '@type': 'Question',
          name: q.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: q.answer,
          },
        })),
      };

    case 'howto':
      return {
        ...base,
        '@type': 'HowTo',
        name: data.name,
        description: data.description,
        totalTime: data.totalTime,
        step: (data.steps || []).filter(s => s.name || s.text).map((s, i) => ({
          '@type': 'HowToStep',
          position: i + 1,
          name: s.name,
          text: s.text,
        })),
      };

    case 'article':
      return {
        ...base,
        '@type': 'Article',
        headline: data.headline,
        description: data.description,
        author: data.author ? { '@type': 'Person', name: data.author } : undefined,
        datePublished: data.datePublished,
        image: data.image,
      };

    case 'localbusiness':
      return {
        ...base,
        '@type': 'LocalBusiness',
        name: data.name,
        address: data.address,
        telephone: data.phone,
        openingHours: data.openingHours,
      };

    case 'organization':
      return {
        ...base,
        '@type': 'Organization',
        name: data.name,
        url: data.url,
        logo: data.logo,
        sameAs: data.sameAs?.split(',').map(s => s.trim()),
      };

    default:
      return { ...base, '@type': schemaTypes[type]?.label || type, ...data };
  }
}

// Code preview with copy
function CodePreview({ code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <pre className="p-4 bg-dark-bg rounded-lg overflow-x-auto text-sm text-green-400 font-mono">
        {code}
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-2 bg-dark-border rounded hover:bg-dark-muted transition-colors"
      >
        {copied ? (
          <Check className="w-4 h-4 text-success" />
        ) : (
          <Copy className="w-4 h-4 text-dark-muted" />
        )}
      </button>
    </div>
  );
}

// Saved schema card
function SavedSchemaCard({ schema, onDelete, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  const config = schemaTypes[schema.schema_type] || {};

  return (
    <Card className="overflow-hidden">
      <div
        className="p-4 cursor-pointer hover:bg-dark-border/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{config.icon || '📄'}</span>
            <div>
              <h4 className="text-white font-medium">{schema.name || config.label}</h4>
              <p className="text-sm text-dark-muted">{schema.sites?.mcp_alias || schema.sites?.domain}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" size="sm">{config.label}</Badge>
            {expanded ? <ChevronDown className="w-4 h-4 text-dark-muted" /> : <ChevronRight className="w-4 h-4 text-dark-muted" />}
          </div>
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 border-t border-dark-border pt-4">
          <CodePreview code={JSON.stringify(JSON.parse(schema.json_ld || '{}'), null, 2)} />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" size="sm" onClick={() => onEdit(schema)}>
              Modifier
            </Button>
            <Button variant="danger" size="sm" onClick={() => onDelete(schema.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function SchemaMarkup() {
  const [schemas, setSchemas] = useState([]);
  const [sites, setSites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('faq');
  const [formData, setFormData] = useState({});
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [schemaName, setSchemaName] = useState('');
  const [showBuilder, setShowBuilder] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const sitesData = await sitesApi.getAll();
      setSites(sitesData || []);

      const { data, error } = await supabase
        .from('schema_markups')
        .select('*, sites(mcp_alias, domain)')
        .order('created_at', { ascending: false });

      if (!error) {
        setSchemas(data || []);
      }
    } catch (err) {
      console.error('Error loading schemas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedSiteId) {
      alert('Selectionnez un site');
      return;
    }

    const jsonLd = generateJsonLd(selectedType, formData);

    try {
      const { data, error } = await supabase
        .from('schema_markups')
        .insert([{
          site_id: selectedSiteId,
          name: schemaName || schemaTypes[selectedType].label,
          schema_type: selectedType,
          json_ld: JSON.stringify(jsonLd),
        }])
        .select('*, sites(mcp_alias, domain)')
        .single();

      if (!error && data) {
        setSchemas([data, ...schemas]);
        setFormData({});
        setSchemaName('');
        setShowBuilder(false);
      }
    } catch (err) {
      console.error('Error saving schema:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce schema ?')) return;

    try {
      const { error } = await supabase
        .from('schema_markups')
        .delete()
        .eq('id', id);

      if (!error) {
        setSchemas(schemas.filter(s => s.id !== id));
      }
    } catch (err) {
      console.error('Error deleting schema:', err);
    }
  };

  const generatedCode = JSON.stringify(generateJsonLd(selectedType, formData), null, 2);

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
          <h1 className="text-2xl font-bold text-white">Schema Markup</h1>
          <p className="text-dark-muted mt-1">Generez des donnees structurees JSON-LD</p>
        </div>
        <Button onClick={() => setShowBuilder(!showBuilder)}>
          {showBuilder ? 'Fermer' : <><Plus className="w-4 h-4 mr-2" />Nouveau schema</>}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {Object.entries(schemaTypes).slice(0, 4).map(([key, config]) => (
          <Card key={key} className="p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{config.icon}</span>
              <div>
                <div className="text-lg font-bold text-white">
                  {schemas.filter(s => s.schema_type === key).length}
                </div>
                <div className="text-sm text-dark-muted">{config.label}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Builder */}
      {showBuilder && (
        <div className="grid grid-cols-2 gap-6">
          {/* Form */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Configurer le schema</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-dark-muted mb-1">Type de schema</label>
                <select
                  value={selectedType}
                  onChange={(e) => { setSelectedType(e.target.value); setFormData({}); }}
                  className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
                >
                  {Object.entries(schemaTypes).map(([key, config]) => (
                    <option key={key} value={key}>{config.icon} {config.label} - {config.description}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-dark-muted mb-1">Site *</label>
                  <select
                    value={selectedSiteId}
                    onChange={(e) => setSelectedSiteId(e.target.value)}
                    className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
                  >
                    <option value="">Selectionner...</option>
                    {sites.map(site => (
                      <option key={site.id} value={site.id}>{site.mcp_alias || site.domain}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-dark-muted mb-1">Nom (optionnel)</label>
                  <input
                    type="text"
                    value={schemaName}
                    onChange={(e) => setSchemaName(e.target.value)}
                    placeholder="Mon schema FAQ"
                    className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="border-t border-dark-border pt-4">
                {selectedType === 'faq' && <FAQBuilder data={formData} onChange={setFormData} />}
                {selectedType === 'howto' && <HowToBuilder data={formData} onChange={setFormData} />}
                {selectedType === 'article' && <ArticleBuilder data={formData} onChange={setFormData} />}
                {!['faq', 'howto', 'article'].includes(selectedType) && (
                  <GenericBuilder schemaType={selectedType} data={formData} onChange={setFormData} />
                )}
              </div>
            </div>
          </Card>

          {/* Preview */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Apercu JSON-LD</h3>
              <a
                href="https://validator.schema.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                Valider <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <CodePreview code={generatedCode} />

            <div className="mt-4 p-3 bg-info/10 rounded-lg">
              <p className="text-sm text-info flex items-start gap-2">
                <HelpCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                Copiez ce code et ajoutez-le dans la section &lt;head&gt; de votre page avec une balise &lt;script type="application/ld+json"&gt;
              </p>
            </div>

            <div className="flex justify-end mt-4">
              <Button onClick={handleSave} disabled={!selectedSiteId}>
                Enregistrer le schema
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Saved schemas */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Schemas enregistres</h3>
        {schemas.length === 0 ? (
          <Card className="p-12 text-center">
            <FileJson className="w-12 h-12 mx-auto text-dark-muted mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Aucun schema</h3>
            <p className="text-dark-muted mb-6">Creez votre premier schema JSON-LD</p>
            <Button onClick={() => setShowBuilder(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau schema
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {schemas.map(schema => (
              <SavedSchemaCard
                key={schema.id}
                schema={schema}
                onDelete={handleDelete}
                onEdit={(s) => { /* TODO: edit mode */ }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
