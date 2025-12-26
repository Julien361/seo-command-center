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
        focus: site.focus,
        wp_api_url: site.wpApiUrl || null,
        wp_username: site.wpUsername || null,
        wp_app_password: site.wpAppPassword || null,
        gsc_property: site.gscProperty || null,
        ga4_property_id: site.ga4PropertyId || null,
        status: 'active',
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
        focus: site.focus,
        wp_api_url: site.wpApiUrl || null,
        wp_username: site.wpUsername || null,
        wp_app_password: site.wpAppPassword || null,
        gsc_property: site.gscProperty || null,
        ga4_property_id: site.ga4PropertyId || null,
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
  }
};
