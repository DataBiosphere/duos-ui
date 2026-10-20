# Docusaurus spike for DT-4234

Converts the duos.blog import in `src/content/articles` into a Docusaurus 3.10 site that serves
every article at its original duos.blog path. Results are in the DT-4234 plan, under Spike results.

To reproduce, from the repo root:

```sh
npx create-docusaurus@3.10.2 /tmp/duos-blog classic --javascript
cd /tmp/duos-blog && rm -rf blog docs sidebars.js src/pages/* src/components
npm install @docusaurus/plugin-client-redirects@3.10.2
cp <repo>/scripts/docusaurus-spike/docusaurus.config.js .
cp -R <repo>/public/article-images static/
node <repo>/scripts/docusaurus-spike/convert.mjs <repo> .
npx docusaurus build && npx docusaurus serve
```
