const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Always set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: 'No url provided' });
  }

  // Retry logic for ETIMEDOUT errors
  const maxRetries = 3;
  const baseDelay = 1000;
  let attempt = 0;
  let lastError = null;
  while (attempt <= maxRetries) {
    try {
      // Forward most headers from the client
      const headers = { ...req.headers };
      // Remove headers that should not be forwarded
      delete headers['host'];
      delete headers['connection'];
      delete headers['keep-alive'];
      delete headers['proxy-authenticate'];
      delete headers['proxy-authorization'];
      delete headers['te'];
      delete headers['trailers'];
      delete headers['transfer-encoding'];
      delete headers['upgrade'];

      const response = await fetch(targetUrl, {
        method: req.method,
        headers,
        redirect: 'follow',
      });

      // Forward status and headers
      res.status(response.status);
      response.headers.forEach((value, key) => {
        // Skip certain headers
        if (['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailers', 'transfer-encoding', 'upgrade', 'set-cookie'].includes(key.toLowerCase())) {
          return;
        }
        res.setHeader(key, value);
      });

      // Stream the response
      if (response.body) {
        response.body.pipe(res);
      } else {
        res.end();
      }
      return;
    } catch (error) {
      lastError = error;
      // Set CORS headers on error responses
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      if (error.code === 'ETIMEDOUT' && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
        continue;
      } else {
        return res.status(502).json({ error: 'Proxy error', details: error.message });
      }
    }
  }
  // Final error response if all retries fail
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  return res.status(502).json({ error: 'Proxy error', details: lastError?.message || 'Unknown error' });
};