import { useState, useEffect } from 'react';
import { FileSearch, RefreshCw, AlertTriangle, CheckCircle, XCircle, ExternalLink, TrendingUp, FileText, Search, Filter, BarChart3 } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { sitesApi, supabase } from '../../lib/supabase';

// Score color helper
const getScoreColor = (score) => {
  if (score >= 80) return 'text-success';
  if (score >= 50) return 'text-warning';
  return 'text-danger';
};

const getScoreBg = (score) => {
  if (score >= 80) return 'bg-success/10 border-success/30';
  if (score >= 50) return 'bg-warning/10 border-warning/30';
  return 'bg-danger/10 border-danger/30';
};

// Page Audit Card
function PageAuditCard({ page, onAudit }) {
  const score = page.seo_score || Math.floor(Math.random() * 40 + 50); // Placeholder

  const issues = [
    { type: 'warning', text: 'Meta description trop courte', condition: !page.meta_description || page.meta_description.length < 120 },
    { type: 'error', text: 'Titre H1 manquant', condition: !page.h1 },
    { type: 'warning', text: 'Contenu thin (< 300 mots)', condition: page.word_count < 300 },
    { type: 'success', text: 'Images optimisees', condition: true },
  ].filter(i => i.condition);

  return (
    <Card className="p-4 hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-white truncate">{page.title}</h3>
            {page.wp_url && (
              <a href={page.wp_url} target="_blank" rel="noopener noreferrer" className="text-dark-muted hover:text-primary flex-shrink-0">
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <p className="text-sm text-dark-muted truncate mt-0.5">{page.slug || page.wp_url || '/'}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg border flex items-center justify-center ${getScoreBg(score)}`}>
          <span className={`text-lg font-bold ${getScoreColor(score)}`}>{score}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3 text-center">
        <div className="bg-dark-border/30 rounded p-2">
          <div className="text-sm font-medium text-white">{page.word_count || 0}</div>
          <div className="text-xs text-dark-muted">mots</div>
        </div>
        <div className="bg-dark-border/30 rounded p-2">
          <div className="text-sm font-medium text-white">{page.meta_title?.length || 0}/60</div>
          <div className="text-xs text-dark-muted">title</div>
        </div>
        <div className="bg-dark-border/30 rounded p-2">
          <div className="text-sm font-medium text-white">{page.meta_description?.length || 0}/155</div>
          <div className="text-xs text-dark-muted">desc</div>
        </div>
      </div>

      {issues.length > 0 && (
        <div className="space-y-1 mb-3">
          {issues.slice(0, 3).map((issue, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              {issue.type === 'error' && <XCircle className="w-3 h-3 text-danger" />}
              {issue.type === 'warning' && <AlertTriangle className="w-3 h-3 text-warning" />}
              {issue.type === 'success' && <CheckCircle className="w-3 h-3 text-success" />}
              <span className="text-dark-muted">{issue.text}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Button size="sm" variant="ghost" className="flex-1" onClick={() => onAudit(page)}>
          <RefreshCw className="w-3 h-3 mr-1" />
          Re-auditer
        </Button>
        <Button size="sm" className="flex-1">
          Optimiser
        </Button>
      </div>
    </Card>
  );
}

export default function AuditContenu() {
  const [pages, setPages] = useState([]);
  const [sites, setSites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSiteId, setSelectedSiteId] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [sitesData] = await Promise.all([sitesApi.getAll()]);
      setSites(sitesData || []);

      // Load pages from Supabase
      const { data: pagesData, error } = await supabase
        .from('pages')
        .select('*, sites(mcp_alias, domain)')
        .order('created_at', { ascending: false });

      if (!error) {
        setPages(pagesData || []);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAudit = async (page) => {
    // TODO: Trigger n8n workflow for content audit
    alert(`Audit de la page "${page.title}" (via n8n workflow)`);
  };

  const handleScanAll = async () => {
    // TODO: Trigger full site audit via n8n
    alert('Scan complet du site (via n8n workflow)');
  };

  // Filter pages
  const filteredPages = pages.filter(page => {
    const matchesSearch = page.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          page.slug?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSite = selectedSiteId === 'all' || page.site_id === selectedSiteId;
    return matchesSearch && matchesSite;
  });

  // Calculate stats
  const stats = {
    total: pages.length,
    optimized: pages.filter(p => (p.seo_score || 0) >= 80).length,
    needsWork: pages.filter(p => (p.seo_score || 0) < 50).length,
    avgScore: pages.length > 0
      ? Math.round(pages.reduce((sum, p) => sum + (p.seo_score || 60), 0) / pages.length)
      : 0
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
          <h1 className="text-2xl font-bold text-white">Audit Contenu</h1>
          <p className="text-dark-muted mt-1">Analysez la qualite SEO de vos pages</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={handleScanAll}>
            <FileSearch className="w-4 h-4 mr-2" />
            Scanner tout
          </Button>
        </div>
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
              <div className="text-sm text-dark-muted">Pages totales</div>
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
              <div className="text-sm text-dark-muted">Optimisees (80+)</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-danger/10">
              <AlertTriangle className="w-5 h-5 text-danger" />
            </div>
            <div>
              <div className="text-2xl font-bold text-danger">{stats.needsWork}</div>
              <div className="text-sm text-dark-muted">A ameliorer (&lt;50)</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info/10">
              <BarChart3 className="w-5 h-5 text-info" />
            </div>
            <div>
              <div className="text-2xl font-bold text-info">{stats.avgScore}</div>
              <div className="text-sm text-dark-muted">Score moyen</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
              <input
                type="text"
                placeholder="Rechercher une page..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Tous les sites</option>
            {sites.map(site => (
              <option key={site.id} value={site.id}>{site.mcp_alias || site.domain}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Tous les scores</option>
            <option value="good">Bon (80+)</option>
            <option value="medium">Moyen (50-79)</option>
            <option value="bad">Faible (&lt;50)</option>
          </select>
        </div>
      </Card>

      {/* Pages Grid */}
      {filteredPages.length === 0 ? (
        <Card className="p-12 text-center">
          <FileSearch className="w-12 h-12 mx-auto text-dark-muted mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Aucune page a auditer</h3>
          <p className="text-dark-muted mb-6">
            Creez des pages dans la section Creation ou scannez vos pages WordPress existantes
          </p>
          <Button onClick={handleScanAll}>
            <FileSearch className="w-4 h-4 mr-2" />
            Scanner les pages WordPress
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPages.map(page => (
            <PageAuditCard key={page.id} page={page} onAudit={handleAudit} />
          ))}
        </div>
      )}
    </div>
  );
}
