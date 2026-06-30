import React, { useState } from 'react'
import { DataUseTranslation, DarInfo, TranslationEntry } from 'src/libs/dataUseTranslation'
import { isNil, flatMap, keys } from 'src/utils/NodashUtil'
import { DataUsePills } from './DataUsePill'
import DataUseAlertBox from './DataUseAlertBox'
import HighlightText from 'src/components/HighlightText'
import { DataAccessRequestData } from 'src/types/model'

const styles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    borderRadius: '0 8px 8px 8px',
    border: '#84a3db 2px solid',
  },
  slabTitle: {
    color: '#000000',
    fontSize: '1.6rem',
    fontWeight: 'bold',
    width: 'fit-content',
    padding: '1.2rem',
    borderRadius: '4px 4px 0 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: '2rem',
  },
  dataUseCategoryLabel: {
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  link: {
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    color: '#0948B7',
    fontWeight: '500',
  },
  collapsedData: {
    color: '#333F52',
    padding: '15px 25px',
  },
  expandedData: {
    paddingLeft: '15px',
  },
  researchPurposeTitle: {
    fontSize: '1.8rem',
    fontWeight: 'bold',
    display: 'inline-block',
  },
  researchPurposeSummary: {
    fontSize: '1.4rem',
    fontWeight: '500',
    lineHeight: '20px',
    margin: '1.5rem',
  },
}

type TranslatedDataUse = Record<string, TranslationEntry[]>

const highlightedWords = [
  {
    bgColor: 'rgba(0,0,100,.2)',
    textColor: '#0948B7',
    words: [
      'Health', 'Medical', 'Biomedical', 'Disease', 'Methods',
      'Algorithm', 'Population', 'Origin', 'Ancestry', 'Controls',
      'Commercial', 'Profit',
    ],
  },
]

const DataUseSummary = ({ translatedDataUse }: { translatedDataUse: TranslatedDataUse }) => {
  const allDataUses = flatMap(keys(translatedDataUse), key => translatedDataUse[key])
  return <div className="data-use-summary">{DataUsePills(allDataUses, true)}</div>
}

const CollapseExpandLink = ({ expanded, setExpanded }: { expanded: boolean, setExpanded: (v: boolean) => void }) => {
  const linkMessage = expanded ? '(Hide)' : '(Show)'
  return (
    <button
      style={styles.link}
      id="rp-narrative-toggle"
      onClick={() => setExpanded(!expanded)}
    >
      {linkMessage}
    </button>
  )
}

const ResearchPurposeSummary = ({ darInfo }: { darInfo?: Partial<DataAccessRequestData> }) => {
  return isNil(darInfo)
    ? (
        <div />
      )
    : (
        <div style={styles.researchPurposeSummary}>
          <HighlightText
            highlight={highlightedWords}
            text={darInfo.rus}
          />
        </div>
      )
}

interface ResearchProposalSlabProps {
  readonly darInfo?: Partial<DataAccessRequestData>
  readonly isLoading?: boolean
}

const toTranslatedDataUse = (darInfo: Partial<DataAccessRequestData>): TranslatedDataUse => {
  const { primary = [], secondary = [] } = DataUseTranslation.translateDarInfo(darInfo as DarInfo)
  return {
    primary: primary as TranslationEntry[],
    secondary: secondary as TranslationEntry[],
  }
}

export default function ResearchProposalSlab({ darInfo, isLoading }: ResearchProposalSlabProps) {
  const [expanded, setExpanded] = useState(true)
  const translatedDataUse: TranslatedDataUse = isNil(darInfo)
    ? {}
    : toTranslatedDataUse(darInfo)

  return (
    <div data-cy="rp-slab" style={styles.baseStyle}>
      {isLoading
        ? (
            <div className="text-placeholder" style={{ height: '100px' }} />
          )
        : (
            <div>
              <div style={styles.collapsedData}>
                <DataUseSummary translatedDataUse={translatedDataUse} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '1rem' }}>
                  <span style={styles.researchPurposeTitle}>Narrative</span>
                  <CollapseExpandLink expanded={expanded} setExpanded={setExpanded} />
                </div>
                {expanded && (
                  <div data-cy="rp-expanded" style={styles.expandedData}>
                    <div data-cy="research-purpose">
                      <ResearchPurposeSummary darInfo={darInfo} />
                      <DataUseAlertBox translatedDataUse={translatedDataUse} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
    </div>
  )
}
