# Plan d'Implémentation - SEO Command Center v2

> Dashboard SEO complet avec 26 modules organisés en 3 phases

---

## 📊 Vue d'ensemble

| Phase | Modules | Priorité | Estimation |
|-------|---------|----------|------------|
| **Phase 1 - ANALYSE** | 6 modules | HAUTE | Semaine 1-2 |
| **Phase 2 - CRÉATION** | 9 modules | HAUTE | Semaine 2-4 |
| **Phase 3 - SUIVI** | 6 modules | MOYENNE | Semaine 4-5 |
| **Phase 4 - CONFIG** | 2 modules | MOYENNE | Semaine 5 |
| **Refonte UI** | Sidebar + Navigation | HAUTE | Continu |

---

## 🏗️ PHASE 0 - Fondations (Jour 1)

### 0.1 Nouvelles Tables Supabase

```sql
-- Pages (mères/filles)
CREATE TABLE pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES sites(id),
  cluster_id UUID REFERENCES semantic_clusters(id),
  type VARCHAR(20) CHECK (type IN ('pillar', 'satellite', 'standalone')),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255),
  h1 VARCHAR(255),
  meta_title VARCHAR(70),
  meta_description VARCHAR(160),
  content TEXT,
  word_count INTEGER DEFAULT 0,
  target_keyword VARCHAR(255),
  status VARCHAR(20) DEFAULT 'draft',
  wp_post_id INTEGER,
  wp_url VARCHAR(500),
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Maillage interne
CREATE TABLE internal_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES sites(id),
  source_page_id UUID REFERENCES pages(id),
  target_page_id UUID REFERENCES pages(id),
  source_url VARCHAR(500),
  target_url VARCHAR(500),
  anchor_text VARCHAR(255),
  context TEXT,
  is_implemented BOOLEAN DEFAULT false,
  suggested_by VARCHAR(50), -- 'auto', 'manual', 'ai'
  created_at TIMESTAMP DEFAULT now()
);

-- Schema Markup
CREATE TABLE schema_markups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID REFERENCES pages(id),
  site_id UUID REFERENCES sites(id),
  type VARCHAR(50), -- 'FAQ', 'HowTo', 'Article', 'LocalBusiness'...
  json_ld JSONB NOT NULL,
  is_implemented BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

-- Images SEO
CREATE TABLE images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID REFERENCES pages(id),
  site_id UUID REFERENCES sites(id),
  url VARCHAR(500),
  alt_text VARCHAR(255),
  alt_text_suggested VARCHAR(255),
  file_size INTEGER,
  dimensions VARCHAR(20),
  is_optimized BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

-- Alertes
CREATE TABLE alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES sites(id),
  type VARCHAR(50), -- 'position_drop', 'traffic_drop', 'error_404', 'cannibalization'...
  severity VARCHAR(20), -- 'critical', 'warning', 'info'
  title VARCHAR(255),
  message TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  resolved_at TIMESTAMP
);

-- Revenus
CREATE TABLE revenues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES sites(id),
  page_id UUID REFERENCES pages(id),
  type VARCHAR(50), -- 'lead', 'sale', 'affiliate', 'subscription', 'link_sale'
  amount DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'EUR',
  description TEXT,
  source VARCHAR(100),
  recorded_at DATE,
  created_at TIMESTAMP DEFAULT now()
);

-- API Credentials
CREATE TABLE api_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50), -- 'api_key', 'oauth', 'basic_auth', 'bearer'
  provider VARCHAR(100), -- 'wordpress', 'google', 'dataforseo', 'custom'...
  site_id UUID REFERENCES sites(id), -- NULL si global
  credentials JSONB, -- Encrypted in production
  base_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  last_tested_at TIMESTAMP,
  test_status VARCHAR(20), -- 'success', 'failed', 'pending'
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Idées de contenu
CREATE TABLE content_ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES sites(id),
  title VARCHAR(255) NOT NULL,
  keyword VARCHAR(255),
  source VARCHAR(50), -- 'paa', 'trends', 'competitor', 'manual', 'ai'
  search_volume INTEGER,
  difficulty INTEGER,
  priority_score INTEGER,
  status VARCHAR(20) DEFAULT 'new', -- 'new', 'approved', 'rejected', 'in_progress', 'published'
  notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- SEO Technique (Core Web Vitals, etc.)
CREATE TABLE technical_seo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES sites(id),
  page_url VARCHAR(500),
  lcp DECIMAL(5,2), -- Largest Contentful Paint
  fid DECIMAL(5,2), -- First Input Delay
  cls DECIMAL(5,3), -- Cumulative Layout Shift
  ttfb DECIMAL(5,2), -- Time to First Byte
  score_performance INTEGER,
  score_accessibility INTEGER,
  score_seo INTEGER,
  score_best_practices INTEGER,
  issues JSONB,
  checked_at TIMESTAMP DEFAULT now()
);

-- SEO Local (GMB)
CREATE TABLE local_seo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES sites(id),
  gmb_place_id VARCHAR(100),
  business_name VARCHAR(255),
  address TEXT,
  phone VARCHAR(20),
  category VARCHAR(100),
  rating DECIMAL(2,1),
  reviews_count INTEGER,
  posts_count INTEGER,
  photos_count INTEGER,
  last_post_at TIMESTAMP,
  last_review_at TIMESTAMP,
  nap_consistent BOOLEAN,
  citations JSONB,
  updated_at TIMESTAMP DEFAULT now()
);

-- Historique des améliorations
CREATE TABLE improvements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES sites(id),
  page_id UUID REFERENCES pages(id),
  keyword_id UUID REFERENCES keywords(id),
  type VARCHAR(50), -- 'content_update', 'title_change', 'meta_update', 'internal_links', 'speed_fix'
  description TEXT,
  position_before DECIMAL(5,1),
  position_after DECIMAL(5,1),
  traffic_before INTEGER,
  traffic_after INTEGER,
  status VARCHAR(20) DEFAULT 'in_progress', -- 'planned', 'in_progress', 'completed', 'measuring'
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  measured_at TIMESTAMP,
  results JSONB,
  created_at TIMESTAMP DEFAULT now()
);
```

### 0.2 Refonte Sidebar

```jsx
// Structure navigation
const navigation = {
  main: [
    { id: 'dashboard', icon: 'LayoutDashboard', label: 'Dashboard' }
  ],
  sites: {
    label: 'Sites',
    collapsible: true,
    items: [] // Dynamique depuis Supabase
  },
  analyse: {
    label: 'ANALYSE',
    items: [
      { id: 'recherche-kw', icon: 'Search', label: 'Recherche KW' },
      { id: 'quick-wins', icon: 'Zap', label: 'Quick Wins' },
      { id: 'concurrents', icon: 'Target', label: 'Concurrents' },
      { id: 'backlinks', icon: 'Link', label: 'Backlinks' },
      { id: 'audit-contenu', icon: 'FileSearch', label: 'Audit Contenu' },
      { id: 'cocons', icon: 'GitBranch', label: 'Cocons Sémantiques' }
    ]
  },
  creation: {
    label: 'CRÉATION',
    items: [
      { id: 'idees', icon: 'Lightbulb', label: 'Idées' },
      { id: 'briefs', icon: 'FileText', label: 'Briefs' },
      { id: 'pages', icon: 'File', label: 'Pages' },
      { id: 'articles', icon: 'PenTool', label: 'Articles' },
      { id: 'liens-internes', icon: 'Link2', label: 'Liens Internes' },
      { id: 'schema-markup', icon: 'Code', label: 'Schema Markup' },
      { id: 'images-seo', icon: 'Image', label: 'Images SEO' },
      { id: 'calendrier', icon: 'Calendar', label: 'Calendrier' },
      { id: 'publication', icon: 'Send', label: 'Publication' }
    ]
  },
  suivi: {
    label: 'SUIVI',
    items: [
      { id: 'ameliorations', icon: 'TrendingUp', label: 'Améliorations' },
      { id: 'positions', icon: 'LineChart', label: 'Positions' },
      { id: 'performance', icon: 'BarChart3', label: 'Performance' },
      { id: 'seo-technique', icon: 'Settings', label: 'SEO Technique' },
      { id: 'seo-local', icon: 'MapPin', label: 'SEO Local' },
      { id: 'alertes', icon: 'Bell', label: 'Alertes' },
      { id: 'revenus', icon: 'DollarSign', label: 'Revenus' }
    ]
  },
  config: {
    label: 'CONFIG',
    items: [
      { id: 'workflows', icon: 'GitBranch', label: 'Workflows n8n' },
      { id: 'credentials', icon: 'Key', label: 'Credentials & APIs' }
    ]
  },
  outils: {
    label: 'OUTILS',
    items: [
      { id: 'claude-code', icon: 'Terminal', label: 'Claude Code' }
    ]
  }
};
```

---

## 🔍 PHASE 1 - ANALYSE (Jour 2-5)

### 1.1 Recherche KW (existant → améliorer)
- **Fichier**: `src/views/Keywords.jsx` (existe)
- **Améliorations**:
  - Ajouter filtres par intent (info, transac, navig, commercial)
  - Ajouter colonne SERP features
  - Ajouter indicateur opportunité P0
  - Bouton "Analyser" → déclenche WF1 (DataForSEO)
  - Modal confirmation coût API

### 1.2 Quick Wins (existant → améliorer)
- **Fichier**: `src/views/QuickWins.jsx` (existe)
- **Améliorations**:
  - Actions suggérées plus détaillées
  - Bouton "Créer brief" direct
  - Historique des actions

### 1.3 Concurrents (NOUVEAU)
- **Fichier**: `src/views/Concurrents.jsx`
- **Fonctionnalités**:
  - Liste concurrents par site
  - Analyse SERP top 10
  - Content gaps
  - Backlinks concurrents
- **Workflow**: WF3 - Firecrawl Competitor
- **Table**: `competitors` (existe, vide)

### 1.4 Backlinks (NOUVEAU)
- **Fichier**: `src/views/Backlinks.jsx`
- **Fonctionnalités**:
  - Liste backlinks par site
  - Nouveaux / Perdus
  - Opportunités
  - Domain Authority
- **Table**: `backlinks` (existe, vide)
- **API**: DataForSEO Backlinks

### 1.5 Audit Contenu (NOUVEAU)
- **Fichier**: `src/views/AuditContenu.jsx`
- **Fonctionnalités**:
  - Scanner pages existantes
  - Score SEO par page
  - Recommandations
  - Contenu thin/duplicate
- **Workflow**: Nouveau WF-Audit-Content

### 1.6 Cocons Sémantiques (existant → améliorer)
- **Fichier**: `src/views/Cocons.jsx` (à créer, données existent)
- **Fonctionnalités**:
  - Visualisation mind map (react-flow ou d3)
  - Création/édition cocons
  - Assignation pages mères/filles
  - Maillage automatique
- **Table**: `semantic_clusters`, `cluster_satellites`
- **Workflow**: WF6 - Semantic Clustering

---

## ✍️ PHASE 2 - CRÉATION (Jour 6-12)

### 2.1 Idées (NOUVEAU)
- **Fichier**: `src/views/Idees.jsx`
- **Fonctionnalités**:
  - Liste idées avec sources
  - Générateur automatique (PAA, trends, gaps)
  - Filtres par statut/priorité
  - Validation → Brief
- **Table**: `content_ideas` (à créer)
- **Workflow**: WF-PAA + nouveau générateur

### 2.2 Briefs (NOUVEAU)
- **Fichier**: `src/views/Briefs.jsx`
- **Fonctionnalités**:
  - Liste briefs existants
  - Générateur brief P0
  - Structure H1-H3 éditable
  - Export PDF/Markdown
- **Table**: `content_briefs` (existe)
- **Workflow**: WF-ContentBrief

### 2.3 Pages (NOUVEAU)
- **Fichier**: `src/views/Pages.jsx`
- **Fonctionnalités**:
  - Liste pages mères/filles
  - Création avec templates
  - Éditeur WYSIWYG
  - Preview SERP
- **Table**: `pages` (à créer)
- **Workflow**: Page Generator v2

### 2.4 Articles (existant → améliorer)
- **Fichier**: `src/views/Articles.jsx` (existe, mock)
- **Améliorations**:
  - Connecter à Supabase
  - Éditeur riche
  - Humanisation intégrée
  - Score IA détection
- **Table**: `articles` (existe, vide)
- **Workflow**: Article Generator v2

### 2.5 Liens Internes (NOUVEAU)
- **Fichier**: `src/views/LiensInternes.jsx`
- **Fonctionnalités**:
  - Suggestions maillage
  - Visualisation graphe
  - Implémentation en 1 clic
- **Table**: `internal_links` (à créer)

### 2.6 Schema Markup (NOUVEAU)
- **Fichier**: `src/views/SchemaMarkup.jsx`
- **Fonctionnalités**:
  - Générateur JSON-LD
  - Types: FAQ, HowTo, Article, LocalBusiness...
  - Preview
  - Copy/Export
- **Table**: `schema_markups` (à créer)

### 2.7 Images SEO (NOUVEAU)
- **Fichier**: `src/views/ImagesSEO.jsx`
- **Fonctionnalités**:
  - Scanner images sans alt
  - Suggestions alt text IA
  - Compression
  - Lazy loading check
- **Table**: `images` (à créer)

### 2.8 Calendrier (NOUVEAU)
- **Fichier**: `src/views/Calendrier.jsx`
- **Fonctionnalités**:
  - Vue semaine/mois
  - Drag & drop articles
  - Statuts visuels
  - Rappels
- **Table**: `editorial_calendar` (existe, vide)
- **Librairie**: react-big-calendar ou @fullcalendar/react

### 2.9 Publication (NOUVEAU)
- **Fichier**: `src/views/Publication.jsx`
- **Fonctionnalités**:
  - Queue de publication
  - Preview WordPress
  - Scheduling
  - Historique
- **Workflow**: WF-WordPress-Publisher

---

## 📈 PHASE 3 - SUIVI (Jour 13-18)

### 3.1 Améliorations (NOUVEAU)
- **Fichier**: `src/views/suivi/Ameliorations.jsx`
- **Fonctionnalités**:
  - Actions en cours d'optimisation
  - Historique modifications
  - Avant/Après (position, trafic)
  - ROI des actions
  - Content refresh (pages > 6 mois)
  - Tests A/B titles/descriptions
  - Recommandations IA
- **Table**: `improvements` (à créer)

### 3.2 Positions (NOUVEAU)
- **Fichier**: `src/views/Positions.jsx`
- **Fonctionnalités**:
  - Évolution par KW
  - Graphiques temporels
  - Comparaison périodes
  - Export
- **Table**: `gsc_keyword_history`, `keyword_history`
- **Workflow**: WF-GSC-Sync, Position Monitor

### 3.2 Performance (NOUVEAU)
- **Fichier**: `src/views/Performance.jsx`
- **Fonctionnalités**:
  - Trafic global/par site
  - CTR par page
  - Impressions
  - Top pages
- **Table**: `gsc_keyword_history`

### 3.3 SEO Technique (NOUVEAU)
- **Fichier**: `src/views/SEOTechnique.jsx`
- **Fonctionnalités**:
  - Core Web Vitals
  - Erreurs 404
  - Indexation
  - Sitemap status
- **Table**: `technical_seo` (à créer)
- **API**: PageSpeed Insights, GSC

### 3.4 SEO Local (NOUVEAU)
- **Fichier**: `src/views/SEOLocal.jsx`
- **Fonctionnalités**:
  - Fiches GMB
  - Avis
  - Citations NAP
  - Posts GMB
- **Table**: `local_seo` (à créer)

### 3.5 Alertes (NOUVEAU)
- **Fichier**: `src/views/Alertes.jsx`
- **Fonctionnalités**:
  - Liste alertes
  - Filtres sévérité
  - Actions rapides
  - Historique
- **Table**: `alerts` (à créer)

### 3.6 Revenus (NOUVEAU)
- **Fichier**: `src/views/Revenus.jsx`
- **Fonctionnalités**:
  - Dashboard revenus
  - Par type (leads, ventes...)
  - Par site/page
  - Graphiques
- **Table**: `revenues` (à créer)

---

## ⚙️ PHASE 4 - CONFIG (Jour 18-19)

### 4.1 Workflows n8n (existant → améliorer)
- **Fichier**: `src/views/Workflows.jsx` (existe)
- **Améliorations**:
  - Grouper par catégorie
  - Logs détaillés
  - Boutons exécution
  - Statistiques

### 4.2 Credentials & APIs (NOUVEAU)
- **Fichier**: `src/views/Credentials.jsx`
- **Fonctionnalités**:
  - Liste APIs configurées
  - Ajout custom
  - Test connexion
  - Statuts
- **Table**: `api_credentials` (à créer)

---

## 🔄 WORKFLOWS N8N À CRÉER

| Workflow | Trigger | Fonction |
|----------|---------|----------|
| WF-Audit-Content | Webhook | Scanner pages existantes |
| WF-Backlinks-Sync | Schedule | Récupérer backlinks DataForSEO |
| WF-Ideas-Generator | Schedule | Générer idées depuis PAA/Trends |
| WF-Internal-Links | Webhook | Suggérer maillage interne |
| WF-Schema-Generator | Webhook | Générer JSON-LD |
| WF-Image-Optimizer | Webhook | Analyser/optimiser images |
| WF-Technical-Audit | Schedule | Core Web Vitals + erreurs |
| WF-GMB-Sync | Schedule | Sync données GMB |
| WF-Alerts-Monitor | Schedule | Détecter alertes |
| WF-Revenue-Tracker | Webhook | Enregistrer conversions |

---

## 📁 STRUCTURE FICHIERS FINALE

```
src/
├── components/
│   ├── common/
│   │   ├── Card.jsx
│   │   ├── Badge.jsx
│   │   ├── Button.jsx
│   │   ├── Modal.jsx (NOUVEAU)
│   │   ├── Table.jsx (NOUVEAU)
│   │   ├── Chart.jsx (NOUVEAU)
│   │   ├── Calendar.jsx (NOUVEAU)
│   │   └── MindMap.jsx (NOUVEAU)
│   ├── layout/
│   │   ├── Sidebar.jsx (REFONTE)
│   │   └── Header.jsx
│   └── chat/
│       └── ClaudePanel.jsx
├── views/
│   ├── Dashboard.jsx
│   ├── Sites.jsx
│   ├── AddSite.jsx
│   │
│   ├── analyse/
│   │   ├── Keywords.jsx (AMÉLIORER)
│   │   ├── QuickWins.jsx (AMÉLIORER)
│   │   ├── Concurrents.jsx (NOUVEAU)
│   │   ├── Backlinks.jsx (NOUVEAU)
│   │   ├── AuditContenu.jsx (NOUVEAU)
│   │   └── Cocons.jsx (NOUVEAU)
│   │
│   ├── creation/
│   │   ├── Idees.jsx (NOUVEAU)
│   │   ├── Briefs.jsx (NOUVEAU)
│   │   ├── Pages.jsx (NOUVEAU)
│   │   ├── Articles.jsx (AMÉLIORER)
│   │   ├── LiensInternes.jsx (NOUVEAU)
│   │   ├── SchemaMarkup.jsx (NOUVEAU)
│   │   ├── ImagesSEO.jsx (NOUVEAU)
│   │   ├── Calendrier.jsx (NOUVEAU)
│   │   └── Publication.jsx (NOUVEAU)
│   │
│   ├── suivi/
│   │   ├── Ameliorations.jsx (NOUVEAU)
│   │   ├── Positions.jsx (NOUVEAU)
│   │   ├── Performance.jsx (NOUVEAU)
│   │   ├── SEOTechnique.jsx (NOUVEAU)
│   │   ├── SEOLocal.jsx (NOUVEAU)
│   │   ├── Alertes.jsx (NOUVEAU)
│   │   └── Revenus.jsx (NOUVEAU)
│   │
│   └── config/
│       ├── Workflows.jsx (AMÉLIORER)
│       └── Credentials.jsx (NOUVEAU)
│
├── lib/
│   ├── supabase.js (ENRICHIR)
│   ├── n8n.js (ENRICHIR)
│   └── google.js
│
└── App.jsx (REFONTE ROUTING)
```

---

## 🚀 ORDRE D'EXÉCUTION

### Semaine 1
1. ✅ Créer tables Supabase (Phase 0)
2. ✅ Refonte Sidebar + Navigation
3. ✅ Améliorer Keywords.jsx
4. ✅ Améliorer QuickWins.jsx
5. ✅ Créer Cocons.jsx avec mind map

### Semaine 2
6. Créer Concurrents.jsx
7. Créer Backlinks.jsx
8. Créer AuditContenu.jsx
9. Créer Idees.jsx
10. Créer Briefs.jsx

### Semaine 3
11. Créer Pages.jsx
12. Améliorer Articles.jsx
13. Créer LiensInternes.jsx
14. Créer SchemaMarkup.jsx
15. Créer ImagesSEO.jsx

### Semaine 4
16. Créer Calendrier.jsx
17. Créer Publication.jsx
18. Créer Positions.jsx
19. Créer Performance.jsx

### Semaine 5
20. Créer SEOTechnique.jsx
21. Créer SEOLocal.jsx
22. Créer Alertes.jsx
23. Créer Revenus.jsx
24. Créer Credentials.jsx
25. Améliorer Workflows.jsx
26. Tests et polish

---

## 📊 MÉTRIQUES DE SUCCÈS

| Critère | Objectif |
|---------|----------|
| Modules fonctionnels | 27/27 |
| Tables Supabase | 28 (17 existantes + 11 nouvelles) |
| Workflows n8n | 35+ actifs |
| Temps chargement | < 2s |
| Couverture données | 100% sites connectés |

---

## 📈 RÉCAPITULATIF FINAL

| Section | Modules | Existants | À créer | À améliorer |
|---------|---------|-----------|---------|-------------|
| Principal | 2 | 2 | 0 | 0 |
| Analyse | 6 | 2 | 4 | 2 |
| Création | 9 | 1 | 8 | 1 |
| Suivi | 7 | 0 | 7 | 0 |
| Config | 2 | 1 | 1 | 1 |
| Outils | 1 | 1 | 0 | 0 |
| **TOTAL** | **27** | **7** | **20** | **4** |

---

*Plan créé le 2025-12-26*
*Version: 1.0*
