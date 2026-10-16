import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import { ConsoleDashboardResource } from './ConsoleDashboardResources'
import { ARTICLE_LINKS } from 'src/content/articles/links'

export const COMMON_CONSOLE_RESOURCES: ConsoleDashboardResource[] = [
  {
    icon: QuizOutlinedIcon,
    label: 'Frequently Asked Questions',
    description: 'Answers to common questions about using DUOS.',
    href: ARTICLE_LINKS.faqs,
  },
  {
    icon: ArticleOutlinedIcon,
    label: 'Help Center',
    description: 'Browse the full library of DUOS documentation and how-to articles.',
    href: ARTICLE_LINKS.help,
  },
]
