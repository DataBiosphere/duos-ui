import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { DataUseTranslation } from '../../libs/dataUseTranslation'
import { isNil, flatMap, keys } from 'lodash'
import { DataUsePills } from './DataUsePill'
import DataUseAlertBox from './DataUseAlertBox'
import HighlightText from '../HighlightText'

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

const highlightedWords = [
  {
    bgColor: 'rgba(0,0,100,.2)',
    textColor: '#0948B7',
    words: [
      'Health',
      'Medical',
      'Biomedical',
      'Disease',
      'Methods',
      'Algorithm',
      'Population',
      'Origin',
      'Ancestry',
      'Controls',
      'Commercial',
      'Profit',
    ],
  },
]

const DataUseSummary = ({ translatedDataUse }) => {
  const allDataUses = flatMap(keys(translatedDataUse), key => translatedDataUse[key])
  return <div className="data-use-summary">{DataUsePills(allDataUses, true)}</div>
}

DataUseSummary.propTypes = {
  translatedDataUse: PropTypes.object.isRequired,
}

const CollapseExpandLink = ({ expanded, setExpanded }) => {
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

CollapseExpandLink.propTypes = {
  expanded: PropTypes.bool.isRequired,
  setExpanded: PropTypes.func.isRequired,
}

const ResearchPurposeSummary = ({ darInfo }) => {
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

ResearchPurposeSummary.propTypes = {
  darInfo: PropTypes.shape({ rus: PropTypes.string }),
}

export default function ResearchProposalSlab(props) {
  const [expanded, setExpanded] = useState(true)
  const { darInfo, isLoading } = props
  const translatedDataUse = isNil(darInfo) ? {} : DataUseTranslation.translateDarInfo(darInfo)

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

ResearchProposalSlab.propTypes = {
  darInfo: PropTypes.object,
  isLoading: PropTypes.bool,
}
