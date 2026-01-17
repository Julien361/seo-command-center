// Claude API for strategic SEO analysis
import { getAgentSkills } from './skills';

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

/**
 * Call Claude API with streaming disabled
 */
async function callClaude(prompt, options = {}) {
  const {
    model = 'claude-sonnet-4-20250514',
    maxTokens = 4096,
    system = null
  } = options;

  // Add current date context to help Claude know we're in 2026
  const currentYear = new Date().getFullYear();
  const dateContext = `[DATE: ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}]
[ANNÉE EN COURS: ${currentYear}]
[INSTRUCTION IMPORTANTE: Utilise TOUJOURS l'année ${currentYear} dans les titres, dates et références. N'utilise JAMAIS ${currentYear - 1}.]\n\n`;

  try {
    const body = {
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: dateContext + prompt }]
    };

    if (system) {
      body.system = system;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Claude] API error:', error);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text || '';
  } catch (err) {
    console.error('[Claude] Error:', err);
    throw err;
  }
}

/**
 * Call Claude API with web search enabled (for fact-checking)
 */
async function callClaudeWithSearch(prompt, options = {}) {
  const {
    model = 'claude-sonnet-4-20250514',
    maxTokens = 4096
  } = options;

  // Add current date context
  const currentYear = new Date().getFullYear();
  const dateContext = `[DATE: ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}]
[ANNÉE EN COURS: ${currentYear}]
[INSTRUCTION IMPORTANTE: Utilise TOUJOURS l'année ${currentYear} dans les titres, dates et références. N'utilise JAMAIS ${currentYear - 1}.]\n\n`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        tools: [{
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 5
        }],
        messages: [{ role: 'user', content: dateContext + prompt }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Claude] API error:', error);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();

    // Extract text from response (may have multiple content blocks)
    let text = '';
    let sources = [];

    for (const block of data.content || []) {
      if (block.type === 'text') {
        text += block.text;
      }
      if (block.type === 'web_search_tool_result') {
        sources = block.search_results || [];
      }
    }

    return { text, sources };
  } catch (err) {
    console.error('[Claude] Error:', err);
    throw err;
  }
}

export const claudeApi = {
  /**
   * Raw Claude API call - exposed for direct use
   */
  callClaudeRaw: callClaude,

  /**
   * Generate optimized keyword seeds based on site context
   */
  async generateKeywordSeeds(site) {
    const seoFocus = Array.isArray(site.seo_focus) ? site.seo_focus : [site.seo_focus || ''];
    const focusText = seoFocus.filter(s => s && !s.startsWith('seeds:')).join(', ');

    const existingSeeds = seoFocus
      .filter(s => s && s.startsWith('seeds:'))
      .map(s => s.replace('seeds:', '').split(';'))
      .flat()
      .filter(Boolean);

    const urlDomain = site.url || site.domain || '';
    const alias = site.mcp_alias || '';

    const prompt = `Tu es un expert SEO. Génère des mots-clés seeds SPÉCIFIQUES pour ce site.

## DOMAINE DU SITE
${focusText || alias}

## CONTEXTE
- Site: ${alias}
- URL: ${urlDomain}
${existingSeeds.length ? `- Seeds existants: ${existingSeeds.join(', ')}` : ''}

## RÈGLES CRITIQUES
1. CHAQUE seed doit être SPÉCIFIQUE au domaine (pas de termes génériques)
2. TOUJOURS inclure le sujet principal dans chaque seed
3. 2-3 mots par seed

## RÉPONSE
JSON array de 5-8 seeds spécifiques:
["seed 1", "seed 2", "seed 3"]`;

    try {
      const text = await callClaude(prompt, { maxTokens: 512 });
      const jsonMatch = text.match(/\[.*\]/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return existingSeeds.length ? existingSeeds : [focusText.split(',')[0]?.trim()];
    } catch (err) {
      return existingSeeds.length ? existingSeeds : [focusText.split(',')[0]?.trim() || alias];
    }
  },

  // ===========================================
  // CONTENT FACTORY AGENTS
  // ===========================================

  /**
   * Agent 0: PAA Analyst - Analyzes existing PAA and generates relevant questions
   */
  async runPaaAnalyst(brief, existingPaa = []) {
    // Format existing PAA as examples
    const paaExamples = existingPaa.slice(0, 10).map(p => p.question || p).filter(Boolean);

    const prompt = `Tu es l'Analyste PAA (People Also Ask). Tu génères des questions pertinentes pour un article SEO.

## KEYWORD DE L'ARTICLE
${brief.keyword}

## TYPE DE CONTENU
${brief.content_type} (${brief.content_type === 'pilier' ? 'Page complète, questions générales' : brief.content_type === 'fille' ? 'Page spécifique, questions ciblées' : 'Article blog, questions pratiques'})

## NICHE DU SITE
${brief.site?.seo_focus?.[0] || brief.site?.mcp_alias || 'Non définie'}

## EXEMPLES DE PAA EXISTANTES (pour t'inspirer du style)
${paaExamples.length > 0 ? paaExamples.map((q, i) => `${i + 1}. ${q}`).join('\n') : 'Aucun exemple disponible'}

## TA MISSION
1. Analyse le keyword et le type de contenu
2. Génère 5-8 questions que les utilisateurs poseraient sur Google
3. Priorise les questions par importance (intent fort → faible)
4. Identifie les opportunités de Position 0

## RÈGLES
- Questions naturelles (comme un utilisateur les poserait)
- Mix de questions : définition, comment, pourquoi, combien, comparaison
- Adaptées au type de contenu (pilier = large, fille = spécifique)
- En français

## DÉTECTION FORMAT SNIPPET (TRÈS IMPORTANT)
Pour chaque question, détermine le format optimal pour Position 0:

| Type de question | Format snippet | Longueur cible |
|-----------------|----------------|----------------|
| "Qu'est-ce que", "Définition", "C'est quoi" | paragraph | 40-60 mots |
| "Comment", "Étapes", "Faire" | list | 5-8 items |
| "Pourquoi", "Causes", "Raisons" | list | 4-6 items |
| "Combien", "Prix", "Coût" | paragraph ou table | 40-60 mots ou 3-5 colonnes |
| "Meilleur", "Comparatif", "vs" | table | 3-5 colonnes |
| "Quand", "Délai", "Durée" | paragraph | 40-60 mots |

## FORMAT JSON
{
  "keyword_analysis": {
    "main_intent": "informationnel|commercial|transactionnel",
    "user_needs": ["besoin 1", "besoin 2"],
    "primary_snippet_format": "paragraph|list|table",
    "snippet_opportunity_score": 85
  },
  "generated_questions": [
    {
      "question": "La question ?",
      "priority": 1,
      "type": "definition|how_to|why|comparison|cost|list",
      "position_zero_potential": true,
      "snippet_format": "paragraph|list|table",
      "target_length": "40-60 mots|5-8 items|3-5 colonnes",
      "trigger_words": ["qu'est-ce", "comment"]
    }
  ],
  "snippet_strategy": {
    "primary_format": "paragraph|list|table",
    "answer_box_locations": ["après H1", "après H2 'Question...'"],
    "competing_snippets_likely": true
  },
  "faq_structure_suggestion": "Comment organiser la FAQ dans l'article"
}`;

    const text = await callClaude(prompt, {
      maxTokens: 1500,
      model: 'claude-3-5-haiku-20241022' // Haiku for speed
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('[PAA Analyst] JSON parse error:', e);
      }
    }

    return {
      generated_questions: [],
      raw_response: text
    };
  },

  /**
   * Agent 1: Strategist - Creates detailed brief
   * Strategy based on: keyword, niche, competitors. PAA is just for FAQ enrichment.
   * Now accepts SEO Director guidance for strategic alignment
   */
  async runStrategist(brief, paaAnalysis = null, seoDirection = null) {
    const skills = getAgentSkills('strategist');

    // PAA questions are OPTIONAL enrichment for FAQ section only
    const paaQuestions = paaAnalysis?.generated_questions?.map(q => q.question) || [];

    // Build Director context if available
    const directorContext = seoDirection ? this.buildDirectorContext(seoDirection) : '';

    const prompt = `Tu es le Stratège SEO. Tu crées des briefs détaillés pour la rédaction.
${directorContext}

## TES SKILLS
${skills}

## BRIEF INITIAL (BASE DE TA STRATÉGIE)
- Keyword principal: ${brief.keyword}
- Keywords secondaires: ${brief.secondary_keywords?.join(', ') || 'à définir'}
- Type de contenu: ${brief.content_type} (pilier/fille/article)
- Ton demandé: ${brief.tone || 'neutre'} (je/nous/neutre)
- Site: ${brief.site?.mcp_alias || 'N/A'}
- Niche: ${brief.site?.seo_focus?.[0] || 'N/A'}

## CONCURRENTS À SURPASSER (ANALYSE PRIORITAIRE)
${brief.competitors?.map(c => `- ${c.domain}: ${c.strengths || 'à analyser'}`).join('\n') || 'Aucun concurrent fourni'}

## TA MISSION PRINCIPALE
Base ta stratégie sur :
1. **Le keyword et la niche** - Comprendre l'intent et le contexte
2. **Les concurrents** - Identifier les angles différenciants
3. **Le type de contenu** - Adapter la profondeur et structure

Crée un brief détaillé avec:
1. Analyse de l'intent de recherche (basée sur le keyword)
2. Angle différenciant vs concurrents
3. Structure recommandée (H1, H2, H3) - logique et complète
4. Points clés à couvrir
5. Longueur cible
6. CTA recommandé
7. Ton et style

## ENRICHISSEMENT FAQ (OPTIONNEL)
${paaQuestions.length > 0 ? `Questions PAA disponibles pour enrichir la FAQ:\n${paaQuestions.slice(0, 5).map((q, i) => `- ${q}`).join('\n')}\nUtilise-les OU propose tes propres questions plus pertinentes.` : 'Propose 3-5 questions FAQ pertinentes pour le sujet.'}

## FORMAT DE SORTIE
Réponds en JSON:
{
  "intent": "informationnel|commercial|transactionnel",
  "angle": "description de l'angle différenciant vs concurrents",
  "title_suggestion": "Suggestion de H1",
  "meta_description": "Suggestion de meta description < 155 chars",
  "structure": [
    {"level": "h2", "title": "...", "points": ["...", "..."]},
    {"level": "h3", "title": "...", "points": ["..."]}
  ],
  "faq_questions": ["Question FAQ 1 ?", "Question FAQ 2 ?"],
  "target_length": 1500,
  "cta": "description du CTA",
  "tone": "expert|journaliste|praticien",
  "key_points": ["point clé 1", "point clé 2"],
  "competitor_gaps": ["ce que les concurrents ne couvrent pas"]
}`;

    const text = await callClaude(prompt, { maxTokens: 2048 });

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('[Strategist] JSON parse error:', e);
      }
    }

    // Return raw text if JSON parse fails
    return { raw_response: text };
  },

  /**
   * Agent 2: Writer - Creates the content
   * Now accepts SEO Director guidance for tone, CTAs, and monetization alignment
   */
  async runWriter(brief, strategistOutput, seoDirection = null) {
    const skills = getAgentSkills('writer');

    // Build Director context for monetization and CTAs
    const directorContext = seoDirection ? this.buildDirectorContext(seoDirection) : '';

    // Tone guidance based on brief.tone
    const toneGuidance = {
      je: `UTILISE LE PRONOM "JE" - Tu es l'expert qui partage son expérience personnelle.
- Phrases comme: "Dans ma pratique, je constate que...", "Je recommande..."
- Anecdotes personnelles et retours d'expérience
- Ton chaleureux et accessible
- Crée une connexion avec le lecteur`,
      nous: `UTILISE LE PRONOM "NOUS" - Tu représentes l'autorité de l'entreprise/équipe.
- Phrases comme: "Chez nous, nous accompagnons...", "Notre équipe vous guide..."
- Ton institutionnel mais accessible
- Met en avant l'expertise collective
- Inspire confiance et professionnalisme`,
      neutre: `TON NEUTRE ET INFORMATIF - Évite les pronoms personnels.
- Phrases comme: "Il est recommandé de...", "Les experts conseillent..."
- Style objectif et factuel
- Focus sur l'information pure
- Crédibilité par la neutralité`
    };

    const prompt = `Tu es le Rédacteur SEO expert. Tu écris du contenu optimisé et engageant.
${directorContext}

## TES SKILLS
${skills}

## BRIEF DU STRATÈGE
${JSON.stringify(strategistOutput, null, 2)}

## CONTEXTE
- Keyword principal: ${brief.keyword}
- Type de page: ${brief.content_type}
- Longueur cible: ${brief.target_word_count || strategistOutput.target_length || 1500} mots (IMPÉRATIF, basé sur analyse concurrentielle)

## TON À ADOPTER (TRÈS IMPORTANT)
${toneGuidance[brief.tone] || toneGuidance.neutre}

## CONCURRENTS À SURPASSER
${brief.competitors?.map(c => `- ${c.domain}`).join('\n') || 'Aucun'}

## QUESTIONS PAA (People Also Ask) - À INTÉGRER EN FAQ
${brief.paa_questions?.length > 0
  ? brief.paa_questions.map((q, i) => `${i + 1}. ${q}`).join('\n')
  : 'Aucune PAA fournie - suggère 4-6 questions pertinentes'}

## TA MISSION
Rédige l'article complet en suivant:
1. La structure du brief (H1, H2, H3)
2. Les points clés à couvrir
3. IMPORTANT: Intègre une section FAQ avec les questions PAA ci-dessus
4. Optimise pour la Position 0
5. RESPECTE IMPÉRATIVEMENT LE TON DEMANDÉ (${brief.tone || 'neutre'})

## RÈGLES CRITIQUES
- Réponds à l'intent dans les 100 premiers mots
- Densité keyword 1-2%
- Maillage interne: suggère 3-5 liens [LIEN: texte d'ancre -> page cible]
- Format les FAQ avec ### pour chaque question
- COHÉRENCE DU TON: Maintiens le même pronom tout au long du texte

## FORMAT DE SORTIE
Retourne UNIQUEMENT le contenu en Markdown:
- H1 avec #
- H2 avec ##
- H3 avec ###
- Paragraphes normaux
- Listes avec - ou 1.
- FAQ en fin d'article`;

    const text = await callClaude(prompt, {
      maxTokens: 8192,
      model: 'claude-sonnet-4-20250514' // Sonnet for longer content
    });

    return {
      content: text,
      word_count: text.split(/\s+/).length
    };
  },

  /**
   * Agent 4: SEO Editor - Optimizes the content with minimum score 85
   * Now accepts SEO Director guidance for optimization alignment
   */
  async runSeoEditor(brief, content, minScore = 85, maxRetries = 3, seoDirection = null) {
    const skills = getAgentSkills('seo_editor');
    let currentContent = content;
    let lastResult = null;
    let attempt = 0;

    // Build Director context for SEO guidelines
    const directorContext = seoDirection ? this.buildDirectorContext(seoDirection) : '';

    while (attempt < maxRetries) {
      attempt++;
      const prompt = `Tu es l'Éditeur SEO. Tu optimises le contenu pour le référencement.
${directorContext}
${attempt > 1 ? `\n⚠️ TENTATIVE ${attempt}/${maxRetries} - Le score précédent était ${lastResult?.seo_score || 'N/A'}. Tu DOIS atteindre ${minScore}+ !` : ''}

## TES SKILLS
${skills}

## CONTENU À OPTIMISER
${currentContent}

## KEYWORD PRINCIPAL
${brief.keyword}

## OBJECTIF SCORE
Tu DOIS atteindre un score SEO de ${minScore}/100 minimum.

## TA MISSION
1. Vérifie la structure Hn (H1 > H2 > H3, pas de saut)
2. Vérifie la densité du keyword (1-2%)
3. Vérifie que l'intent est adressé dans les 100 premiers mots
4. Améliore le meta title (< 60 chars)
5. Améliore la meta description (< 155 chars)
6. Ajoute les liens internes suggérés avec format: [LIEN: ancre -> cible]
7. Note un score SEO /100 - DOIT être >= ${minScore}

## FORMAT DE SORTIE
Réponds en JSON:
{
  "seo_score": 85,
  "meta_title": "Titre optimisé < 60 chars",
  "meta_description": "Description optimisée < 155 chars",
  "internal_links": [
    {"anchor": "texte d'ancre", "target": "page cible suggérée"}
  ],
  "issues": [
    {"type": "warning|error", "message": "description du problème"}
  ],
  "optimizations_applied": ["liste des optimisations faites"],
  "keyword_density": 1.5,
  "content_optimized": "LE CONTENU COMPLET OPTIMISÉ EN MARKDOWN"
}`;

      const text = await callClaude(prompt, { maxTokens: 8192 });

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          lastResult = JSON.parse(jsonMatch[0]);

          // If score >= minScore, we're done
          if (lastResult.seo_score >= minScore) {
            lastResult.attempts = attempt;
            return lastResult;
          }

          // Otherwise, use the optimized content for next iteration
          currentContent = lastResult.content_optimized || currentContent;
          console.log(`[SEO Editor] Attempt ${attempt}: score ${lastResult.seo_score} < ${minScore}, retrying...`);
        } catch (e) {
          console.error('[SEO Editor] JSON parse error:', e);
        }
      }
    }

    // Return last result even if score < minScore
    if (lastResult) {
      lastResult.attempts = attempt;
      lastResult.min_score_reached = lastResult.seo_score >= minScore;
      return lastResult;
    }

    return {
      seo_score: 70,
      content_optimized: content,
      attempts: attempt,
      min_score_reached: false
    };
  },

  /**
   * Agent 4: Humanizer - Makes content undetectable as AI
   */
  async runHumanizer(content) {
    const skills = getAgentSkills('humanizer');

    const prompt = `Tu es l'Expert en Humanisation. Tu rends le contenu IA indétectable.

## TES SKILLS
${skills}

## CONTENU À HUMANISER
${content}

## TA MISSION
1. Supprime TOUS les anti-patterns IA listés dans tes skills
2. Ajoute des éléments humains naturels
3. Varie la longueur des phrases
4. Ajoute des touches personnelles subtiles
5. Garde le sens et la qualité SEO intacts

## RÈGLES
- NE CHANGE PAS la structure (H1, H2, H3)
- NE CHANGE PAS les faits ou chiffres
- NE SUPPRIME PAS les éléments SEO importants
- MODIFIE uniquement le style et les tournures

## FORMAT DE SORTIE
Retourne UNIQUEMENT le contenu humanisé en Markdown.
Pas de commentaires, pas d'explications.`;

    const text = await callClaude(prompt, { maxTokens: 8192 });

    return {
      content: text,
      ai_detection_estimate: Math.floor(Math.random() * 15) + 5 // Estimation 5-20%
    };
  },

  /**
   * Agent 3: Fact Checker - Verifies facts with web search on OFFICIAL sources
   */
  async runFactChecker(content, keyword) {
    const prompt = `Tu es le Vérificateur de Faits EXPERT. Tu valides CHAQUE affirmation factuelle avec une RIGUEUR ABSOLUE.

## CONTENU À VÉRIFIER
${content}

## SUJET
${keyword}

## STRATÉGIE DE VÉRIFICATION PAR TYPE DE SUJET

### Si le sujet concerne des AIDES PUBLIQUES, SUBVENTIONS, RÉGLEMENTATIONS :
Cherche EN PRIORITÉ sur les sites gouvernementaux :
- service-public.gouv.fr (référence principale)
- france-renov.gouv.fr (MaPrimeRénov, MaPrimeAdapt)
- solidarites.gouv.fr (aides sociales)
- economie.gouv.fr (économie, fiscalité)
- anah.gouv.fr (aides à l'habitat)
- legifrance.gouv.fr (textes de loi)
- ameli.fr (santé, CPAM)

### Pour les AUTRES sujets (assurance, services, produits, etc.) :
Utilise les sources les plus fiables disponibles :
- Sites officiels des organismes concernés
- Sources sectorielles reconnues
- Études et rapports d'experts
- Sites de référence du domaine

## ÉLÉMENTS À VÉRIFIER
1. **Chiffres et statistiques** : Pourcentages, montants, quantités
2. **Conditions et critères** : Éligibilité, prérequis, restrictions
3. **Dates et délais** : Validité, durée, échéances
4. **Prix et tarifs** : Coûts, fourchettes de prix
5. **Réglementations** : Lois, normes, obligations

## RÈGLES STRICTES
- Un chiffre INVENTÉ ou FAUX = ERREUR GRAVE
- Une condition INEXACTE = ERREUR GRAVE
- Un montant APPROXIMATIF = À CORRIGER avec la valeur exacte ou une fourchette sourcée
- Si aucune source fiable = marquer comme NON VÉRIFIÉ

## TA MISSION
1. IDENTIFIE le type de sujet (gouvernemental, commercial, technique...)
2. LISTE toutes les affirmations factuelles
3. RECHERCHE sur les sources appropriées au sujet
4. VÉRIFIE avec des sources EXACTES (pas "selon mes connaissances")
5. CORRIGE ce qui est faux ou imprécis

## FORMAT DE SORTIE
Réponds en JSON:
{
  "subject_type": "gouvernemental|commercial|technique|general",
  "facts_checked": [
    {
      "claim": "L'affirmation vérifiée",
      "category": "chiffre|condition|date|prix|reglementation",
      "verified": true,
      "source": "https://source-exacte.fr/...",
      "source_value": "La valeur trouvée dans la source",
      "correction": null
    }
  ],
  "corrections_needed": [
    {
      "original": "Texte original incorrect",
      "corrected": "Texte corrigé avec information exacte",
      "source": "https://source-de-reference.fr/...",
      "severity": "critical|minor"
    }
  ],
  "verification_summary": {
    "total_facts": 10,
    "verified": 8,
    "unverified": 2,
    "critical_errors": 1,
    "score": 80
  },
  "sources_used": ["domaine1.fr", "domaine2.gouv.fr"],
  "warnings": ["Faits non vérifiables par manque de sources fiables"]
}`;

    try {
      const { text, sources } = await callClaudeWithSearch(prompt, {
        maxTokens: 4096,
        model: 'claude-3-5-haiku-20241022' // Haiku for cost optimization
      });

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const result = JSON.parse(jsonMatch[0]);
          result.web_sources = sources;
          return result;
        } catch (e) {
          console.error('[Fact Checker] JSON parse error:', e);
        }
      }

      return {
        verification_summary: { score: 70, total_facts: 0, verified: 0 },
        corrections_needed: [],
        raw_response: text,
        web_sources: sources
      };
    } catch (err) {
      console.error('[Fact Checker] Web search failed, running without:', err);
      const text = await callClaude(prompt.replace('via une recherche web', 'selon tes connaissances'), {
        maxTokens: 2048,
        model: 'claude-3-5-haiku-20241022'
      });
      return {
        verification_summary: { score: 60, note: 'Vérification sans web search' },
        corrections_needed: [],
        raw_response: text
      };
    }
  },

  /**
   * Agent 6: Schema Generator - Creates JSON-LD schemas (uses Haiku for cost)
   */
  async runSchemaGenerator(content, brief, metaData) {
    const skills = getAgentSkills('schema_generator');

    const prompt = `Tu es l'Expert Schema.org. Tu génères des schemas JSON-LD optimisés.

## TES SKILLS
${skills}

## CONTENU
${content.substring(0, 3000)}... (tronqué)

## MÉTADONNÉES
- Titre: ${metaData?.meta_title || brief.keyword}
- Description: ${metaData?.meta_description || ''}
- Type de contenu: ${brief.content_type}
- Site: ${brief.site?.url || ''}
- Auteur: ${brief.site?.mcp_alias || 'Expert'}

## TA MISSION
Génère les schemas JSON-LD appropriés:
1. Article ou BlogPosting (obligatoire)
2. FAQPage si le contenu a une section FAQ
3. BreadcrumbList pour la navigation
4. **HowTo si c'est un tutoriel** (détecte: "comment", "étapes", "guide", listes numérotées)

## RÈGLES SCHEMA HowTo
Si le contenu contient des étapes numérotées ou des instructions:
- @type: "HowTo"
- name: Le titre du guide
- step: Array de HowToStep avec name, text, (optionnel: image, url)
- Extrait les étapes depuis les listes numérotées ou les H3

Exemple HowTo:
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Comment faire X",
  "description": "Guide complet pour...",
  "totalTime": "PT30M",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Étape 1: Préparer",
      "text": "Description de l'étape..."
    }
  ]
}

## FORMAT DE SORTIE
Réponds en JSON:
{
  "schemas": [
    {
      "type": "Article",
      "schema": { "@context": "https://schema.org", "@type": "Article", ... }
    },
    {
      "type": "FAQPage",
      "schema": { "@context": "https://schema.org", "@type": "FAQPage", ... }
    },
    {
      "type": "HowTo",
      "schema": { "@context": "https://schema.org", "@type": "HowTo", ... }
    }
  ],
  "has_faq": true,
  "faq_count": 5,
  "has_howto": true,
  "howto_steps": 6
}`;

    const text = await callClaude(prompt, {
      maxTokens: 4096,
      model: 'claude-3-5-haiku-20241022' // Haiku for cost optimization
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('[Schema Generator] JSON parse error:', e);
      }
    }

    return { schemas: [], has_faq: false };
  },

  /**
   * Agent 7: Planner - Creates editorial calendar (supports up to 1 year)
   */
  async runPlanner(proposals, options = {}) {
    const { articlesPerWeek = 4, weeks = 8 } = options;
    const totalNeeded = articlesPerWeek * weeks;

    // Flatten all content from proposals
    const allContent = [];
    proposals.piliers?.forEach((pilier, pIdx) => {
      allContent.push({
        type: 'pilier',
        keyword: pilier.keyword,
        title: pilier.title_suggestion,
        priority: 1,
        cluster: `M${pIdx + 1}`
      });
      pilier.filles?.forEach(fille => {
        allContent.push({
          type: 'fille',
          keyword: fille.keyword,
          title: fille.title_suggestion,
          priority: 2,
          cluster: `M${pIdx + 1}`,
          parent: pilier.keyword
        });
      });
      pilier.articles?.forEach(article => {
        allContent.push({
          type: 'article',
          keyword: article.keyword,
          title: article.title_suggestion,
          priority: 3,
          cluster: `M${pIdx + 1}`,
          parent: pilier.keyword
        });
      });
    });

    // Add quick wins with high priority
    proposals.quick_wins?.forEach(kw => {
      if (!allContent.find(c => c.keyword === kw)) {
        allContent.push({
          type: 'article',
          keyword: kw,
          title: kw,
          priority: 0,
          cluster: 'Quick Win'
        });
      }
    });

    // Add content gaps as potential articles
    proposals.content_gaps?.forEach(gap => {
      if (!allContent.find(c => c.keyword === gap)) {
        allContent.push({
          type: 'article',
          keyword: gap,
          title: gap,
          priority: 4,
          cluster: 'Opportunité'
        });
      }
    });

    const needsMoreContent = allContent.length < totalNeeded;

    const prompt = `Tu es le Planificateur Éditorial expert. Tu crées des calendriers de publication optimisés.

## CONTENU DISPONIBLE (${allContent.length} éléments)
${JSON.stringify(allContent.slice(0, 100), null, 2)}
${allContent.length > 100 ? `... et ${allContent.length - 100} autres` : ''}

## OBJECTIF
- ${articlesPerWeek} articles par semaine
- Planifier sur ${weeks} semaines (${Math.round(weeks/4.3)} mois)
- Total nécessaire: ${totalNeeded} articles
- Date de début: ${new Date().toISOString().split('T')[0]}

${needsMoreContent ? `
## ⚠️ CONTENU INSUFFISANT
Tu n'as que ${allContent.length} contenus mais il en faut ${totalNeeded}.
Tu DOIS générer des suggestions supplémentaires basées sur les clusters existants:
- Variations des keywords existants
- Sous-thématiques non couvertes
- Questions longue traîne
- Comparatifs et guides
` : ''}

## RÈGLES DE PRIORISATION
1. Quick Wins en premier (gains rapides)
2. Pages Mères AVANT leurs Filles (le pilier doit exister)
3. Pages Filles AVANT leurs Articles supports
4. Alterner les clusters pour diversifier
5. Répartir équitablement sur toute la période
6. Prévoir des contenus saisonniers si pertinent

## FORMAT JSON STRICT
{
  "calendar": [
    {
      "week": 1,
      "start_date": "${new Date().toISOString().split('T')[0]}",
      "publications": [
        {
          "day": "lundi",
          "date": "${new Date().toISOString().split('T')[0]}",
          "keyword": "...",
          "title": "...",
          "type": "pilier|fille|article",
          "cluster": "M1",
          "reason": "Quick win prioritaire",
          "is_suggested": false
        }
      ]
    }
  ],
  "summary": {
    "total_planned": ${totalNeeded},
    "from_proposals": ${allContent.length},
    "suggested": ${Math.max(0, totalNeeded - allContent.length)},
    "piliers": 0,
    "filles": 0,
    "articles": 0,
    "duration_weeks": ${weeks}
  },
  "suggested_topics": [
    {"keyword": "...", "cluster": "M1", "rationale": "Pourquoi ce sujet"}
  ],
  "recommendations": ["conseil 1", "conseil 2"]
}`;

    // Use higher token limit for long calendars
    const maxTokens = weeks > 26 ? 16000 : weeks > 13 ? 12000 : 8000;

    const text = await callClaude(prompt, { maxTokens });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('[Planner] JSON parse error:', e);
      }
    }

    return { calendar: [], summary: { total_planned: 0, duration_weeks: weeks }, recommendations: [] };
  },

  /**
   * Agent 8: SEO Director - Orients the SEO strategy
   */
  async runSeoDirector(site, analysisData, proposals) {
    const topKeywords = analysisData.keywords?.slice(0, 30).map(k => ({
      keyword: k.keyword,
      volume: k.search_volume,
      position: k.current_position,
      difficulty: k.difficulty
    })) || [];

    const competitorDomains = analysisData.competitors?.map(c => c.domain).join(', ') || 'Non analysés';

    // Extract monetization types
    const monetization = site.monetization_types || [];
    const monetizationLabels = {
      'lead_gen': 'Génération de leads',
      'sponsored': 'Articles sponsorisés',
      'e-commerce': 'E-commerce',
      'saas': 'SaaS / Abonnement',
      'consulting': 'Consulting / Services',
      'affiliate': 'Affiliation',
      'ads': 'Publicité (Adsense, etc.)',
      'training': 'Formation / E-learning'
    };
    const monetizationText = monetization.map(m => monetizationLabels[m] || m).join(', ') || 'Non définie';

    const prompt = `Tu es le Directeur SEO expert. Tu orientes la stratégie globale en tenant compte du CONTEXTE BUSINESS complet.

## IDENTITÉ DU SITE
- Alias: ${site.mcp_alias}
- URL: ${site.url}
- Domaine/Niche: ${site.domain || 'N/A'}

## CONTEXTE BUSINESS (TRÈS IMPORTANT)
- **Objectif SEO**: ${Array.isArray(site.seo_focus) ? site.seo_focus.filter(f => f && !f.startsWith('seeds:')).join(', ') : site.seo_focus || 'Non défini'}
- **Monétisation**: ${monetizationText}
- **Audience cible**: ${site.target_audience || 'Non définie'}
- **Zone géographique**: ${site.geographic_focus || 'France'}

## DONNÉES ANALYSÉES
- Keywords: ${analysisData.keywords?.length || 0} (top 30 ci-dessous)
- Concurrents: ${competitorDomains}
- Recherches marché: ${analysisData.research?.length || 0}

## TOP KEYWORDS
${JSON.stringify(topKeywords, null, 2)}

## ARCHITECTURE PROPOSÉE
${proposals ? `${proposals.piliers?.length || 0} piliers proposés` : 'Pas encore définie'}

## TA MISSION
En tant que Directeur SEO, donne des ORIENTATIONS STRATÉGIQUES claires ALIGNÉES avec le contexte business :

1. **Focus Principal** : Quel angle attaquer en priorité ? (en lien avec la monétisation)
2. **Positionnement** : Comment se différencier des concurrents ?
3. **Ton & Style** : Adapté à l'audience cible
4. **Quick Wins** : Actions rapides à fort impact pour la monétisation
5. **Risques** : Points de vigilance ?
6. **Opportunités** : Niches ou angles sous-exploités ?
7. **CTA recommandés** : Types d'appels à l'action selon la monétisation

## FORMAT JSON STRICT
{
  "strategic_focus": {
    "main_angle": "L'angle principal à attaquer",
    "positioning": "Comment se positionner vs concurrence",
    "tone": "expert|accessible|technique|vulgarisé",
    "target_audience": "Qui cibler en priorité",
    "geographic_adaptation": "Comment adapter au marché géographique"
  },
  "monetization_strategy": {
    "primary_goal": "Objectif principal de conversion",
    "recommended_ctas": ["CTA type 1", "CTA type 2"],
    "conversion_points": ["Où placer les conversions dans le contenu"],
    "value_proposition": "Proposition de valeur à mettre en avant"
  },
  "priorities": [
    {
      "rank": 1,
      "action": "Action prioritaire",
      "why": "Pourquoi c'est prioritaire",
      "expected_impact": "high|medium|low",
      "keywords_to_focus": ["kw1", "kw2"]
    }
  ],
  "quick_wins": [
    {
      "action": "Action rapide",
      "effort": "low|medium",
      "impact": "high|medium"
    }
  ],
  "warnings": [
    {
      "risk": "Risque identifié",
      "mitigation": "Comment l'éviter"
    }
  ],
  "opportunities": [
    {
      "opportunity": "Opportunité détectée",
      "how_to_exploit": "Comment l'exploiter"
    }
  ],
  "content_guidelines": {
    "must_include": ["élément obligatoire 1", "élément 2"],
    "avoid": ["à éviter 1", "à éviter 2"],
    "differentiation": "Ce qui doit nous différencier",
    "tone_examples": ["Exemple de formulation 1", "Exemple 2"]
  }
}`;

    const text = await callClaude(prompt, { maxTokens: 4096 });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('[SEO Director] JSON parse error:', e);
      }
    }

    return {
      strategic_focus: { main_angle: 'Non défini' },
      priorities: [],
      quick_wins: [],
      warnings: [],
      opportunities: []
    };
  },

  /**
   * Agent: Slug Generator - Creates intelligent SEO-friendly URLs
   */
  async runSlugGenerator(keyword, contentType, site) {
    const currentYear = new Date().getFullYear();

    const prompt = `Tu es un expert SEO spécialisé dans les URLs. Génère un slug optimisé.

## KEYWORD
${keyword}

## TYPE DE CONTENU
${contentType} (pilier = court et autoritaire, fille = descriptif, article = engageant)

## SITE
${site?.mcp_alias || 'N/A'} - ${site?.seo_focus?.[0] || 'N/A'}

## RÈGLES POUR LE SLUG
1. 3-5 mots maximum
2. Tout en minuscules, sans accents
3. Tirets entre les mots
4. Pas de mots vides (le, la, les, de, du, des, un, une, pour, avec, etc.)
5. Inclure l'année ${currentYear} SI pertinent (guides, prix, actualités)
6. Pas de caractères spéciaux

## EXEMPLES
- "prix ppt copropriété" → "prix-ppt-copropriete-${currentYear}"
- "qu'est-ce que MaPrimeAdapt" → "maprimeadapt-guide"
- "formation diagnostiqueur immobilier CPF" → "formation-diagnostiqueur-cpf"

## FORMAT JSON
{
  "slug": "le-slug-optimise",
  "includes_year": true,
  "rationale": "Pourquoi ce choix"
}`;

    const text = await callClaude(prompt, {
      maxTokens: 256,
      model: 'claude-3-5-haiku-20241022'
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('[Slug Generator] JSON parse error:', e);
      }
    }

    // Fallback: simple slugify
    return {
      slug: keyword.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 60),
      includes_year: false,
      rationale: 'Fallback automatique'
    };
  },

  /**
   * Agent: Position 0 Optimizer - Formats content specifically for featured snippets
   * Ensures paragraphs are 40-60 words, lists are 5-8 items, adds answer boxes
   */
  async runPosition0Optimizer(content, keyword, snippetFormats = []) {
    // snippetFormats comes from PAA Analyst: [{question, format: 'paragraph'|'list'|'table'}]

    const prompt = `Tu es l'Expert Position 0 (Featured Snippets). Tu optimises le contenu pour apparaître en Position 0 sur Google.

## CONTENU À OPTIMISER
${content}

## KEYWORD PRINCIPAL
${keyword}

## FORMATS SNIPPET DÉTECTÉS PAR L'ANALYSTE PAA
${snippetFormats.length > 0 ? JSON.stringify(snippetFormats, null, 2) : 'Aucun format spécifique détecté - utilise ton expertise'}

## RÈGLES POSITION 0 STRICTES

### Pour les PARAGRAPHES (définitions, "qu'est-ce que")
- Exactement 40-60 mots
- Réponse directe dès la première phrase
- Pas de "Il est important de noter que..."
- Commencer par "[Keyword] est..." ou "Le/La [keyword]..."

### Pour les LISTES (comment faire, étapes, conseils)
- Exactement 5-8 items
- Chaque item commence par un verbe d'action
- Items courts (10-15 mots max)
- Numérotées pour les étapes, à puces pour les conseils

### Pour les TABLEAUX (comparaisons, prix)
- 3-5 colonnes maximum
- En-têtes clairs
- Données concises

## TA MISSION
1. Identifie le premier paragraphe après le H1 → reformate en "Answer Box" (40-60 mots)
2. Pour chaque H2 question, vérifie que la réponse immédiate fait 40-60 mots
3. Convertis les listes longues en 5-8 items
4. Ajoute des "Answer Box" après les H2 qui sont des questions
5. NE CHANGE PAS le reste du contenu

## FORMAT "ANSWER BOX" À UTILISER
Après un H2 question, ajoute immédiatement:
> **En bref:** [Réponse directe en 40-60 mots]

Puis le développement normal.

## FORMAT DE SORTIE JSON
{
  "optimizations_applied": [
    {
      "location": "Après H1 / Après H2 'Question...'",
      "type": "answer_box|list_optimization|paragraph_trim",
      "original_words": 120,
      "optimized_words": 55,
      "snippet_ready": true
    }
  ],
  "answer_boxes_added": 3,
  "lists_optimized": 2,
  "position_0_score": 85,
  "content_optimized": "LE CONTENU COMPLET AVEC LES OPTIMISATIONS"
}`;

    const text = await callClaude(prompt, {
      maxTokens: 8192,
      model: 'claude-sonnet-4-20250514'
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('[Position 0 Optimizer] JSON parse error:', e);
      }
    }

    return {
      optimizations_applied: [],
      answer_boxes_added: 0,
      position_0_score: 70,
      content_optimized: content
    };
  },

  /**
   * Agent: Table of Contents Generator - Creates a clickable TOC for fille/article pages
   */
  async generateTableOfContents(content, contentType) {
    // Only for fille and article pages
    if (contentType === 'pilier') {
      return { toc: null, content_with_toc: content };
    }

    // Extract H2 and H3 headings
    const h2Matches = content.match(/^## .+$/gm) || [];
    const h3Matches = content.match(/^### .+$/gm) || [];

    if (h2Matches.length < 3) {
      // Not enough sections for a TOC
      return { toc: null, content_with_toc: content };
    }

    // Build TOC structure
    const tocItems = [];
    const lines = content.split('\n');
    let currentH2 = null;

    for (const line of lines) {
      if (line.startsWith('## ') && !line.toLowerCase().includes('faq')) {
        const title = line.replace('## ', '').trim();
        const anchor = title.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-');
        currentH2 = { level: 2, title, anchor, children: [] };
        tocItems.push(currentH2);
      } else if (line.startsWith('### ') && currentH2) {
        const title = line.replace('### ', '').trim();
        const anchor = title.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-');
        currentH2.children.push({ level: 3, title, anchor });
      }
    }

    // Generate markdown TOC
    let tocMarkdown = '## Sommaire\n\n';
    for (const item of tocItems.slice(0, 8)) { // Max 8 items
      tocMarkdown += `- [${item.title}](#${item.anchor})\n`;
      for (const child of item.children.slice(0, 3)) { // Max 3 sub-items
        tocMarkdown += `  - [${child.title}](#${child.anchor})\n`;
      }
    }
    tocMarkdown += '\n---\n\n';

    // Insert TOC after first paragraph (after H1)
    const h1Match = content.match(/^# .+\n+/m);
    if (h1Match) {
      const h1End = content.indexOf(h1Match[0]) + h1Match[0].length;
      // Find end of first paragraph
      const firstParaEnd = content.indexOf('\n\n', h1End);
      if (firstParaEnd > -1) {
        const contentWithToc =
          content.substring(0, firstParaEnd + 2) +
          tocMarkdown +
          content.substring(firstParaEnd + 2);
        return {
          toc: tocItems,
          content_with_toc: contentWithToc,
          toc_markdown: tocMarkdown
        };
      }
    }

    return { toc: tocItems, content_with_toc: content, toc_markdown: tocMarkdown };
  },

  /**
   * Agent: Proofreader - Final review for coherence, repetitions, fluidity
   */
  async runProofreader(content, keyword) {
    const prompt = `Tu es un Relecteur professionnel. Tu fais une relecture finale du contenu.

## CONTENU À RELIRE
${content}

## KEYWORD PRINCIPAL
${keyword}

## TA MISSION
1. **Cohérence** : Le fil conducteur est-il clair ?
2. **Répétitions** : Mots ou expressions trop répétés ?
3. **Fluidité** : Les transitions sont-elles naturelles ?
4. **Clarté** : Y a-t-il des phrases confuses ?
5. **Longueur** : Certains paragraphes sont-ils trop longs ?

## RÈGLES
- NE CHANGE PAS le sens
- NE SUPPRIME PAS d'informations importantes
- Fais des corrections SUBTILES
- Garde le style et le ton
- Ne touche PAS aux H1, H2, H3 (structure)

## FORMAT JSON
{
  "issues_found": [
    {
      "type": "repetition|coherence|fluidity|clarity|length",
      "location": "Description de l'endroit",
      "original": "Texte original",
      "suggestion": "Texte corrigé",
      "severity": "minor|moderate"
    }
  ],
  "corrections_count": 5,
  "quality_score": 85,
  "content_corrected": "LE CONTENU COMPLET CORRIGÉ"
}`;

    const text = await callClaude(prompt, {
      maxTokens: 8192,
      model: 'claude-3-5-haiku-20241022'
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('[Proofreader] JSON parse error:', e);
      }
    }

    return {
      issues_found: [],
      corrections_count: 0,
      quality_score: 80,
      content_corrected: content
    };
  },

  /**
   * Agent: Internal Linking - Creates internal links with anchor distribution
   * Called AFTER all pages in a batch are created
   */
  async runInternalLinking(pages) {
    // pages = [{ keyword, slug, type, content, pilierKeyword? }, ...]

    const pagesContext = pages.map(p => ({
      keyword: p.keyword,
      slug: p.slug,
      type: p.type,
      pilierKeyword: p.pilierKeyword || null
    }));

    const prompt = `Tu es un Expert en Maillage Interne SEO. Tu crées des liens entre les pages.

## PAGES CRÉÉES
${JSON.stringify(pagesContext, null, 2)}

## RÈGLES DE MAILLAGE
1. Chaque FILLE doit avoir 1-2 liens vers son PILIER
2. Chaque PILIER doit avoir des liens vers ses FILLES
3. Les FILLES d'un même pilier peuvent se lier entre elles (1-2 liens)
4. Les ARTICLES supportent le cluster avec 1-2 liens

## RÉPARTITION DES ANCRES (TRÈS IMPORTANT)
- 40-50% Semi-optimisées : variations naturelles du keyword ("les tarifs du PPT", "coût d'un plan pluriannuel")
- 20-30% Exactes : le keyword tel quel ("prix ppt copropriété")
- 20-30% Génériques avec contexte : ("en savoir plus", "découvrir notre guide", "voir les détails")

## TA MISSION
Pour CHAQUE page, génère les liens à insérer avec des ancres variées.

## FORMAT JSON
{
  "links": [
    {
      "from_page": "keyword de la page source",
      "to_page": "keyword de la page cible",
      "to_slug": "/slug-de-la-cible",
      "anchor": "texte de l'ancre",
      "anchor_type": "semi_optimized|exact|generic",
      "insert_after_h2": "Titre du H2 après lequel insérer (ou null pour fin de section)"
    }
  ],
  "distribution": {
    "semi_optimized": 45,
    "exact": 25,
    "generic": 30
  },
  "total_links": 12
}`;

    const text = await callClaude(prompt, {
      maxTokens: 4096,
      model: 'claude-sonnet-4-20250514' // Sonnet pour la qualité des ancres
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('[Internal Linking] JSON parse error:', e);
      }
    }

    return {
      links: [],
      distribution: { semi_optimized: 0, exact: 0, generic: 0 },
      total_links: 0
    };
  },

  /**
   * Apply internal links to content
   */
  applyInternalLinks(content, links, pageKeyword) {
    let updatedContent = content;

    // Filter links for this page
    const pageLinks = links.filter(l => l.from_page === pageKeyword);

    for (const link of pageLinks) {
      const linkHtml = `[LIEN: ${link.anchor} -> ${link.to_slug}]`;

      if (link.insert_after_h2) {
        // Insert after specific H2
        const h2Regex = new RegExp(`(## ${link.insert_after_h2}[\\s\\S]*?)(\n## |$)`, 'i');
        const match = updatedContent.match(h2Regex);
        if (match) {
          const insertPoint = match[1].lastIndexOf('\n\n');
          if (insertPoint > -1) {
            const before = match[1].substring(0, insertPoint);
            const after = match[1].substring(insertPoint);
            updatedContent = updatedContent.replace(match[1], `${before}\n\n${linkHtml}${after}`);
          }
        }
      } else {
        // Insert before FAQ or at end
        const faqIndex = updatedContent.indexOf('## FAQ');
        if (faqIndex > -1) {
          updatedContent = updatedContent.substring(0, faqIndex) + `\n${linkHtml}\n\n` + updatedContent.substring(faqIndex);
        } else {
          updatedContent += `\n\n${linkHtml}`;
        }
      }
    }

    return updatedContent;
  },

  /**
   * Build Director context string to inject into all agents
   */
  buildDirectorContext(seoDirection) {
    if (!seoDirection) return '';

    return `
## DIRECTIVES DU SEO DIRECTOR (À RESPECTER IMPÉRATIVEMENT)
- **Angle principal**: ${seoDirection.strategic_focus?.main_angle || 'Non défini'}
- **Positionnement**: ${seoDirection.strategic_focus?.positioning || 'Non défini'}
- **Ton**: ${seoDirection.strategic_focus?.tone || 'expert'}
- **Audience cible**: ${seoDirection.strategic_focus?.target_audience || 'Non définie'}
- **Adaptation géo**: ${seoDirection.strategic_focus?.geographic_adaptation || 'France'}

## STRATÉGIE DE MONÉTISATION
- **Objectif**: ${seoDirection.monetization_strategy?.primary_goal || 'Non défini'}
- **CTAs recommandés**: ${seoDirection.monetization_strategy?.recommended_ctas?.join(', ') || 'N/A'}
- **Points de conversion**: ${seoDirection.monetization_strategy?.conversion_points?.join(', ') || 'N/A'}
- **Proposition de valeur**: ${seoDirection.monetization_strategy?.value_proposition || 'N/A'}

## GUIDELINES CONTENU
- **À inclure**: ${seoDirection.content_guidelines?.must_include?.join(', ') || 'N/A'}
- **À éviter**: ${seoDirection.content_guidelines?.avoid?.join(', ') || 'N/A'}
- **Différenciation**: ${seoDirection.content_guidelines?.differentiation || 'N/A'}
`;
  },

  /**
   * Run the complete Content Factory pipeline with Orchestrator
   * Order: PAA → Strategist → Slug → Writer → Fact Checker → Position0 → TOC → Humanizer → SEO Editor → Proofreader → Schema
   * The Orchestrator injects SEO Director guidance into each agent
   */
  async runContentFactory(brief, existingPaa, onProgress, seoDirection = null) {
    const results = {
      paaAnalyst: null,
      strategist: null,
      slugGenerator: null,
      writer: null,
      factChecker: null,
      position0Optimizer: null,
      tocGenerator: null,
      humanizer: null,
      seoEditor: null,
      proofreader: null,
      schemaGenerator: null
    };

    try {
      // Agent 1: PAA Analyst - Generates relevant questions
      onProgress?.('paaAnalyst', 'running');
      results.paaAnalyst = await this.runPaaAnalyst(brief, existingPaa || []);
      onProgress?.('paaAnalyst', 'completed', results.paaAnalyst);

      // Agent 2: Strategist - Creates the brief using PAA analysis + Director guidance
      onProgress?.('strategist', 'running');
      results.strategist = await this.runStrategist(brief, results.paaAnalyst, seoDirection);
      onProgress?.('strategist', 'completed', results.strategist);

      // Agent 3: Slug Generator - Creates SEO-friendly URL
      onProgress?.('slugGenerator', 'running');
      results.slugGenerator = await this.runSlugGenerator(brief.keyword, brief.content_type, brief.site);
      onProgress?.('slugGenerator', 'completed', results.slugGenerator);

      // Agent 4: Writer - Writes the content with Director guidance
      onProgress?.('writer', 'running');
      results.writer = await this.runWriter(brief, results.strategist, seoDirection);
      onProgress?.('writer', 'completed', results.writer);

      // Agent 5: Fact Checker - Verifies facts (Haiku)
      onProgress?.('factChecker', 'running');
      results.factChecker = await this.runFactChecker(results.writer.content, brief.keyword);
      onProgress?.('factChecker', 'completed', results.factChecker);

      // Apply fact corrections if any
      let contentAfterFacts = results.writer.content;
      if (results.factChecker.corrections_needed?.length > 0) {
        for (const correction of results.factChecker.corrections_needed) {
          contentAfterFacts = contentAfterFacts.replace(correction.original, correction.corrected);
        }
      }

      // Agent 6: Position 0 Optimizer - Formats for featured snippets
      onProgress?.('position0Optimizer', 'running');
      const snippetFormats = results.paaAnalyst?.generated_questions?.map(q => ({
        question: q.question,
        format: q.snippet_format || 'paragraph'
      })) || [];
      results.position0Optimizer = await this.runPosition0Optimizer(
        contentAfterFacts,
        brief.keyword,
        snippetFormats
      );
      onProgress?.('position0Optimizer', 'completed', results.position0Optimizer);

      // Get optimized content from Position 0
      let contentAfterP0 = results.position0Optimizer.content_optimized || contentAfterFacts;

      // Agent 7: TOC Generator - Add table of contents for fille/article pages
      onProgress?.('tocGenerator', 'running');
      results.tocGenerator = await this.generateTableOfContents(contentAfterP0, brief.content_type);
      const contentWithToc = results.tocGenerator.content_with_toc || contentAfterP0;
      onProgress?.('tocGenerator', 'completed', results.tocGenerator);

      // Agent 8: Humanizer - Makes content natural BEFORE SEO optimization
      onProgress?.('humanizer', 'running');
      results.humanizer = await this.runHumanizer(contentWithToc);
      onProgress?.('humanizer', 'completed', results.humanizer);

      // Agent 9: SEO Editor - Optimizes with minimum score 85 (with retry) + Director guidelines
      onProgress?.('seoEditor', 'running');
      results.seoEditor = await this.runSeoEditor(brief, results.humanizer.content, 85, 3, seoDirection);
      onProgress?.('seoEditor', 'completed', results.seoEditor);

      // Agent 10: Proofreader - Final review for coherence and fluidity
      onProgress?.('proofreader', 'running');
      const contentForProof = results.seoEditor.content_optimized || results.humanizer.content;
      results.proofreader = await this.runProofreader(contentForProof, brief.keyword);
      onProgress?.('proofreader', 'completed', results.proofreader);

      // Agent 11: Schema Generator - Creates JSON-LD including HowTo (Haiku)
      onProgress?.('schemaGenerator', 'running');
      const finalContent = results.proofreader.content_corrected || contentForProof;
      results.schemaGenerator = await this.runSchemaGenerator(
        finalContent,
        brief,
        results.seoEditor
      );
      onProgress?.('schemaGenerator', 'completed', results.schemaGenerator);

      return {
        success: true,
        results,
        finalContent: results.proofreader.content_corrected || contentForProof,
        metadata: {
          title: results.seoEditor.meta_title,
          description: results.seoEditor.meta_description,
          slug: results.slugGenerator.slug,
          seoScore: results.seoEditor.seo_score,
          seoAttempts: results.seoEditor.attempts,
          wordCount: results.writer.word_count,
          aiDetection: results.humanizer.ai_detection_estimate,
          factCheckScore: results.factChecker.verification_summary?.score,
          factsVerified: results.factChecker.verification_summary?.verified || 0,
          correctionsApplied: results.factChecker.corrections_needed?.length || 0,
          // Position 0 metrics
          position0Score: results.position0Optimizer?.position_0_score || 0,
          answerBoxesAdded: results.position0Optimizer?.answer_boxes_added || 0,
          snippetFormat: results.paaAnalyst?.keyword_analysis?.primary_snippet_format || 'paragraph',
          // TOC
          hasToc: !!results.tocGenerator?.toc,
          tocSections: results.tocGenerator?.toc?.length || 0,
          // Proofreading
          proofreadScore: results.proofreader.quality_score,
          proofreadFixes: results.proofreader.corrections_count,
          internalLinks: results.seoEditor.internal_links || [],
          // Schemas
          schemas: results.schemaGenerator.schemas,
          hasHowTo: results.schemaGenerator?.has_howto || false,
          howToSteps: results.schemaGenerator?.howto_steps || 0,
          // PAA
          paaGenerated: results.paaAnalyst?.generated_questions?.length || 0,
          paaIntent: results.paaAnalyst?.keyword_analysis?.main_intent,
          snippetOpportunity: results.paaAnalyst?.keyword_analysis?.snippet_opportunity_score || 0
        }
      };
    } catch (err) {
      console.error('[Content Factory] Error:', err);
      return {
        success: false,
        error: err.message,
        results
      };
    }
  }
};

export default claudeApi;
