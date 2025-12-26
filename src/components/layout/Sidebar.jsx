import { useEffect, useRef, useState } from 'react';
import {
  LayoutDashboard,
  Globe,
  Search,
  Workflow,
  TrendingUp,
  Settings,
  FileText,
  Target,
  Zap,
  BarChart3,
  Sparkles,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Plus
} from 'lucide-react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
  { icon: Globe, label: 'Sites', id: 'sites' },
  { icon: Search, label: 'Keywords', id: 'keywords' },
  { icon: Target, label: 'Quick Wins', id: 'quickwins' },
  { icon: FileText, label: 'Articles', id: 'articles' },
  { icon: Workflow, label: 'Workflows', id: 'workflows' },
];

export default function Sidebar({ activeView, onViewChange }) {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [appVersion, setAppVersion] = useState('');
  const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron;

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
      fontSize: 12,
      lineHeight: 1.3,
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

  return (
    <aside className="w-80 bg-dark-card border-r border-dark-border h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-dark-border">
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <span>SEO Command Center</span>
          {appVersion && (
            <span className="text-xs font-normal text-dark-muted">v{appVersion}</span>
          )}
        </h1>
      </div>

      {/* Navigation */}
      <nav className="p-3">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-dark-muted hover:bg-dark-border hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
          {/* Add Site Button */}
          <li>
          <button
            onClick={() => onViewChange('add-site')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
              activeView === 'add-site'
                ? 'bg-primary text-white'
                : 'text-dark-muted hover:bg-dark-border hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">Ajouter un site</span>
          </button>
          </li>
        </ul>
      </nav>

      {/* Claude Code Section */}
      <div className="flex-1 flex flex-col border-t border-dark-border min-h-0">
        {/* Claude Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-dark-border">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
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
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded hover:bg-dark-border text-dark-muted hover:text-white"
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Terminal */}
        {isExpanded && (
          <div
            ref={terminalRef}
            className="flex-1 overflow-hidden"
            style={{ backgroundColor: '#0f172a', minHeight: '200px' }}
            onClick={() => xtermRef.current?.focus()}
          />
        )}

        {!isElectron && isExpanded && (
          <div className="flex-1 flex items-center justify-center p-4">
            <p className="text-xs text-dark-muted text-center">
              npm run electron:dev
            </p>
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="p-3 border-t border-dark-border">
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-dark-muted hover:bg-dark-border hover:text-white transition-all">
          <Settings className="w-4 h-4" />
          <span className="font-medium">Settings</span>
        </button>
      </div>
    </aside>
  );
}
