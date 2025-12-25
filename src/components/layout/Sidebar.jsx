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
  BarChart3
} from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
  { icon: Globe, label: 'Sites', id: 'sites' },
  { icon: Search, label: 'Keywords', id: 'keywords' },
  { icon: Target, label: 'Quick Wins', id: 'quickwins' },
  { icon: FileText, label: 'Articles', id: 'articles' },
  { icon: Workflow, label: 'Workflows', id: 'workflows' },
  { icon: BarChart3, label: 'Analytics', id: 'analytics' },
  { icon: Zap, label: 'Automations', id: 'automations' },
];

export default function Sidebar({ activeView, onViewChange }) {
  return (
    <aside className="w-64 bg-dark-card border-r border-dark-border h-screen flex flex-col">
      <div className="p-6 border-b border-dark-border">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" />
          SEO Command Center
        </h1>
        <p className="text-sm text-dark-muted mt-1">Julio SEO Hub</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-dark-muted hover:bg-dark-border hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-dark-border">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-dark-muted hover:bg-dark-border hover:text-white transition-all">
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </button>
      </div>
    </aside>
  );
}
