import { chromium } from 'playwright';
import fs from 'fs';

const BASE_URL = 'http://localhost:5177';
const REPORT_PATH = '/tmp/seo-audit-report.json';

async function auditApp() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  const issues = [];
  const consoleErrors = [];
  const screenshots = [];

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({ text: msg.text(), location: msg.location() });
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push({ text: err.message, stack: err.stack });
  });

  console.log('=== SEO Command Center - Audit Playwright ===\n');

  try {
    // 1. Load main page
    console.log('1. Chargement de la page principale...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Screenshot initial
    await page.screenshot({ path: '/tmp/audit-01-initial.png', fullPage: true });
    screenshots.push('/tmp/audit-01-initial.png');

    // 2. Check sidebar sites
    console.log('2. Verification sidebar sites...');
    const sidebarSites = await page.locator('aside nav ul li').count();
    console.log(`   Sites dans sidebar: ${sidebarSites}`);
    if (sidebarSites === 0) {
      issues.push({ type: 'data', severity: 'high', message: 'Aucun site dans la sidebar' });
    }

    // 3. Check if sites list is visible
    console.log('3. Verification liste des sites...');
    const sitesTable = await page.locator('table tbody tr').count();
    console.log(`   Lignes dans tableau sites: ${sitesTable}`);

    // 4. Check for empty data
    const emptyBadges = await page.locator('text="0"').count();
    const dashBadges = await page.locator('text="-"').count();
    console.log(`   Badges "0": ${emptyBadges}, Badges "-": ${dashBadges}`);

    // 5. Click on first site if available
    console.log('4. Clic sur premier site...');
    const firstSite = page.locator('aside nav ul li button').first();
    if (await firstSite.isVisible()) {
      await firstSite.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/audit-02-site-detail.png', fullPage: true });
      screenshots.push('/tmp/audit-02-site-detail.png');

      // Check site header
      const siteTitle = await page.locator('h1').first().textContent().catch(() => 'Not found');
      console.log(`   Titre du site: ${siteTitle}`);

      // Check entity badge
      const entityBadge = await page.locator('h1 + a + div').textContent().catch(() => '');
      console.log(`   Badge entite: ${entityBadge}`);

      // Check focus/objective
      const focusSection = await page.locator('text="Objectif SEO"').isVisible();
      console.log(`   Section Objectif SEO visible: ${focusSection}`);

      if (!focusSection) {
        issues.push({ type: 'ui', severity: 'medium', message: 'Section Objectif SEO non visible' });
      }

      // 6. Check tabs
      console.log('5. Verification des onglets...');
      const tabs = await page.locator('button:has-text("Vue")').first().isVisible() ||
                   await page.locator('[role="tab"]').count() > 0;

      // Check KPIs
      const kpiCards = await page.locator('.grid .text-3xl, .grid .text-2xl').count();
      console.log(`   Cartes KPI: ${kpiCards}`);

      // 7. Navigate through tabs
      const tabButtons = ['Keywords', 'Cocons', 'Contenu', 'Backlinks', 'Performance'];
      for (const tabName of tabButtons) {
        const tabBtn = page.locator(`button:has-text("${tabName}")`).first();
        if (await tabBtn.isVisible().catch(() => false)) {
          console.log(`   Clic sur onglet ${tabName}...`);
          await tabBtn.click();
          await page.waitForTimeout(1000);

          // Check for content
          const hasContent = await page.locator('table tbody tr, .grid > div').first().isVisible().catch(() => false);
          if (!hasContent) {
            issues.push({ type: 'data', severity: 'low', message: `Onglet ${tabName} vide` });
          }
        }
      }

      await page.screenshot({ path: '/tmp/audit-03-tabs.png', fullPage: true });
      screenshots.push('/tmp/audit-03-tabs.png');
    }

    // 8. Check Workflows page
    console.log('6. Verification page Workflows...');
    const workflowsBtn = page.locator('button:has-text("Workflows")').first();
    if (await workflowsBtn.isVisible()) {
      await workflowsBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/audit-04-workflows.png', fullPage: true });
      screenshots.push('/tmp/audit-04-workflows.png');

      const workflowRows = await page.locator('table tbody tr').count();
      console.log(`   Workflows affichés: ${workflowRows}`);

      if (workflowRows === 0) {
        issues.push({ type: 'data', severity: 'high', message: 'Page Workflows vide' });
      }
    }

    // 9. Check Credentials page
    console.log('7. Verification page Credentials...');
    const credentialsBtn = page.locator('button:has-text("Credentials")').first();
    if (await credentialsBtn.isVisible()) {
      await credentialsBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/audit-05-credentials.png', fullPage: true });
      screenshots.push('/tmp/audit-05-credentials.png');

      const credentialCards = await page.locator('.grid > div').count();
      console.log(`   Cartes credentials: ${credentialCards}`);
    }

    // 10. Analyze visual issues
    console.log('\n8. Analyse visuelle...');

    // Check for loading spinners stuck
    const spinners = await page.locator('.animate-spin').count();
    if (spinners > 0) {
      issues.push({ type: 'ui', severity: 'medium', message: `${spinners} loader(s) toujours actif(s)` });
    }

    // Check for error messages
    const errors = await page.locator('text=/erreur|error/i').count();
    if (errors > 0) {
      issues.push({ type: 'error', severity: 'high', message: `${errors} message(s) d'erreur visible(s)` });
    }

  } catch (err) {
    issues.push({ type: 'critical', severity: 'critical', message: err.message });
  }

  await browser.close();

  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    url: BASE_URL,
    consoleErrors,
    issues,
    screenshots,
    summary: {
      totalIssues: issues.length,
      critical: issues.filter(i => i.severity === 'critical').length,
      high: issues.filter(i => i.severity === 'high').length,
      medium: issues.filter(i => i.severity === 'medium').length,
      low: issues.filter(i => i.severity === 'low').length,
    }
  };

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

  console.log('\n=== RAPPORT ===');
  console.log(`Issues trouvées: ${report.summary.totalIssues}`);
  console.log(`  - Critiques: ${report.summary.critical}`);
  console.log(`  - Hautes: ${report.summary.high}`);
  console.log(`  - Moyennes: ${report.summary.medium}`);
  console.log(`  - Basses: ${report.summary.low}`);
  console.log(`\nErreurs console: ${consoleErrors.length}`);

  if (consoleErrors.length > 0) {
    console.log('\nErreurs console:');
    consoleErrors.forEach((e, i) => console.log(`  ${i+1}. ${e.text.substring(0, 100)}`));
  }

  if (issues.length > 0) {
    console.log('\nIssues détectées:');
    issues.forEach((i, idx) => console.log(`  ${idx+1}. [${i.severity.toUpperCase()}] ${i.message}`));
  }

  console.log(`\nScreenshots: ${screenshots.join(', ')}`);
  console.log(`Rapport complet: ${REPORT_PATH}`);

  return report;
}

auditApp().catch(console.error);
