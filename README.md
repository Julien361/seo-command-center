# SEO Command Center

Dashboard de gestion SEO pour le portfolio Julio Sikoutris - 15 sites WordPress.

## Architecture

```
seo-command-center/
├── src/                    # Frontend React + Vite + Tailwind
│   ├── components/         # Composants réutilisables
│   │   ├── chat/          # Claude Chat Panel
│   │   ├── common/        # Card, Badge, Button, StatCard
│   │   ├── dashboard/     # Stats, Charts, Tables
│   │   ├── layout/        # Sidebar, Header
│   │   └── workflows/     # Workflow Status
│   └── views/             # Pages principales
│       ├── Dashboard.jsx
│       ├── Sites.jsx
│       ├── Keywords.jsx
│       ├── QuickWins.jsx
│       ├── Articles.jsx
│       └── Workflows.jsx
└── server/                 # Backend Express + Claude API
    └── index.js           # WebSocket + Anthropic SDK
```

## Fonctionnalités

- **Dashboard** : Vue d'ensemble avec stats, graphiques, activité
- **Sites** : Gestion des 15 sites WordPress du portfolio
- **Keywords** : Suivi des positions avec filtres intent/quick wins
- **Quick Wins** : Détection des opportunités P11-20
- **Articles** : Gestion WordPress (créer, éditer, publier)
- **Workflows** : Monitoring des workflows n8n
- **Claude Chat** : Assistant SEO avec accès aux MCPs

## Installation

### 1. Frontend

```bash
cd ~/seo-command-center
npm install
npm run dev
```

→ Ouvre http://localhost:5173

### 2. Backend (pour le Chat Claude)

```bash
cd ~/seo-command-center/server

# Configurer l'API key
cp .env.example .env
# Éditer .env et ajouter ANTHROPIC_API_KEY

npm install
npm run dev
```

→ WebSocket sur ws://localhost:3002

## Configuration

### Variables d'environnement (server/.env)

```
ANTHROPIC_API_KEY=sk-ant-xxxxx
MCP_BRIDGE_URL=http://localhost:3001  # optionnel
PORT=3002
```

## MCPs Intégrés

Le Chat Claude a accès aux outils suivants :

| Outil | Description |
|-------|-------------|
| `wordpress_get_posts` | Lire les articles d'un site |
| `wordpress_create_post` | Créer un article |
| `supabase_query` | Requêtes sur la BDD SEO |
| `seo_keyword_analysis` | Analyse complète d'un keyword |
| `quick_wins_detect` | Détecter les opportunités |
| `n8n_execute_workflow` | Lancer un workflow |
| `n8n_list_workflows` | Lister les workflows |

## Sites WordPress

| Alias | Domaine | Entité |
|-------|---------|--------|
| srat | srat.fr | SRAT |
| srat-energies | srat-energies.fr | SRAT |
| pro-formation | formation-diagnostiqueur-immobilier.net | PRO FORMATION |
| pro-formation-re | pro-formation.re | PRO FORMATION |
| metis-digital | metis-digital.click | METIS |
| bien-vieillir | bien-vieillir.solutions | METIS |
| annuaire-qualiopi | annuairequaliopi.fr | METIS |
| assurance-animal | monassuranceanimal.fr | METIS |
| diagnostic-13 | diagnostic-immobilier13.fr | Client |
| 3pt | plan-pluriannuel-de-travaux-3pt.fr | Cabinet |
| digne-infos | digne-infos.fr | METIS |
| actualites-aurillac | actualites-aurillac.fr | METIS |
| actualites-gap | actualites-gap.fr | METIS |
| infos-aubenas | infos-aubenas.fr | METIS |
| manosque-infos | manosque-infos.fr | METIS |

## Synchronisation

### GitHub (recommandé)

```bash
# Créer un repo sur github.com, puis :
git remote add origin git@github.com:USERNAME/seo-command-center.git
git push -u origin main
```

### Sur un autre ordinateur

```bash
git clone git@github.com:USERNAME/seo-command-center.git
cd seo-command-center
npm install
cd server && npm install
```

## Stack Technique

- **Frontend** : React 19, Vite, Tailwind CSS v4
- **Charts** : Recharts
- **Icons** : Lucide React
- **Backend** : Express, WebSocket, Anthropic SDK
- **MCPs** : julio-seo-hub, n8n-mcp
