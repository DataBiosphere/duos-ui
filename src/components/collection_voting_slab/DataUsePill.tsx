import React from 'react'
import { isNil } from 'src/utils/NodashUtil'
import { ControlledAccessType, TranslationEntry } from 'src/libs/dataUseTranslation'

const styles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    fontSize: '1.25rem',
    margin: '0.35rem 0',
    display: 'flex',
    gap: '0.8rem',
    alignItems: 'center',
  },
  code: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: '1.1rem',
    height: '24px',
    minWidth: '42px',
    borderRadius: '5rem',
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex',
    flexShrink: 0,
  },
  codePrimary: {
    backgroundColor: '#00609f',
  },
  codeSecondary: {
    backgroundColor: '#7ab8e0',
  },
  codeManualReview: {
    backgroundColor: '#db5454',
  },
  subheading: {
    fontWeight: 'bold',
    fontSize: '1.2rem',
    margin: '0.4rem 0 0.1rem',
  },
  description: {
    color: '#333F52',
    fontWeight: '500',
  },
  descriptionManualReview: {
    color: '#e57373',
  },
} as const

interface DataUsePillProps {
  readonly dataUse: TranslationEntry
  readonly index: number
}

export const DataUsePill = ({ dataUse, index }: DataUsePillProps) => {
  const isPrimary = dataUse?.type === ControlledAccessType.permissions
  return (
    <div key={`data_use_pill_${dataUse.type}_${dataUse.code}_${index}`} style={styles.baseStyle}>
      <span
        style={{
          ...styles.code,
          ...(isPrimary ? styles.codePrimary : styles.codeSecondary),
          ...(dataUse?.manualReview ? styles.codeManualReview : {}),
        }}
      >
        {isNil(dataUse) ? [] : [dataUse.code]}
      </span>
      <span
        style={{
          ...styles.description,
          ...(dataUse?.manualReview ? styles.descriptionManualReview : {}),
        }}
      >
        {isNil(dataUse) ? [] : [dataUse.description]}
      </span>
    </div>
  )
}

interface DataUsePillsProps {
  readonly dataUses: TranslationEntry[]
  readonly twoColumn?: boolean
}

export const DataUsePills = ({ dataUses, twoColumn = false }: DataUsePillsProps) => {
  const permissionsUses = dataUses.filter(dataUse => dataUse.type === ControlledAccessType.permissions)
  const modifierUses = dataUses.filter(dataUse => dataUse.type === ControlledAccessType.modifiers)

  if (twoColumn) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="permissions-uses">
          <h3 style={styles.subheading}>{ControlledAccessType.permissions}</h3>
          {permissionsUses.map((dataUse, idx) => (
            <DataUsePill dataUse={dataUse} key={`${dataUse.code}-${idx}`} index={idx} />
          ))}
        </div>
        <div className="modifier-uses">
          {modifierUses.length > 0 && (
            <>
              <h3 style={styles.subheading}>{ControlledAccessType.modifiers}</h3>
              {modifierUses.map((dataUse, idx) => (
                <DataUsePill dataUse={dataUse} key={`${dataUse.code}-${idx}`} index={idx} />
              ))}
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      {[...permissionsUses, ...modifierUses].map((dataUse, idx) => (
        <DataUsePill dataUse={dataUse} key={`${dataUse.code}-${idx}`} index={idx} />
      ))}
    </div>
  )
}
