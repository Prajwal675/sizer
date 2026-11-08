const brandsData = require('../data/brands.json');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

const METRIC_WEIGHTS = {
  chest: 2.0,
  shoulders: 1.5,
  waist: 1.2,
  height: 0.5
};

/**
 * Normalizes measurement values to centimeters.
 * If unit is provided as 'in' or 'inches', converts inches to cm.
 */
function normalizeMeasurement(val, unit) {
  if (val === undefined || val === null || val === '') return null;
  const num = parseFloat(val);
  if (isNaN(num) || num <= 0) return null;
  if (unit === 'in' || unit === 'inches') {
    return Math.round(num * 2.54 * 10) / 10;
  }
  return Math.round(num * 10) / 10;
}

/**
 * Calculates deviation penalty for a given user measurement against a size threshold [min, max].
 */
function calculateMetricDeviation(userVal, range) {
  if (userVal === null || !range) return { deviation: 0, status: 'unknown', diff: 0 };
  
  if (userVal < range.min) {
    const diff = Math.round((range.min - userVal) * 10) / 10;
    return {
      deviation: diff,
      status: 'loose', // User is smaller than garment minimum -> loose fit
      diff: -diff,
      note: `${diff}cm under size minimum (${range.min}cm)`
    };
  } else if (userVal > range.max) {
    const diff = Math.round((userVal - range.max) * 10) / 10;
    return {
      deviation: diff,
      status: 'tight', // User is larger than garment maximum -> snug/tight fit
      diff: diff,
      note: `${diff}cm over size maximum (${range.max}cm)`
    };
  } else {
    return {
      deviation: 0,
      status: 'ideal',
      diff: 0,
      note: `Ideal fit (${range.min}-${range.max}cm)`
    };
  }
}

/**
 * Serverless Netlify function handler: match-size
 */
exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: ''
    };
  }

  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        status: 'online',
        service: 'Universal Size Profile Matching Engine',
        version: '1.0.0',
        available_brands: brandsData.brands.map(b => ({ id: b.id, name: b.name })),
        endpoints: {
          match: 'POST /match-size'
        }
      })
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method Not Allowed. Use POST.' })
    };
  }

  try {
    let body = {};
    if (event.body) {
      body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    }

    const {
      product_id,
      product_category = 'tops',
      brand: requestedBrand,
      user_measurements
    } = body;

    if (!user_measurements || typeof user_measurements !== 'object') {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: 'Missing required field: user_measurements',
          example_payload: {
            product_id: 'zara-slim-shirt-101',
            product_category: 'tops',
            brand: 'zara',
            user_measurements: {
              chest: 98,
              waist: 84,
              shoulders: 45,
              height: 175,
              unit: 'cm'
            }
          }
        })
      };
    }

    // Resolve brand & product info
    let targetBrandId = requestedBrand ? requestedBrand.toLowerCase() : null;
    let targetCategory = (product_category || 'tops').toLowerCase();
    let productDetails = null;

    if (product_id && brandsData.mock_products && brandsData.mock_products[product_id]) {
      productDetails = brandsData.mock_products[product_id];
      if (!targetBrandId) targetBrandId = productDetails.brand_id;
      if (productDetails.category) targetCategory = productDetails.category;
    }

    // Find brand data
    let brandConfig = brandsData.brands.find(b => 
      b.id === targetBrandId || b.name.toLowerCase() === (targetBrandId || '').toLowerCase()
    );

    // Fallback to first brand if not found or not specified
    if (!brandConfig) {
      brandConfig = brandsData.brands[0];
    }

    // Find category sizing chart
    const categorySizes = (brandConfig.categories && brandConfig.categories[targetCategory]) 
      ? brandConfig.categories[targetCategory].sizes 
      : (brandConfig.categories['tops'] ? brandConfig.categories['tops'].sizes : []);

    if (!categorySizes || categorySizes.length === 0) {
      return {
        statusCode: 404,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: `No sizing chart available for category '${targetCategory}' in brand '${brandConfig.name}'`
        })
      };
    }

    // Normalize user measurements to cm
    const unit = user_measurements.unit || 'cm';
    const normalizedMetrics = {
      chest: normalizeMeasurement(user_measurements.chest, unit),
      waist: normalizeMeasurement(user_measurements.waist, unit),
      shoulders: normalizeMeasurement(user_measurements.shoulders, unit),
      height: normalizeMeasurement(user_measurements.height, unit)
    };

    // Deviation Penalty Matching Algorithm
    const scoredSizes = categorySizes.map(sizeEntry => {
      let totalPenalty = 0;
      let metricsCount = 0;
      const metricBreakdowns = {};

      for (const [metricKey, userVal] of Object.entries(normalizedMetrics)) {
        if (userVal !== null && sizeEntry.measurements[metricKey]) {
          const weight = METRIC_WEIGHTS[metricKey] || 1.0;
          const range = sizeEntry.measurements[metricKey];
          const deviationResult = calculateMetricDeviation(userVal, range);

          // Quadratic penalty for deviations to penalize large mismatches more heavily
          const penalty = Math.pow(deviationResult.deviation, 1.8) * weight;
          totalPenalty += penalty;
          metricsCount++;

          metricBreakdowns[metricKey] = {
            user_value: userVal,
            size_min: range.min,
            size_max: range.max,
            deviation: deviationResult.deviation,
            status: deviationResult.status,
            diff: deviationResult.diff,
            note: deviationResult.note
          };
        }
      }

      // Calculate confidence score (0 to 100%)
      const penaltyScore = metricsCount > 0 ? totalPenalty / metricsCount : 0;
      const confidence = Math.max(50, Math.min(100, Math.round(100 - (penaltyScore * 3))));

      return {
        size: sizeEntry.size,
        total_penalty: Math.round(totalPenalty * 100) / 100,
        confidence_score: confidence,
        metrics: metricBreakdowns
      };
    });

    // Sort ascending by lowest deviation penalty
    scoredSizes.sort((a, b) => a.total_penalty - b.total_penalty);
    const bestMatch = scoredSizes[0];

    // Determine fit notes
    let fitSummary = 'Great match for your body profile.';
    if (bestMatch.total_penalty === 0) {
      fitSummary = 'Perfect fit! All measurements fall cleanly within this size range.';
    } else {
      const tightMetrics = Object.entries(bestMatch.metrics)
        .filter(([_, m]) => m.status === 'tight')
        .map(([k]) => k);
      const looseMetrics = Object.entries(bestMatch.metrics)
        .filter(([_, m]) => m.status === 'loose')
        .map(([k]) => k);

      if (tightMetrics.length > 0 && looseMetrics.length === 0) {
        fitSummary = `Tailored / snug fit across ${tightMetrics.join(', ')}. Consider sizing up if you prefer a relaxed fit.`;
      } else if (looseMetrics.length > 0 && tightMetrics.length === 0) {
        fitSummary = `Comfortable / relaxed fit with extra room across ${looseMetrics.join(', ')}.`;
      } else if (tightMetrics.length > 0 && looseMetrics.length > 0) {
        fitSummary = `Closest fit balance. Slightly snug in ${tightMetrics.join(', ')} and roomy in ${looseMetrics.join(', ')}.`;
      }
    }

    const responsePayload = {
      recommended_size: bestMatch.size,
      confidence_score: bestMatch.confidence_score,
      brand: {
        id: brandConfig.id,
        name: brandConfig.name,
        fit_type: brandConfig.fit_type
      },
      product: productDetails || {
        category: targetCategory,
        category_name: (brandConfig.categories[targetCategory] && brandConfig.categories[targetCategory].category_name) || targetCategory
      },
      fit_summary: fitSummary,
      active_measurements: {
        unit: 'cm',
        ...normalizedMetrics
      },
      best_match_breakdown: bestMatch.metrics,
      all_sizes_comparison: scoredSizes.map(s => ({
        size: s.size,
        penalty: s.total_penalty,
        confidence: s.confidence_score
      }))
    };

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(responsePayload)
    };

  } catch (error) {
    console.error('Error processing match-size:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      })
    };
  }
};
