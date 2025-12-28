/**
 * Test complet de debug de l'application SEO Command Center
 */

import { chromium } from 'playwright';

const SUPABASE_URL = 'https://mxtlqbpbnnfarcmlcykj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14dGxxYnBibm5mYXJjbWxjeWtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MTQzODAsImV4cCI6MjA4MTM5MDM4MH0.eKsKJj66YU8j4h0QykOi1y0ths_WcMkpeBbIhwFwWcU';

async function supabaseQuery(table, select = '*', filters = {}) {
  let url = `${SUPABASE_URL}/rest/v1/${table}?select=${select}`;
  for (const [key, value] of Object.entries(filters)) {
    url += `&${key}=eq.${value}`;
  }

  const response = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  return response.json();
}

async function debugApp() {
  console.log('🔍 DEBUG COMPLET DE L\'APPLICATION\n');
  console.log('='.repeat(60));

  // 1. Vérifier les données Supabase
  console.log('\n📊 VERIFICATION SUPABASE\n');

  // Sites
  const sites = await supabaseQuery('sites', 'id,mcp_alias,domain,seo_focus,monetization_types');
  console.log(`Sites: ${sites.length}`);
  sites.slice(0, 5).forEach(s => {
    console.log(`  - ${s.mcp_alias}: seo_focus=${s.seo_focus ? 'OUI' : 'NON'}, monetization=${s.monetization_types?.join(',') || 'NON'}`);
  });

  // Keywords par site
  console.log('\nKeywords par site:');
  for (const site of sites.slice(0, 5)) {
    const keywords = await supabaseQuery('keywords', 'id', { site_id: site.id });
    const count = Array.isArray(keywords) ? keywords.length : 0;
    console.log(`  - ${site.mcp_alias}: ${count} keywords`);
  }

  // Competitors
  const competitors = await supabaseQuery('competitors', '*');
  console.log(`\nCompetitors total: ${Array.isArray(competitors) ? competitors.length : 0}`);
  if (Array.isArray(competitors) && competitors.length > 0) {
    console.log('  Colonnes:', Object.keys(competitors[0]).join(', '));
  }

  // Clusters
  const clusters = await supabaseQuery('semantic_clusters', 'id,name,site_id');
  console.log(`Clusters total: ${Array.isArray(clusters) ? clusters.length : 0}`);

  // 2. Test de l'interface via Playwright
  console.log('\n' + '='.repeat(60));
  console.log('🌐 TEST INTERFACE PLAYWRIGHT\n');

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
    networkErrors.push(`${request.url()} - ${request.failure()?.errorText}`);
  });

  try {
    // Charger l'app
    console.log('1. Chargement de l\'application...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/debug-01-home.png', fullPage: true });
    console.log('   ✓ Page chargee');

    // Aller sur SEO Coach
    console.log('\n2. Navigation vers SEO Coach...');
    await page.click('text=SEO Coach');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/debug-02-coach.png', fullPage: true });
    console.log('   ✓ SEO Coach charge');

    // Analyser le contenu du SEO Coach
    const coachContent = await page.textContent('body');

    // Vérifier les éléments clés
    const hasMonetisation = coachContent.includes('Monetisation') || coachContent.includes('💰');
    const hasAudience = coachContent.includes('Audience') || coachContent.includes('🎯');
    const hasZone = coachContent.includes('Zone') || coachContent.includes('📍');
    const hasFocus = coachContent.includes('Focus') || coachContent.includes('🔍');

    console.log(`   - Monetisation visible: ${hasMonetisation ? '✓' : '✗'}`);
    console.log(`   - Audience visible: ${hasAudience ? '✓' : '✗'}`);
    console.log(`   - Zone visible: ${hasZone ? '✓' : '✗'}`);
    console.log(`   - Focus SEO visible: ${hasFocus ? '✓' : '✗'}`);

    // Vérifier les stats
    const keywordsMatch = coachContent.match(/(\d+)\s*Keywords/i);
    const concurrentsMatch = coachContent.match(/(\d+)\s*Concurrents/i);
    console.log(`   - Keywords affiches: ${keywordsMatch ? keywordsMatch[1] : 'non trouve'}`);
    console.log(`   - Concurrents affiches: ${concurrentsMatch ? concurrentsMatch[1] : 'non trouve'}`);

    // Vérifier le message "Analyse deja effectuee"
    const hasAnalyseMsg = coachContent.includes('Analyse deja effectuee');
    console.log(`   - Message "Analyse deja effectuee": ${hasAnalyseMsg ? '✓' : '✗'}`);

    // 3. Tester le changement de site
    console.log('\n3. Test changement de site...');
    const siteSelect = await page.$('select');
    if (siteSelect) {
      const options = await siteSelect.$$('option');
      console.log(`   - ${options.length} sites dans le selecteur`);

      // Sélectionner metis-digital
      const optionTexts = await Promise.all(options.map(o => o.textContent()));
      const metisIndex = optionTexts.findIndex(t => t.includes('metis-digital'));
      if (metisIndex >= 0) {
        await siteSelect.selectOption({ index: metisIndex });
        await page.waitForTimeout(2000);
        await page.screenshot({ path: '/tmp/debug-03-metis.png', fullPage: true });
        console.log('   ✓ metis-digital selectionne');

        const metisContent = await page.textContent('body');
        const metisKeywords = metisContent.match(/(\d+)\s*Keywords/i);
        console.log(`   - Keywords metis-digital: ${metisKeywords ? metisKeywords[1] : '0'}`);
      }
    }

    // 4. Tester la page Keywords
    console.log('\n4. Test page Keywords...');
    await page.click('text=Recherche KW');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/debug-04-keywords.png', fullPage: true });

    const kwContent = await page.textContent('body');
    const totalMatch = kwContent.match(/Total:\s*(\d+)/i);
    const tableRows = await page.$$('table tbody tr');
    console.log(`   - Total keywords: ${totalMatch ? totalMatch[1] : 'non trouve'}`);
    console.log(`   - Lignes tableau: ${tableRows.length}`);

    // 5. Tester la page Concurrents
    console.log('\n5. Test page Concurrents...');
    await page.click('text=Concurrents');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/debug-05-concurrents.png', fullPage: true });

    const concContent = await page.textContent('body');
    const concRows = await page.$$('table tbody tr');
    console.log(`   - Lignes tableau concurrents: ${concRows.length}`);

    // Vérifier s'il y a un message "aucun concurrent"
    const noConc = concContent.includes('Aucun concurrent') || concContent.includes('aucun concurrent');
    console.log(`   - Message "Aucun concurrent": ${noConc ? 'OUI' : 'NON'}`);

    // 6. Retour sur SEO Coach pour tester le lancement de workflow
    console.log('\n6. Test lancement workflow...');
    await page.click('text=SEO Coach');
    await page.waitForTimeout(2000);

    // Chercher un bouton de lancement
    const launchButtons = await page.$$('button:has-text("▶"), button:has-text("Lancer")');
    console.log(`   - Boutons de lancement: ${launchButtons.length}`);

    // 7. Vérifier les champs éditables
    console.log('\n7. Verification champs editables...');
    const inputs = await page.$$('input[type="text"], textarea');
    const editableInputs = [];
    for (const input of inputs) {
      const isEditable = await input.evaluate(el => !el.disabled && !el.readOnly);
      if (isEditable) {
        const placeholder = await input.getAttribute('placeholder');
        editableInputs.push(placeholder || 'sans placeholder');
      }
    }
    console.log(`   - Champs editables: ${editableInputs.length}`);
    editableInputs.slice(0, 5).forEach(p => console.log(`     - ${p}`));

    // Logs console pertinents
    console.log('\n8. Logs console pertinents:');
    const relevantLogs = consoleLogs.filter(log =>
      log.includes('Error') ||
      log.includes('error') ||
      log.includes('Workflow') ||
      log.includes('Keywords') ||
      log.includes('Supabase')
    ).slice(0, 10);
    relevantLogs.forEach(log => console.log(`   ${log}`));

    if (networkErrors.length > 0) {
      console.log('\n❌ Erreurs reseau:');
      networkErrors.slice(0, 5).forEach(err => console.log(`   ${err}`));
    }

  } catch (error) {
    console.error('❌ Erreur test:', error.message);
  } finally {
    await browser.close();
  }

  console.log('\n' + '='.repeat(60));
  console.log('📸 Screenshots sauvegardes dans /tmp/debug-*.png');
  console.log('='.repeat(60));
}

debugApp().catch(console.error);
