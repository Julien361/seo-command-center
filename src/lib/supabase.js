import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
);

// Sites API
export const sitesApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async create(site) {
    const { data, error } = await supabase
      .from('sites')
      .insert([{
        mcp_alias: site.alias,
        domain: site.domain,
        url: `https://${site.domain}`,
        entity_id: site.entity,
        seo_focus: site.focus || null,
        wp_api_url: site.wpApiUrl || null,
        wp_endpoint: site.wpApiUrl || null, // Compatibilité legacy
        wp_username: site.wpUsername || null,
        wp_app_password: site.wpAppPassword || null,
        gsc_property: site.gscProperty || null,
        ga4_property_id: site.ga4PropertyId || null,
        // Nouveaux champs
        target_audience: site.targetAudience || null,
        content_tone: site.contentTone || 'expert',
        geographic_focus: site.geographicFocus || null,
        priority: site.priority || 3,
        total_articles: site.articlesCount || 0,
        is_active: true,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id, site) {
    const { data, error } = await supabase
      .from('sites')
      .update({
        mcp_alias: site.alias,
        domain: site.domain,
        url: `https://${site.domain}`,
        entity_id: site.entity,
        seo_focus: site.focus || null,
        wp_api_url: site.wpApiUrl || null,
        wp_endpoint: site.wpApiUrl || null,
        wp_username: site.wpUsername || null,
        wp_app_password: site.wpAppPassword || null,
        gsc_property: site.gscProperty || null,
        ga4_property_id: site.ga4PropertyId || null,
        target_audience: site.targetAudience || null,
        content_tone: site.contentTone || 'expert',
        geographic_focus: site.geographicFocus || null,
        priority: site.priority || 3,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('sites')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Synchroniser les stats d'un site depuis WordPress
  async syncSiteStats(site) {
    if (!site.wp_api_url || !site.wp_username || !site.wp_app_password) {
      return { success: false, error: 'Credentials WordPress manquants' };
    }

    try {
      const authHeader = 'Basic ' + btoa(`${site.wp_username}:${site.wp_app_password}`);
      const url = `${site.wp_api_url}posts?per_page=1&status=publish`;

      let postsResponse;
      let totalArticles = 0;

      // Use Electron proxy if available (bypasses CORS)
      if (window.wpApi?.fetch) {
        const result = await window.wpApi.fetch(url, {
          headers: { 'Authorization': authHeader }
        });
        if (!result.ok) {
          throw new Error(result.error || `HTTP ${result.status}`);
        }
        totalArticles = parseInt(result.headers['x-wp-total']) || 0;
      } else {
        // Fallback to regular fetch (may be blocked by CORS)
        postsResponse = await fetch(url, {
          headers: { 'Authorization': authHeader }
        });
        if (!postsResponse.ok) {
          throw new Error(`HTTP ${postsResponse.status}`);
        }
        totalArticles = parseInt(postsResponse.headers.get('X-WP-Total')) || 0;
      }

      // Mettre à jour dans Supabase
      const { error } = await supabase
        .from('sites')
        .update({
          total_articles: totalArticles,
          last_monitored_at: new Date().toISOString()
        })
        .eq('id', site.id);

      if (error) throw error;

      return { success: true, total_articles: totalArticles };
    } catch (error) {
      console.error(`Sync error for ${site.domain}:`, error);
      return { success: false, error: error.message };
    }
  },

  // Synchroniser tous les sites
  async syncAllSites() {
    const sites = await this.getAll();
    const results = [];

    for (const site of sites) {
      const result = await this.syncSiteStats(site);
      results.push({
        domain: site.domain,
        ...result
      });
    }

    return results;
  }
};

// Keywords API
export const keywordsApi = {
  async getAll(filters = {}) {
    let query = supabase
      .from('keywords')
      .select(`
        *,
        sites (mcp_alias, domain)
      `)
      .order('search_volume', { ascending: false, nullsFirst: false });

    if (filters.siteId) {
      query = query.eq('site_id', filters.siteId);
    }
    if (filters.isTracked !== undefined) {
      query = query.eq('is_tracked', filters.isTracked);
    }
    if (filters.isQuickWin !== undefined) {
      query = query.eq('is_quick_win', filters.isQuickWin);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getBySite(siteId) {
    const { data, error } = await supabase
      .from('keywords')
      .select('*')
      .eq('site_id', siteId)
      .order('search_volume', { ascending: false, nullsFirst: false });

    if (error) throw error;
    return data;
  },

  async getCount() {
    const { count, error } = await supabase
      .from('keywords')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count;
  }
};

// Quick Wins API
export const quickWinsApi = {
  async getAll(filters = {}) {
    let query = supabase
      .from('quick_wins')
      .select(`
        *,
        sites (mcp_alias, domain)
      `)
      .order('opportunity_score', { ascending: false });

    if (filters.siteId) {
      query = query.eq('site_id', filters.siteId);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async updateStatus(id, status) {
    const { data, error } = await supabase
      .from('quick_wins')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getCount() {
    const { count, error } = await supabase
      .from('quick_wins')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (error) throw error;
    return count;
  }
};

// SERP Results API
export const serpApi = {
  async getByKeyword(keyword, siteId = null) {
    let query = supabase
      .from('serp_results')
      .select('*')
      .eq('keyword', keyword)
      .order('position', { ascending: true });

    if (siteId) {
      query = query.eq('site_id', siteId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getRecent(limit = 50) {
    const { data, error } = await supabase
      .from('serp_results')
      .select(`
        *,
        sites (mcp_alias, domain)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }
};

// Semantic Clusters API
export const clustersApi = {
  async getAll(siteId = null) {
    let query = supabase
      .from('semantic_clusters')
      .select(`
        *,
        sites (mcp_alias, domain)
      `)
      .order('created_at', { ascending: false });

    if (siteId) {
      query = query.eq('site_id', siteId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('semantic_clusters')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async getCount() {
    const { count, error } = await supabase
      .from('semantic_clusters')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count;
  }
};

// Dashboard Stats API
export const statsApi = {
  async getDashboardStats() {
    const [sites, keywords, quickWins, clusters] = await Promise.all([
      supabase.from('sites').select('*', { count: 'exact', head: true }),
      supabase.from('keywords').select('*', { count: 'exact', head: true }),
      supabase.from('quick_wins').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('semantic_clusters').select('*', { count: 'exact', head: true }),
    ]);

    return {
      totalSites: sites.count || 0,
      totalKeywords: keywords.count || 0,
      pendingQuickWins: quickWins.count || 0,
      totalClusters: clusters.count || 0,
    };
  },

  async getRecentActivity(limit = 10) {
    const { data, error } = await supabase
      .from('sites')
      .select('mcp_alias, domain, last_monitored_at, total_articles')
      .not('last_monitored_at', 'is', null)
      .order('last_monitored_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }
};
