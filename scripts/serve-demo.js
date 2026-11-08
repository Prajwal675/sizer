const http = require('http');
const fs = require('fs');
const path = require('path');
const { handler: matchSizeHandler } = require('../packages/api/functions/match-size');

const API_PORT = 8888;
const PORTAL_PORT = 5173;
const PARTNER_PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function serveStatic(baseDir, req, res, fallbackFile = 'index.html') {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let pathname = decodeURIComponent(url.pathname);

  // Cross-origin headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // Handle /bridge route for SPA
  if (pathname === '/bridge' || pathname === '/bridge/') {
    const bridgeHtml = path.join(baseDir, 'public', 'bridge.html');
    if (fs.existsSync(bridgeHtml)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      fs.createReadStream(bridgeHtml).pipe(res);
      return;
    }
  }

  let filePath = path.join(baseDir, pathname === '/' ? 'index.html' : pathname);

  // If path doesn't exist, check dist or fallback to index.html for SPA
  if (!fs.existsSync(filePath)) {
    // Try dist folder
    const distPath = path.join(baseDir, 'dist', pathname);
    if (fs.existsSync(distPath) && !fs.statSync(distPath).isDirectory()) {
      filePath = distPath;
    } else {
      filePath = path.join(baseDir, fallbackFile);
      if (!fs.existsSync(filePath)) {
        filePath = path.join(baseDir, 'dist', fallbackFile);
      }
    }
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('File Not Found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
}

// 1. API Server (Port 8888)
const apiServer = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (
    pathname === '/match-size' ||
    pathname === '/.netlify/functions/match-size' ||
    pathname === '/api/match-size'
  ) {
    let rawBody = '';
    req.on('data', chunk => { rawBody += chunk; });
    req.on('end', async () => {
      try {
        const event = {
          httpMethod: req.method,
          path: pathname,
          headers: req.headers,
          queryStringParameters: Object.fromEntries(url.searchParams),
          body: rawBody
        };
        const result = await matchSizeHandler(event, {});
        if (result.headers) {
          for (const [k, v] of Object.entries(result.headers)) {
            res.setHeader(k, v);
          }
        }
        res.statusCode = result.statusCode || 200;
        res.end(result.body || '');
      } catch (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  } else {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ status: 'Netlify Functions API Online', port: API_PORT }));
  }
});

// 2. Consumer Portal Server (Port 5173)
const portalDir = path.resolve(__dirname, '../apps/consumer-portal');
const portalServer = http.createServer((req, res) => {
  serveStatic(portalDir, req, res);
});

// 3. Partner Store Demo Server (Port 3000)
const demoDir = path.resolve(__dirname, '../demo');
const partnerServer = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // Serve widget bundle if requested at /dist/size-widget.iife.js or /size-widget.iife.js
  if (url.pathname.includes('size-widget.iife.js')) {
    const widgetDist = path.resolve(__dirname, '../apps/b2b-widget/dist/size-widget.iife.js');
    if (fs.existsSync(widgetDist)) {
      res.writeHead(200, {
        'Content-Type': 'text/javascript',
        'Access-Control-Allow-Origin': '*'
      });
      fs.createReadStream(widgetDist).pipe(res);
      return;
    }
  }

  serveStatic(demoDir, req, res);
});

// Start all three services
apiServer.listen(API_PORT, () => {
  console.log(`[API Engine]       Online -> http://localhost:${API_PORT}/.netlify/functions/match-size`);
});

portalServer.listen(PORTAL_PORT, () => {
  console.log(`[Consumer Portal]  Online -> http://localhost:${PORTAL_PORT} (Bridge at /bridge)`);
});

partnerServer.listen(PARTNER_PORT, () => {
  console.log(`[Partner Store]    Online -> http://localhost:${PARTNER_PORT} (Embedded Dummy Page)`);
  console.log(`\n============================================================`);
  console.log(`🚀 Universal Size Profile (Zero-DB SaaS) Sandbox is ready!`);
  console.log(`👉 Open Partner Store in your browser: http://localhost:${PARTNER_PORT}`);
  console.log(`👉 Open Consumer Portal:               http://localhost:${PORTAL_PORT}`);
  console.log(`============================================================\n`);
});
