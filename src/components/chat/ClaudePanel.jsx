import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { X, RotateCcw, Sparkles } from 'lucide-react';
import 'xterm/css/xterm.css';

export default function ClaudePanel({ onClose }) {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron;

  useEffect(() => {
    console.log('[ClaudePanel] useEffect running');
    console.log('[ClaudePanel] isElectron:', isElectron);
    console.log('[ClaudePanel] window.terminal:', window.terminal);
    console.log('[ClaudePanel] terminalRef.current:', !!terminalRef.current);

    if (!isElectron || !terminalRef.current) return;

    // Initialize xterm
    const xterm = new XTerm({
      theme: {
        background: '#0f172a',
        foreground: '#e2e8f0',
        cursor: '#8b5cf6',
        cursorAccent: '#0f172a',
        selectionBackground: '#334155',
        black: '#0f172a',
        red: '#ef4444',
        green: '#22c55e',
        yellow: '#eab308',
        blue: '#3b82f6',
        magenta: '#8b5cf6',
        cyan: '#06b6d4',
        white: '#e2e8f0',
        brightBlack: '#475569',
        brightRed: '#f87171',
        brightGreen: '#4ade80',
        brightYellow: '#facc15',
        brightBlue: '#60a5fa',
        brightMagenta: '#a78bfa',
        brightCyan: '#22d3ee',
        brightWhite: '#f8fafc',
      },
      fontFamily: 'JetBrains Mono, Menlo, Monaco, monospace',
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: 'bar',
      scrollback: 5000,
      allowTransparency: true,
    });

    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);
    xterm.open(terminalRef.current);

    // Small delay to ensure container is sized
    setTimeout(() => {
      fitAddon.fit();
    }, 100);

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    // Handle user input
    xterm.onData((data) => {
      console.log('[ClaudePanel] User typed:', JSON.stringify(data));
      console.log('[ClaudePanel] window.terminal exists:', !!window.terminal);
      if (window.terminal) {
        window.terminal.write(data);
      } else {
        console.error('[ClaudePanel] window.terminal is undefined!');
      }
    });

    // Handle terminal output
    window.terminal.onData((data) => {
      xterm.write(data);
    });

    // Handle terminal exit
    window.terminal.onExit((code) => {
      xterm.writeln(`\r\n\x1b[33mClaude exited with code ${code}\x1b[0m`);
      setIsConnected(false);
    });

    // Start Claude
    window.terminal.start().then(() => {
      setIsConnected(true);
      // Resize after start
      setTimeout(() => {
        fitAddon.fit();
        const dims = fitAddon.proposeDimensions();
        if (dims) {
          window.terminal.resize(dims.cols, dims.rows);
        }
      }, 200);
    });

    // Handle resize
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

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (window.terminal) {
        window.terminal.removeListeners();
        window.terminal.stop();
      }
      if (xtermRef.current) {
        xtermRef.current.dispose();
      }
    };
  }, [isElectron]);

  const restartClaude = async () => {
    if (!isElectron) return;

    setIsConnected(false);
    await window.terminal.stop();

    if (xtermRef.current) {
      xtermRef.current.clear();
      xtermRef.current.writeln('\x1b[33mRedemarrage de Claude...\x1b[0m\r\n');
    }

    await window.terminal.start();
    setIsConnected(true);

    if (fitAddonRef.current) {
      fitAddonRef.current.fit();
      const dims = fitAddonRef.current.proposeDimensions();
      if (dims) {
        window.terminal.resize(dims.cols, dims.rows);
      }
    }
  };

  // If not in Electron, show message
  if (!isElectron) {
    return (
      <aside className="w-[420px] bg-dark-card border-l border-dark-border flex flex-col h-screen">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-primary opacity-50" />
            <p className="text-sm text-dark-muted">
              Lance l'app avec <code className="bg-dark-bg px-2 py-1 rounded">npm run electron:dev</code>
            </p>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-[420px] bg-dark-card border-l border-dark-border flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Claude Code</h3>
            <p className={`text-xs ${isConnected ? 'text-success' : 'text-warning'}`}>
              {isConnected ? 'Connecte' : 'Connexion...'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={restartClaude}
            className="p-2 rounded-lg hover:bg-dark-border text-dark-muted hover:text-white"
            title="Redemarrer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-dark-border text-dark-muted hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-hidden p-2"
        style={{ backgroundColor: '#0f172a' }}
      />
    </aside>
  );
}
