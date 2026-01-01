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

## EXEMPLES
- Site assurance animaux → "assurance chien", "mutuelle chat", "assurance animaux prix" ✓
- Site assurance animaux → "comparateur assurance", "mutuelle santé" ✗ (trop générique, pourrait être auto/vie/etc)

## RÉPONSE
JSON array de 5-8 seeds spécifiques:
["seed 1", "seed 2", "seed 3"]`;

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
