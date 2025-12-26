import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, TrendingDown, TrendingUp, CheckCircle, Clock, X, Filter, Settings, Plus, Trash2 } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { sitesApi, supabase } from '../../lib/supabase';

// Alert type configuration
const alertTypes = {
  position_drop: {
    label: 'Chute de position',
    icon: TrendingDown,
    color: 'text-danger',
    bgColor: 'bg-danger/10',
    description: 'Keyword descendu de plus de 5 positions'
  },
  position_gain: {
    label: 'Gain de position',
    icon: TrendingUp,
    color: 'text-success',
    bgColor: 'bg-success/10',
    description: 'Keyword monte de plus de 5 positions'
  },
  traffic_drop: {
    label: 'Baisse de trafic',
    icon: AlertTriangle,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    description: 'Trafic en baisse de plus de 20%'
  },
  new_quick_win: {
    label: 'Nouveau Quick Win',
    icon: TrendingUp,
    color: 'text-info',
    bgColor: 'bg-info/10',
    description: 'Opportunite de quick win detectee'
  },
  error_404: {
    label: 'Erreur 404',
    icon: AlertTriangle,
    color: 'text-danger',
    bgColor: 'bg-danger/10',
    description: 'Page non trouvee detectee'
  },
  indexing_issue: {
    label: 'Probleme indexation',
    icon: AlertTriangle,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    description: 'Page non indexee ou desindexee'
  }
};

// Alert item
function AlertItem({ alert, onDismiss, onMarkRead }) {
  const config = alertTypes[alert.alert_type] || alertTypes.position_drop;
  const Icon = config.icon;
  const isUnread = !alert.read_at;

  return (
    <div className={`p-4 border-b border-dark-border hover:bg-dark-border/30 transition-colors ${isUnread ? 'bg-dark-border/20' : ''}`}>
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-lg ${config.bgColor}`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-white font-medium">{config.label}</h4>
            {isUnread && <Badge variant="primary" size="sm">Nouveau</Badge>}
          </div>
          <p className="text-dark-muted text-sm mt-1">{alert.message}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-dark-muted">
            {alert.sites?.mcp_alias && (
              <span>{alert.sites.mcp_alias}</span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(alert.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isUnread && (
            <button
              onClick={() => onMarkRead(alert.id)}
              className="p-1.5 hover:bg-dark-border rounded text-dark-muted hover:text-success"
              title="Marquer comme lu"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onDismiss(alert.id)}
            className="p-1.5 hover:bg-dark-border rounded text-dark-muted hover:text-danger"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Alert settings modal
function AlertSettingsModal({ settings, onClose, onSave }) {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleToggle = (key) => {
    setLocalSettings({ ...localSettings, [key]: !localSettings[key] });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <Card className="w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Configuration des alertes</h3>
          <button onClick={onClose} className="text-dark-muted hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {Object.entries(alertTypes).map(([key, config]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-dark-border/30 rounded-lg">
              <div className="flex items-center gap-3">
                <config.icon className={`w-5 h-5 ${config.color}`} />
                <div>
                  <p className="text-white text-sm">{config.label}</p>
                  <p className="text-xs text-dark-muted">{config.description}</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings[key] !== false}
                  onChange={() => handleToggle(key)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-dark-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          ))}
        </div>

        <div className="flex gap-2 justify-end mt-6">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button onClick={() => { onSave(localSettings); onClose(); }}>Enregistrer</Button>
        </div>
      </Card>
    </div>
  );
}

export default function Alertes() {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, type
  const [typeFilter, setTypeFilter] = useState('all');
  const [showSettings, setShowSettings] = useState(false);
  const [alertSettings, setAlertSettings] = useState({});

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('alerts')
        .select('*, sites(mcp_alias, domain)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error) {
        setAlerts(data || []);
      }
    } catch (err) {
      console.error('Error loading alerts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkRead = async (alertId) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ read_at: new Date().toISOString() })
        .eq('id', alertId);

      if (!error) {
        setAlerts(alerts.map(a => a.id === alertId ? { ...a, read_at: new Date().toISOString() } : a));
      }
    } catch (err) {
      console.error('Error marking alert as read:', err);
    }
  };

  const handleDismiss = async (alertId) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', alertId);

      if (!error) {
        setAlerts(alerts.filter(a => a.id !== alertId));
      }
    } catch (err) {
      console.error('Error dismissing alert:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const unreadIds = alerts.filter(a => !a.read_at).map(a => a.id);
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('alerts')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadIds);

      if (!error) {
        setAlerts(alerts.map(a => ({ ...a, read_at: a.read_at || new Date().toISOString() })));
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'unread' && alert.read_at) return false;
    if (typeFilter !== 'all' && alert.alert_type !== typeFilter) return false;
    return true;
  });

  // Stats
  const stats = {
    total: alerts.length,
    unread: alerts.filter(a => !a.read_at).length,
    critical: alerts.filter(a => ['position_drop', 'error_404', 'traffic_drop'].includes(a.alert_type)).length,
    positive: alerts.filter(a => ['position_gain', 'new_quick_win'].includes(a.alert_type)).length
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
          <h1 className="text-2xl font-bold text-white">Alertes SEO</h1>
          <p className="text-dark-muted mt-1">Notifications et alertes en temps reel</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowSettings(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Configurer
          </Button>
          {stats.unread > 0 && (
            <Button variant="secondary" onClick={handleMarkAllRead}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Tout marquer lu
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-sm text-dark-muted">Total alertes</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info/10">
              <Clock className="w-5 h-5 text-info" />
            </div>
            <div>
              <div className="text-2xl font-bold text-info">{stats.unread}</div>
              <div className="text-sm text-dark-muted">Non lues</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-danger/10">
              <AlertTriangle className="w-5 h-5 text-danger" />
            </div>
            <div>
              <div className="text-2xl font-bold text-danger">{stats.critical}</div>
              <div className="text-sm text-dark-muted">Critiques</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div>
              <div className="text-2xl font-bold text-success">{stats.positive}</div>
              <div className="text-sm text-dark-muted">Positives</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm ${filter === 'all' ? 'bg-primary text-white' : 'bg-dark-border text-dark-muted hover:text-white'}`}
            >
              Toutes
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg text-sm ${filter === 'unread' ? 'bg-primary text-white' : 'bg-dark-border text-dark-muted hover:text-white'}`}
            >
              Non lues ({stats.unread})
            </button>
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
          >
            <option value="all">Tous les types</option>
            {Object.entries(alertTypes).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Alerts list */}
      <Card className="overflow-hidden">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-12 h-12 mx-auto text-dark-muted mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Aucune alerte</h3>
            <p className="text-dark-muted">
              {filter === 'unread' ? 'Toutes les alertes ont ete lues' : 'Aucune alerte pour le moment'}
            </p>
          </div>
        ) : (
          <div>
            {filteredAlerts.map(alert => (
              <AlertItem
                key={alert.id}
                alert={alert}
                onDismiss={handleDismiss}
                onMarkRead={handleMarkRead}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Settings modal */}
      {showSettings && (
        <AlertSettingsModal
          settings={alertSettings}
          onClose={() => setShowSettings(false)}
          onSave={setAlertSettings}
        />
      )}
    </div>
  );
}
