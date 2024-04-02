const { createProxyMiddleware } = require('http-proxy-middleware');

const proxyMiddleware = createProxyMiddleware({
  target: 'https://api.blockchair.com',
  changeOrigin: true,
  pathRewrite: {
    '^/v1/blockchair': '',
  },
  onProxyReq: (proxyReq) => {
    const baseUrl = `${proxyReq.protocol}//${proxyReq.host}`;
    const url = new URL(proxyReq.path, baseUrl);

    if (proxyReq.path !== '/litecoin/push/transaction') {
      url.searchParams.append('key', process.env.BLOCKCHAIR_KEY);
    }

    // eslint-disable-next-line no-param-reassign
    proxyReq.path = url.pathname + url.search;
  }
});

module.exports = proxyMiddleware
