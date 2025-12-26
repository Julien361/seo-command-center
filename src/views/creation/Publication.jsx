import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { sitesApi, supabase } from '../../lib/supabase';
import {
  Send,
  Globe,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  ExternalLink,
  Calendar,
  Search,
  Filter,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Settings,
  Zap,
  Upload,
  Image,
  Link,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Publication statuses
const publicationStatuses = {
  draft: { label: 'Brouillon', color: 'bg-gray-500', icon: FileText },
  scheduled: { label: 'Planifie', color: 'bg-info', icon: Calendar },
  publishing: { label: 'En cours', color: 'bg-warning', icon: RefreshCw },
  published: { label: 'Publie', color: 'bg-success', icon: CheckCircle },
  failed: { label: 'Echec', color: 'bg-danger', icon: AlertCircle },
  updating: { label: 'Mise a jour', color: 'bg-primary', icon: RefreshCw },
};

// Content types
const contentTypes = {
  article: { label: 'Article', icon: FileText },
  page: { label: 'Page', icon: Globe },
  landing: { label: 'Landing', icon: Zap },
};

function PublicationCard({ publication, sites, onPublish, onSchedule, onView, onRetry, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const site = sites.find(s => s.id === publication.site_id);
  const status = publicationStatuses[publication.status] || publicationStatuses.draft;
  const StatusIcon = status.icon;
  const contentType = contentTypes[publication.content_type] || contentTypes.article;
  const ContentIcon = contentType.icon;

  return (
    <Card className="hover:border-primary/30 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <ContentIcon size={16} className="text-gray-400" />
            <h3 className="font-medium text-white">{publication.title}</h3>
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-400 mb-3">
            <span className="flex items-center gap-1">
              <Globe size={12} />
              {site?.domain || 'Site inconnu'}
            </span>
            {publication.word_count && (
              <span>{publication.word_count.toLocaleString()} mots</span>
            )}
            {publication.scheduled_at && (
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {new Date(publication.scheduled_at).toLocaleDateString('fr-FR')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="default" className={status.color}>
              <StatusIcon size={12} className="mr-1" />
              {status.label}
            </Badge>
            <Badge variant="outline">{contentType.label}</Badge>
            {publication.has_images && (
              <Badge variant="outline" className="text-info border-info/30">
                <Image size={12} className="mr-1" />
                Images
              </Badge>
            )}
            {publication.has_internal_links && (
              <Badge variant="outline" className="text-success border-success/30">
                <Link size={12} className="mr-1" />
                Liens
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {publication.status === 'draft' && (
            <>
              <Button size="sm" variant="outline" onClick={() => onSchedule(publication)}>
                <Calendar size={14} className="mr-1" />
                Planifier
              </Button>
              <Button size="sm" onClick={() => onPublish(publication)}>
                <Send size={14} className="mr-1" />
                Publier
              </Button>
            </>
          )}
          {publication.status === 'scheduled' && (
            <Button size="sm" onClick={() => onPublish(publication)}>
              <Play size={14} className="mr-1" />
              Publier maintenant
            </Button>
          )}
          {publication.status === 'published' && publication.wp_url && (
            <Button size="sm" variant="outline" onClick={() => window.open(publication.wp_url, '_blank')}>
              <ExternalLink size={14} className="mr-1" />
              Voir
            </Button>
          )}
          {publication.status === 'failed' && (
            <Button size="sm" variant="outline" onClick={() => onRetry(publication)}>
              <RotateCcw size={14} className="mr-1" />
              Reessayer
            </Button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-dark-border">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Cree le</p>
              <p className="text-sm text-white">
                {new Date(publication.created_at).toLocaleDateString('fr-FR')}
              </p>
            </div>
            {publication.published_at && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Publie le</p>
                <p className="text-sm text-white">
                  {new Date(publication.published_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            )}
            {publication.wp_post_id && (
              <div>
                <p className="text-xs text-gray-500 mb-1">ID WordPress</p>
                <p className="text-sm text-white">#{publication.wp_post_id}</p>
              </div>
            )}
            {publication.category && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Categorie</p>
                <p className="text-sm text-white">{publication.category}</p>
              </div>
            )}
          </div>

          {publication.meta_title && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1">Meta Title</p>
              <p className="text-sm text-white">{publication.meta_title}</p>
            </div>
          )}

          {publication.meta_description && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1">Meta Description</p>
              <p className="text-sm text-gray-300">{publication.meta_description}</p>
            </div>
          )}

          {publication.error_message && (
            <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg">
              <p className="text-sm text-danger">{publication.error_message}</p>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button size="sm" variant="outline" onClick={() => onView(publication)}>
              <Eye size={14} className="mr-1" />
              Apercu
            </Button>
            <Button size="sm" variant="ghost" className="text-danger" onClick={() => onDelete(publication)}>
              <Trash2 size={14} className="mr-1" />
              Supprimer
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function PublicationQueue({ queue, onCancel }) {
  if (queue.length === 0) return null;

  return (
    <Card className="mb-6 border-warning/30">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="text-warning" size={20} />
        <h3 className="font-medium text-white">File d'attente ({queue.length})</h3>
      </div>
      <div className="space-y-2">
        {queue.map((item, index) => (
          <div key={item.id} className="flex items-center justify-between p-3 bg-dark-bg rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">#{index + 1}</span>
              <span className="text-white">{item.title}</span>
              <Badge variant="outline">{item.site_domain}</Badge>
            </div>
            <div className="flex items-center gap-2">
              {item.status === 'publishing' ? (
                <RefreshCw size={16} className="text-warning animate-spin" />
              ) : (
                <Button size="sm" variant="ghost" onClick={() => onCancel(item)}>
                  <Pause size={14} />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ScheduleModal({ isOpen, onClose, publication, onSchedule }) {
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');

  if (!isOpen) return null;

  const handleSubmit = () => {
    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);
    onSchedule(publication, scheduledAt);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-white mb-4">Planifier la publication</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Date</label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Heure</label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={!scheduledDate}>
            <Calendar size={16} className="mr-2" />
            Planifier
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Publication() {
  const [publications, setPublications] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [scheduleModal, setScheduleModal] = useState({ open: false, publication: null });
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load sites
      const sitesData = await sitesApi.getAll();
      setSites(sitesData || []);

      // Load publications (articles ready for publishing)
      const { data: pubData, error } = await supabase
        .from('articles')
        .select('*')
        .in('status', ['ready', 'scheduled', 'publishing', 'published', 'failed'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform to publication format
      const pubs = (pubData || []).map(article => ({
        id: article.id,
        title: article.title,
        site_id: article.site_id,
        content_type: article.content_type || 'article',
        status: mapArticleStatus(article.status),
        word_count: article.word_count,
        has_images: article.has_images,
        has_internal_links: article.has_internal_links,
        meta_title: article.meta_title,
        meta_description: article.meta_description,
        category: article.category,
        wp_post_id: article.wp_post_id,
        wp_url: article.wp_url,
        scheduled_at: article.scheduled_at,
        published_at: article.published_at,
        error_message: article.error_message,
        created_at: article.created_at,
      }));

      setPublications(pubs);

      // Set queue from publishing items
      setQueue(pubs.filter(p => p.status === 'publishing').map(p => ({
        ...p,
        site_domain: sitesData?.find(s => s.id === p.site_id)?.domain
      })));
    } catch (error) {
      console.error('Error loading publications:', error);
    } finally {
      setLoading(false);
    }
  };

  const mapArticleStatus = (articleStatus) => {
    const statusMap = {
      'ready': 'draft',
      'scheduled': 'scheduled',
      'publishing': 'publishing',
      'published': 'published',
      'failed': 'failed',
    };
    return statusMap[articleStatus] || 'draft';
  };

  const handlePublish = async (publication) => {
    // Update status to publishing
    const { error } = await supabase
      .from('articles')
      .update({ status: 'publishing' })
      .eq('id', publication.id);

    if (error) {
      console.error('Error starting publication:', error);
      return;
    }

    // Add to queue
    const site = sites.find(s => s.id === publication.site_id);
    setQueue(prev => [...prev, { ...publication, status: 'publishing', site_domain: site?.domain }]);

    // TODO: Trigger n8n workflow for WordPress publication
    // n8nApi.publishToWordPress({ article_id: publication.id, site_alias: site?.mcp_alias });

    // Simulate publication (in real app, this would be handled by n8n callback)
    setTimeout(async () => {
      const { error: updateError } = await supabase
        .from('articles')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          wp_post_id: Math.floor(Math.random() * 10000) + 1000,
        })
        .eq('id', publication.id);

      if (!updateError) {
        loadData();
      }
    }, 3000);
  };

  const handleSchedule = async (publication, scheduledAt) => {
    const { error } = await supabase
      .from('articles')
      .update({
        status: 'scheduled',
        scheduled_at: scheduledAt.toISOString()
      })
      .eq('id', publication.id);

    if (!error) {
      loadData();
    }
  };

  const handleRetry = async (publication) => {
    await handlePublish(publication);
  };

  const handleDelete = async (publication) => {
    if (!confirm('Supprimer cette publication ?')) return;

    const { error } = await supabase
      .from('articles')
      .update({ status: 'draft' })
      .eq('id', publication.id);

    if (!error) {
      loadData();
    }
  };

  const handleCancelQueue = async (item) => {
    const { error } = await supabase
      .from('articles')
      .update({ status: 'ready' })
      .eq('id', item.id);

    if (!error) {
      setQueue(prev => prev.filter(q => q.id !== item.id));
      loadData();
    }
  };

  const handleView = (publication) => {
    // TODO: Open preview modal
    console.log('Preview:', publication);
  };

  // Filter publications
  const filteredPublications = publications.filter(pub => {
    if (selectedSite !== 'all' && pub.site_id !== selectedSite) return false;
    if (selectedStatus !== 'all' && pub.status !== selectedStatus) return false;
    if (searchTerm && !pub.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Stats
  const stats = {
    total: publications.length,
    draft: publications.filter(p => p.status === 'draft').length,
    scheduled: publications.filter(p => p.status === 'scheduled').length,
    published: publications.filter(p => p.status === 'published').length,
    failed: publications.filter(p => p.status === 'failed').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="text-center">
          <Upload className="mx-auto mb-2 text-primary" size={24} />
          <p className="text-2xl font-bold text-white">{stats.total}</p>
          <p className="text-xs text-gray-400">Total</p>
        </Card>
        <Card className="text-center">
          <FileText className="mx-auto mb-2 text-gray-400" size={24} />
          <p className="text-2xl font-bold text-white">{stats.draft}</p>
          <p className="text-xs text-gray-400">Brouillons</p>
        </Card>
        <Card className="text-center">
          <Calendar className="mx-auto mb-2 text-info" size={24} />
          <p className="text-2xl font-bold text-white">{stats.scheduled}</p>
          <p className="text-xs text-gray-400">Planifies</p>
        </Card>
        <Card className="text-center">
          <CheckCircle className="mx-auto mb-2 text-success" size={24} />
          <p className="text-2xl font-bold text-white">{stats.published}</p>
          <p className="text-xs text-gray-400">Publies</p>
        </Card>
        <Card className="text-center">
          <AlertCircle className="mx-auto mb-2 text-danger" size={24} />
          <p className="text-2xl font-bold text-white">{stats.failed}</p>
          <p className="text-xs text-gray-400">Echecs</p>
        </Card>
      </div>

      {/* Queue */}
      <PublicationQueue queue={queue} onCancel={handleCancelQueue} />

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500"
              />
            </div>
          </div>

          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
          >
            <option value="all">Tous les sites</option>
            {sites.map(site => (
              <option key={site.id} value={site.id}>{site.domain}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
          >
            <option value="all">Tous les statuts</option>
            {Object.entries(publicationStatuses).map(([key, status]) => (
              <option key={key} value={key}>{status.label}</option>
            ))}
          </select>

          <Button variant="outline" onClick={loadData}>
            <RefreshCw size={16} className="mr-2" />
            Actualiser
          </Button>
        </div>
      </Card>

      {/* Publications list */}
      {filteredPublications.length === 0 ? (
        <Card className="text-center py-12">
          <Send className="mx-auto mb-4 text-gray-600" size={48} />
          <h3 className="text-lg font-medium text-white mb-2">Aucune publication</h3>
          <p className="text-gray-400">Les articles prets seront affiches ici.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPublications.map(publication => (
            <PublicationCard
              key={publication.id}
              publication={publication}
              sites={sites}
              onPublish={handlePublish}
              onSchedule={(pub) => setScheduleModal({ open: true, publication: pub })}
              onView={handleView}
              onRetry={handleRetry}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Schedule Modal */}
      <ScheduleModal
        isOpen={scheduleModal.open}
        onClose={() => setScheduleModal({ open: false, publication: null })}
        publication={scheduleModal.publication}
        onSchedule={handleSchedule}
      />
    </div>
  );
}
