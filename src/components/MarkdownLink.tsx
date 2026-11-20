import React from 'react'

// target and rel come after the spread so document content cannot override them: without rel the
// opened page can reach back through window.opener.
const MarkdownLink = (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <a {...props} target="_blank" rel="noopener noreferrer" />
)

export default MarkdownLink
