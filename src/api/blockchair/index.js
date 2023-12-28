const { createProxyMiddleware } = require('http-proxy-middleware');

const proxyMiddleware = createProxyMiddleware({
  target: 'https://api.blockchair.com',
  changeOrigin: true,
  pathRewrite: {
    '^/v1/blockchair': '',
  },
  params: {
    key: process.env.BLOCKCHAIR_KEY,
  }
});

module.exports = proxyMiddleware
