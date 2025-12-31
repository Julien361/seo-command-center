// Claude API for strategic SEO analysis
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

export const claudeApi = {
  /**
   * Generate optimized keyword seeds based on site context
   * ONE call per site using Sonnet for accuracy
   */
  async generateKeywordSeeds(site) {
    const seoFocus = Array.isArray(site.seo_focus) ? site.seo_focus : [site.seo_focus || ''];
    const focusText = seoFocus.filter(s => s && !s.startsWith('seeds:')).join(', ');

    // Extract existing seeds if any
    const existingSeeds = seoFocus
      .filter(s => s && s.startsWith('seeds:'))
      .map(s => s.replace('seeds:', '').split(';'))
      .flat()
      .filter(Boolean);

    // Deduce the main topic from URL and alias
    const urlDomain = site.url || site.domain || '';
    const alias = site.mcp_alias || '';

    const prompt = `Tu es un expert SEO senior. Analyse ce site et génère des mots-clés seeds PERTINENTS.

## SITE A ANALYSER
- Nom/Alias: ${alias}
- URL: ${urlDomain}
- Focus SEO déclaré: ${focusText || 'non spécifié'}
- Monétisation: ${site.monetization_types?.join(', ') || 'non spécifié'}
- Audience cible: ${site.target_audience || 'non spécifié'}
${existingSeeds.length ? `- Seeds existants: ${existingSeeds.join(', ')}` : ''}

## ANALYSE REQUISE
1. Déduis le DOMAINE PRINCIPAL du site depuis son URL et son nom (ex: "monassuranceanimal.fr" = assurance pour animaux)
2. Identifie le SECTEUR D'ACTIVITÉ précis
3. Génère des mots-clés qui correspondent EXACTEMENT à ce domaine

## RÈGLES STRICTES
- TOUS les mots-clés doivent être EN RAPPORT DIRECT avec le domaine du site
- NE PAS dériver vers d'autres secteurs (ex: si c'est assurance animaux, pas d'assurance auto/vie/retraite)
- Mots-clés courts (2-3 mots) pour maximiser les résultats DataForSEO
- Mix: termes génériques du secteur + termes spécifiques
- Inclure des termes transactionnels si site commercial

## FORMAT DE RÉPONSE
Réponds UNIQUEMENT avec un tableau JSON de 5-8 strings, sans explication.
Exemple: ["keyword 1", "keyword 2", "keyword 3"]`;

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
          model: 'claude-sonnet-4-20250514', // Sonnet for accuracy
          max_tokens: 512,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[Claude] API error:', error);
        return existingSeeds.length ? existingSeeds : [focusText.split(',')[0]?.trim() || site.mcp_alias];
      }

      const data = await response.json();
      const text = data.content?.[0]?.text || '[]';

      // Extract JSON array from response
      const jsonMatch = text.match(/\[.*\]/s);
      if (jsonMatch) {
        const seeds = JSON.parse(jsonMatch[0]);
        console.log('[Claude] Generated seeds:', seeds);
        return seeds;
      }

      return existingSeeds.length ? existingSeeds : [focusText.split(',')[0]?.trim()];
    } catch (err) {
      console.error('[Claude] Error:', err);
      // Fallback to existing seeds or focus text
      return existingSeeds.length ? existingSeeds : [focusText.split(',')[0]?.trim() || site.mcp_alias];
    }
  }
};
