import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Trash2, Loader2, Wrench, X, Sparkles } from 'lucide-react';

export default function ClaudePanel({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentTool, setCurrentTool] = useState(null);
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    connectWebSocket();
    return () => wsRef.current?.close();
  }, []);

  const connectWebSocket = () => {
    const ws = new WebSocket('ws://localhost:3002');

    ws.onopen = () => {
      setIsConnected(true);
      console.log('Connected to Claude backend');
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Retry connection after 3 seconds
      setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = () => setIsConnected(false);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'typing':
          setIsTyping(data.status);
          if (!data.status) setCurrentTool(null);
          break;
        case 'tool_use':
          setCurrentTool(data.tool);
          break;
        case 'response':
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: data.content,
            timestamp: new Date(),
          }]);
          break;
        case 'error':
          setMessages(prev => [...prev, {
            role: 'error',
            content: data.message,
            timestamp: new Date(),
          }]);
          break;
        case 'cleared':
          setMessages([]);
          break;
      }
    };

    wsRef.current = ws;
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = () => {
    if (!input.trim() || !isConnected) return;

    setMessages(prev => [...prev, {
      role: 'user',
      content: input,
      timestamp: new Date(),
    }]);

    wsRef.current?.send(JSON.stringify({
      type: 'chat',
      content: input,
    }));

    setInput('');
  };

  const clearChat = () => {
    wsRef.current?.send(JSON.stringify({ type: 'clear' }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Quick actions
  const quickActions = [
    { label: 'Quick Wins', prompt: 'Détecte les quick wins sur tous mes sites' },
    { label: 'Articles SRAT', prompt: 'Liste les derniers articles publiés sur srat.fr' },
    { label: 'Workflows', prompt: 'Liste mes workflows n8n actifs' },
    { label: 'Analyse KW', prompt: 'Analyse le keyword "diagnostic immobilier paris"' },
  ];

  return (
    <aside className="w-96 bg-dark-card border-l border-dark-border flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isConnected ? 'bg-gradient-to-br from-primary to-secondary' : 'bg-danger/20'}`}>
            <Sparkles className={`w-5 h-5 ${isConnected ? 'text-white' : 'text-danger'}`} />
          </div>
          <div>
            <h3 className="font-semibold text-white">Claude SEO</h3>
            <p className={`text-xs ${isConnected ? 'text-success' : 'text-danger'}`}>
              {isConnected ? 'Connecté aux MCPs' : 'Déconnecté - Backend requis'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearChat}
            className="p-2 rounded-lg hover:bg-dark-border text-dark-muted hover:text-white transition-colors"
            title="Effacer la conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-dark-border text-dark-muted hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      {messages.length === 0 && (
        <div className="p-4 border-b border-dark-border">
          <p className="text-xs text-dark-muted mb-2">Actions rapides</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => {
                  setInput(action.prompt);
                  setTimeout(sendMessage, 100);
                }}
                disabled={!isConnected}
                className="px-3 py-1.5 bg-dark-bg border border-dark-border rounded-lg text-xs text-dark-muted hover:text-white hover:border-primary transition-colors disabled:opacity-50"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-dark-muted text-sm py-8">
            <Bot className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="font-medium">Assistant SEO avec MCPs</p>
            <p className="mt-2 text-xs">
              Accès: WordPress, Supabase, n8n, DataForSEO
            </p>
            {!isConnected && (
              <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-lg text-warning text-xs">
                Lance le backend:<br/>
                <code className="bg-dark-bg px-2 py-1 rounded mt-1 inline-block">
                  cd server && npm run dev
                </code>
              </div>
            )}
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
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
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5">
              <div className="flex items-center gap-2 text-sm text-dark-muted">
                {currentTool ? (
                  <>
                    <Wrench className="w-4 h-4 text-warning animate-pulse" />
                    <span className="text-warning">{currentTool}</span>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Réflexion...</span>
                  </>
                )}
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
            placeholder={isConnected ? "Demande quelque chose..." : "Backend non connecté..."}
            disabled={!isConnected}
            rows={1}
            className="flex-1 bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-white text-sm placeholder:text-dark-muted focus:outline-none focus:border-primary resize-none disabled:opacity-50"
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || !isConnected}
            className="p-3 bg-primary rounded-xl text-white hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
