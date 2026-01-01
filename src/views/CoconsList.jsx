import { useState, useEffect } from 'react';
import {
  ArrowLeft, GitBranch, FileText, Link, Loader2, ChevronDown, ChevronRight,
  Target, Circle, ArrowRight, Plus, ExternalLink, BookOpen
} from 'lucide-react';
import Card from '../components/common/Card';
import { supabase } from '../lib/supabase';

export default function CoconsList({ site, onBack }) {
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    if (!site?.id) return;
    loadClusters();
  }, [site?.id]);

  const loadClusters = async () => {
    setLoading(true);
    try {
      // Load clusters
      const { data: clustersData, error: clustersError } = await supabase
        .from('semantic_clusters')
        .select('*')
        .eq('site_id', site.id)
        .order('created_at', { ascending: false });

      if (clustersError) throw clustersError;

      // Load satellites for each cluster
      const clustersWithSatellites = await Promise.all(
        (clustersData || []).map(async (cluster) => {
          const { data: satellites } = await supabase
            .from('cluster_satellites')
            .select('*, articles(*)')
            .eq('cluster_id', cluster.id);
          return { ...cluster, satellites: satellites || [] };
        })
      );

      setClusters(clustersWithSatellites);

      // Auto-expand first cluster
      if (clustersWithSatellites.length > 0) {
        setExpanded({ [clustersWithSatellites[0].id]: true });
      }
    } catch (err) {
      console.error('Error loading clusters:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getStatusBadge = (status) => {
    const statuses = {
      draft: { label: 'Brouillon', class: 'bg-dark-muted/20 text-dark-muted' },
      planned: { label: 'Planifie', class: 'bg-info/20 text-info' },
      in_progress: { label: 'En cours', class: 'bg-warning/20 text-warning' },
      completed: { label: 'Complete', class: 'bg-success/20 text-success' },
    };
    const s = statuses[status] || statuses.draft;
    return <span className={`px-2 py-1 text-xs rounded ${s.class}`}>{s.label}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
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
            <GitBranch className="w-6 h-6 text-purple-500" />
            Cocons Semantiques
          </h1>
          <p className="text-dark-muted">{clusters.length} cocons pour {site?.mcp_alias}</p>
        </div>
      </div>

      {/* Explanation Card */}
      <Card className="p-5 bg-gradient-to-r from-purple-500/10 to-purple-900/10 border-purple-500/30">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Visual diagram */}
          <div className="flex-shrink-0 flex items-center justify-center">
            <div className="relative p-4">
              {/* Pillar (center) */}
              <div className="w-20 h-20 rounded-full bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center">
                <Target className="w-8 h-8 text-purple-500" />
              </div>
              {/* Satellites (orbiting) */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-purple-400/20 border border-purple-400 flex items-center justify-center">
                <Circle className="w-3 h-3 text-purple-400" />
              </div>
              <div className="absolute top-1/2 -right-4 -translate-y-1/2 w-8 h-8 rounded-full bg-purple-400/20 border border-purple-400 flex items-center justify-center">
                <Circle className="w-3 h-3 text-purple-400" />
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-purple-400/20 border border-purple-400 flex items-center justify-center">
                <Circle className="w-3 h-3 text-purple-400" />
              </div>
              <div className="absolute top-1/2 -left-4 -translate-y-1/2 w-8 h-8 rounded-full bg-purple-400/20 border border-purple-400 flex items-center justify-center">
                <Circle className="w-3 h-3 text-purple-400" />
              </div>
              {/* Connecting lines (visual only) */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-full h-full border border-dashed border-purple-500/30 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Explanation text */}
          <div className="flex-1">
            <h3 className="text-white font-semibold text-lg mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-400" />
              Qu'est-ce qu'un Cocon Semantique ?
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Target className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                <p className="text-dark-muted">
                  <span className="text-white font-medium">Page Pilier</span> : Article principal (3000+ mots) qui cible le keyword principal
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Circle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <p className="text-dark-muted">
                  <span className="text-white font-medium">Satellites</span> : 4-6 articles (1500 mots) qui traitent des sous-sujets
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Link className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                <p className="text-dark-muted">
                  <span className="text-white font-medium">Maillage</span> : Liens internes entre pilier et satellites pour renforcer l'autorite
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-500">{clusters.length}</div>
          <div className="text-sm text-dark-muted">Cocons</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-white">
            {clusters.reduce((sum, c) => sum + (c.satellites?.length || 0), 0)}
          </div>
          <div className="text-sm text-dark-muted">Satellites</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-warning">
            {clusters.filter(c => c.status === 'draft').length}
          </div>
          <div className="text-sm text-dark-muted">Brouillons</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-success">
            {clusters.filter(c => c.status === 'completed').length}
          </div>
          <div className="text-sm text-dark-muted">Completes</div>
        </Card>
      </div>

      {/* Clusters list */}
      {clusters.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="max-w-md mx-auto">
            <GitBranch className="w-16 h-16 text-purple-500/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Aucun cocon semantique</h3>
            <p className="text-dark-muted mb-6">
              Les cocons sont crees automatiquement par le workflow de clustering
              a partir de vos keywords. Lancez d'abord une analyse Keywords puis le Clustering.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-purple-400">
              <span className="px-3 py-1 bg-purple-500/20 rounded">1. Keywords</span>
              <ArrowRight className="w-4 h-4" />
              <span className="px-3 py-1 bg-purple-500/20 rounded">2. Clustering</span>
              <ArrowRight className="w-4 h-4" />
              <span className="px-3 py-1 bg-purple-500/20 rounded">3. Cocons</span>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {clusters.map((cluster) => (
            <Card key={cluster.id} className="overflow-hidden">
              {/* Cluster header */}
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-dark-border/30 transition-colors"
                onClick={() => toggleExpand(cluster.id)}
              >
                <div className="flex items-center gap-4">
                  {/* Expand icon */}
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    {expanded[cluster.id] ? (
                      <ChevronDown className="w-5 h-5 text-purple-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-purple-500" />
                    )}
                  </div>

                  {/* Cluster info */}
                  <div>
                    <h3 className="text-white font-medium flex items-center gap-2">
                      <Target className="w-4 h-4 text-purple-500" />
                      {cluster.name}
                    </h3>
                    <p className="text-sm text-dark-muted flex items-center gap-2 mt-1">
                      <span className="text-purple-400">{cluster.main_keyword}</span>
                      <span className="text-dark-border">|</span>
                      <span>{cluster.satellite_count || cluster.satellites?.length || 0} satellites</span>
                    </p>
                  </div>
                </div>

                {/* Status and stats */}
                <div className="flex items-center gap-4">
                  {cluster.avg_position && (
                    <div className="text-right hidden md:block">
                      <div className="text-xs text-dark-muted">Position moy.</div>
                      <div className="text-white font-medium">#{Math.round(cluster.avg_position)}</div>
                    </div>
                  )}
                  {cluster.total_traffic > 0 && (
                    <div className="text-right hidden md:block">
                      <div className="text-xs text-dark-muted">Trafic</div>
                      <div className="text-white font-medium">{cluster.total_traffic}</div>
                    </div>
                  )}
                  {getStatusBadge(cluster.status)}
                </div>
              </div>

              {/* Expanded content */}
              {expanded[cluster.id] && (
                <div className="border-t border-dark-border bg-dark-bg/50 p-4">
                  {/* Visual tree structure */}
                  <div className="flex flex-col items-start">
                    {/* Pillar */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 mb-2 w-full max-w-md">
                      <Target className="w-5 h-5 text-purple-500 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-xs text-purple-400 uppercase">Page Pilier</div>
                        <div className="text-white font-medium">{cluster.main_keyword}</div>
                      </div>
                      {cluster.pillar_article_id && (
                        <ExternalLink className="w-4 h-4 text-dark-muted" />
                      )}
                    </div>

                    {/* Satellites */}
                    {cluster.satellites?.length > 0 ? (
                      <div className="ml-8 space-y-2 w-full max-w-md">
                        <div className="text-xs text-dark-muted uppercase mb-2 flex items-center gap-2">
                          <div className="w-4 h-px bg-purple-500/30"></div>
                          Satellites ({cluster.satellites.length})
                        </div>
                        {cluster.satellites.map((sat, idx) => (
                          <div
                            key={sat.id || idx}
                            className="flex items-center gap-3 p-2 rounded-lg bg-dark-card border border-dark-border"
                          >
                            <div className="w-6 h-px bg-purple-500/30"></div>
                            <Circle className="w-4 h-4 text-purple-400 flex-shrink-0" />
                            <span className="text-white text-sm flex-1">
                              {sat.articles?.title || sat.keyword || `Satellite ${idx + 1}`}
                            </span>
                            {sat.link_type && (
                              <span className="text-xs text-dark-muted flex items-center gap-1">
                                <Link className="w-3 h-3" />
                                {sat.link_type}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="ml-8 p-4 rounded-lg border border-dashed border-dark-border text-center w-full max-w-md">
                        <p className="text-dark-muted text-sm">
                          Aucun satellite lie a ce cocon.
                        </p>
                        <p className="text-xs text-dark-muted mt-1">
                          Creez des articles satellites via l'onglet Articles.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Action tip */}
      {clusters.length > 0 && (
        <Card className="p-4 bg-info/5 border-info/30">
          <div className="flex items-start gap-3">
            <Plus className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-white font-medium mb-1">Prochaines etapes</h3>
              <p className="text-sm text-dark-muted">
                Pour chaque cocon, creez la page pilier (3000+ mots) puis les satellites (1500 mots).
                N'oubliez pas de lier les satellites vers la page pilier avec des ancres variees.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
