import React, { useState, CSSProperties } from 'react'

interface ReadMoreProps {
  inline?: boolean
  content?: React.ReactNode[]
  moreContent?: React.ReactNode[]
  className?: string
  style?: CSSProperties
  readStyle?: CSSProperties
  charLimit?: number
  hideUnderLimit?: boolean
  readMoreText?: string
  readLessText?: string
}

const LINK_BUTTON: CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  color: 'inherit',
  fontFamily: 'inherit',
  fontSize: 'inherit',
}

export const ReadMore = (props: Readonly<ReadMoreProps>) => {
  const {
    inline = false,
    content = [<span key="content"></span>],
    moreContent = [<span key="moreContent"></span>],
    className = '',
    style = {},
    readStyle = {},
    charLimit = 100,
    hideUnderLimit = false,
    readMoreText = 'Read More',
    readLessText = 'Read Less',
  } = props

  const [expanded, setExpanded] = useState(false)

  const isUnderLimit = () => !content || content.length <= charLimit

  const getInlineContent = () => {
    const ellipsis = hideUnderLimit && isUnderLimit() ? [] : [' ...']
    const displayContent = expanded ? content : content.slice(0, charLimit).concat(ellipsis)
    return (
      <span className={className} style={style}>
        {displayContent}
      </span>
    )
  }

  const getFormattedContent = () => expanded ? [...content, ...moreContent] : content

  const getContent = () => inline ? getInlineContent() : getFormattedContent()

  const getReadLink = (fn: () => void, text: string, chevronClass: string) => {
    const linkElements = inline
      ? [text]
      : [
          text,
          <span key="chevron" className={chevronClass} style={{ padding: '0 1rem' }} aria-hidden="true" />,
        ]
    const linkStyle = inline ? {} : readStyle
    return (
      <button type="button" style={{ ...LINK_BUTTON, ...linkStyle }} onClick={fn}>
        {linkElements}
      </button>
    )
  }

  const readLink = expanded
    ? getReadLink(() => setExpanded(false), readLessText, 'glyphicon glyphicon-chevron-up')
    : getReadLink(() => setExpanded(true), readMoreText, 'glyphicon glyphicon-chevron-down')

  return (
    <div>
      {getContent()}
      {(hideUnderLimit && isUnderLimit()) || readLink}
    </div>
  )
}
