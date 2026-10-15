import { describe, expect, it } from 'vitest'
import {
  categoryFor,
  createConverter,
  decodeEntities,
  excerptFrom,
  fitHeadings,
  parentFor,
  promoteTableHeaders,
  removeEmptyLinks,
  rewriteLinks,
  slugFor,
  toTypeScript,
} from '../../scripts/import-duos-blog.mjs'

const page = (path: string) => ({ type: 'page', URL: `http://duos.blog${path}` })
const post = (tags: string[]) => ({ type: 'post', URL: 'http://duos.blog/2025/01/01/x/', tags: Object.fromEntries(tags.map(tag => [tag, {}])) })

describe('import-duos-blog', () => {
  it('assigns categories from the page path or the post tag', () => {
    expect(categoryFor(page('/help/dacguide/'))).toBe('USER_GUIDE')
    expect(categoryFor(page('/help/'))).toBe('PAGE')
    expect(categoryFor(page('/feature-announcements/progressreports/'))).toBe('FEATURE_ANNOUNCEMENT')
    expect(categoryFor(page('/aboutduos/'))).toBe('PAGE')
    expect(categoryFor(post(['User Guides']))).toBe('USER_GUIDE')
    expect(categoryFor(post(['Feature']))).toBe('FEATURE_ANNOUNCEMENT')
    expect(categoryFor(post(['Policy']))).toBe('POLICY_BRIEF')
    expect(categoryFor(post(['Article']))).toBe('IN_THE_NEWS')
    expect(categoryFor(post([]))).toBe('BLOG_POST')
  })

  it('normalizes slugs and nests help pages under Help', () => {
    expect(slugFor({ slug: 'link_institutional_email_to_gmail' })).toBe('link-institutional-email-to-gmail')
    expect(slugFor({ slug: 'hello-world' })).toBe('nih-genomic-data-sharing-policy-update')
    expect(parentFor(page('/help/nih_ras/'))).toBe('help')
    expect(parentFor(page('/help/'))).toBeUndefined()
  })

  it('decodes entities and cuts excerpts at a word', () => {
    expect(decodeEntities('&#8220;Data&#8221; &amp; more&hellip;')).toBe('“Data” & more…')
    const paragraph = 'DACs must answer important questions about access to data before approving requests.'
    expect(excerptFrom(`<h2>Guide</h2><p>Short caption</p><p>${paragraph}</p>`)).toBe(paragraph)
    expect(excerptFrom(`<p>${paragraph}</p>`, 20)).toBe('DACs must answer…')
    expect(excerptFrom('<p>\u200Bshort <strong>card</strong>.<br>Next</p>')).toBe('short card. Next')
  })

  it('points duos.blog links at the migrated articles', () => {
    const byPath = new Map([['/help/dacguide/', '/articles/user-guides/dacguide'], ['/', '/articles']])
    const byId = new Map([[3, '/articles/pages/help']])
    const markdown = '[a](http://duos.blog/help/dacguide/#faq) [b](https://duos.blog/help/dacguide) [c](http://duos.blog/?post_type=page&p=3) [d](https://duos.blog) [e](https://duos.blog/gone/)'

    expect(rewriteLinks(markdown, byPath, byId))
      .toBe('[a](/articles/user-guides/dacguide#faq) [b](/articles/user-guides/dacguide) [c](/articles/pages/help) [d](/articles) [e](https://duos.blog/gone/)')
  })

  it('drops a leading heading that restates the title and keeps a single h1', () => {
    expect(fitHeadings('# About DUOS\n\nText\n\n# Part\n\n## Sub', 'About DUOS')).toBe('Text\n\n## Part\n\n### Sub')
    expect(fitHeadings('## Data Access Committee (DAC) Guide\n\nText', 'DAC User Guide')).toBe('Text')
    expect(fitHeadings('## Overview\n\nText', 'NIH RAS in DUOS')).toBe('## Overview\n\nText')
    expect(fitHeadings('### **At a Glance**\n\nText', 'Progress Reports')).toBe('### At a Glance\n\nText')
  })

  it('removes empty links and promotes a table\'s first row into an empty header', () => {
    expect(removeEmptyLinks('Intro [](https://example.org/a)\n\n\n\n[x](/y) ![](/img.png)')).toBe('Intro \n\n[x](/y) ![](/img.png)')
    expect(promoteTableHeaders('|     |     |\n| --- | --- |\n| **Role** | **Use** |\n| DAC | Review |'))
      .toBe('| **Role** | **Use** |\n| --- | --- |\n| DAC | Review |')
  })

  it('converts HTML, turning YouTube embeds into links and keeping tables', () => {
    const convert = createConverter()

    expect(convert('<p>Hi</p><iframe src="https://www.youtube.com/embed/abc_1?rel=1"></iframe><script>x()</script>'))
      .toBe('Hi\n\n[Watch the video on YouTube](https://www.youtube.com/watch?v=abc_1)')
    expect(convert('<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>'))
      .toMatch(/^\| A +\|\n\| --- \|/)
  })

  it('writes the article list as TypeScript, escaping quotes and skipping unset fields', () => {
    const source = toTypeScript([{ category: 'PAGE', slug: 'help', title: 'DUOS\'s help', parent: undefined, tags: ['a'] }])

    expect(source).toContain('    title: \'DUOS\\\'s help\',\n    tags: [\'a\'],\n')
    expect(source).not.toContain('parent')
  })
})
