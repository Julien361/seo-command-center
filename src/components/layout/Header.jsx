import { useState, useEffect } from 'react';
import { Bell, Search, User, RefreshCw, Download, CheckCircle, Loader2 } from 'lucide-react';

export default function Header({ title, onRefresh, isLoading, rightAction }) {
  const [updateStatus, setUpdateStatus] = useState(null);
  const [currentVersion, setCurrentVersion] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Check if we're in Electron
    if (window.updater) {
      // Get initial status
      window.updater.getStatus().then((status) => {
        setCurrentVersion(status.currentVersion || '');
        if (status.updateAvailable) {
          setUpdateStatus({ status: 'available', info: status.updateAvailable });
        }
      });

      // Listen for status updates
      window.updater.onStatus((data) => {
        console.log('[Header] Update status:', data);
        setUpdateStatus(data);
        if (data.status !== 'checking') {
          setIsChecking(false);
        }
      });

      return () => {
        window.updater.removeListeners();
      };
    }
  }, []);

  const handleCheckUpdate = async () => {
    if (!window.updater || isChecking) return;
    setIsChecking(true);
    setUpdateStatus({ status: 'checking' });
    const result = await window.updater.check();
    console.log('[Header] Check result:', result);
    if (!result.available && !result.error) {
      setUpdateStatus({ status: 'up-to-date' });
    }
    setIsChecking(false);
  };

  const handleDownload = async () => {
    if (!window.updater) return;
    await window.updater.download();
  };

  const handleInstall = async () => {
    if (!window.updater) return;
    await window.updater.install();
  };

  const renderUpdateButton = () => {
    if (!window.updater) return null;

    const status = updateStatus?.status;

    if (status === 'checking' || isChecking) {
      return (
        <button
          disabled
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-border text-dark-muted text-sm"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Recherche...</span>
        </button>
      );
    }

    if (status === 'available') {
      return (
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/80 text-white text-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>v{updateStatus.info?.version}</span>
        </button>
      );
    }

    if (status === 'downloading') {
      const percent = Math.round(updateStatus.progress?.percent || 0);
      return (
        <button
          disabled
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-border text-dark-muted text-sm"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{percent}%</span>
        </button>
      );
    }

    if (status === 'downloaded') {
      return (
        <button
          onClick={handleInstall}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success hover:bg-success/80 text-white text-sm transition-colors"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Installer</span>
        </button>
      );
    }

    if (status === 'up-to-date') {
      return (
        <button
          onClick={handleCheckUpdate}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-border hover:bg-dark-border/80 text-dark-muted text-sm transition-colors"
          title="Version actuelle"
        >
          <CheckCircle className="w-4 h-4 text-success" />
          <span>v{currentVersion}</span>
        </button>
      );
    }

    // Default: show check button
    return (
      <button
        onClick={handleCheckUpdate}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-border hover:bg-dark-border/80 text-dark-muted text-sm transition-colors"
        title="Vérifier les mises à jour"
      >
        <Download className="w-4 h-4" />
        <span>v{currentVersion}</span>
      </button>
    );
  };

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
        {renderUpdateButton()}

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

        {rightAction && (
          <div className="pl-4 border-l border-dark-border">
            {rightAction}
          </div>
        )}
      </div>
    </header>
  );
}
