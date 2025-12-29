import { useState, useEffect } from 'react';
import { ArrowLeft, GitBranch, FileText, Link, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
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
      planned: { label: 'Planifie', class: 'bg-info/20 text-info' },
      in_progress: { label: 'En cours', class: 'bg-warning/20 text-warning' },
      completed: { label: 'Complete', class: 'bg-success/20 text-success' },
    };
    const s = statuses[status] || statuses.planned;
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

      {/* Explanation */}
      <Card className="p-4 bg-purple-500/5 border-purple-500/30">
        <div className="flex items-start gap-3">
          <GitBranch className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-white font-medium mb-1">Architecture en Cocon</h3>
            <p className="text-sm text-dark-muted">
              Chaque cocon = 1 page pilier (3000+ mots) + 4-6 satellites (1500 mots).
              Le maillage interne renforce l'autorite thematique pour la Position 0.
            </p>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
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
          <div className="text-2xl font-bold text-success">
            {clusters.filter(c => c.status === 'completed').length}
          </div>
          <div className="text-sm text-dark-muted">Completes</div>
        </Card>
      </div>

      {/* Clusters list */}
      {clusters.length === 0 ? (
        <Card className="p-8 text-center">
          <GitBranch className="w-12 h-12 text-dark-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Aucun cocon</h3>
          <p className="text-dark-muted">Lancez l'analyse de clustering pour creer vos cocons semantiques.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {clusters.map((cluster) => (
            <Card key={cluster.id} className="overflow-hidden">
              {/* Cluster header */}
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-dark-border/30"
                onClick={() => toggleExpand(cluster.id)}
              >
                <div className="flex items-center gap-3">
                  {expanded[cluster.id] ? (
                    <ChevronDown className="w-5 h-5 text-dark-muted" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-dark-muted" />
                  )}
                  <div>
                    <h3 className="text-white font-medium">{cluster.name || cluster.pillar_keyword}</h3>
                    <p className="text-sm text-dark-muted">
                      {cluster.pillar_keyword} - {cluster.satellites?.length || 0} satellites
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(cluster.status)}
                </div>
              </div>

              {/* Satellites */}
              {expanded[cluster.id] && cluster.satellites?.length > 0 && (
                <div className="border-t border-dark-border bg-dark-bg/50">
                  <div className="p-4">
                    <div className="text-xs text-dark-muted uppercase mb-3">Satellites</div>
                    <div className="space-y-2">
                      {cluster.satellites.map((sat, idx) => (
                        <div key={sat.id || idx} className="flex items-center gap-3 p-2 rounded bg-dark-card">
                          <FileText className="w-4 h-4 text-purple-400" />
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
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
