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

// GSC Keyword History API
export const gscApi = {
  async getPositionsBySite() {
    const { data, error } = await supabase
      .from('gsc_keyword_history')
      .select('site_id, position, clicks, impressions');

    if (error) throw error;

    // Calculer les stats par site
    const statsBySite = {};
    data.forEach(row => {
      if (!statsBySite[row.site_id]) {
        statsBySite[row.site_id] = { positions: [], clicks: 0, impressions: 0 };
      }
      statsBySite[row.site_id].positions.push(row.position);
      statsBySite[row.site_id].clicks += row.clicks || 0;
      statsBySite[row.site_id].impressions += row.impressions || 0;
    });

    // Calculer la position moyenne par site
    const result = {};
    for (const [siteId, stats] of Object.entries(statsBySite)) {
      const avgPosition = stats.positions.length > 0
        ? Math.round((stats.positions.reduce((a, b) => a + b, 0) / stats.positions.length) * 10) / 10
        : null;
      result[siteId] = {
        avgPosition,
        totalClicks: stats.clicks,
        totalImpressions: stats.impressions,
        keywordsTracked: stats.positions.length
      };
    }
    return result;
  }
};

// Articles API
export const articlesApi = {
  async getAll(filters = {}) {
    let query = supabase
      .from('articles')
      .select(`*, sites (mcp_alias, domain)`)
      .order('created_at', { ascending: false });

    if (filters.siteId) query = query.eq('site_id', filters.siteId);
    if (filters.status) query = query.eq('status', filters.status);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async create(article) {
    const { data, error } = await supabase
      .from('articles')
      .insert([article])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, article) {
    const { data, error } = await supabase
      .from('articles')
      .update({ ...article, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (error) throw error;
  }
};

// Backlinks API
export const backlinksApi = {
  async getAll(filters = {}) {
    let query = supabase
      .from('backlinks')
      .select(`*, sites (mcp_alias, domain)`)
      .order('created_at', { ascending: false });

    if (filters.siteId) query = query.eq('site_id', filters.siteId);
    if (filters.status) query = query.eq('status', filters.status);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async create(backlink) {
    const { data, error } = await supabase
      .from('backlinks')
      .insert([backlink])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, backlink) {
    const { data, error } = await supabase
      .from('backlinks')
      .update({ ...backlink, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('backlinks').delete().eq('id', id);
    if (error) throw error;
  }
};

// Competitors API
export const competitorsApi = {
  async getAll(filters = {}) {
    let query = supabase
      .from('competitors')
      .select(`*, sites (mcp_alias, domain)`)
      .order('created_at', { ascending: false });

    if (filters.siteId) query = query.eq('site_id', filters.siteId);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async create(competitor) {
    const { data, error } = await supabase
      .from('competitors')
      .insert([competitor])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, competitor) {
    const { data, error } = await supabase
      .from('competitors')
      .update({ ...competitor, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('competitors').delete().eq('id', id);
    if (error) throw error;
  }
};

// Content Ideas API
export const ideasApi = {
  async getAll(filters = {}) {
    let query = supabase
      .from('content_ideas')
      .select(`*, sites (mcp_alias, domain)`)
      .order('created_at', { ascending: false });

    if (filters.siteId) query = query.eq('site_id', filters.siteId);
    if (filters.status) query = query.eq('status', filters.status);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async create(idea) {
    const { data, error } = await supabase
      .from('content_ideas')
      .insert([idea])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, idea) {
    const { data, error } = await supabase
      .from('content_ideas')
      .update({ ...idea, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('content_ideas').delete().eq('id', id);
    if (error) throw error;
  }
};

// Content Briefs API
export const briefsApi = {
  async getAll(filters = {}) {
    let query = supabase
      .from('content_briefs')
      .select(`*, sites (mcp_alias, domain)`)
      .order('created_at', { ascending: false });

    if (filters.siteId) query = query.eq('site_id', filters.siteId);
    if (filters.status) query = query.eq('status', filters.status);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async create(brief) {
    const { data, error } = await supabase
      .from('content_briefs')
      .insert([brief])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, brief) {
    const { data, error } = await supabase
      .from('content_briefs')
      .update({ ...brief, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('content_briefs').delete().eq('id', id);
    if (error) throw error;
  }
};

// Internal Links API
export const internalLinksApi = {
  async getAll(filters = {}) {
    let query = supabase
      .from('internal_links')
      .select(`*, sites (mcp_alias, domain)`)
      .order('created_at', { ascending: false });

    if (filters.siteId) query = query.eq('site_id', filters.siteId);
    if (filters.status) query = query.eq('status', filters.status);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async create(link) {
    const { data, error } = await supabase
      .from('internal_links')
      .insert([link])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, link) {
    const { data, error } = await supabase
      .from('internal_links')
      .update({ ...link, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('internal_links').delete().eq('id', id);
    if (error) throw error;
  }
};

// Pages API
export const pagesApi = {
  async getAll(filters = {}) {
    let query = supabase
      .from('pages')
      .select(`*, sites (mcp_alias, domain)`)
      .order('created_at', { ascending: false });

    if (filters.siteId) query = query.eq('site_id', filters.siteId);
    if (filters.type) query = query.eq('page_type', filters.type);
    if (filters.status) query = query.eq('status', filters.status);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async create(page) {
    const { data, error } = await supabase
      .from('pages')
      .insert([page])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, page) {
    const { data, error } = await supabase
      .from('pages')
      .update({ ...page, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('pages').delete().eq('id', id);
    if (error) throw error;
  }
};

// Images API
export const imagesApi = {
  async getAll(filters = {}) {
    let query = supabase
      .from('images')
      .select(`*, sites (mcp_alias, domain)`)
      .order('created_at', { ascending: false });

    if (filters.siteId) query = query.eq('site_id', filters.siteId);
    if (filters.status) query = query.eq('optimization_status', filters.status);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async create(image) {
    const { data, error } = await supabase
      .from('images')
      .insert([image])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, image) {
    const { data, error } = await supabase
      .from('images')
      .update({ ...image, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('images').delete().eq('id', id);
    if (error) throw error;
  }
};

// Alerts API
export const alertsApi = {
  async getAll(filters = {}) {
    let query = supabase
      .from('alerts')
      .select(`*, sites (mcp_alias, domain)`)
      .order('created_at', { ascending: false });

    if (filters.siteId) query = query.eq('site_id', filters.siteId);
    if (filters.type) query = query.eq('alert_type', filters.type);
    if (filters.isRead !== undefined) query = query.eq('is_read', filters.isRead);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async create(alert) {
    const { data, error } = await supabase
      .from('alerts')
      .insert([alert])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async markAsRead(id) {
    const { data, error } = await supabase
      .from('alerts')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('alerts').delete().eq('id', id);
    if (error) throw error;
  }
};

// Editorial Calendar API
export const calendarApi = {
  async getAll(filters = {}) {
    let query = supabase
      .from('editorial_calendar')
      .select(`*, sites (mcp_alias, domain)`)
      .order('scheduled_date', { ascending: true });

    if (filters.siteId) query = query.eq('site_id', filters.siteId);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.startDate) query = query.gte('scheduled_date', filters.startDate);
    if (filters.endDate) query = query.lte('scheduled_date', filters.endDate);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async create(event) {
    const { data, error } = await supabase
      .from('editorial_calendar')
      .insert([event])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, event) {
    const { data, error } = await supabase
      .from('editorial_calendar')
      .update({ ...event, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('editorial_calendar').delete().eq('id', id);
    if (error) throw error;
  }
};

// Revenues API
export const revenuesApi = {
  async getAll(filters = {}) {
    let query = supabase
      .from('revenues')
      .select(`*, sites (mcp_alias, domain)`)
      .order('date', { ascending: false });

    if (filters.siteId) query = query.eq('site_id', filters.siteId);
    if (filters.type) query = query.eq('revenue_type', filters.type);
    if (filters.startDate) query = query.gte('date', filters.startDate);
    if (filters.endDate) query = query.lte('date', filters.endDate);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async create(revenue) {
    const { data, error } = await supabase
      .from('revenues')
      .insert([revenue])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, revenue) {
    const { data, error } = await supabase
      .from('revenues')
      .update({ ...revenue, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('revenues').delete().eq('id', id);
    if (error) throw error;
  },

  async getStats(siteId = null) {
    let query = supabase.from('revenues').select('amount, revenue_type, date');
    if (siteId) query = query.eq('site_id', siteId);

    const { data, error } = await query;
    if (error) throw error;

    const total = (data || []).reduce((sum, r) => sum + (r.amount || 0), 0);
    const byType = {};
    (data || []).forEach(r => {
      byType[r.revenue_type] = (byType[r.revenue_type] || 0) + (r.amount || 0);
    });

    return { total, byType, count: data?.length || 0 };
  }
};

// Improvements API
export const improvementsApi = {
  async getAll(filters = {}) {
    let query = supabase
      .from('improvements')
      .select(`*, sites (mcp_alias, domain)`)
      .order('created_at', { ascending: false });

    if (filters.siteId) query = query.eq('site_id', filters.siteId);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.type) query = query.eq('improvement_type', filters.type);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async create(improvement) {
    const { data, error } = await supabase
      .from('improvements')
      .insert([improvement])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, improvement) {
    const { data, error } = await supabase
      .from('improvements')
      .update({ ...improvement, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('improvements').delete().eq('id', id);
    if (error) throw error;
  }
};

// Positions API (from GSC history)
export const positionsApi = {
  async getHistory(filters = {}) {
    let query = supabase
      .from('gsc_keyword_history')
      .select(`*, sites (mcp_alias, domain)`)
      .order('recorded_at', { ascending: false });

    if (filters.siteId) query = query.eq('site_id', filters.siteId);
    if (filters.keyword) query = query.ilike('keyword', `%${filters.keyword}%`);
    if (filters.limit) query = query.limit(filters.limit);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getTopKeywords(siteId, limit = 20) {
    let query = supabase
      .from('gsc_keyword_history')
      .select('keyword, position, clicks, impressions, ctr, page_url')
      .order('clicks', { ascending: false })
      .limit(limit);

    if (siteId) query = query.eq('site_id', siteId);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
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
