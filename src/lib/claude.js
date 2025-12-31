// Claude API for strategic SEO analysis
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

export const claudeApi = {
  /**
   * Generate optimized keyword seeds based on site context
   * ONE call per site - cost optimized
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

    const prompt = `Tu es un expert SEO. Analyse ce site et genere des mots-cles de recherche optimises.

SITE: ${site.mcp_alias}
URL: ${site.url || site.domain}
FOCUS: ${focusText}
MONETISATION: ${site.monetization_types?.join(', ') || 'non specifie'}
AUDIENCE: ${site.target_audience || 'non specifie'}
${existingSeeds.length ? `SEEDS EXISTANTS: ${existingSeeds.join(', ')}` : ''}

OBJECTIF: Generer 5-8 mots-cles seeds pour une recherche keyword LARGE et EFFICACE.

REGLES:
- Mots-cles courts (2-3 mots max) pour maximiser les resultats DataForSEO
- Mix: termes generiques + termes specifiques au business
- Inclure des termes a forte intention commerciale si monetisation
- Eviter les termes trop nichés avec peu de volume

Reponds UNIQUEMENT avec un tableau JSON de strings. Exemple:
["mot cle 1", "mot cle 2", "mot cle 3"]`;

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
          model: 'claude-3-5-haiku-20241022', // Haiku = 3x moins cher
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
