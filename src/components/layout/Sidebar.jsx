import { useEffect, useRef, useState } from 'react';
import {
  Globe,
  TrendingUp,
  Settings,
  Workflow,
  Key,
  Terminal,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Plus,
  ExternalLink,
  Brain
} from 'lucide-react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
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
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTerminalExpanded, setIsTerminalExpanded] = useState(true);
  const [appVersion, setAppVersion] = useState('');
  const [sites, setSites] = useState([]);
  const [entities, setEntities] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron;

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

  // Fetch app version
  useEffect(() => {
    if (window.updater) {
      window.updater.getStatus().then((status) => {
        setAppVersion(status.currentVersion || '');
      });
    }
  }, []);

  useEffect(() => {
    if (!isElectron || !terminalRef.current || xtermRef.current) return;

    const xterm = new XTerm({
      theme: {
        background: '#0f172a',
        foreground: '#e2e8f0',
        cursor: '#8b5cf6',
        cursorAccent: '#0f172a',
        selectionBackground: '#334155',
      },
      fontFamily: 'Menlo, Monaco, monospace',
      fontSize: 11,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'bar',
      scrollback: 5000,
    });

    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);
    xterm.open(terminalRef.current);

    setTimeout(() => fitAddon.fit(), 100);

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    xterm.onData((data) => {
      if (window.terminal) {
        window.terminal.write(data);
      }
    });

    window.terminal.onData((data) => {
      xterm.write(data);
    });

    window.terminal.onExit((code) => {
      xterm.writeln(`\r\n\x1b[33mClaude exited (${code})\x1b[0m`);
      setIsConnected(false);
    });

    window.terminal.start().then(() => {
      setIsConnected(true);
      setTimeout(() => {
        fitAddon.fit();
        const dims = fitAddon.proposeDimensions();
        if (dims) window.terminal.resize(dims.cols, dims.rows);
      }, 200);
    });

    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
        const dims = fitAddonRef.current.proposeDimensions();
        if (dims && window.terminal) {
          window.terminal.resize(dims.cols, dims.rows);
        }
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (window.terminal) {
        window.terminal.removeListeners();
        window.terminal.stop();
      }
      if (xtermRef.current) {
        xtermRef.current.dispose();
        xtermRef.current = null;
      }
    };
  }, [isElectron]);

  const restartClaude = async () => {
    if (!window.terminal) return;
    setIsConnected(false);
    await window.terminal.stop();
    if (xtermRef.current) {
      xtermRef.current.clear();
      xtermRef.current.writeln('\x1b[33mRedemarrage...\x1b[0m\r\n');
    }
    await window.terminal.start();
    setIsConnected(true);
    if (fitAddonRef.current) {
      fitAddonRef.current.fit();
    }
  };

  // Filter sites by search
  const filteredSites = sites.filter(site =>
    (site.mcp_alias || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (site.domain || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group sites by entity (use entity name instead of ID)
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
                const isActive = activeView === 'sites' || activeView === `site-${site.id}`;
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
            {searchTerm ? 'Aucun site trouvé' : 'Aucun site'}
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

      {/* SEO Coach */}
      <div className="p-2 border-t border-dark-border">
        <button
          onClick={() => onViewChange('coach')}
          className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeView === 'coach'
              ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg'
              : 'bg-dark-border text-white hover:bg-primary/20 hover:text-primary'
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>SEO Coach</span>
          <span className="ml-auto text-xs opacity-70">AI</span>
        </button>
      </div>

      {/* Config Section */}
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
        <button
          onClick={() => onViewChange('credentials')}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
            activeView === 'credentials'
              ? 'bg-primary/20 text-primary'
              : 'text-dark-muted hover:bg-dark-border hover:text-white'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Credentials</span>
        </button>
      </div>

      {/* Claude Code Section */}
      <div className="flex flex-col border-t border-dark-border min-h-0 flex-shrink-0" style={{ height: isTerminalExpanded ? '240px' : 'auto' }}>
        {/* Claude Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-dark-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-white">Claude Code</span>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-warning'}`} />
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={restartClaude}
              className="p-1 rounded hover:bg-dark-border text-dark-muted hover:text-white"
              title="Redemarrer"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
            <button
              onClick={() => setIsTerminalExpanded(!isTerminalExpanded)}
              className="p-1 rounded hover:bg-dark-border text-dark-muted hover:text-white"
            >
              {isTerminalExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Terminal */}
        {isTerminalExpanded && (
          <div
            ref={terminalRef}
            className="flex-1 overflow-hidden"
            style={{ backgroundColor: '#0f172a' }}
            onClick={() => xtermRef.current?.focus()}
          />
        )}

        {!isElectron && isTerminalExpanded && (
          <div className="flex-1 flex items-center justify-center p-4">
            <p className="text-xs text-dark-muted text-center">
              npm run electron:dev
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
