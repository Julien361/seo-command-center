import { Bell, Search, User, RefreshCw } from 'lucide-react';

export default function Header({ title, onRefresh, isLoading }) {
  return (
    <header className="h-16 bg-dark-card border-b border-dark-border flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-lg hover:bg-dark-border transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 text-dark-muted ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="bg-dark-bg border border-dark-border rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-dark-muted focus:outline-none focus:border-primary w-64"
          />
        </div>

        <button className="relative p-2 rounded-lg hover:bg-dark-border transition-colors">
          <Bell className="w-5 h-5 text-dark-muted" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-dark-border">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-medium text-white">Julio</span>
        </div>
      </div>
    </header>
  );
}
