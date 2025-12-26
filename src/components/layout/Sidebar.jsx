import { useEffect, useRef, useState } from 'react';
import {
  LayoutDashboard,
  Globe,
  Search,
  Zap,
  Target,
  Link,
  FileSearch,
  GitBranch,
  Lightbulb,
  FileText,
  File,
  PenTool,
  Link2,
  Code,
  Image,
  Calendar,
  Send,
  TrendingUp,
  LineChart,
  BarChart3,
  Settings,
  MapPin,
  Bell,
  DollarSign,
  Workflow,
  Key,
  Terminal,
  Sparkles,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Plus,
  ExternalLink
} from 'lucide-react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { sitesApi } from '../../lib/supabase';

// Navigation configuration
const navigation = {
  analyse: {
    label: 'ANALYSE',
    items: [
      { id: 'keywords', icon: Search, label: 'Recherche KW' },
      { id: 'quickwins', icon: Zap, label: 'Quick Wins' },
      { id: 'concurrents', icon: Target, label: 'Concurrents' },
      { id: 'backlinks', icon: Link, label: 'Backlinks' },
      { id: 'audit-contenu', icon: FileSearch, label: 'Audit Contenu' },
      { id: 'cocons', icon: GitBranch, label: 'Cocons' }
    ]
  },
  creation: {
    label: 'CREATION',
    items: [
      { id: 'idees', icon: Lightbulb, label: 'Idees' },
      { id: 'briefs', icon: FileText, label: 'Briefs' },
      { id: 'pages', icon: File, label: 'Pages' },
      { id: 'articles', icon: PenTool, label: 'Articles' },
      { id: 'liens-internes', icon: Link2, label: 'Liens Internes' },
      { id: 'schema-markup', icon: Code, label: 'Schema Markup' },
      { id: 'images-seo', icon: Image, label: 'Images SEO' },
      { id: 'calendrier', icon: Calendar, label: 'Calendrier' },
      { id: 'publication', icon: Send, label: 'Publication' }
    ]
  },
  suivi: {
    label: 'SUIVI',
    items: [
      { id: 'ameliorations', icon: TrendingUp, label: 'Ameliorations' },
      { id: 'positions', icon: LineChart, label: 'Positions' },
      { id: 'performance', icon: BarChart3, label: 'Performance' },
      { id: 'seo-technique', icon: Settings, label: 'SEO Technique' },
      { id: 'seo-local', icon: MapPin, label: 'SEO Local' },
      { id: 'alertes', icon: Bell, label: 'Alertes' },
      { id: 'revenus', icon: DollarSign, label: 'Revenus' }
    ]
  },
  config: {
    label: 'CONFIG',
    items: [
      { id: 'workflows', icon: Workflow, label: 'Workflows n8n' },
      { id: 'credentials', icon: Key, label: 'Credentials & APIs' }
    ]
  }
};

// NavSection component
function NavSection({ section, items, activeView, onViewChange, isExpanded, onToggle }) {
  return (
    <div className="mb-2">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-dark-muted uppercase tracking-wider hover:text-white transition-colors"
      >
        <span>{section}</span>
        <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
      </button>
      {isExpanded && (
        <ul className="space-y-0.5 mt-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-dark-muted hover:bg-dark-border hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// Sites list component
function SitesList({ sites, activeView, onViewChange, isExpanded, onToggle }) {
  return (
    <div className="mb-2">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-dark-muted uppercase tracking-wider hover:text-white transition-colors"
      >
        <span className="flex items-center gap-1">
          <Globe className="w-3 h-3" />
          Sites ({sites.length})
        </span>
        <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
      </button>
      {isExpanded && (
        <ul className="space-y-0.5 mt-1 max-h-48 overflow-y-auto">
          {sites.map((site) => {
            const isActive = activeView === `site-${site.id}`;
            return (
              <li key={site.id}>
                <button
                  onClick={() => onViewChange(`site-${site.id}`)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all group ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-dark-muted hover:bg-dark-border hover:text-white'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${site.is_active ? 'bg-success' : 'bg-dark-muted'}`} />
                  <span className="truncate flex-1 text-left">{site.mcp_alias || site.domain}</span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-50 flex-shrink-0" />
                </button>
              </li>
            );
          })}
          <li>
            <button
              onClick={() => onViewChange('add-site')}
              className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${
                activeView === 'add-site'
                  ? 'bg-primary text-white'
                  : 'text-primary/70 hover:bg-dark-border hover:text-primary'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un site</span>
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}

export default function Sidebar({ activeView, onViewChange }) {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTerminalExpanded, setIsTerminalExpanded] = useState(true);
  const [appVersion, setAppVersion] = useState('');
  const [sites, setSites] = useState([]);
  const [expandedSections, setExpandedSections] = useState({
    sites: true,
    analyse: true,
    creation: false,
    suivi: false,
    config: false
  });
  const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron;

  // Load sites
  useEffect(() => {
    const loadSites = async () => {
      try {
        const data = await sitesApi.getAll();
        setSites(data || []);
      } catch (error) {
        console.error('Error loading sites:', error);
      }
    };
    loadSites();
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

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <aside className="w-72 bg-dark-card border-r border-dark-border h-screen flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-dark-border flex-shrink-0">
        <h1 className="text-base font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <span>SEO Command Center</span>
          {appVersion && (
            <span className="text-xs font-normal text-dark-muted">v{appVersion}</span>
          )}
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Dashboard */}
        <button
          onClick={() => onViewChange('dashboard')}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all mb-2 ${
            activeView === 'dashboard'
              ? 'bg-primary text-white'
              : 'text-dark-muted hover:bg-dark-border hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="font-medium">Dashboard</span>
        </button>

        {/* Sites */}
        <SitesList
          sites={sites}
          activeView={activeView}
          onViewChange={onViewChange}
          isExpanded={expandedSections.sites}
          onToggle={() => toggleSection('sites')}
        />

        {/* Divider */}
        <div className="border-t border-dark-border my-2" />

        {/* Analyse */}
        <NavSection
          section={navigation.analyse.label}
          items={navigation.analyse.items}
          activeView={activeView}
          onViewChange={onViewChange}
          isExpanded={expandedSections.analyse}
          onToggle={() => toggleSection('analyse')}
        />

        {/* Creation */}
        <NavSection
          section={navigation.creation.label}
          items={navigation.creation.items}
          activeView={activeView}
          onViewChange={onViewChange}
          isExpanded={expandedSections.creation}
          onToggle={() => toggleSection('creation')}
        />

        {/* Suivi */}
        <NavSection
          section={navigation.suivi.label}
          items={navigation.suivi.items}
          activeView={activeView}
          onViewChange={onViewChange}
          isExpanded={expandedSections.suivi}
          onToggle={() => toggleSection('suivi')}
        />

        {/* Config */}
        <NavSection
          section={navigation.config.label}
          items={navigation.config.items}
          activeView={activeView}
          onViewChange={onViewChange}
          isExpanded={expandedSections.config}
          onToggle={() => toggleSection('config')}
        />
      </nav>

      {/* Claude Code Section */}
      <div className="flex flex-col border-t border-dark-border min-h-0 flex-shrink-0" style={{ height: isTerminalExpanded ? '280px' : 'auto' }}>
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
