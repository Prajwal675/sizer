const fs = require('fs');
const path = require('path');
const { handler: matchSizeHandler } = require('./packages/api/functions/match-size');

async function runEndToEndVerification() {
  console.log('========================================================');
  console.log('  UNIVERSAL SIZE PROFILE (ZERO-DB SAAS) — E2E VERIFICATION');
  console.log('========================================================\n');

  let passedChecks = 0;
  let totalChecks = 0;

  function assert(condition, message) {
    totalChecks++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passedChecks++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // --- Phase 1: Static Brand Data Verification ---
  console.log('\n--- Phase 1: Static Brand Data ---');
  const brandsPath = path.resolve(__dirname, 'packages/api/data/brands.json');
  assert(fs.existsSync(brandsPath), 'brands.json exists in packages/api/data');
  const brandsData = JSON.parse(fs.readFileSync(brandsPath, 'utf8'));
  assert(Array.isArray(brandsData.brands), 'brandsData.brands is an array');
  assert(brandsData.brands.length >= 3, `brands count >= 3 (Found: ${brandsData.brands.length})`);

  const brandIds = brandsData.brands.map(b => b.id);
  assert(brandIds.includes('zara'), 'Zara brand sizing chart is present');
  assert(brandIds.includes('hm'), 'H&M brand sizing chart is present');
  assert(brandIds.includes('allensolly'), 'Allen Solly brand sizing chart is present');

  for (const b of brandsData.brands) {
    const topSizes = b.categories && b.categories.tops && b.categories.tops.sizes;
    assert(Array.isArray(topSizes) && topSizes.length >= 4, `${b.name} has tops sizing chart with >= 4 sizes`);
    const medium = topSizes.find(s => s.size === 'M');
    assert(medium && medium.measurements.chest && medium.measurements.waist && medium.measurements.shoulders,
      `${b.name} size M has chest, waist, and shoulders min/max thresholds`
    );
  }

  // --- Phase 2: Serverless Matching Engine Verification ---
  console.log('\n--- Phase 2: Serverless Matching Engine (match-size.js) ---');
  
  // Test OPTIONS CORS preflight
  const preflightRes = await matchSizeHandler({ httpMethod: 'OPTIONS' }, {});
  assert(preflightRes.statusCode === 204, 'CORS preflight returns 204');
  assert(preflightRes.headers['Access-Control-Allow-Origin'] === '*', 'CORS Allow-Origin is *');

  // Test Zara Match
  const zaraRes = await matchSizeHandler({
    httpMethod: 'POST',
    body: JSON.stringify({
      brand: 'zara',
      product_category: 'tops',
      user_measurements: {
        chest: 96,
        waist: 82,
        shoulders: 45,
        unit: 'cm'
      }
    })
  }, {});
  const zaraData = JSON.parse(zaraRes.body);
  assert(zaraRes.statusCode === 200, 'Zara match returns 200 OK');
  assert(zaraData.recommended_size === 'M', `Zara (96cm chest) recommended size is M (Got: ${zaraData.recommended_size})`);
  assert(zaraData.confidence_score >= 90, `Confidence score is high (Got: ${zaraData.confidence_score}%)`);

  // Test H&M Match (Large)
  const hmRes = await matchSizeHandler({
    httpMethod: 'POST',
    body: JSON.stringify({
      product_id: 'hm-relaxed-tee-202',
      user_measurements: {
        chest: 104,
        waist: 90,
        shoulders: 48,
        unit: 'cm'
      }
    })
  }, {});
  const hmData = JSON.parse(hmRes.body);
  assert(hmData.recommended_size === 'L', `H&M Tee (104cm chest) recommended size is L (Got: ${hmData.recommended_size})`);

  // Test Allen Solly Match (Small)
  const allenSollyRes = await matchSizeHandler({
    httpMethod: 'POST',
    body: JSON.stringify({
      product_id: 'allensolly-formal-shirt-303',
      user_measurements: {
        chest: 92,
        waist: 79,
        shoulders: 43,
        unit: 'cm'
      }
    })
  }, {});
  const allenSollyData = JSON.parse(allenSollyRes.body);
  assert(allenSollyData.recommended_size === 'S', `Allen Solly Formal Shirt (92cm chest) recommended size is S (Got: ${allenSollyData.recommended_size})`);

  // --- Phase 3: Consumer Portal Verification ---
  console.log('\n--- Phase 3: Consumer Portal Build Artifacts ---');
  const portalHtml = path.resolve(__dirname, 'apps/consumer-portal/dist/index.html');
  const bridgeHtml = path.resolve(__dirname, 'apps/consumer-portal/public/bridge.html');
  assert(fs.existsSync(portalHtml), 'Consumer portal compiled bundle exists in apps/consumer-portal/dist');
  assert(fs.existsSync(bridgeHtml), 'Bridge HTML endpoint exists in apps/consumer-portal/public/bridge.html');

  const portalSrc = fs.readFileSync(path.resolve(__dirname, 'apps/consumer-portal/src/App.jsx'), 'utf8');
  assert(portalSrc.includes('size_profile_metrics'), 'App.jsx references localStorage key size_profile_metrics');
  assert(portalSrc.includes('/bridge'), 'App.jsx implements hidden /bridge route');

  // --- Phase 4: B2B Widget IIFE Verification ---
  console.log('\n--- Phase 4: B2B Injectable Widget (IIFE) ---');
  const widgetIife = path.resolve(__dirname, 'apps/b2b-widget/dist/size-widget.iife.js');
  assert(fs.existsSync(widgetIife), 'B2B Widget single IIFE bundle exists in apps/b2b-widget/dist/size-widget.iife.js');
  
  const widgetCode = fs.readFileSync(widgetIife, 'utf8');
  assert(widgetCode.includes('universal-size-bridge-frame'), 'Widget script injects bridge iframe');
  assert(widgetCode.includes('postMessage'), 'Widget script utilizes postMessage for cross-origin communication');
  assert(widgetCode.includes('match-size'), 'Widget script communicates with match-size Netlify function');

  // --- Phase 5: Local Sandbox Demo Verification ---
  console.log('\n--- Phase 5: Dummy Product Page & Sandbox ---');
  const demoHtml = path.resolve(__dirname, 'demo/index.html');
  assert(fs.existsSync(demoHtml), 'demo/index.html dummy product page exists');
  const demoContent = fs.readFileSync(demoHtml, 'utf8');
  assert(demoContent.includes('size-widget.iife.js'), 'demo/index.html embeds compiled widget script');
  assert(demoContent.includes('data-size-widget'), 'demo/index.html has data-size-widget container');
  assert(demoContent.includes('data-product-id'), 'demo/index.html specifies data-product-id');

  console.log('\n========================================================');
  console.log(`🎉 ALL ${passedChecks}/${totalChecks} E2E VERIFICATION CHECKS PASSED SUCCESSFULLY!`);
  console.log('========================================================\n');
}

runEndToEndVerification().catch(err => {
  console.error('\n❌ E2E Verification failed:', err.message);
  process.exit(1);
});
