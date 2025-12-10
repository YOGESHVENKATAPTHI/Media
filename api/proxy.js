const fetch = require('node-fetch');

module.exports = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: 'No url provided' });
  }

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
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(502).json({ error: 'Proxy error', message: err.message });
  }
};