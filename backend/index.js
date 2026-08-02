import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './src/routes/auth.js';
import healthRoutes from './src/routes/health.js';
import uploadRoutes from './src/routes/upload.js';
import apiRoutes from './src/routes/api.js';
import tasksRoutes from './src/routes/tasks.js';
import dietRoutes from './src/routes/diet.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// LibreChat proxy middleware (placed before body parsers to keep request stream intact)
const LIBRECHAT_URL = process.env.LIBRECHAT_URL || 'http://127.0.0.1:3080';
app.use(async (req, res, next) => {
  const referer = req.headers.referer || '';
  const isLibrechatPath = req.path.startsWith('/librechat');
  
  let isFromLibrechatIframe = false;
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const host = req.headers.host || '';
      // If the referer host matches the backend's host, the request is coming from inside the iframe.
      if (refererUrl.host === host) {
        isFromLibrechatIframe = true;
      }
    } catch (e) {
      // Invalid URL
    }
  }

  // Also fallback to the older query token / referer path matching for safety
  const isLegacyLibrechatReferer = referer.includes('/librechat') || referer.includes('autoLoginToken');

  if (isLibrechatPath || isFromLibrechatIframe || isLegacyLibrechatReferer) {
    let subPath = req.url;
    if (isLibrechatPath) {
      subPath = req.url.replace(/^\/librechat/, '');
      if (subPath === '') subPath = '/';
    }

    const targetUrl = `${LIBRECHAT_URL}${subPath}`;

    const headers = {};
    Object.keys(req.headers).forEach((key) => {
      if (![
        'host',
        'connection',
        'content-length',
        'expect',
        'keep-alive',
        'transfer-encoding',
        'te',
        'upgrade'
      ].includes(key.toLowerCase())) {
        headers[key] = req.headers[key];
      }
    });

    try {
      const fetchOptions = {
        method: req.method,
        headers: headers,
      };

      if (req.method === 'POST' || req.method === 'PUT') {
        fetchOptions.body = req;
        fetchOptions.duplex = 'half';
      }

      const response = await fetch(targetUrl, fetchOptions);

      res.status(response.status);
      response.headers.forEach((val, key) => {
        res.setHeader(key, val);
      });

      if (response.body) {
        const reader = response.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
      }
      res.end();
    } catch (err) {
      console.error(`[LibreChat Proxy Error to ${targetUrl}]`, err);
      res.status(502).json({ error: `Bad Gateway: ${err.message}` });
    }
  } else {
    next();
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/', (req, res) => {
  res.send('Backend server is running');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/diet', dietRoutes);
app.use('/api', apiRoutes);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
