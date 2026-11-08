const http = require('http');
const { handler } = require('./functions/match-size');

const PORT = process.env.PORT || 8888;

const server = http.createServer(async (req, res) => {
  // Normalize URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Route matching
  if (
    pathname === '/match-size' ||
    pathname === '/.netlify/functions/match-size' ||
    pathname === '/api/match-size'
  ) {
    let rawBody = '';
    req.on('data', chunk => {
      rawBody += chunk;
    });

    req.on('end', async () => {
      try {
        const event = {
          httpMethod: req.method,
          path: pathname,
          headers: req.headers,
          queryStringParameters: Object.fromEntries(url.searchParams),
          body: rawBody
        };

        const result = await handler(event, {});

        // Set response headers
        if (result.headers) {
          for (const [key, value] of Object.entries(result.headers)) {
            res.setHeader(key, value);
          }
        }

        res.statusCode = result.statusCode || 200;
        res.end(result.body || '');
      } catch (err) {
        console.error('Local server error:', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  } else if (pathname === '/health' || pathname === '/') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(JSON.stringify({ status: 'API is running', port: PORT }));
  } else {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

server.listen(PORT, () => {
  console.log(`[API Server] Running at http://localhost:${PORT}`);
  console.log(`[API Server] Netlify Function endpoint: http://localhost:${PORT}/.netlify/functions/match-size`);
});
