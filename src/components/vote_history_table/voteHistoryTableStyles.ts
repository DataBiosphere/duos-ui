import type React from 'react'
import { Styles } from 'src/libs/theme'
import { type TableStyles } from 'src/components/SimpleTable'

// Shared SimpleTable style tokens giving the Voting History tables the flat DataGrid look used
// by the Data Library. Kept out of Styles.TABLE, whose tokens many unrelated tables still rely on.
export const VOTE_TABLE_BORDER_COLOR = '#E0E0E0'

// The row's top rule doubles as the header underline, so the header carries no border of its
// own — otherwise the two stack into a 2px line under the header.
export const voteHistoryBaseStyle: React.CSSProperties = {
  fontFamily: 'Montserrat',
  fontSize: '1.4rem',
  fontWeight: 400,
  color: '#333F52',
  backgroundColor: '#FFFFFF',
  display: 'flex',
  padding: '1rem 2%',
  lineHeight: '2rem',
  justifyContent: 'space-between',
  alignItems: 'center',
  whiteSpace: 'pre-line',
  borderTop: `1px solid ${VOTE_TABLE_BORDER_COLOR}`,
}

export const voteHistoryColumnStyle: React.CSSProperties = {
  ...Styles.TABLE.HEADER_ROW,
  fontFamily: 'Montserrat',
  fontSize: '1.4rem',
  color: '#333F52',
  justifyContent: 'space-between',
  textTransform: 'none',
  fontWeight: 600,
  marginBottom: 0,
  borderTop: 'none',
}

export const voteHistoryContainerOverride: React.CSSProperties = {
  marginTop: 0,
  backgroundColor: '#FFFFFF',
  padding: 0,
  border: `1px solid ${VOTE_TABLE_BORDER_COLOR}`,
  borderRadius: '4px',
  overflow: 'hidden',
}

export const voteHistoryTableStyles: TableStyles = {
  baseStyle: voteHistoryBaseStyle,
  columnStyle: voteHistoryColumnStyle,
  containerOverride: voteHistoryContainerOverride,
}
