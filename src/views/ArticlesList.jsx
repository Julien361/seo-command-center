import { useState, useEffect } from 'react';
import { ArrowLeft, FileText, ExternalLink, Loader2, Clock, CheckCircle, Edit, AlertCircle } from 'lucide-react';
import Card from '../components/common/Card';
import { supabase } from '../lib/supabase';

export default function ArticlesList({ site, onBack }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!site?.id) return;
    loadArticles();
  }, [site?.id]);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('site_id', site.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (err) {
      console.error('Error loading articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'draft':
        return <Edit className="w-4 h-4 text-warning" />;
      case 'writing':
        return <Clock className="w-4 h-4 text-info" />;
      default:
        return <AlertCircle className="w-4 h-4 text-dark-muted" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'published': return 'Publie';
      case 'draft': return 'Brouillon';
      case 'writing': return 'En cours';
      default: return status || 'Inconnu';
    }
  };

  const filtered = filter === 'all'
    ? articles
    : articles.filter(a => a.status === filter);

  const stats = {
    total: articles.length,
    published: articles.filter(a => a.status === 'published').length,
    draft: articles.filter(a => a.status === 'draft').length,
    writing: articles.filter(a => a.status === 'writing').length,
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
          <h1 className="text-2xl font-bold text-white">Articles</h1>
          <p className="text-dark-muted">{articles.length} articles pour {site?.mcp_alias}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card
          className={`p-4 text-center cursor-pointer transition-colors ${filter === 'all' ? 'border-primary' : 'hover:border-dark-muted'}`}
          onClick={() => setFilter('all')}
        >
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-sm text-dark-muted">Total</div>
        </Card>
        <Card
          className={`p-4 text-center cursor-pointer transition-colors ${filter === 'published' ? 'border-success' : 'hover:border-dark-muted'}`}
          onClick={() => setFilter('published')}
        >
          <div className="text-2xl font-bold text-success">{stats.published}</div>
          <div className="text-sm text-dark-muted">Publies</div>
        </Card>
        <Card
          className={`p-4 text-center cursor-pointer transition-colors ${filter === 'draft' ? 'border-warning' : 'hover:border-dark-muted'}`}
          onClick={() => setFilter('draft')}
        >
          <div className="text-2xl font-bold text-warning">{stats.draft}</div>
          <div className="text-sm text-dark-muted">Brouillons</div>
        </Card>
        <Card
          className={`p-4 text-center cursor-pointer transition-colors ${filter === 'writing' ? 'border-info' : 'hover:border-dark-muted'}`}
          onClick={() => setFilter('writing')}
        >
          <div className="text-2xl font-bold text-info">{stats.writing}</div>
          <div className="text-sm text-dark-muted">En cours</div>
        </Card>
      </div>

      {/* Articles List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="w-12 h-12 text-dark-muted mx-auto mb-4" />
            <p className="text-dark-muted">
              {filter === 'all' ? 'Aucun article' : `Aucun article ${getStatusLabel(filter).toLowerCase()}`}
            </p>
          </Card>
        ) : (
          filtered.map((article) => (
            <Card key={article.id} className="p-4 hover:border-dark-muted transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(article.status)}
                    <span className="text-xs text-dark-muted">
                      {getStatusLabel(article.status)}
                    </span>
                    {article.word_count && (
                      <span className="text-xs text-dark-muted">
                        • {article.word_count} mots
                      </span>
                    )}
                  </div>
                  <h3 className="text-white font-medium truncate">
                    {article.title || 'Sans titre'}
                  </h3>
                  {article.target_keyword && (
                    <p className="text-sm text-dark-muted mt-1">
                      Keyword: {article.target_keyword}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {article.wp_post_id && site?.url && (
                    <a
                      href={`${site.url}/?p=${article.wp_post_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-dark-border text-dark-muted hover:text-primary transition-colors"
                      title="Voir sur WordPress"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 mt-3 text-xs text-dark-muted">
                <span>
                  Cree le {new Date(article.created_at).toLocaleDateString('fr-FR')}
                </span>
                {article.published_at && (
                  <span>
                    Publie le {new Date(article.published_at).toLocaleDateString('fr-FR')}
                  </span>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
