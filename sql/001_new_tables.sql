-- ============================================
-- SEO Command Center - Migration 001
-- 11 nouvelles tables pour le dashboard v2
-- Created: 2025-12-26
-- ============================================

-- 1. Pages (meres/filles/standalone)
CREATE TABLE IF NOT EXISTS pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  cluster_id UUID REFERENCES semantic_clusters(id) ON DELETE SET NULL,
  type VARCHAR(20) CHECK (type IN ('pillar', 'satellite', 'standalone')) DEFAULT 'standalone',
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255),
  h1 VARCHAR(255),
  meta_title VARCHAR(70),
  meta_description VARCHAR(160),
  content TEXT,
  word_count INTEGER DEFAULT 0,
  target_keyword VARCHAR(255),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'published', 'archived')),
  wp_post_id INTEGER,
  wp_url VARCHAR(500),
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_pages_site ON pages(site_id);
CREATE INDEX idx_pages_cluster ON pages(cluster_id);
CREATE INDEX idx_pages_status ON pages(status);
CREATE INDEX idx_pages_type ON pages(type);

-- 2. Maillage interne
CREATE TABLE IF NOT EXISTS internal_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  source_page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  target_page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  source_url VARCHAR(500),
  target_url VARCHAR(500),
  anchor_text VARCHAR(255),
  context TEXT,
  is_implemented BOOLEAN DEFAULT false,
  suggested_by VARCHAR(50) DEFAULT 'manual' CHECK (suggested_by IN ('auto', 'manual', 'ai')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_internal_links_site ON internal_links(site_id);
CREATE INDEX idx_internal_links_source ON internal_links(source_page_id);
CREATE INDEX idx_internal_links_target ON internal_links(target_page_id);
CREATE INDEX idx_internal_links_implemented ON internal_links(is_implemented);

-- 3. Schema Markup (JSON-LD)
CREATE TABLE IF NOT EXISTS schema_markups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('FAQ', 'HowTo', 'Article', 'LocalBusiness', 'Product', 'Review', 'Event', 'Organization', 'Person', 'BreadcrumbList', 'WebPage', 'Custom')),
  json_ld JSONB NOT NULL,
  is_implemented BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_schema_markups_page ON schema_markups(page_id);
CREATE INDEX idx_schema_markups_site ON schema_markups(site_id);
CREATE INDEX idx_schema_markups_type ON schema_markups(type);

-- 4. Images SEO
CREATE TABLE IF NOT EXISTS images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID REFERENCES pages(id) ON DELETE SET NULL,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  filename VARCHAR(255),
  alt_text VARCHAR(255),
  alt_text_suggested VARCHAR(255),
  title_text VARCHAR(255),
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  format VARCHAR(10),
  is_optimized BOOLEAN DEFAULT false,
  is_lazy_loaded BOOLEAN,
  optimization_score INTEGER CHECK (optimization_score >= 0 AND optimization_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_images_page ON images(page_id);
CREATE INDEX idx_images_site ON images(site_id);
CREATE INDEX idx_images_optimized ON images(is_optimized);

-- 5. Alertes
CREATE TABLE IF NOT EXISTS alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('position_drop', 'position_gain', 'traffic_drop', 'traffic_spike', 'error_404', 'error_5xx', 'cannibalization', 'index_issue', 'speed_issue', 'security', 'content_thin', 'duplicate', 'custom')),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'warning', 'info')) DEFAULT 'info',
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSONB,
  page_url VARCHAR(500),
  keyword VARCHAR(255),
  is_read BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_alerts_site ON alerts(site_id);
CREATE INDEX idx_alerts_type ON alerts(type);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_unread ON alerts(is_read) WHERE is_read = false;
CREATE INDEX idx_alerts_unresolved ON alerts(is_resolved) WHERE is_resolved = false;
CREATE INDEX idx_alerts_created ON alerts(created_at DESC);

-- 6. Revenus
CREATE TABLE IF NOT EXISTS revenues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  page_id UUID REFERENCES pages(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('lead', 'sale', 'affiliate', 'subscription', 'link_sale', 'sponsored', 'service', 'other')),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  description TEXT,
  source VARCHAR(100),
  client_name VARCHAR(255),
  recorded_at DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_revenues_site ON revenues(site_id);
CREATE INDEX idx_revenues_page ON revenues(page_id);
CREATE INDEX idx_revenues_type ON revenues(type);
CREATE INDEX idx_revenues_date ON revenues(recorded_at DESC);
CREATE INDEX idx_revenues_month ON revenues(date_trunc('month', recorded_at));

-- 7. API Credentials
CREATE TABLE IF NOT EXISTS api_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('api_key', 'oauth', 'basic_auth', 'bearer', 'wordpress_app')),
  provider VARCHAR(100) NOT NULL,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  credentials JSONB NOT NULL,
  base_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  last_tested_at TIMESTAMP WITH TIME ZONE,
  test_status VARCHAR(20) CHECK (test_status IN ('success', 'failed', 'pending', 'untested')) DEFAULT 'untested',
  test_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_api_credentials_site ON api_credentials(site_id);
CREATE INDEX idx_api_credentials_provider ON api_credentials(provider);
CREATE INDEX idx_api_credentials_active ON api_credentials(is_active);

-- 8. Idees de contenu
CREATE TABLE IF NOT EXISTS content_ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  keyword VARCHAR(255),
  source VARCHAR(50) CHECK (source IN ('paa', 'trends', 'competitor', 'manual', 'ai', 'gap', 'user')) DEFAULT 'manual',
  search_volume INTEGER,
  difficulty INTEGER CHECK (difficulty >= 0 AND difficulty <= 100),
  intent VARCHAR(20) CHECK (intent IN ('informational', 'transactional', 'navigational', 'commercial')),
  priority_score INTEGER CHECK (priority_score >= 0 AND priority_score <= 100),
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'approved', 'rejected', 'in_progress', 'published')),
  cluster_id UUID REFERENCES semantic_clusters(id) ON DELETE SET NULL,
  brief_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_content_ideas_site ON content_ideas(site_id);
CREATE INDEX idx_content_ideas_status ON content_ideas(status);
CREATE INDEX idx_content_ideas_source ON content_ideas(source);
CREATE INDEX idx_content_ideas_priority ON content_ideas(priority_score DESC);

-- 9. SEO Technique (Core Web Vitals)
CREATE TABLE IF NOT EXISTS technical_seo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  page_url VARCHAR(500) NOT NULL,
  device VARCHAR(10) CHECK (device IN ('mobile', 'desktop')) DEFAULT 'mobile',
  lcp DECIMAL(6,2),
  fid DECIMAL(6,2),
  cls DECIMAL(6,4),
  inp DECIMAL(6,2),
  ttfb DECIMAL(6,2),
  fcp DECIMAL(6,2),
  si DECIMAL(6,2),
  tbt DECIMAL(8,2),
  score_performance INTEGER CHECK (score_performance >= 0 AND score_performance <= 100),
  score_accessibility INTEGER CHECK (score_accessibility >= 0 AND score_accessibility <= 100),
  score_seo INTEGER CHECK (score_seo >= 0 AND score_seo <= 100),
  score_best_practices INTEGER CHECK (score_best_practices >= 0 AND score_best_practices <= 100),
  issues JSONB,
  opportunities JSONB,
  diagnostics JSONB,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_technical_seo_site ON technical_seo(site_id);
CREATE INDEX idx_technical_seo_url ON technical_seo(page_url);
CREATE INDEX idx_technical_seo_device ON technical_seo(device);
CREATE INDEX idx_technical_seo_checked ON technical_seo(checked_at DESC);

-- 10. SEO Local (GMB)
CREATE TABLE IF NOT EXISTS local_seo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  gmb_place_id VARCHAR(100),
  gmb_cid VARCHAR(50),
  business_name VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(10),
  country VARCHAR(2) DEFAULT 'FR',
  phone VARCHAR(20),
  website VARCHAR(500),
  category_primary VARCHAR(100),
  categories_secondary JSONB,
  rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
  reviews_count INTEGER DEFAULT 0,
  reviews_average_response_time INTEGER,
  posts_count INTEGER DEFAULT 0,
  photos_count INTEGER DEFAULT 0,
  last_post_at TIMESTAMP WITH TIME ZONE,
  last_review_at TIMESTAMP WITH TIME ZONE,
  nap_consistent BOOLEAN,
  citations JSONB,
  hours JSONB,
  attributes JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_local_seo_site ON local_seo(site_id);
CREATE INDEX idx_local_seo_city ON local_seo(city);
CREATE INDEX idx_local_seo_rating ON local_seo(rating DESC);

-- 11. Historique des ameliorations
CREATE TABLE IF NOT EXISTS improvements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  page_id UUID REFERENCES pages(id) ON DELETE SET NULL,
  keyword_id UUID REFERENCES keywords(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('content_update', 'title_change', 'meta_update', 'internal_links', 'speed_fix', 'schema_added', 'image_optimization', 'content_expansion', 'keyword_optimization', 'ux_improvement', 'technical_fix', 'other')),
  description TEXT NOT NULL,
  changes JSONB,
  position_before DECIMAL(5,1),
  position_after DECIMAL(5,1),
  position_change DECIMAL(5,1) GENERATED ALWAYS AS (position_before - position_after) STORED,
  traffic_before INTEGER,
  traffic_after INTEGER,
  traffic_change_pct DECIMAL(6,2),
  clicks_before INTEGER,
  clicks_after INTEGER,
  ctr_before DECIMAL(5,2),
  ctr_after DECIMAL(5,2),
  status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'measuring', 'success', 'failed', 'cancelled')),
  priority VARCHAR(10) CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  measuring_start_at TIMESTAMP WITH TIME ZONE,
  measured_at TIMESTAMP WITH TIME ZONE,
  results JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_improvements_site ON improvements(site_id);
CREATE INDEX idx_improvements_page ON improvements(page_id);
CREATE INDEX idx_improvements_keyword ON improvements(keyword_id);
CREATE INDEX idx_improvements_type ON improvements(type);
CREATE INDEX idx_improvements_status ON improvements(status);
CREATE INDEX idx_improvements_created ON improvements(created_at DESC);

-- ============================================
-- Functions et Triggers
-- ============================================

-- Fonction pour mettre a jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_credentials_updated_at BEFORE UPDATE ON api_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_ideas_updated_at BEFORE UPDATE ON content_ideas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_local_seo_updated_at BEFORE UPDATE ON local_seo
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE schema_markups ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE technical_seo ENABLE ROW LEVEL SECURITY;
ALTER TABLE local_seo ENABLE ROW LEVEL SECURITY;
ALTER TABLE improvements ENABLE ROW LEVEL SECURITY;

-- Policies pour acces public (anon key)
CREATE POLICY "Allow all for pages" ON pages FOR ALL USING (true);
CREATE POLICY "Allow all for internal_links" ON internal_links FOR ALL USING (true);
CREATE POLICY "Allow all for schema_markups" ON schema_markups FOR ALL USING (true);
CREATE POLICY "Allow all for images" ON images FOR ALL USING (true);
CREATE POLICY "Allow all for alerts" ON alerts FOR ALL USING (true);
CREATE POLICY "Allow all for revenues" ON revenues FOR ALL USING (true);
CREATE POLICY "Allow all for api_credentials" ON api_credentials FOR ALL USING (true);
CREATE POLICY "Allow all for content_ideas" ON content_ideas FOR ALL USING (true);
CREATE POLICY "Allow all for technical_seo" ON technical_seo FOR ALL USING (true);
CREATE POLICY "Allow all for local_seo" ON local_seo FOR ALL USING (true);
CREATE POLICY "Allow all for improvements" ON improvements FOR ALL USING (true);

-- ============================================
-- Vues utiles
-- ============================================

-- Vue pour les alertes non lues par site
CREATE OR REPLACE VIEW alerts_summary AS
SELECT
  site_id,
  COUNT(*) FILTER (WHERE NOT is_read) as unread_count,
  COUNT(*) FILTER (WHERE severity = 'critical' AND NOT is_resolved) as critical_count,
  COUNT(*) FILTER (WHERE severity = 'warning' AND NOT is_resolved) as warning_count,
  MAX(created_at) as last_alert_at
FROM alerts
GROUP BY site_id;

-- Vue pour les revenus mensuels
CREATE OR REPLACE VIEW revenues_monthly AS
SELECT
  site_id,
  date_trunc('month', recorded_at) as month,
  type,
  SUM(amount) as total_amount,
  COUNT(*) as transaction_count
FROM revenues
GROUP BY site_id, date_trunc('month', recorded_at), type
ORDER BY month DESC;

-- Vue pour les ameliorations avec impact
CREATE OR REPLACE VIEW improvements_with_impact AS
SELECT
  i.*,
  s.domain as site_domain,
  p.title as page_title,
  k.keyword as keyword_text,
  CASE
    WHEN position_before IS NOT NULL AND position_after IS NOT NULL THEN
      ROUND(((position_before - position_after) / NULLIF(position_before, 0)) * 100, 1)
    ELSE NULL
  END as position_improvement_pct
FROM improvements i
LEFT JOIN sites s ON i.site_id = s.id
LEFT JOIN pages p ON i.page_id = p.id
LEFT JOIN keywords k ON i.keyword_id = k.id;

-- ============================================
-- Commentaires
-- ============================================

COMMENT ON TABLE pages IS 'Pages du site (pilier, satellite, standalone)';
COMMENT ON TABLE internal_links IS 'Liens internes entre pages';
COMMENT ON TABLE schema_markups IS 'Schemas JSON-LD pour le rich snippet';
COMMENT ON TABLE images IS 'Images avec optimisation SEO';
COMMENT ON TABLE alerts IS 'Alertes SEO (drops, erreurs, etc.)';
COMMENT ON TABLE revenues IS 'Suivi des revenus par type';
COMMENT ON TABLE api_credentials IS 'Credentials pour APIs externes';
COMMENT ON TABLE content_ideas IS 'Idees de contenu a produire';
COMMENT ON TABLE technical_seo IS 'Audits techniques (Core Web Vitals)';
COMMENT ON TABLE local_seo IS 'Donnees SEO local (GMB)';
COMMENT ON TABLE improvements IS 'Historique des ameliorations SEO';
