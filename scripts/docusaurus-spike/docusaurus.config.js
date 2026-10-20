// @ts-check
const redirects = require('./legacy-paths.json').redirects

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'DUOS',
  tagline: 'Data Use Oversight System',
  url: 'https://duos.blog',
  baseUrl: '/',
  trailingSlash: true,
  onBrokenLinks: 'throw',
  markdown: { format: 'detect', hooks: { onBrokenMarkdownLinks: 'throw' } },
  i18n: { defaultLocale: 'en', locales: ['en'] },
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: false,
        blog: {
          routeBasePath: '/',
          blogTitle: 'DUOS Blog',
          blogDescription: 'News, guides and policy briefs from the DUOS team',
          postsPerPage: 10,
          showReadingTime: true,
          onUntruncatedBlogPosts: 'ignore',
          onInlineAuthors: 'ignore',
          feedOptions: { type: ['rss', 'atom'], xslt: false, limit: false },
        },
        theme: { customCss: './src/css/custom.css' },
        sitemap: { changefreq: 'weekly' },
      }),
    ],
  ],
  plugins: [
    [
      '@docusaurus/plugin-client-redirects',
      { redirects: Object.entries(redirects).map(([from, to]) => ({ from: from.replace(/\/$/, ''), to })) },
    ],
  ],
  themeConfig: {
    navbar: {
      title: 'DUOS',
      items: [
        { to: '/', label: 'Blog', position: 'left' },
        { to: '/help/', label: 'Help', position: 'left' },
        { to: '/aboutduos/', label: 'About', position: 'left' },
        { to: '/publications/', label: 'Publications', position: 'left' },
        { href: 'https://duos.org', label: 'DUOS', position: 'right' },
      ],
    },
    footer: { style: 'dark', copyright: `Broad Institute of MIT and Harvard` },
  },
}

module.exports = config
