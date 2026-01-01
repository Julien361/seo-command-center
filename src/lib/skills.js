/**
 * SEO Skills - Extracted from CLAUDE.md
 * Used by Content Factory agents
 */

export const SKILLS = {

  // ===========================================
  // SKILL 1: SEO Content Expert
  // ===========================================
  SEO_CONTENT_EXPERT: `
## SEO Content Expert

### Règles de structure
- Structure sémantique H1 > H2 > H3 stricte (jamais de saut de niveau)
- Un seul H1 par page (le titre principal)
- H2 pour les sections principales (5-8 max)
- H3 pour les sous-sections

### Règles de contenu
- Densité keyword principal: 1-2% naturelle (pas de bourrage)
- Keyword dans: H1, premier paragraphe, 1-2 H2, meta description
- Longueurs recommandées:
  - Page pilier: 3000+ mots
  - Page fille: 1500-2000 mots
  - Article support: 800-1500 mots

### Optimisations
- Meta title: < 60 caractères, keyword au début
- Meta description: < 155 caractères, incitation au clic
- Introduction: répondre à l'intent dans les 100 premiers mots
- Maillage interne: 3-5 liens vers pages piliers/filles du même cocon
- Images: alt text descriptif avec keyword si pertinent

### Process de création
1. Analyser l'intent de recherche
2. Identifier les featured snippets existants
3. Structurer pour la position 0
4. Rédiger contenu de valeur
5. Optimiser meta title/description
`,

  // ===========================================
  // SKILL 2: Position Zero Master
  // ===========================================
  POSITION_ZERO_MASTER: `
## Position Zero Master

### Types de Featured Snippets

| Type | Format optimal | Déclencheurs |
|------|----------------|--------------|
| Paragraphe | 40-60 mots, réponse directe | "qu'est-ce que", "définition", "pourquoi" |
| Liste | 5-8 items numérotés ou à puces | "comment", "étapes", "conseils", "astuces" |
| Tableau | 3-5 colonnes, données comparatives | "comparaison", "vs", "différence", "prix" |

### Règle d'or
Répondre à la question principale dans les 100 premiers mots.
Google extrait souvent le premier paragraphe après le H1 ou H2.

### Optimisations Position 0
- Utiliser la question exacte comme H2
- Réponse immédiate sous le H2 (pas d'introduction)
- Format adapté à l'intent (liste pour "comment", paragraphe pour "définition")
- Reprendre les termes exacts de la requête
`,

  // ===========================================
  // SKILL 3: Semantic Cluster Intelligence
  // ===========================================
  SEMANTIC_CLUSTER: `
## Semantic Cluster (Cocon Sémantique)

### Structure recommandée
\`\`\`
Page Pilier (3000+ mots)
├── Satellite 1 (1500 mots) → link vers pilier
├── Satellite 2 (1500 mots) → link vers pilier
├── Satellite 3 (1500 mots) → link vers pilier + satellite 1
└── Satellite 4 (1500 mots) → link vers pilier + satellite 2
\`\`\`

### Maillage interne
- Chaque satellite → 1 lien vers page pilier (ancre variée, pas toujours le même texte)
- Page pilier → liens vers tous les satellites
- Satellites → liens croisés entre eux selon pertinence sémantique
- Utiliser des ancres descriptives (pas "cliquez ici")

### Règles
- Un cocon = une thématique cohérente
- Pas de liens vers des pages hors-cocon (sauf navigation)
- Chaque page doit apporter une valeur unique (pas de cannibalisation)
`,

  // ===========================================
  // SKILL 4: Search Intent Adaptive Engine
  // ===========================================
  SEARCH_INTENT: `
## Search Intent Classification

### Types d'intent

| Intent | Indicateurs | Format recommandé |
|--------|-------------|-------------------|
| Informationnel | "comment", "pourquoi", "qu'est-ce" | Guide éducatif, FAQ, tutoriel |
| Navigationnel | Nom de marque, site spécifique | Page optimisée marque |
| Transactionnel | "acheter", "prix", "devis", "commander" | Landing page avec CTA fort |
| Commercial | "meilleur", "comparatif", "avis", "vs" | Comparatif, tableau, reviews |

### Adaptation du contenu

**Informationnel**
- Ton: pédagogique, expert
- Structure: problème → explication → solution
- CTA: doux (newsletter, guide gratuit)

**Commercial**
- Ton: objectif, comparatif
- Structure: critères → comparaison → recommandation
- CTA: moyen (demander devis, essai gratuit)

**Transactionnel**
- Ton: direct, bénéfices clairs
- Structure: bénéfices → preuves → action
- CTA: fort (acheter, commander, réserver)
`,

  // ===========================================
  // SKILL 5: Editorial Personas (Humanisation)
  // ===========================================
  HUMANIZER: `
## Humanisation du contenu

### Objectif
Rendre le contenu IA indétectable tout en gardant la qualité.

### Anti-patterns à ÉVITER absolument
- "Dans cet article, nous allons..."
- "Il est important de noter que..."
- "En conclusion, ..."
- "Cependant, il convient de mentionner..."
- "Il est essentiel de comprendre que..."
- "Comme mentionné précédemment..."
- Listes à puces systématiques sans variation
- Transitions trop fluides et prévisibles
- Phrases toutes de même longueur
- Absence totale de contractions

### Patterns HUMAINS à utiliser
- Questions rhétoriques naturelles ("Vous vous demandez peut-être...")
- Anecdotes et exemples concrets du terrain
- Opinions nuancées ("Personnellement, je trouve que...")
- Imperfections stylistiques intentionnelles
- Références à l'expérience réelle
- Phrases courtes. Puis des plus longues pour varier le rythme.
- Expressions familières quand approprié ("Bon, soyons honnêtes...")
- Incises et parenthèses (comme celle-ci)

### Ton selon le persona
- Expert: confiant, précis, références techniques
- Journaliste: factuel, citations, sources
- Praticien: retour d'expérience, cas concrets, conseils pratiques
`,

  // ===========================================
  // SKILL 6: Quick Wins Detection
  // ===========================================
  QUICK_WINS: `
## Quick Wins SEO

### Critères de détection
- Position actuelle: 11-30 (pages 2-3 de Google)
- Volume de recherche: > 100/mois
- Difficulté: < 40

### Actions pour transformer un Quick Win
1. Enrichir le contenu (+500 mots minimum)
2. Améliorer les signaux UX (temps de lecture, scroll)
3. Ajouter des médias (images, vidéos, infographies)
4. Renforcer le maillage interne (3-5 liens entrants)
5. Optimiser Core Web Vitals de la page
6. Mettre à jour la date de publication
7. Ajouter une section FAQ avec PAA
`,

  // ===========================================
  // SKILL 7: Competitor Analysis
  // ===========================================
  COMPETITOR_ANALYSIS: `
## Analyse Concurrentielle

### Process d'analyse
1. Identifier les 5 concurrents directs (même SERP)
2. Analyser leur structure de contenu (H1, H2, longueur)
3. Mapper leurs points forts et faiblesses
4. Identifier les content gaps (ce qu'ils ne couvrent pas)
5. Trouver les angles différenciants possibles

### Ce qu'on cherche chez les concurrents
- Structure des articles (nombre de sections, profondeur)
- Éléments visuels (tableaux, images, vidéos)
- FAQ présente ou non
- Type de contenu (guide, comparatif, liste)
- Longueur moyenne
- Maillage interne visible

### Stratégie de différenciation
- Couvrir ce qu'ils ne couvrent pas
- Aller plus en profondeur sur les sujets clés
- Meilleur format (tableau vs texte, vidéo vs image)
- Données plus récentes
- Expertise plus visible (auteur, sources)
`,

  // ===========================================
  // SKILL 8: FAQ & PAA Optimization
  // ===========================================
  FAQ_PAA: `
## FAQ & People Also Ask

### Utilisation des PAA
- Récupérer les 5-10 questions PAA principales
- Chaque PAA = potentiel H2 ou élément de FAQ
- Répondre de manière concise (40-60 mots) puis développer

### Structure FAQ optimale
\`\`\`html
<section class="faq">
  <h2>Questions fréquentes sur [sujet]</h2>

  <h3>Question exacte du PAA ?</h3>
  <p>Réponse directe en 40-60 mots. Puis développement si nécessaire.</p>

  <h3>Autre question PAA ?</h3>
  <p>Réponse directe...</p>
</section>
\`\`\`

### Schema FAQ
Toujours générer le schema FAQPage pour les pages avec FAQ:
- Minimum 3 questions
- Maximum 10 questions (au-delà, Google ignore)
- Questions et réponses complètes dans le schema
`
};

/**
 * Get skills for a specific agent
 */
export function getAgentSkills(agentType) {
  switch (agentType) {
    case 'architect':
      return [
        SKILLS.SEMANTIC_CLUSTER,
        SKILLS.COMPETITOR_ANALYSIS,
        SKILLS.QUICK_WINS,
        SKILLS.SEARCH_INTENT
      ].join('\n\n');

    case 'strategist':
      return [
        SKILLS.SEARCH_INTENT,
        SKILLS.POSITION_ZERO_MASTER,
        SKILLS.FAQ_PAA,
        SKILLS.COMPETITOR_ANALYSIS
      ].join('\n\n');

    case 'writer':
      return [
        SKILLS.SEO_CONTENT_EXPERT,
        SKILLS.POSITION_ZERO_MASTER,
        SKILLS.SEMANTIC_CLUSTER,
        SKILLS.FAQ_PAA
      ].join('\n\n');

    case 'seo_editor':
      return [
        SKILLS.SEO_CONTENT_EXPERT,
        SKILLS.POSITION_ZERO_MASTER,
        SKILLS.SEMANTIC_CLUSTER
      ].join('\n\n');

    case 'humanizer':
      return [
        SKILLS.HUMANIZER
      ].join('\n\n');

    case 'fact_checker':
      return ''; // Fact checker uses web search, not skills

    case 'schema_generator':
      return [
        SKILLS.FAQ_PAA,
        SKILLS.POSITION_ZERO_MASTER
      ].join('\n\n');

    default:
      return '';
  }
}

export default SKILLS;
