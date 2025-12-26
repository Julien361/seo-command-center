// Google Search Console Integration
// OAuth2 flow for Electron app

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GSC_API_URL = 'https://www.googleapis.com/webmasters/v3';
const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];

// Storage keys
const STORAGE_KEYS = {
  GOOGLE_TOKENS: 'google_tokens',
  GOOGLE_CREDENTIALS: 'google_credentials'
};

// Get stored credentials
export const getGoogleCredentials = () => {
  const stored = localStorage.getItem(STORAGE_KEYS.GOOGLE_CREDENTIALS);
  return stored ? JSON.parse(stored) : null;
};

// Save credentials
export const saveGoogleCredentials = (credentials) => {
  localStorage.setItem(STORAGE_KEYS.GOOGLE_CREDENTIALS, JSON.stringify(credentials));
};

// Get stored tokens
export const getGoogleTokens = () => {
  const stored = localStorage.getItem(STORAGE_KEYS.GOOGLE_TOKENS);
  return stored ? JSON.parse(stored) : null;
};

// Save tokens
const saveGoogleTokens = (tokens) => {
  localStorage.setItem(STORAGE_KEYS.GOOGLE_TOKENS, JSON.stringify({
    ...tokens,
    obtained_at: Date.now()
  }));
};

// Clear tokens (logout)
export const clearGoogleTokens = () => {
  localStorage.removeItem(STORAGE_KEYS.GOOGLE_TOKENS);
};

// Check if connected to Google
export const isGoogleConnected = () => {
  const tokens = getGoogleTokens();
  return tokens && tokens.refresh_token;
};

// Generate OAuth2 URL
export const getAuthUrl = (credentials) => {
  const params = new URLSearchParams({
    client_id: credentials.client_id,
    redirect_uri: 'http://localhost:8085/oauth/callback',
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent'
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
};

// Exchange code for tokens
export const exchangeCodeForTokens = async (code, credentials) => {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: credentials.client_id,
      client_secret: credentials.client_secret,
      redirect_uri: 'http://localhost:8085/oauth/callback',
      grant_type: 'authorization_code'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || 'Failed to exchange code');
  }

  const tokens = await response.json();
  saveGoogleTokens(tokens);
  return tokens;
};

// Refresh access token
export const refreshAccessToken = async () => {
  const tokens = getGoogleTokens();
  const credentials = getGoogleCredentials();

  if (!tokens?.refresh_token || !credentials) {
    throw new Error('No refresh token available');
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: tokens.refresh_token,
      client_id: credentials.client_id,
      client_secret: credentials.client_secret,
      grant_type: 'refresh_token'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || 'Failed to refresh token');
  }

  const newTokens = await response.json();
  saveGoogleTokens({
    ...tokens,
    access_token: newTokens.access_token,
    expires_in: newTokens.expires_in
  });

  return newTokens.access_token;
};

// Get valid access token (refresh if needed)
const getValidAccessToken = async () => {
  const tokens = getGoogleTokens();
  if (!tokens) throw new Error('Not authenticated');

  // Check if token is expired (with 5 min buffer)
  const expiresAt = tokens.obtained_at + (tokens.expires_in * 1000) - 300000;
  if (Date.now() > expiresAt) {
    return await refreshAccessToken();
  }

  return tokens.access_token;
};

// GSC API: Get site list
export const getGSCSites = async () => {
  const accessToken = await getValidAccessToken();

  const response = await fetch(`${GSC_API_URL}/sites`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch GSC sites');
  }

  const data = await response.json();
  return data.siteEntry || [];
};

// GSC API: Get search analytics data
export const getSearchAnalytics = async (siteUrl, options = {}) => {
  const accessToken = await getValidAccessToken();

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (options.days || 28));

  const body = {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    dimensions: options.dimensions || ['query'],
    rowLimit: options.rowLimit || 1000,
    startRow: options.startRow || 0
  };

  // Encode the site URL properly
  const encodedSiteUrl = encodeURIComponent(siteUrl);

  const response = await fetch(
    `${GSC_API_URL}/sites/${encodedSiteUrl}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  );

  if (!response.ok) {
    const error = await response.json();
    console.error('GSC API Error:', error);
    throw new Error(error.error?.message || 'Failed to fetch search analytics');
  }

  return await response.json();
};

// Get site performance summary (clicks, impressions, position, ctr)
export const getSitePerformance = async (siteUrl, days = 28) => {
  try {
    const data = await getSearchAnalytics(siteUrl, {
      dimensions: [],
      days,
      rowLimit: 1
    });

    if (data.rows && data.rows.length > 0) {
      const row = data.rows[0];
      return {
        clicks: Math.round(row.clicks) || 0,
        impressions: Math.round(row.impressions) || 0,
        ctr: (row.ctr * 100).toFixed(2),
        position: row.position?.toFixed(1) || 0
      };
    }

    return { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  } catch (error) {
    console.error(`Error fetching performance for ${siteUrl}:`, error);
    return null;
  }
};

// Get top keywords for a site
export const getTopKeywords = async (siteUrl, limit = 100) => {
  try {
    const data = await getSearchAnalytics(siteUrl, {
      dimensions: ['query'],
      days: 28,
      rowLimit: limit
    });

    return (data.rows || []).map(row => ({
      keyword: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: (row.ctr * 100).toFixed(2),
      position: row.position?.toFixed(1)
    }));
  } catch (error) {
    console.error(`Error fetching keywords for ${siteUrl}:`, error);
    return [];
  }
};

// Sync all sites with GSC data
export const syncSitesWithGSC = async (sites, updateCallback) => {
  const results = [];

  for (let i = 0; i < sites.length; i++) {
    const site = sites[i];
    if (!site.gsc_property) {
      results.push({ domain: site.domain, success: false, error: 'No GSC property configured' });
      continue;
    }

    try {
      const performance = await getSitePerformance(site.gsc_property, 28);

      if (performance) {
        results.push({
          domain: site.domain,
          siteId: site.id,
          success: true,
          data: performance
        });
      } else {
        results.push({ domain: site.domain, success: false, error: 'No data available' });
      }

      if (updateCallback) {
        updateCallback(i + 1, sites.length);
      }
    } catch (error) {
      results.push({ domain: site.domain, success: false, error: error.message });
    }
  }

  return results;
};
