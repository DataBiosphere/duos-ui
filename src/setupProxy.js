const { createProxyMiddleware } = require('http-proxy-middleware');
const configUrls = require('../public/config.json');

/*
  Rough outline of the proxy approach is described here
  https://create-react-app.dev/docs/proxying-api-requests-in-development/#configuring-the-proxy-manually

  In short, this file is setting up proxy middleware that will listen for requests made to the application's open port.
  It's the reason why the ajax file initializes a url string for our APIs depending on our environment.
  If the config.json file has an env=local, then the url string will remove the host portion of the url, causing those requests to be self-referenced.
  If the path matches any of the proxies, the request will be intercepted and altered based on its (proxy) configuration.
  For most of the proxies, it means simply rewriting the urls so that the origin is <apiUrl> or <ontologyUrl> rather than hostname.
  In the instance of status though, requests to ontology's and consent's status endpoints had their pathName changed.
  The above needed to be done since, from an application perspective. '/status' is the request made to fetch assets (icons, html, etc.) for the status page.
  Simply checking on '/status' would intercept the above request on page load, therefore consent's and ontology's status path needed to be different.
  In addition, a pathRewrite option was defined to alter the pathName back to '/status' once the request is intercepted to ensure the endpoint is hit on those APIs.

  If you need to add additional paths to be intercepted, you can do one of two things
    1) If there exists a proxy that fits your needs, update the path listing for that proxy with the new value.
       NOTE: multiple paths require an array argument instead of a string
    2) Append a new proxy by using app.use(). Format should be similar to the defined options below, but reference http-proxy-middleware docs if you need more
       https://github.com/chimurai/http-proxy-middleware
       NOTE: Middleware are executed in the order they are added. This may need to be taken into consideration if you want to add a proxy for a specific subpath.

  This file will only be read and evaluated when running 'react-scripts start' (which has been shortcuted to 'npm start' on package.json).
  Our deployment processes use 'npm build' to generate bundled files that are served by nginx, with the files included having references in the application itself.
  Since this file isn't imported or referenced by the application code in any way, it will not be included in the build files, therefore this file will not exist in
  any deployed environments.
*/

module.exports = function (app) {
  app.use(
    ['/api', '/schemas', '/metrics'],
    createProxyMiddleware({
      target: configUrls.apiUrl,
      secure: false,
      pathRewrite: {
        '/api/status': '/status',
        '/api/tos/text/duos': '/tos/text/duos'
      }
    })
  );

  app.use(
    ['/autocomplete', '/search', '/ontology/status', '/translate/paragraph'],
    createProxyMiddleware({
      target: configUrls.ontologyApiUrl,
      secure: false,
      pathRewrite: {
        '/ontology/status': '/status'
      }
    })
  );

};
