const { createProxyMiddleware } = require('http-proxy-middleware');
const configUrls = require('../public/config.json');

module.exports = function (app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: configUrls.apiUrl,
      secure: false,
    })
  );

  app.use(
    ['/autocomplete', '/search'],
    createProxyMiddleware({
      target: configUrls.ontologyApiUrl,
      secure: false
    })
  );

  //Still need to work on this one
  app.use(
    '/broad-duos-banner',
    createProxyMiddleware({
      target: 'https://storage.googleapis.com',
      secure: false
    })
  );
};
