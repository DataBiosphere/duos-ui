const { createProxyMiddleware } = require('http-proxy-middleware');
const configUrls = require('../public/config.json');

module.exports = function (app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: configUrls.apiUrl,
      secure: false,
      pathRewrite: {
        '/api/status': '/status'
      }
    })
  );

  app.use(
    ['/autocomplete', '/search', '/ontology/status'],
    createProxyMiddleware({
      target: configUrls.ontologyApiUrl,
      secure: false,
      pathRewrite: {
        '/ontology/status': '/status'
      }
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
