import { useState } from 'react';
import {
  Sparkles, X, Terminal, Database, Workflow, Globe,
  Search, FileText, Target, Zap, Copy, Check,
  ExternalLink, ChevronDown, ChevronRight
} from 'lucide-react';

const MCP_STATUS = [
  { name: 'julio-seo-hub', status: 'connected', tools: ['WordPress', 'Supabase', 'SEO Analysis', 'Quick Wins'] },
  { name: 'n8n-mcp', status: 'connected', tools: ['Workflows', 'Executions', 'Webhooks'] },
];

const PROMPT_CATEGORIES = [
  {
    title: 'WordPress',
    icon: Globe,
    prompts: [
      { label: 'Derniers articles SRAT', prompt: 'Liste les 5 derniers articles publiés sur srat.fr' },
      { label: 'Créer un article', prompt: 'Crée un article sur [sujet] pour le site [alias]' },
      { label: 'Articles tous sites', prompt: 'Combien d\'articles sont publiés sur chaque site ?' },
    ]
  },
  {
    title: 'Keywords & SEO',
    icon: Search,
    prompts: [
      { label: 'Analyser un keyword', prompt: 'Analyse SEO complète pour le keyword "[keyword]"' },
      { label: 'Quick Wins', prompt: 'Détecte les quick wins sur tous mes sites' },
      { label: 'Concurrents', prompt: 'Analyse les concurrents pour "[keyword]"' },
    ]
  },
  {
    title: 'Workflows n8n',
    icon: Workflow,
    prompts: [
      { label: 'Lister workflows', prompt: 'Liste mes workflows n8n actifs' },
      { label: 'Lancer WF0', prompt: 'Exécute le workflow WF0 SEO Cascade Starter' },
      { label: 'Dernières exécutions', prompt: 'Montre les dernières exécutions de workflows' },
    ]
  },
  {
    title: 'Base de données',
    icon: Database,
    prompts: [
      { label: 'Stats sites', prompt: 'Requête Supabase: statistiques de tous les sites' },
      { label: 'Keywords suivis', prompt: 'Combien de keywords sont suivis par site ?' },
      { label: 'Positions moyennes', prompt: 'Quelle est la position moyenne par site ?' },
    ]
  },
];

export default function ClaudePanel({ onClose }) {
  const [copiedPrompt, setCopiedPrompt] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState('WordPress');

  const copyPrompt = (prompt) => {
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(prompt);
    setTimeout(() => setCopiedPrompt(null), 2000);
  };

  return (
    <aside className="w-80 bg-dark-card border-l border-dark-border flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Claude Code</h3>
            <p className="text-xs text-success">MCPs connectés</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-dark-border text-dark-muted hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Info Banner */}
      <div className="p-4 bg-primary/10 border-b border-primary/20">
        <div className="flex items-start gap-3">
          <Terminal className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="text-white font-medium">Claude Code = MCPs + Skills</p>
            <p className="text-dark-muted mt-1">
              Utilise le terminal Claude Code pour exécuter ces actions. Copie un prompt ci-dessous.
            </p>
          </div>
        </div>
      </div>

      {/* MCP Status */}
      <div className="p-4 border-b border-dark-border">
        <p className="text-xs text-dark-muted mb-3 uppercase tracking-wide">MCPs Actifs</p>
        <div className="space-y-2">
          {MCP_STATUS.map((mcp) => (
            <div key={mcp.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span className="text-sm text-white">{mcp.name}</span>
              </div>
              <span className="text-xs text-dark-muted">{mcp.tools.length} outils</span>
            </div>
          ))}
        </div>
      </div>

      {/* Prompt Suggestions */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <p className="text-xs text-dark-muted mb-3 uppercase tracking-wide">Prompts suggérés</p>

          <div className="space-y-2">
            {PROMPT_CATEGORIES.map((category) => {
              const Icon = category.icon;
              const isExpanded = expandedCategory === category.title;

              return (
                <div key={category.title} className="bg-dark-bg rounded-lg border border-dark-border overflow-hidden">
                  <button
                    onClick={() => setExpandedCategory(isExpanded ? null : category.title)}
                    className="w-full flex items-center justify-between p-3 hover:bg-dark-border/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-white">{category.title}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-dark-muted" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-dark-muted" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-2">
                      {category.prompts.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 bg-dark-card rounded-lg group"
                        >
                          <span className="text-xs text-dark-muted group-hover:text-white transition-colors">
                            {item.label}
                          </span>
                          <button
                            onClick={() => copyPrompt(item.prompt)}
                            className="p-1.5 rounded hover:bg-dark-border transition-colors"
                            title="Copier le prompt"
                          >
                            {copiedPrompt === item.prompt ? (
                              <Check className="w-3.5 h-3.5 text-success" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-dark-muted" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-dark-border bg-dark-bg">
        <a
          href="https://claude.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-dark-card border border-dark-border rounded-lg text-sm text-dark-muted hover:text-white hover:border-primary transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Ouvrir Claude.ai
        </a>
        <p className="text-xs text-dark-muted text-center mt-2">
          Pour les MCPs, utilise Claude Code
        </p>
      </div>
    </aside>
  );
}
