/**
 * Audit UX de l'application SEO Command Center
 * Teste l'interactivité et capture des screenshots
 */

import { chromium } from 'playwright';

async function auditApp() {
  console.log('🔍 Lancement de l\'audit UX...\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  const issues = [];
  const suggestions = [];

  try {
    // 1. Page d'accueil (Sites)
    console.log('📄 Test de la page Sites...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/audit-01-sites.png', fullPage: true });

    // Vérifier les éléments cliquables
    const siteLinks = await page.$$('aside button');
    console.log(`   → ${siteLinks.length} boutons dans la sidebar`);

    // 2. Aller sur SEO Coach
    console.log('📄 Test du SEO Coach...');
    const coachBtn = await page.$('text=SEO Coach');
    if (coachBtn) {
      await coachBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/audit-02-coach.png', fullPage: true });

      // Analyser les éléments
      const clickableElements = await page.$$('button, a, [role="button"]');
      console.log(`   → ${clickableElements.length} éléments cliquables`);

      // Chercher les stats (ex: "23 keywords")
      const statsText = await page.textContent('body');
      const keywordMatch = statsText.match(/(\d+)\s*keywords?/i);
      if (keywordMatch) {
        console.log(`   → Stat trouvée: "${keywordMatch[0]}"`);
        // Vérifier si c'est cliquable
        const keywordStat = await page.$(`text=${keywordMatch[0]}`);
        if (keywordStat) {
          const isClickable = await keywordStat.evaluate(el => {
            return el.tagName === 'BUTTON' || el.tagName === 'A' ||
                   el.closest('button') || el.closest('a') ||
                   el.style.cursor === 'pointer' ||
                   getComputedStyle(el).cursor === 'pointer';
          });
          if (!isClickable) {
            issues.push('Les stats (ex: "23 keywords") ne sont pas cliquables');
            suggestions.push('Rendre les stats cliquables pour naviguer vers les détails');
          }
        }
      }

      // Vérifier les recommandations
      const recommendations = await page.$$('[class*="recommendation"], [class*="Recommendation"]');
      console.log(`   → ${recommendations.length} recommandations visibles`);

      // Chercher les workflows/actions
      const actionButtons = await page.$$('button:has-text("Lancer"), button:has-text("Voir"), button:has-text("Analyser")');
      console.log(`   → ${actionButtons.length} boutons d'action`);

    } else {
      issues.push('Bouton SEO Coach non trouvé');
    }

    // 3. Test de la page Keywords
    console.log('📄 Test de la page Keywords...');
    // Chercher un moyen d'aller aux keywords
    const keywordsLink = await page.$('text=Keywords') || await page.$('text=Recherche KW');
    if (keywordsLink) {
      await keywordsLink.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/audit-03-keywords.png', fullPage: true });

      // Compter les keywords affichés
      const keywordRows = await page.$$('table tbody tr');
      console.log(`   → ${keywordRows.length} keywords dans la table`);

      // Vérifier la barre de stats
      const statsBar = await page.$('text=/Total.*keywords/');
      if (statsBar) {
        console.log('   → Barre de stats visible');
      } else {
        issues.push('Barre de stats non visible sur Keywords');
      }
    }

    // 4. Retour au Coach pour analyse approfondie
    console.log('📄 Analyse approfondie du Coach...');
    await page.click('text=SEO Coach');
    await page.waitForTimeout(2000);

    // Sélectionner un site si dropdown disponible
    const siteSelect = await page.$('select');
    if (siteSelect) {
      const options = await siteSelect.$$('option');
      console.log(`   → ${options.length} sites dans le sélecteur`);
      if (options.length > 1) {
        await siteSelect.selectOption({ index: 1 });
        await page.waitForTimeout(2000);
        await page.screenshot({ path: '/tmp/audit-04-coach-site.png', fullPage: true });
      }
    }

    // Analyser la structure des phases
    const phaseElements = await page.$$('[class*="phase"], [class*="Phase"]');
    console.log(`   → ${phaseElements.length} éléments de phase`);

    // Vérifier les barres de progression
    const progressBars = await page.$$('[class*="progress"], [role="progressbar"], .bg-primary');
    console.log(`   → ${progressBars.length} barres de progression`);

    // Chercher les liens vers résultats
    const viewResultsLinks = await page.$$('button:has-text("Voir"), a:has-text("Voir")');
    console.log(`   → ${viewResultsLinks.length} liens "Voir les résultats"`);

    if (viewResultsLinks.length === 0) {
      issues.push('Pas de liens pour voir les résultats des étapes');
      suggestions.push('Ajouter des liens "Voir les résultats" pour chaque phase');
    }

    // Screenshot final
    await page.screenshot({ path: '/tmp/audit-05-final.png', fullPage: true });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    issues.push(`Erreur test: ${error.message}`);
  } finally {
    await browser.close();
  }

  // Rapport
  console.log('\n' + '='.repeat(60));
  console.log('📊 RAPPORT D\'AUDIT UX');
  console.log('='.repeat(60));

  if (issues.length > 0) {
    console.log('\n❌ PROBLÈMES DÉTECTÉS:');
    issues.forEach((issue, i) => console.log(`   ${i+1}. ${issue}`));
  }

  console.log('\n💡 AMÉLIORATIONS SUGGÉRÉES:');
  const allSuggestions = [
    ...suggestions,
    'Rendre les stats cliquables (ex: "23 keywords" → page Keywords)',
    'Ajouter des boutons "Voir les résultats" après chaque workflow',
    'Afficher une barre de progression globale (Phase 2/6)',
    'Lister les étapes restantes avec des checkboxes',
    'Ajouter des indicateurs visuels de statut (fait/en cours/à faire)',
    'Permettre de lancer des analyses directement depuis les stats',
  ];

  [...new Set(allSuggestions)].forEach((s, i) => console.log(`   ${i+1}. ${s}`));

  console.log('\n📸 Screenshots sauvegardés dans /tmp/audit-*.png');
  console.log('='.repeat(60));
}

auditApp().catch(console.error);
