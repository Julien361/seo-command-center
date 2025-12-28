/**
 * Test du chargement des keywords
 */

import { chromium } from 'playwright';

async function testKeywords() {
  console.log('🔍 Test du chargement des keywords...\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  // Capturer les logs console
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  // Capturer les erreurs réseau
  const networkErrors = [];
  page.on('requestfailed', request => {
    networkErrors.push(`${request.url()} - ${request.failure().errorText}`);
  });

  try {
    // 1. Charger la page
    console.log('📄 Chargement de l\'application...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 2. Aller sur SEO Coach
    console.log('📄 Navigation vers SEO Coach...');
    await page.click('text=SEO Coach');
    await page.waitForTimeout(3000);

    // Capturer le nombre de keywords affiché
    const coachContent = await page.textContent('body');
    const keywordMatch = coachContent.match(/(\d+)\s*Keywords?/i);
    if (keywordMatch) {
      console.log(`   → SEO Coach affiche: ${keywordMatch[0]}`);
    }

    // 3. Cliquer sur les keywords
    console.log('📄 Clic sur les keywords...');
    const keywordBtn = await page.$('button:has-text("Keywords")');
    if (keywordBtn) {
      await keywordBtn.click();
    } else {
      // Essayer autrement
      await page.click('text=Keywords');
    }
    await page.waitForTimeout(3000);

    // 4. Analyser la page Keywords
    console.log('📄 Analyse de la page Keywords...');
    await page.screenshot({ path: '/tmp/test-keywords.png', fullPage: true });

    // Vérifier le contenu
    const pageContent = await page.textContent('body');

    // Chercher les stats
    const totalMatch = pageContent.match(/Total:\s*(\d+)\s*keywords/i);
    const displayedMatch = pageContent.match(/Affich[eé]s?:\s*(\d+)/i);

    console.log(`   → Total trouvé: ${totalMatch ? totalMatch[1] : 'non trouvé'}`);
    console.log(`   → Affichés trouvé: ${displayedMatch ? displayedMatch[1] : 'non trouvé'}`);

    // Compter les lignes du tableau
    const rows = await page.$$('table tbody tr');
    console.log(`   → Lignes dans le tableau: ${rows.length}`);

    // Vérifier s'il y a un message d'erreur
    const errorDiv = await page.$('.text-danger, [class*="error"]');
    if (errorDiv) {
      const errorText = await errorDiv.textContent();
      console.log(`   → Message d'erreur: ${errorText}`);
    }

    // Vérifier le loading
    const loading = await page.$('text=Chargement');
    if (loading) {
      console.log('   → Toujours en chargement...');
    }

    // Logs console pertinents
    console.log('\n📝 Logs console pertinents:');
    const relevantLogs = consoleLogs.filter(log =>
      log.includes('Keywords') ||
      log.includes('Error') ||
      log.includes('error') ||
      log.includes('Supabase')
    );
    relevantLogs.forEach(log => console.log(`   ${log}`));

    if (networkErrors.length > 0) {
      console.log('\n❌ Erreurs réseau:');
      networkErrors.forEach(err => console.log(`   ${err}`));
    }

    // 5. Test direct de Supabase via l'app
    console.log('\n📄 Test de la connexion Supabase...');
    const supabaseTest = await page.evaluate(async () => {
      try {
        // Vérifier si les vars d'env sont chargées
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
        return {
          hasUrl: !!url,
          hasKey: !!key,
          urlPrefix: url ? url.substring(0, 30) : 'none'
        };
      } catch (e) {
        return { error: e.message };
      }
    });
    console.log('   → Config Supabase:', JSON.stringify(supabaseTest));

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await browser.close();
  }

  console.log('\n📸 Screenshot sauvegardé: /tmp/test-keywords.png');
}

testKeywords().catch(console.error);
