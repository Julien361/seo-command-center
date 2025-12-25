import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Trash2, Minimize2, Maximize2, Loader2, Wrench } from 'lucide-react';

export default function ClaudeChat({ isOpen, onToggle }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentTool, setCurrentTool] = useState(null);
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Connect to WebSocket
    const ws = new WebSocket('ws://localhost:3002');

    ws.onopen = () => {
      setIsConnected(true);
      console.log('Connected to Claude backend');
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('Disconnected from Claude backend');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

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

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = () => {
    if (!input.trim() || !isConnected) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

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

  if (!isOpen) return null;

  return (
    <div
      className={`fixed right-6 bottom-6 bg-dark-card border border-dark-border rounded-xl shadow-2xl flex flex-col transition-all duration-300 ${
        isMinimized ? 'w-80 h-14' : 'w-96 h-[600px]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isConnected ? 'bg-primary/20' : 'bg-danger/20'}`}>
            <Bot className={`w-5 h-5 ${isConnected ? 'text-primary' : 'text-danger'}`} />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">Claude SEO Assistant</h3>
            <p className={`text-xs ${isConnected ? 'text-success' : 'text-danger'}`}>
              {isConnected ? 'Connecté' : 'Déconnecté'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearChat}
            className="p-1.5 rounded hover:bg-dark-border text-dark-muted hover:text-white"
            title="Effacer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 rounded hover:bg-dark-border text-dark-muted hover:text-white"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-dark-muted text-sm py-8">
                <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Bonjour ! Je suis ton assistant SEO.</p>
                <p className="mt-1">Pose-moi une question sur tes sites WordPress, keywords, ou workflows n8n.</p>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' ? 'bg-primary/20' : msg.role === 'error' ? 'bg-danger/20' : 'bg-secondary/20'
                }`}>
                  {msg.role === 'user' ? (
                    <User className="w-4 h-4 text-primary" />
                  ) : (
                    <Bot className={`w-4 h-4 ${msg.role === 'error' ? 'text-danger' : 'text-secondary'}`} />
                  )}
                </div>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 ${
                  msg.role === 'user'
                    ? 'bg-primary text-white'
                    : msg.role === 'error'
                    ? 'bg-danger/20 text-danger'
                    : 'bg-dark-border text-white'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-secondary/20">
                  <Bot className="w-4 h-4 text-secondary" />
                </div>
                <div className="bg-dark-border rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 text-sm text-dark-muted">
                    {currentTool ? (
                      <>
                        <Wrench className="w-4 h-4 animate-pulse" />
                        <span>Exécution: {currentTool}</span>
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
          <div className="p-4 border-t border-dark-border">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pose ta question..."
                rows={1}
                className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white text-sm placeholder:text-dark-muted focus:outline-none focus:border-primary resize-none"
                style={{ minHeight: '40px', maxHeight: '120px' }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || !isConnected}
                className="p-2.5 bg-primary rounded-lg text-white hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-dark-muted mt-2">
              Entrée pour envoyer. Accès: WordPress, Supabase, n8n, Keywords.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
