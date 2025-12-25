import { useState, useEffect, useRef } from 'react';
import {
  Send, Bot, User, Trash2, Loader2, X, Sparkles,
  Terminal, Play, Square, AlertCircle
} from 'lucide-react';

export default function ClaudePanel({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentOutput, setCurrentOutput] = useState('');
  const messagesEndRef = useRef(null);
  const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron;

  useEffect(() => {
    if (!isElectron) return;

    // Check Claude status
    window.claude.status().then(({ running }) => {
      setIsRunning(running);
    });

    // Listen for Claude output
    window.claude.onOutput((data) => {
      if (data.type === 'stdout') {
        setCurrentOutput(prev => prev + data.data);

        // Check if response is complete (simple heuristic)
        if (data.data.includes('\n> ') || data.data.includes('\n❯ ')) {
          // Response complete
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: currentOutput + data.data,
            timestamp: new Date(),
          }]);
          setCurrentOutput('');
          setIsProcessing(false);
        }
      } else if (data.type === 'error') {
        setMessages(prev => [...prev, {
          role: 'error',
          content: data.data,
          timestamp: new Date(),
        }]);
        setIsProcessing(false);
      } else if (data.type === 'exit') {
        setIsRunning(false);
        setIsProcessing(false);
      }
    });

    return () => {
      if (isElectron) {
        window.claude.removeOutputListener();
      }
    };
  }, [isElectron]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentOutput]);

  const startClaude = async () => {
    if (!isElectron) return;
    await window.claude.start();
    setIsRunning(true);
  };

  const stopClaude = async () => {
    if (!isElectron) return;
    await window.claude.stop();
    setIsRunning(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || !isElectron || !isRunning) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);
    setCurrentOutput('');

    await window.claude.send(input);
    setInput('');
  };

  const clearChat = () => {
    setMessages([]);
    setCurrentOutput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Quick prompts
  const quickPrompts = [
    'Liste les derniers articles sur srat.fr',
    'Détecte les quick wins',
    'Liste mes workflows n8n',
    'Analyse le keyword "diagnostic immobilier"',
  ];

  // If not in Electron, show a message
  if (!isElectron) {
    return (
      <aside className="w-96 bg-dark-card border-l border-dark-border flex flex-col h-screen">
        <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Claude Code</h3>
              <p className="text-xs text-warning">Mode navigateur</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-dark-border text-dark-muted hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <Terminal className="w-16 h-16 mx-auto mb-4 text-dark-muted opacity-50" />
            <h4 className="text-white font-medium mb-2">Application Desktop requise</h4>
            <p className="text-sm text-dark-muted mb-4">
              Pour utiliser Claude avec les MCPs, lance l'application Electron.
            </p>
            <code className="block bg-dark-bg p-3 rounded-lg text-xs text-primary">
              npm run electron:dev
            </code>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-96 bg-dark-card border-l border-dark-border flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isRunning ? 'bg-gradient-to-br from-primary to-secondary' : 'bg-dark-border'
          }`}>
            <Sparkles className={`w-5 h-5 ${isRunning ? 'text-white' : 'text-dark-muted'}`} />
          </div>
          <div>
            <h3 className="font-semibold text-white">Claude Code</h3>
            <p className={`text-xs ${isRunning ? 'text-success' : 'text-dark-muted'}`}>
              {isRunning ? 'MCPs connectés' : 'Arrêté'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isRunning ? (
            <button
              onClick={stopClaude}
              className="p-2 rounded-lg hover:bg-dark-border text-danger"
              title="Arrêter Claude"
            >
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={startClaude}
              className="p-2 rounded-lg hover:bg-dark-border text-success"
              title="Démarrer Claude"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={clearChat}
            className="p-2 rounded-lg hover:bg-dark-border text-dark-muted hover:text-white"
            title="Effacer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-dark-border text-dark-muted hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Prompts */}
      {messages.length === 0 && isRunning && (
        <div className="p-4 border-b border-dark-border">
          <p className="text-xs text-dark-muted mb-2">Actions rapides</p>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => setInput(prompt)}
                className="px-3 py-1.5 bg-dark-bg border border-dark-border rounded-lg text-xs text-dark-muted hover:text-white hover:border-primary transition-colors"
              >
                {prompt.slice(0, 25)}...
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!isRunning && messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="w-16 h-16 mx-auto mb-4 text-dark-muted opacity-30" />
            <p className="text-dark-muted text-sm">Clique sur ▶ pour démarrer Claude Code</p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user'
                ? 'bg-primary'
                : msg.role === 'error'
                ? 'bg-danger/20'
                : 'bg-gradient-to-br from-primary/20 to-secondary/20'
            }`}>
              {msg.role === 'user' ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <Bot className={`w-4 h-4 ${msg.role === 'error' ? 'text-danger' : 'text-primary'}`} />
              )}
            </div>
            <div className={`max-w-[85%] rounded-xl px-4 py-2.5 ${
              msg.role === 'user'
                ? 'bg-primary text-white'
                : msg.role === 'error'
                ? 'bg-danger/10 border border-danger/30 text-danger'
                : 'bg-dark-bg border border-dark-border text-white'
            }`}>
              <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{msg.content}</pre>
            </div>
          </div>
        ))}

        {/* Current streaming output */}
        {currentOutput && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="max-w-[85%] rounded-xl px-4 py-2.5 bg-dark-bg border border-dark-border text-white">
              <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{currentOutput}</pre>
              <Loader2 className="w-4 h-4 animate-spin text-primary mt-2" />
            </div>
          </div>
        )}

        {isProcessing && !currentOutput && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5">
              <div className="flex items-center gap-2 text-sm text-dark-muted">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Réflexion...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-dark-border bg-dark-card">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRunning ? "Demande quelque chose..." : "Démarre Claude d'abord..."}
            disabled={!isRunning || isProcessing}
            rows={1}
            className="flex-1 bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-white text-sm placeholder:text-dark-muted focus:outline-none focus:border-primary resize-none disabled:opacity-50"
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || !isRunning || isProcessing}
            className="p-3 bg-primary rounded-xl text-white hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
