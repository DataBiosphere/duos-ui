import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import MarkdownText from 'src/components/MarkdownText'
import { normalizeMarkdown } from 'src/utils/normalizeMarkdown'

/**
 * These tests use the REAL react-markdown (no vi.mock): the point is to pin down what a
 * description from the dbGaP integration looks like once rendered. The fixtures below keep the
 * structure of the stored descriptions of studies 9759 (dev) and 1245 (prod), shortened.
 */

const CLINICAL_TRIAL_DESCRIPTION = [
  '**Study ID:**E5204',
  '**NCT Number:**[NCT00303628](https://clinicaltrials.gov/study/NCT00303628?id=E5204&rank=1#)',
  'ECOG-ACRIN Cancer Research Group',
  '**Clinical data presented in the following publication(s):**',
  '- PMID [31852811](https://pubmed.ncbi.nlm.nih.gov/31852811/)',
  '**Disease type(s):**Gastrointestinal Neoplasm - Colorectal Cancer',
  '**Clinical dataset(s) included:**',
  '- **NCT00303628-D1 (PMID 31852811):** This dataset contains baseline characteristics.',
  '- **NCT00303628-D3 (PMID 31852811):**This dataset contains PRO Bowel function data.',
  'You are encouraged to view the PDF data dictionaries.',
].join('\n')

const COHORT_DESCRIPTION = [
  'The cohort was created by a RC2 "Grand Opportunity" grant (N = 20,935; 19%).',
  'Origins of the RPGEH GERA Cohort',
  'Participants came from the California Men&#39;s Health Study, see [2011a](http://www.ncbi.nlm.nih.gov/pubmed/21565264).',
  'See the [Survey Variables Documentation](GetPdf.cgi?id=phd004310). **Please note the terms of use.**',
].join('\n')

const renderText = (text: string | null | undefined): HTMLElement =>
  render(<MarkdownText text={text} />).container

const texts = (container: HTMLElement, selector: string): Array<string | null> =>
  Array.from(container.querySelectorAll(selector)).map(element => element.textContent)

describe('normalizeMarkdown', () => {
  it('turns each line break into a paragraph break', () => {
    expect(normalizeMarkdown('first\nsecond\r\nthird')).toBe('first\n\nsecond\n\nthird')
  })

  it('does not add to blank lines that are already there', () => {
    expect(normalizeMarkdown('first\n\n\nsecond')).toBe('first\n\nsecond')
  })

  it('keeps adjacent list items together and ends the list at the next plain line', () => {
    expect(normalizeMarkdown('intro\n- one\n- two\n1. three\nafter'))
      .toBe('intro\n\n- one\n- two\n1. three\n\nafter')
  })

  it('adds the space that lets bold text close before a letter or digit', () => {
    expect(normalizeMarkdown('**Study ID:**E5204 **Year:**2020')).toBe('**Study ID:** E5204 **Year:** 2020')
  })

  it('leaves bold text alone when it is already followed by a space or punctuation', () => {
    const text = '**Label:** value, (**note**) and **end.**'
    expect(normalizeMarkdown(text)).toBe(text)
  })

  it('adds the space before an accented letter and before a link', () => {
    expect(normalizeMarkdown('**Lieu:**État **Link:**[text](https://example.org)'))
      .toBe('**Lieu:** État **Link:** [text](https://example.org)')
  })

  it.each(['**BRCA**1', '**see**[link](https://example.org)', '**Table**[2]'])('leaves "%s" alone, because it closes without help', (text) => {
    expect(normalizeMarkdown(text)).toBe(text)
  })

  it('keeps list items with the same indentation at the same level', () => {
    expect(normalizeMarkdown('Cohorts:\n  - Cohort A\n  - Cohort B\n    - Arm 1')).toBe('Cohorts:\n\n- Cohort A\n- Cohort B\n  - Arm 1')
  })

  it('escapes a comparison sign at the start of a line', () => {
    expect(normalizeMarkdown('Criteria:\n> 50% tumor cellularity')).toBe('Criteria:\n\n\\> 50% tumor cellularity')
  })

  it.each([
    ['+ 5 participants', String.raw`\+ 5 participants`],
    ['2007. The survey started.', String.raw`2007\. The survey started.`],
    ['100) samples', String.raw`100\) samples`],
    ['```', '\\`\\`\\`'],
    ['~~~~ text', String.raw`\~\~\~\~ text`],
  ])('escapes the start of "%s"', (text, expected) => {
    expect(normalizeMarkdown(text)).toBe(expected)
  })

  it.each(['10. tenth item', '1) first item', '`code` at the start', '~5 years'])('leaves the start of "%s" alone', (text) => {
    expect(normalizeMarkdown(text)).toBe(text)
  })

  it('removes indentation, which would otherwise start a code block', () => {
    expect(normalizeMarkdown('intro\n    indented\n\tand a tab\n    - first item')).toBe('intro\n\nindented\n\nand a tab\n\n- first item')
  })

  it('keeps the indentation of an item that continues a list', () => {
    expect(normalizeMarkdown('- one\n  - nested\nafter')).toBe('- one\n  - nested\n\nafter')
  })

  it('trims the end of the text in a bold pair, which would otherwise not close', () => {
    expect(normalizeMarkdown('**Label: **value')).toBe('**Label:** value')
  })

  it.each(['2 ** 3 and 4 ** 5', 'a lone ** marker', '****'])('leaves "%s" alone', (text) => {
    expect(normalizeMarkdown(text)).toBe(text)
  })
})

describe('MarkdownText', () => {
  it.each([undefined, null, ''])('renders nothing for %s', (text) => {
    expect(renderText(text)).toBeEmptyDOMElement()
  })

  it('does not render an indented line as a code block', () => {
    const container = renderText('intro\n    indented line')

    expect(container.querySelector('pre, code')).toBeNull()
    expect(texts(container, 'p')).toEqual(['intro', 'indented line'])
  })

  it('renders a plain description unchanged', () => {
    const container = renderText('A plain study description.')

    expect(texts(container, 'p')).toEqual(['A plain study description.'])
  })

  describe('a clinical trial description from dbGaP', () => {
    it('leaves no raw markup on the page', () => {
      const container = renderText(CLINICAL_TRIAL_DESCRIPTION)

      expect(container.textContent).not.toContain('**')
      expect(container.textContent).not.toContain('](')
    })

    it('makes every label bold, including the ones followed directly by a letter', () => {
      const container = renderText(CLINICAL_TRIAL_DESCRIPTION)

      expect(texts(container, 'strong')).toEqual([
        'Study ID:',
        'NCT Number:',
        'Clinical data presented in the following publication(s):',
        'Disease type(s):',
        'Clinical dataset(s) included:',
        'NCT00303628-D1 (PMID 31852811):',
        'NCT00303628-D3 (PMID 31852811):',
      ])
    })

    it('renders two lists and keeps the lines after each list out of it', () => {
      const container = renderText(CLINICAL_TRIAL_DESCRIPTION)

      expect(container.querySelectorAll('ul')).toHaveLength(2)
      expect(texts(container, 'li')).toEqual([
        'PMID 31852811',
        'NCT00303628-D1 (PMID 31852811): This dataset contains baseline characteristics.',
        'NCT00303628-D3 (PMID 31852811): This dataset contains PRO Bowel function data.',
      ])
      expect(texts(container, 'p')).toContain('Disease type(s): Gastrointestinal Neoplasm - Colorectal Cancer')
      expect(texts(container, 'p')).toContain('You are encouraged to view the PDF data dictionaries.')
    })

    it('opens links in a new tab without access to the opener', () => {
      const container = renderText(CLINICAL_TRIAL_DESCRIPTION)
      const links = Array.from(container.querySelectorAll('a'))

      expect(links.map(link => link.getAttribute('href'))).toEqual([
        'https://clinicaltrials.gov/study/NCT00303628?id=E5204&rank=1#',
        'https://pubmed.ncbi.nlm.nih.gov/31852811/',
      ])
      links.forEach((link) => {
        expect(link).toHaveAttribute('target', '_blank')
        expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      })
    })
  })

  describe('a cohort description from dbGaP', () => {
    it('renders each line as its own paragraph', () => {
      const container = renderText(COHORT_DESCRIPTION)

      expect(container.querySelectorAll('p')).toHaveLength(4)
      expect(texts(container, 'p')).toContain('Origins of the RPGEH GERA Cohort')
    })

    it('decodes HTML entities', () => {
      const container = renderText(COHORT_DESCRIPTION)

      expect(container.textContent).toContain('Men\'s Health Study')
      expect(container.textContent).not.toContain('&#39;')
    })

    it('shows a link whose URL is relative to dbGaP as plain text', () => {
      const container = renderText(COHORT_DESCRIPTION)

      expect(texts(container, 'a')).toEqual(['2011a'])
      expect(container.textContent).toContain('See the Survey Variables Documentation.')
      expect(container.textContent).not.toContain('GetPdf.cgi')
    })
  })

  it('shows a comparison at the start of a line as text, not as a block quote', () => {
    const container = renderText('Criteria:\n> 50% tumor cellularity')

    expect(container.querySelector('blockquote')).toBeNull()
    expect(texts(container, 'p')).toEqual(['Criteria:', '> 50% tumor cellularity'])
  })

  it('shows a plus sign and a year at the start of a line as text, not as list items', () => {
    const container = renderText('+ 5 participants\n2007. The survey started.')

    expect(container.querySelector('ul, ol')).toBeNull()
    expect(texts(container, 'p')).toEqual(['+ 5 participants', '2007. The survey started.'])
  })

  it('does not let a stray code fence take the text after it', () => {
    const container = renderText('before\n```\nafter with [link](https://example.org)\n~~~\nlast')

    expect(container.querySelector('pre, code')).toBeNull()
    expect(texts(container, 'p')).toEqual(['before', '```', 'after with link', '~~~', 'last'])
    expect(container.querySelector('a')).toHaveAttribute('href', 'https://example.org')
  })

  it('renders equally indented list items as one flat list', () => {
    const container = renderText('  - Cohort A\n  - Cohort B')

    expect(container.querySelectorAll('ul')).toHaveLength(1)
    expect(texts(container, 'li')).toEqual(['Cohort A', 'Cohort B'])
  })

  it('does not put a space in a name that has a bold part', () => {
    expect(renderText('**BRCA**1 carriers').textContent).toBe('BRCA1 carriers')
  })

  it('keeps an email link, so that its address is not lost', () => {
    const container = renderText('Contact [the study team](mailto:team@example.org).')
    const link = container.querySelector('a')

    expect(link).toHaveTextContent('the study team')
    expect(link).toHaveAttribute('href', 'mailto:team@example.org')
    expect(link).not.toHaveAttribute('target')
  })

  describe('content the page must not take from a description', () => {
    it('does not create elements from raw HTML', () => {
      const container = renderText('<script>window.__pwned = true</script>\n<iframe src="https://evil.test"></iframe>')

      expect(container.querySelector('script')).toBeNull()
      expect(container.querySelector('iframe')).toBeNull()
      expect(container.textContent).toContain('<script>')
    })

    it('does not load images, and shows their alternative text', () => {
      const container = renderText('Before ![Figure 1](https://example.org/tracker.png) after ![](https://example.org/b.png)')

      expect(container.querySelector('img')).toBeNull()
      expect(container.textContent).toBe('Before Figure 1 after ')
    })

    it('does not link to a javascript: URL', () => {
      const container = renderText('[click](javascript:alert(1))')

      expect(container.querySelector('a')).toBeNull()
      expect(container.textContent).toContain('click')
    })

    it('renders a heading as bold text, so the heading order of the page is intact', () => {
      const container = renderText('# Big title\ntext')

      expect(container.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull()
      expect(texts(container, 'strong')).toEqual(['Big title'])
    })
  })
})
