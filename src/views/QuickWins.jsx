import { useState, useEffect } from 'react';
import { Target, Zap, ArrowUpRight, FileText, ExternalLink, TrendingUp, RefreshCw, Loader2, CheckCircle } from 'lucide-react';
import { Card, Badge, Button, StatCard } from '../components/common';
import { quickWinsApi, sitesApi } from '../lib/supabase';
import { n8nApi } from '../lib/n8n';

const statusConfig = {
  pending: { color: 'warning', label: 'A traiter' },
  in_progress: { color: 'info', label: 'En cours' },
  done: { color: 'success', label: 'Termine' },
  skipped: { color: 'secondary', label: 'Ignore' },
};

export default function QuickWins() {
  const [quickWins, setQuickWins] = useState([]);
  const [sites, setSites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSite, setFilterSite] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [qwData, sitesData] = await Promise.all([
        quickWinsApi.getAll(),
        sitesApi.getAll()
      ]);
      setQuickWins(qwData || []);
      setSites(sitesData || []);
    } catch (err) {
      console.error('Erreur chargement quick wins:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      const result = await n8nApi.recalculateQuickWins();
      if (result.success) {
        // Recharger apres un delai
        setTimeout(loadData, 3000);
      } else {
        alert('Erreur: ' + result.error);
      }
    } catch (err) {
      alert('Erreur: ' + err.message);
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await quickWinsApi.updateStatus(id, newStatus);
      setQuickWins(prev => prev.map(qw =>
        qw.id === id ? { ...qw, status: newStatus } : qw
      ));
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  const filteredWins = quickWins
    .filter(win => filterStatus === 'all' || win.status === filterStatus)
    .filter(win => filterSite === 'all' || win.site_id === filterSite)
    .sort((a, b) => (b.opportunity_score || 0) - (a.opportunity_score || 0));

  const stats = {
    total: quickWins.length,
    pending: quickWins.filter(w => w.status === 'pending').length,
    done: quickWins.filter(w => w.status === 'done').length,
    totalVolume: quickWins.reduce((sum, w) => sum + (w.search_volume || 0), 0),
  };

  const getSiteName = (siteId) => {
    const site = sites.find(s => s.id === siteId);
    return site?.mcp_alias || site?.domain || '-';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Target className="w-8 h-8 text-warning" />
            Quick Wins Detectees
          </h2>
          <p className="text-dark-muted mt-1">
            {isLoading ? 'Chargement...' : `${quickWins.length} opportunites de gain rapide`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={loadData}
            disabled={isLoading}
          >
            Actualiser
          </Button>
          <Button
            variant="outline"
            icon={isRecalculating ? Loader2 : Zap}
            onClick={handleRecalculate}
            disabled={isRecalculating}
          >
            {isRecalculating ? 'Calcul...' : 'Recalculer WF7'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 text-danger">
          Erreur: {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Quick Wins Total"
          value={stats.total}
          icon={Target}
          color="warning"
        />
        <StatCard
          title="A traiter"
          value={stats.pending}
          icon={Zap}
          color="info"
        />
        <StatCard
          title="Terminees"
          value={stats.done}
          icon={CheckCircle}
          color="success"
        />
        <StatCard
          title="Volume Total"
          value={stats.totalVolume.toLocaleString()}
          change="recherches/mois"
          icon={TrendingUp}
          color="primary"
        />
      </div>

      <Card>
        <div className="flex items-center gap-4 mb-6">
          <span className="text-sm text-dark-muted">Filtrer:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
          >
            <option value="all">Tous les statuts</option>
            {Object.entries(statusConfig).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
          <select
            value={filterSite}
            onChange={(e) => setFilterSite(e.target.value)}
            className="bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
          >
            <option value="all">Tous les sites</option>
            {sites.map(site => (
              <option key={site.id} value={site.id}>{site.mcp_alias}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filteredWins.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-dark-muted mx-auto mb-4" />
            <p className="text-dark-muted">Aucune quick win trouvee</p>
            <Button
              className="mt-4"
              icon={Zap}
              onClick={handleRecalculate}
            >
              Lancer la detection
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredWins.map((win) => (
              <div
                key={win.id}
                className="flex items-center justify-between p-5 bg-dark-bg rounded-xl border border-dark-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 rounded-lg bg-warning/20">
                    <Target className="w-6 h-6 text-warning" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-white">{win.keyword}</h4>
                      <Badge variant={statusConfig[win.status]?.color || 'secondary'} size="sm">
                        {statusConfig[win.status]?.label || win.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-dark-muted">
                      <span className="flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        {getSiteName(win.site_id)}
                      </span>
                      <span>Position: <span className="text-warning font-medium">{win.current_position || '-'}</span></span>
                      <span>Volume: <span className="text-white">{(win.search_volume || 0).toLocaleString()}</span></span>
                      <span>Difficulte: <span className="text-success">{win.difficulty || '-'}</span></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-dark-muted">Score</p>
                    <p className="text-primary font-semibold">{Math.round(win.opportunity_score || 0)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-dark-muted">Action</p>
                    <p className="text-sm text-white font-medium">{win.recommended_action || 'Optimiser'}</p>
                  </div>
                  {win.status === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={CheckCircle}
                      onClick={() => handleUpdateStatus(win.id, 'done')}
                    >
                      Fait
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
