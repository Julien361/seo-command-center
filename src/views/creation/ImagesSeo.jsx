import { useState, useEffect } from 'react';
import { Image, AlertTriangle, CheckCircle, FileWarning, Zap, Search, RefreshCw, Download, Upload, Edit2, Trash2, Eye, Filter } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { sitesApi, supabase } from '../../lib/supabase';
import { n8nApi } from '../../lib/n8n';

// Image issue types
const issueTypes = {
  missing_alt: { label: 'Alt manquant', color: 'text-danger', severity: 'high' },
  empty_alt: { label: 'Alt vide', color: 'text-danger', severity: 'high' },
  generic_alt: { label: 'Alt generique', color: 'text-warning', severity: 'medium' },
  too_large: { label: 'Trop volumineuse', color: 'text-warning', severity: 'medium' },
  wrong_format: { label: 'Mauvais format', color: 'text-info', severity: 'low' },
  no_lazy_load: { label: 'Pas de lazy load', color: 'text-info', severity: 'low' },
  missing_dimensions: { label: 'Dimensions manquantes', color: 'text-info', severity: 'low' },
};

// Get optimization score
function getOptimizationScore(image) {
  let score = 100;
  if (!image.alt_text) score -= 30;
  else if (image.alt_text.length < 5) score -= 20;
  if (image.file_size > 500000) score -= 20; // > 500KB
  if (image.file_size > 1000000) score -= 20; // > 1MB
  if (!image.has_lazy_load) score -= 10;
  if (!image.has_dimensions) score -= 10;
  if (!['webp', 'avif'].includes(image.format?.toLowerCase())) score -= 10;
  return Math.max(0, score);
}

// Score color
function getScoreColor(score) {
  if (score >= 80) return 'text-success';
  if (score >= 50) return 'text-warning';
  return 'text-danger';
}

// Format file size
function formatFileSize(bytes) {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Image card
function ImageCard({ image, onEdit, onDelete, onView }) {
  const score = getOptimizationScore(image);
  const scoreColor = getScoreColor(score);
  const issues = [];

  if (!image.alt_text) issues.push('missing_alt');
  else if (image.alt_text.length < 5) issues.push('empty_alt');
  if (image.file_size > 500000) issues.push('too_large');
  if (!image.has_lazy_load) issues.push('no_lazy_load');

  return (
    <Card className="overflow-hidden">
      {/* Image preview */}
      <div className="relative h-40 bg-dark-border flex items-center justify-center">
        {image.url ? (
          <img
            src={image.url}
            alt={image.alt_text || 'Image'}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <Image className="w-12 h-12 text-dark-muted" />
        )}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded text-sm font-bold bg-dark-bg/80 ${scoreColor}`}>
            {score}%
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="text-white font-medium text-sm truncate flex-1" title={image.filename}>
            {image.filename || 'image.jpg'}
          </h4>
          <div className="flex items-center gap-1 ml-2">
            <button onClick={() => onView(image)} className="p-1 hover:bg-dark-border rounded text-dark-muted hover:text-white">
              <Eye className="w-4 h-4" />
            </button>
            <button onClick={() => onEdit(image)} className="p-1 hover:bg-dark-border rounded text-dark-muted hover:text-white">
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={() => onDelete(image.id)} className="p-1 hover:bg-dark-border rounded text-dark-muted hover:text-danger">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Alt text */}
        <p className={`text-xs mb-2 ${image.alt_text ? 'text-dark-muted' : 'text-danger italic'}`}>
          {image.alt_text || 'Alt text manquant'}
        </p>

        {/* Meta info */}
        <div className="flex items-center gap-3 text-xs text-dark-muted mb-2">
          <span>{formatFileSize(image.file_size)}</span>
          {image.dimensions && <span>{image.dimensions}</span>}
          <span className="uppercase">{image.format || 'jpg'}</span>
        </div>

        {/* Issues */}
        {issues.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {issues.map(issue => (
              <span key={issue} className={`text-xs px-1.5 py-0.5 rounded bg-dark-border ${issueTypes[issue]?.color}`}>
                {issueTypes[issue]?.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// Edit image modal
function EditImageModal({ image, onClose, onSave }) {
  const [formData, setFormData] = useState({
    alt_text: image?.alt_text || '',
    title: image?.title || '',
    caption: image?.caption || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...image, ...formData });
  };

  // Alt text suggestions based on filename
  const suggestAlt = () => {
    if (!image?.filename) return;
    const name = image.filename
      .replace(/\.[^.]+$/, '') // Remove extension
      .replace(/[-_]/g, ' ') // Replace dashes/underscores with spaces
      .replace(/\d+/g, '') // Remove numbers
      .trim();
    setFormData({ ...formData, alt_text: name });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <Card className="w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-white mb-4">Optimiser l'image</h3>

        {/* Preview */}
        {image?.url && (
          <div className="mb-4 rounded-lg overflow-hidden bg-dark-border h-48 flex items-center justify-center">
            <img src={image.url} alt="" className="max-w-full max-h-full object-contain" />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-dark-muted">Texte alternatif (alt) *</label>
              <button type="button" onClick={suggestAlt} className="text-xs text-primary hover:underline">
                Suggerer
              </button>
            </div>
            <input
              type="text"
              value={formData.alt_text}
              onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
              placeholder="Description de l'image..."
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
            />
            <p className="text-xs text-dark-muted mt-1">
              {formData.alt_text.length} caracteres (recommande: 50-125)
            </p>
          </div>

          <div>
            <label className="block text-sm text-dark-muted mb-1">Titre (title)</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Titre de l'image..."
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-dark-muted mb-1">Legende (caption)</label>
            <textarea
              value={formData.caption}
              onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
              rows={2}
              placeholder="Legende visible sous l'image..."
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white resize-none"
            />
          </div>

          {/* Image info */}
          <div className="p-3 bg-dark-border/30 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-dark-muted">Fichier</p>
                <p className="text-white truncate">{image?.filename}</p>
              </div>
              <div>
                <p className="text-dark-muted">Taille</p>
                <p className={image?.file_size > 500000 ? 'text-warning' : 'text-white'}>
                  {formatFileSize(image?.file_size)}
                </p>
              </div>
              <div>
                <p className="text-dark-muted">Format</p>
                <p className="text-white uppercase">{image?.format || 'jpg'}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" onClick={onClose}>Annuler</Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

// Bulk optimization suggestions
function OptimizationPanel({ images, onOptimize, isOptimizing }) {
  const missingAlt = images.filter(i => !i.alt_text).length;
  const tooLarge = images.filter(i => i.file_size > 500000).length;
  const wrongFormat = images.filter(i => !['webp', 'avif'].includes(i.format?.toLowerCase())).length;

  if (missingAlt === 0 && tooLarge === 0 && wrongFormat === 0) {
    return (
      <Card className="p-4 bg-success/10 border-success/30">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-success" />
          <p className="text-success">Toutes les images sont optimisees!</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="text-white font-medium mb-3 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-warning" />
        Optimisations recommandees
      </h3>
      <div className="space-y-2">
        {missingAlt > 0 && (
          <div className="flex items-center justify-between p-2 bg-dark-border/30 rounded">
            <div className="flex items-center gap-2">
              <FileWarning className="w-4 h-4 text-danger" />
              <span className="text-sm text-white">{missingAlt} images sans alt text</span>
            </div>
            <Button size="sm" variant="secondary" onClick={() => onOptimize('alt')} disabled={isOptimizing}>
              {isOptimizing ? 'En cours...' : 'Corriger'}
            </Button>
          </div>
        )}
        {tooLarge > 0 && (
          <div className="flex items-center justify-between p-2 bg-dark-border/30 rounded">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-warning" />
              <span className="text-sm text-white">{tooLarge} images trop volumineuses (&gt;500KB)</span>
            </div>
            <Button size="sm" variant="secondary" onClick={() => onOptimize('compress')} disabled={isOptimizing}>
              {isOptimizing ? 'En cours...' : 'Compresser'}
            </Button>
          </div>
        )}
        {wrongFormat > 0 && (
          <div className="flex items-center justify-between p-2 bg-dark-border/30 rounded">
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4 text-info" />
              <span className="text-sm text-white">{wrongFormat} images pas en WebP/AVIF</span>
            </div>
            <Button size="sm" variant="secondary" onClick={() => onOptimize('convert')} disabled={isOptimizing}>
              {isOptimizing ? 'En cours...' : 'Convertir'}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function ImagesSeo() {
  const [images, setImages] = useState([]);
  const [sites, setSites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState('all');
  const [issueFilter, setIssueFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const sitesData = await sitesApi.getAll();
      setSites(sitesData || []);

      const { data, error } = await supabase
        .from('images')
        .select('*, sites(mcp_alias, domain)')
        .order('created_at', { ascending: false });

      if (!error) {
        setImages(data || []);
      }
    } catch (err) {
      console.error('Error loading images:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (imageData) => {
    try {
      const { error } = await supabase
        .from('images')
        .update({
          alt_text: imageData.alt_text,
          title: imageData.title,
          caption: imageData.caption,
        })
        .eq('id', imageData.id);

      if (!error) {
        setImages(images.map(i => i.id === imageData.id ? { ...i, ...imageData } : i));
      }
    } catch (err) {
      console.error('Error saving image:', err);
    }
    setShowEditModal(false);
    setSelectedImage(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette image ?')) return;

    try {
      const { error } = await supabase
        .from('images')
        .delete()
        .eq('id', id);

      if (!error) {
        setImages(images.filter(i => i.id !== id));
      }
    } catch (err) {
      console.error('Error deleting image:', err);
    }
  };

  const handleOptimize = async (type) => {
    const site = selectedSiteId !== 'all' ? sites.find(s => s.id === selectedSiteId) : null;

    const typeLabels = {
      alt: 'génération des textes alt',
      compress: 'compression des images',
      convert: 'conversion en WebP/AVIF'
    };

    if (!confirm(`Lancer l'optimisation "${typeLabels[type]}" ?\n\nCette opération peut prendre quelques minutes.`)) {
      return;
    }

    setIsOptimizing(true);
    try {
      const result = await n8nApi.triggerWebhook('images-optimize', {
        type,
        site_alias: site?.mcp_alias || 'all',
        images: images.filter(i => {
          if (type === 'alt') return !i.alt_text;
          if (type === 'compress') return i.file_size > 500000;
          if (type === 'convert') return !['webp', 'avif'].includes(i.format?.toLowerCase());
          return true;
        }).map(i => i.id)
      });

      if (result.success) {
        alert(`Optimisation "${typeLabels[type]}" lancée ! Les images seront mises à jour dans quelques minutes.`);
        setTimeout(loadData, 5000);
      } else {
        alert('Erreur: ' + result.error);
      }
    } catch (err) {
      alert('Erreur: ' + err.message);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleScanSite = async () => {
    const site = selectedSiteId !== 'all' ? sites.find(s => s.id === selectedSiteId) : null;

    if (!site) {
      alert('Veuillez d\'abord sélectionner un site à scanner');
      return;
    }

    if (!confirm(`Scanner les images de ${site.domain} ?\n\nCette opération va analyser toutes les images du site.`)) {
      return;
    }

    setIsScanning(true);
    try {
      const result = await n8nApi.triggerWebhook('images-scan', {
        site_alias: site.mcp_alias,
        site_url: site.url
      });

      if (result.success) {
        alert(`Scan de ${site.domain} lancé ! Les images seront indexées dans quelques minutes.`);
        setTimeout(loadData, 10000);
      } else {
        alert('Erreur: ' + result.error);
      }
    } catch (err) {
      alert('Erreur: ' + err.message);
    } finally {
      setIsScanning(false);
    }
  };

  // Filter images
  const filteredImages = images.filter(img => {
    if (selectedSiteId !== 'all' && img.site_id !== selectedSiteId) return false;
    if (searchTerm && !img.filename?.toLowerCase().includes(searchTerm.toLowerCase())) return false;

    if (issueFilter === 'missing_alt' && img.alt_text) return false;
    if (issueFilter === 'too_large' && img.file_size <= 500000) return false;
    if (issueFilter === 'wrong_format' && ['webp', 'avif'].includes(img.format?.toLowerCase())) return false;
    if (issueFilter === 'optimized' && getOptimizationScore(img) < 80) return false;

    return true;
  });

  // Stats
  const stats = {
    total: images.length,
    optimized: images.filter(i => getOptimizationScore(i) >= 80).length,
    needsWork: images.filter(i => getOptimizationScore(i) < 80).length,
    missingAlt: images.filter(i => !i.alt_text).length,
  };

  const avgScore = images.length > 0
    ? Math.round(images.reduce((sum, i) => sum + getOptimizationScore(i), 0) / images.length)
    : 0;

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
          <h1 className="text-2xl font-bold text-white">Images SEO</h1>
          <p className="text-dark-muted mt-1">Optimisez vos images: alt text, compression, lazy loading</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleScanSite} disabled={isScanning}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Scan...' : 'Scanner un site'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Image className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-sm text-dark-muted">Total images</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <div className="text-2xl font-bold text-success">{stats.optimized}</div>
              <div className="text-sm text-dark-muted">Optimisees</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">{stats.needsWork}</div>
              <div className="text-sm text-dark-muted">A optimiser</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-danger/10">
              <FileWarning className="w-5 h-5 text-danger" />
            </div>
            <div>
              <div className="text-2xl font-bold text-danger">{stats.missingAlt}</div>
              <div className="text-sm text-dark-muted">Sans alt</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getScoreColor(avgScore).replace('text-', 'bg-')}/10`}>
              <Zap className={`w-5 h-5 ${getScoreColor(avgScore)}`} />
            </div>
            <div>
              <div className={`text-2xl font-bold ${getScoreColor(avgScore)}`}>{avgScore}%</div>
              <div className="text-sm text-dark-muted">Score moyen</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Optimization panel */}
      <OptimizationPanel images={images} onOptimize={handleOptimize} isOptimizing={isOptimizing} />

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
              <input
                type="text"
                placeholder="Rechercher une image..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white placeholder-dark-muted"
              />
            </div>
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
          <select
            value={issueFilter}
            onChange={(e) => setIssueFilter(e.target.value)}
            className="px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
          >
            <option value="all">Tous les statuts</option>
            <option value="missing_alt">Alt manquant</option>
            <option value="too_large">Trop volumineuse</option>
            <option value="wrong_format">Pas WebP/AVIF</option>
            <option value="optimized">Optimisees</option>
          </select>
        </div>
      </Card>

      {/* Images grid */}
      {filteredImages.length === 0 ? (
        <Card className="p-12 text-center">
          <Image className="w-12 h-12 mx-auto text-dark-muted mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Aucune image</h3>
          <p className="text-dark-muted mb-6">Scannez un site pour detecter les images a optimiser</p>
          <Button onClick={handleScanSite}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Scanner un site
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {filteredImages.map(image => (
            <ImageCard
              key={image.id}
              image={image}
              onEdit={(i) => { setSelectedImage(i); setShowEditModal(true); }}
              onDelete={handleDelete}
              onView={(i) => window.open(i.url, '_blank')}
            />
          ))}
        </div>
      )}

      {/* Edit modal */}
      {showEditModal && selectedImage && (
        <EditImageModal
          image={selectedImage}
          onClose={() => { setShowEditModal(false); setSelectedImage(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
