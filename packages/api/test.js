const { handler } = require('./functions/match-size');

async function runTests() {
  console.log('--- Testing match-size Netlify Function ---');

  // Test 1: Standard Medium user for Zara
  const res1 = await handler({
    httpMethod: 'POST',
    body: JSON.stringify({
      brand: 'zara',
      product_category: 'tops',
      user_measurements: {
        chest: 96,
        waist: 82,
        shoulders: 45,
        height: 175,
        unit: 'cm'
      }
    })
  });
  const data1 = JSON.parse(res1.body);
  console.log('Test 1 (Zara Top for 96cm chest):', data1.recommended_size, `(Confidence: ${data1.confidence_score}%)`);
  if (data1.recommended_size !== 'M') throw new Error(`Expected M, got ${data1.recommended_size}`);

  // Test 2: Small user for Allen Solly
  const res2 = await handler({
    httpMethod: 'POST',
    body: JSON.stringify({
      brand: 'allensolly',
      product_category: 'tops',
      user_measurements: {
        chest: 92,
        waist: 79,
        shoulders: 43,
        height: 168,
        unit: 'cm'
      }
    })
  });
  const data2 = JSON.parse(res2.body);
  console.log('Test 2 (Allen Solly Top for 92cm chest):', data2.recommended_size, `(Confidence: ${data2.confidence_score}%)`);
  if (data2.recommended_size !== 'S') throw new Error(`Expected S, got ${data2.recommended_size}`);

  // Test 3: Product ID lookup
  const res3 = await handler({
    httpMethod: 'POST',
    body: JSON.stringify({
      product_id: 'hm-relaxed-tee-202',
      user_measurements: {
        chest: 104,
        waist: 90,
        shoulders: 48,
        height: 180,
        unit: 'cm'
      }
    })
  });
  const data3 = JSON.parse(res3.body);
  console.log('Test 3 (Product ID lookup hm-relaxed-tee-202): Brand:', data3.brand.name, 'Size:', data3.recommended_size);
  if (data3.recommended_size !== 'L') throw new Error(`Expected L, got ${data3.recommended_size}`);

  // Test 4: Inches conversion (40 inch chest ~ 101.6 cm -> Zara L or H&M M/L)
  const res4 = await handler({
    httpMethod: 'POST',
    body: JSON.stringify({
      brand: 'zara',
      user_measurements: {
        chest: 40,
        waist: 34,
        shoulders: 18,
        height: 70,
        unit: 'in'
      }
    })
  });
  const data4 = JSON.parse(res4.body);
  console.log('Test 4 (Inches input: 40in chest): Size:', data4.recommended_size, `(Unit normalized to ${data4.active_measurements.chest}cm)`);

  console.log('ALL API TESTS PASSED SUCCESSFULLY! ✅');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
