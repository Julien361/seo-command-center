import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Key, CheckCircle, AlertCircle, Loader2, ExternalLink, Trash2, RefreshCw } from 'lucide-react';
import { Card, Button } from '../components/common';
import {
  getGoogleCredentials,
  saveGoogleCredentials,
  isGoogleConnected,
  getAuthUrl,
  exchangeCodeForTokens,
  clearGoogleTokens,
  getGSCSites
} from '../lib/google';

export default function Settings() {
  const [googleCredentials, setGoogleCredentials] = useState({
    client_id: '',
    client_secret: ''
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [gscSites, setGscSites] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(true);

  // Load saved credentials on mount
  useEffect(() => {
    const saved = getGoogleCredentials();
    if (saved) {
      setGoogleCredentials(saved);
    }
    setIsConnected(isGoogleConnected());
    setIsLoadingCredentials(false);

    // Load GSC sites if connected
    if (isGoogleConnected()) {
      loadGSCSites();
    }
  }, []);

  const loadGSCSites = async () => {
    try {
      const sites = await getGSCSites();
      setGscSites(sites);
    } catch (error) {
      console.error('Error loading GSC sites:', error);
    }
  };

  const handleCredentialsChange = (e) => {
    const { name, value } = e.target;
    setGoogleCredentials(prev => ({ ...prev, [name]: value }));
    setMessage({ type: '', text: '' });
  };

  const handleSaveCredentials = () => {
    if (!googleCredentials.client_id || !googleCredentials.client_secret) {
      setMessage({ type: 'error', text: 'Veuillez remplir les deux champs' });
      return;
    }
    saveGoogleCredentials(googleCredentials);
    setMessage({ type: 'success', text: 'Credentials sauvegardés !' });
  };

  const handleConnectGoogle = async () => {
    if (!googleCredentials.client_id || !googleCredentials.client_secret) {
      setMessage({ type: 'error', text: 'Veuillez d\'abord sauvegarder vos credentials' });
      return;
    }

    setIsConnecting(true);
    setMessage({ type: '', text: '' });

    try {
      // Save credentials first
      saveGoogleCredentials(googleCredentials);

      // Get auth URL and start OAuth flow
      const authUrl = getAuthUrl(googleCredentials);

      if (window.googleAuth) {
        // Electron: use IPC to open browser and capture callback
        const result = await window.googleAuth.startAuth(authUrl);

        if (result.success && result.code) {
          // Exchange code for tokens
          await exchangeCodeForTokens(result.code, googleCredentials);
          setIsConnected(true);
          setMessage({ type: 'success', text: 'Connexion Google reussie !' });
          await loadGSCSites();
        }
      } else {
        // Fallback: open in new window (for dev mode)
        window.open(authUrl, '_blank');
        setMessage({
          type: 'info',
          text: 'Authentifiez-vous dans le navigateur puis collez le code ici'
        });
      }
    } catch (error) {
      console.error('Google auth error:', error);
      setMessage({ type: 'error', text: error.message || 'Erreur de connexion' });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    clearGoogleTokens();
    setIsConnected(false);
    setGscSites([]);
    setMessage({ type: 'success', text: 'Deconnecte de Google' });
  };

  if (isLoadingCredentials) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Parametres</h2>
        <p className="text-dark-muted mt-1">Configuration des integrations</p>
      </div>

      {/* Google Search Console */}
      <Card>
        <div className="flex items-center gap-4 pb-6 border-b border-dark-border">
          <div className="w-12 h-12 bg-danger/20 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M5.27 9.87L5.27 9.87 1.18 8.5c-.38 1.06-.57 2.17-.57 3.31 0 1.14.19 2.25.57 3.31l4.09-1.37c-.24-.72-.36-1.48-.36-2.25s.12-1.53.36-2.25z"/>
              <path fill="#FBBC05" d="M12 5.07c1.43 0 2.74.52 3.76 1.37l2.98-2.98C16.95 1.72 14.61.75 12 .75c-4.43 0-8.24 2.52-10.14 6.2l4.09 1.37c.97-2.93 3.71-5.07 6.91-5.07z"/>
              <path fill="#34A853" d="M12 18.93c-3.2 0-5.94-2.14-6.91-5.07l-4.09 1.37c1.9 3.68 5.71 6.2 10.14 6.2 2.48 0 4.85-.87 6.67-2.49l-3.89-3.01c-1.01.68-2.25 1.08-3.63 1.08z"/>
              <path fill="#4285F4" d="M23.25 12c0-.77-.07-1.53-.2-2.25H12v4.5h6.32c-.27 1.43-1.08 2.64-2.29 3.45l3.89 3.01c2.27-2.09 3.58-5.17 3.58-8.71z"/>
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">Google Search Console</h3>
            <p className="text-sm text-dark-muted">Connectez GSC pour synchroniser positions et trafic</p>
          </div>
          {isConnected && (
            <div className="flex items-center gap-2 text-success">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Connecte</span>
            </div>
          )}
        </div>

        <div className="pt-6 space-y-6">
          {/* Step 1: Create OAuth credentials */}
          <div className="bg-dark-bg rounded-lg p-4">
            <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
              <span className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs">1</span>
              Creer des credentials OAuth2
            </h4>
            <ol className="text-sm text-dark-muted space-y-1 ml-8 list-decimal">
              <li>
                Allez sur{' '}
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Google Cloud Console <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>Creez un projet ou selectionnez-en un existant</li>
              <li>Activez l'API "Search Console API"</li>
              <li>Creez des identifiants OAuth 2.0 (type: Application de bureau)</li>
              <li>Ajoutez <code className="bg-dark-border px-1 rounded">http://localhost:8085/oauth/callback</code> comme URI de redirection</li>
            </ol>
          </div>

          {/* Step 2: Enter credentials */}
          <div className="bg-dark-bg rounded-lg p-4">
            <h4 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs">2</span>
              Entrer vos credentials
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  <Key className="w-4 h-4 inline mr-1" />
                  Client ID
                </label>
                <input
                  type="text"
                  name="client_id"
                  value={googleCredentials.client_id}
                  onChange={handleCredentialsChange}
                  placeholder="xxxxx.apps.googleusercontent.com"
                  className="w-full bg-dark-card border border-dark-border rounded-lg px-4 py-3 text-white placeholder:text-dark-muted focus:outline-none focus:border-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  <Key className="w-4 h-4 inline mr-1" />
                  Client Secret
                </label>
                <input
                  type="password"
                  name="client_secret"
                  value={googleCredentials.client_secret}
                  onChange={handleCredentialsChange}
                  placeholder="GOCSPX-xxxxx"
                  className="w-full bg-dark-card border border-dark-border rounded-lg px-4 py-3 text-white placeholder:text-dark-muted focus:outline-none focus:border-primary text-sm"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" onClick={handleSaveCredentials}>
                Sauvegarder
              </Button>
            </div>
          </div>

          {/* Step 3: Connect */}
          <div className="bg-dark-bg rounded-lg p-4">
            <h4 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs">3</span>
              Se connecter a Google
            </h4>
            <div className="flex gap-2">
              {isConnected ? (
                <>
                  <Button variant="secondary" icon={RefreshCw} onClick={loadGSCSites}>
                    Rafraichir les sites
                  </Button>
                  <Button variant="danger" icon={Trash2} onClick={handleDisconnect}>
                    Deconnecter
                  </Button>
                </>
              ) : (
                <Button
                  icon={isConnecting ? Loader2 : null}
                  onClick={handleConnectGoogle}
                  disabled={isConnecting || !googleCredentials.client_id}
                  className={isConnecting ? 'animate-pulse' : ''}
                >
                  {isConnecting ? 'Connexion...' : 'Connecter Google'}
                </Button>
              )}
            </div>
          </div>

          {/* Message */}
          {message.text && (
            <div className={`flex items-center gap-2 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-success/10 text-success border border-success/30'
                : message.type === 'error'
                  ? 'bg-danger/10 text-danger border border-danger/30'
                  : 'bg-info/10 text-info border border-info/30'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Connected sites */}
          {isConnected && gscSites.length > 0 && (
            <div className="bg-dark-bg rounded-lg p-4">
              <h4 className="text-sm font-medium text-white mb-3">Sites GSC detectes ({gscSites.length})</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {gscSites.map((site, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-dark-muted">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span>{site.siteUrl}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
