import { chromium } from 'playwright';
import fs from 'fs';

// L'app Electron utilise Vite en dev sur un port
const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = '/tmp/electron-audit';

async function auditElectronApp() {
  // Create screenshot directory
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  const results = { tests: [], errors: [] };

  console.log('=== Audit App Electron v1.0.62 ===\n');

  try {
    // 1. Load app
    console.log('1. Chargement de l\'app...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-liste-sites.png`, fullPage: true });
    console.log('   Screenshot: 01-liste-sites.png');

    // 2. Check sidebar entity grouping
    console.log('\n2. Verification sidebar (groupement par entite)...');
    const sidebarText = await page.locator('aside').textContent();

    const hasEntityNames = sidebarText.includes('METIS') || sidebarText.includes('SRAT') || sidebarText.includes('PRO FORMATION');
    const hasUUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/.test(sidebarText);

    results.tests.push({
      name: 'Sidebar affiche noms d\'entites (pas UUID)',
      passed: hasEntityNames && !hasUUID,
      details: hasUUID ? 'UUID detecte dans sidebar!' : 'OK - Noms d\'entites affiches'
    });
    console.log(`   ${hasEntityNames && !hasUUID ? '✅' : '❌'} Noms d'entites: ${hasEntityNames}, UUID visible: ${hasUUID}`);

    // 3. Click on a site with data (bien-vieillir or srat)
    console.log('\n3. Clic sur site "bien-vieillir"...');
    const siteButton = page.locator('button:has-text("bien-vieillir")').first();
    if (await siteButton.isVisible()) {
      await siteButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/02-detail-site.png`, fullPage: true });
      console.log('   Screenshot: 02-detail-site.png');

      // 4. Check Objectif SEO section
      console.log('\n4. Verification section "OBJECTIF SEO"...');
      const objectifVisible = await page.locator('text="OBJECTIF SEO"').isVisible();
      const objectifText = await page.locator('text=/Lead generation|MaPrimeAdapt/').first().isVisible().catch(() => false);

      results.tests.push({
        name: 'Section OBJECTIF SEO visible',
        passed: objectifVisible,
        details: objectifVisible ? 'OK' : 'Section absente!'
      });
      console.log(`   ${objectifVisible ? '✅' : '❌'} Section OBJECTIF SEO visible: ${objectifVisible}`);
      console.log(`   ${objectifText ? '✅' : '❌'} Contenu objectif visible: ${objectifText}`);

      // 5. Check entity badge in header
      console.log('\n5. Verification badge entite dans header...');
      const entityBadge = await page.locator('h1, .text-2xl').first().locator('..').textContent();
      const hasEntityBadge = entityBadge.includes('METIS') || entityBadge.includes('Digital');

      results.tests.push({
        name: 'Badge entite dans header',
        passed: hasEntityBadge,
        details: hasEntityBadge ? 'OK' : 'Badge absent!'
      });
      console.log(`   ${hasEntityBadge ? '✅' : '❌'} Badge entite present: ${hasEntityBadge}`);

      // 6. Check Score SEO (should not be NaN)
      console.log('\n6. Verification Score SEO (pas NaN)...');
      const scoreText = await page.locator('text="Score SEO"').locator('..').textContent();
      const hasNaN = scoreText.includes('NaN');

      results.tests.push({
        name: 'Score SEO sans NaN',
        passed: !hasNaN,
        details: hasNaN ? 'NaN detecte!' : 'OK'
      });
      console.log(`   ${!hasNaN ? '✅' : '❌'} Score SEO: ${scoreText.replace('Score SEO', '').trim()}`);

      // 7. Check KPIs are displayed
      console.log('\n7. Verification KPIs...');
      const kpisVisible = await page.locator('text="Keywords"').isVisible();
      const coconsVisible = await page.locator('text="Cocons"').isVisible();

      results.tests.push({
        name: 'KPIs affiches',
        passed: kpisVisible && coconsVisible,
        details: `Keywords: ${kpisVisible}, Cocons: ${coconsVisible}`
      });
      console.log(`   ${kpisVisible ? '✅' : '❌'} Keywords visible`);
      console.log(`   ${coconsVisible ? '✅' : '❌'} Cocons visible`);
    }

    // 8. Test Workflows page
    console.log('\n8. Test page Workflows...');
    await page.locator('button:has-text("Workflows")').click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/03-workflows.png`, fullPage: true });
    console.log('   Screenshot: 03-workflows.png');

    const workflowsCount = await page.locator('table tbody tr').count();
    results.tests.push({
      name: 'Page Workflows avec donnees',
      passed: workflowsCount > 0,
      details: `${workflowsCount} workflows affiches`
    });
    console.log(`   ${workflowsCount > 0 ? '✅' : '❌'} Workflows affiches: ${workflowsCount}`);

    // 9. Test Credentials page
    console.log('\n9. Test page Credentials...');
    await page.locator('button:has-text("Credentials")').click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/04-credentials.png`, fullPage: true });
    console.log('   Screenshot: 04-credentials.png');

  } catch (err) {
    results.errors.push(err.message);
    console.error('Erreur:', err.message);
  }

  await browser.close();

  // Summary
  console.log('\n=== RESUME ===');
  const passed = results.tests.filter(t => t.passed).length;
  const total = results.tests.length;
  console.log(`Tests: ${passed}/${total} passes`);

  results.tests.forEach(t => {
    console.log(`  ${t.passed ? '✅' : '❌'} ${t.name}: ${t.details}`);
  });

  if (results.errors.length > 0) {
    console.log('\nErreurs:');
    results.errors.forEach(e => console.log(`  - ${e}`));
  }

  console.log(`\nScreenshots dans: ${SCREENSHOT_DIR}/`);

  // Return exit code based on results
  process.exit(passed === total ? 0 : 1);
}

auditElectronApp().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
