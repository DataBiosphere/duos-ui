import { ARTICLES_PATH, articlePath } from 'src/utils/ArticleUtils'

/** Articles the app links to. test/content/articles.spec.ts checks each one exists and is visible. */
export const ARTICLE_LINKS = {
  articles: ARTICLES_PATH,
  about: articlePath({ category: 'PAGE', slug: 'aboutduos' }),
  help: articlePath({ category: 'PAGE', slug: 'help' }),
  institutionalEmail: articlePath({ category: 'PAGE', slug: 'link-institutional-email-to-gmail' }),
  faqs: articlePath({ category: 'USER_GUIDE', slug: 'faqs' }),
  dacGuide: articlePath({ category: 'USER_GUIDE', slug: 'dacguide' }),
  researcherGuide: articlePath({ category: 'USER_GUIDE', slug: 'researcherguide' }),
  signingOfficialGuide: articlePath({ category: 'USER_GUIDE', slug: 'signingofficialguide' }),
  nihRas: articlePath({ category: 'USER_GUIDE', slug: 'nih-ras' }),
  libraryCard: articlePath({ category: 'USER_GUIDE', slug: 'how-to-get-a-library-card-from-your-signing-official' }),
} as const
