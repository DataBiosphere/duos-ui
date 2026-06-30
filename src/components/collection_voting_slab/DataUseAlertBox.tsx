import React from 'react'
import { isEmpty, map } from 'src/utils/NodashUtil'
import { TranslationEntry } from 'src/libs/dataUseTranslation'

const styles = {
  box: {
    color: '#DB3214',
    backgroundColor: '#FFFFFF',
    fontFamily: 'Montserrat',
    padding: '1rem',
    margin: '1.5rem',
    border: '2px solid #DB3214',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    columnGap: '1rem',
    width: 'fit-content',
  },
  text: {
    fontSize: '1.6rem',
    fontWeight: '500',
  },
  exclamationPoint: {
    fontSize: '3rem',
    fontWeight: 'bold',
  },
} as const

type TranslatedDataUse = Record<string, TranslationEntry[]>

const manuallyReviewedDataUses = (dataUses: TranslationEntry[]): TranslationEntry[] => {
  return dataUses.filter(dataUse => dataUse.manualReview)
}

const dataUseDescriptions = (translatedDataUse: TranslatedDataUse) => {
  return Object.keys(translatedDataUse).flatMap((key) => {
    const dataUses = translatedDataUse[key]
    return map(manuallyReviewedDataUses(dataUses), (dataUse, index) => {
      const uniqKey = key + '-' + dataUse.code + '-' + index
      return (
        <div key={uniqKey}>
          {dataUse.description}
        </div>
      )
    })
  })
}

interface DataUseAlertBoxProps {
  readonly translatedDataUse: TranslatedDataUse
}

export default function DataUseAlertBox({ translatedDataUse }: DataUseAlertBoxProps) {
  const descriptions = dataUseDescriptions(translatedDataUse)

  return (
    !isEmpty(descriptions) && (
      <>
        <div>Translated Data Use, Requires Review:</div>
        <div data-cy="alert-box" style={styles.box}>
          <span style={styles.exclamationPoint}>!</span>
          <div style={styles.text}>{descriptions}</div>
        </div>
      </>
    )
  )
}
