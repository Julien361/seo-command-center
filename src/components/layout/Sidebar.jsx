import { useEffect, useState } from 'react';
import {
  Globe,
  TrendingUp,
  Workflow,
  Plus
} from 'lucide-react';
import { sitesApi, supabase } from '../../lib/supabase';

// Entity color mapping
const entityColors = {
  'SRAT': 'bg-primary',
  'PRO FORMATION': 'bg-success',
  'METIS': 'bg-info',
  'Client': 'bg-warning',
  'Cabinet': 'bg-secondary',
};

export default function Sidebar({ activeView, onViewChange }) {
  const [appVersion, setAppVersion] = useState('');
  const [sites, setSites] = useState([]);
  const [entities, setEntities] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  // Load sites and entities
  useEffect(() => {
    const loadSites = async () => {
      try {
        // Load entities first
        const { data: entitiesData } = await supabase.from('entities').select('id, name');
        const entityMap = {};
        (entitiesData || []).forEach(e => { entityMap[e.id] = e.name; });
        setEntities(entityMap);

        // Load sites
        const data = await sitesApi.getAll();
        setSites(data || []);
      } catch (error) {
        console.error('Error loading sites:', error);
      }
    };
    loadSites();

    // Refresh sites periodically
    const interval = setInterval(loadSites, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch app version (for Electron)
  useEffect(() => {
    if (window.updater) {
      window.updater.getStatus().then((status) => {
        setAppVersion(status.currentVersion || '');
      });
    }
  }, []);

  // Filter sites by search
  const filteredSites = sites.filter(site =>
    (site.mcp_alias || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (site.domain || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group sites by entity
  const sitesByEntity = filteredSites.reduce((acc, site) => {
    const entityName = entities[site.entity_id] || 'Autres';
    if (!acc[entityName]) acc[entityName] = [];
    acc[entityName].push(site);
    return acc;
  }, {});

  return (
    <aside className="w-64 bg-dark-card border-r border-dark-border h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-dark-border flex-shrink-0">
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <span>SEO Hub</span>
        </h1>
        {appVersion && (
          <span className="text-xs text-dark-muted">v{appVersion}</span>
        )}
      </div>

      {/* Sites Search */}
      <div className="p-3 border-b border-dark-border">
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
          <input
            type="text"
            placeholder="Rechercher un site..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-dark-bg border border-dark-border rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-dark-muted focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Sites List */}
      <nav className="flex-1 overflow-y-auto p-2">
        {Object.entries(sitesByEntity).map(([entity, entitySites]) => (
          <div key={entity} className="mb-3">
            <div className="flex items-center gap-2 px-2 py-1 mb-1">
              <span className={`w-2 h-2 rounded-full ${entityColors[entity] || 'bg-dark-muted'}`} />
              <span className="text-xs font-medium text-dark-muted uppercase tracking-wide">{entity}</span>
              <span className="text-xs text-dark-muted">({entitySites.length})</span>
            </div>
            <ul className="space-y-0.5">
              {entitySites.map((site) => {
                const isActive = activeView === `site-${site.id}`;
                return (
                  <li key={site.id}>
                    <button
                      onClick={() => onViewChange(`site-${site.id}`, site)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all group ${
                        isActive
                          ? 'bg-primary/20 text-primary border border-primary/30'
                          : 'text-dark-muted hover:bg-dark-border hover:text-white'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${site.is_active ? 'bg-success' : 'bg-dark-muted'}`} />
                      <span className="truncate flex-1 text-left font-medium">{site.mcp_alias || site.domain}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {filteredSites.length === 0 && (
          <div className="text-center py-8 text-dark-muted text-sm">
            {searchTerm ? 'Aucun site trouve' : 'Aucun site'}
          </div>
        )}
      </nav>

      {/* Add Site Button */}
      <div className="p-3 border-t border-dark-border">
        <button
          onClick={() => onViewChange('add-site')}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeView === 'add-site'
              ? 'bg-primary text-white'
              : 'bg-dark-border text-white hover:bg-primary/20 hover:text-primary'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un site</span>
        </button>
      </div>

      {/* Workflows Button */}
      <div className="p-2 border-t border-dark-border">
        <button
          onClick={() => onViewChange('workflows')}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
            activeView === 'workflows'
              ? 'bg-primary/20 text-primary'
              : 'text-dark-muted hover:bg-dark-border hover:text-white'
          }`}
        >
          <Workflow className="w-4 h-4" />
          <span>Workflows n8n</span>
        </button>
      </div>
    </aside>
  );
}
