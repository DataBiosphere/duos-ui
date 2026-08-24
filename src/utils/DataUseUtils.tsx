import React, { CSSProperties, ReactNode } from 'react'
import { Tooltip as ReactTooltip } from 'react-tooltip'
import { DatasetTerm, DataUseSummary } from 'src/types/model'

export type DataUseCodeType = 'primary' | 'secondary'

export interface DataUseCode {
  code: string
  /**
   * The bare DUO code, for displays too tight to carry `code` in full — `code`
   * appends the disease list for DS (`DS (Breast Cancer)`), which does not fit
   * where several codes are shown together.
   */
  shortCode: string
  description: string
  type: DataUseCodeType
}

interface ProcessedDataUseCodes {
  codesAndDescriptions: DataUseCode[]
  codeList: string[]
}

/** Anything carrying data use terms: an indexed dataset, or a DAR collection's data use group. */
export interface HasDataUse {
  dataUse?: DataUseSummary
}

/**
 * Process data use codes from a dataset
 * @param {object} dataset - anything carrying data use information
 * @returns {ProcessedDataUseCodes} - Object with processed data use information
 */
export function processDataUseCodes(dataset: HasDataUse): ProcessedDataUseCodes {
  const codesAndDescriptions: DataUseCode[] = dataset.dataUse?.primary
    ? dataset.dataUse.primary.map((dataUse) => {
        if (dataUse.code === 'OTHER') {
          return { code: `OTH1`, shortCode: 'OTH1', description: dataUse.description, type: 'primary' }
        }
        else if (dataUse.code === 'DS') {
          // The diseases follow a "Disease specific: <list>" prefix. Guard the split:
          // a description with no colon (or none at all) must still yield a usable
          // code, since the library grid derives a whole row's cell value from this.
          const separator = dataUse.description?.indexOf(':') ?? -1
          const disease = separator >= 0 ? dataUse.description.substring(separator + 2) : dataUse.description
          const code = disease ? `${dataUse.code} (${disease})` : dataUse.code
          return { code, shortCode: dataUse.code, description: dataUse.description, type: 'primary' }
        }
        else {
          return { code: dataUse.code, shortCode: dataUse.code, description: dataUse.description, type: 'primary' }
        }
      })
    : []

  if (dataset.dataUse?.secondary) {
    dataset.dataUse.secondary.forEach((dataUse) => {
      if (dataUse.code === 'OTHER') {
        codesAndDescriptions.push({ code: `OTH2`, shortCode: 'OTH2', description: dataUse.description, type: 'secondary' })
      }
      else {
        codesAndDescriptions.push({ code: dataUse.code, shortCode: dataUse.code, description: dataUse.description, type: 'secondary' })
      }
    })
  }

  const codeList = codesAndDescriptions.map(du => du.code)

  return { codesAndDescriptions, codeList }
}

export type TooltipPlacement = 'top' | 'right' | 'bottom' | 'left'

/**
 * Creates a data use display component with tooltips
 * @param {DatasetTerm} dataset - DatasetTerm object
 * @param {string} divClass - CSS class for the div
 * @param {CSSProperties} divStyle - CSS style properties for the div
 * @param {string} spanClass - CSS class for the span
 * @param {TooltipPlacement} tooltipPlace - Placement direction for tooltip
 * @returns {ReactNode} - Element displaying data use codes with tooltips
 */
export function createDataUseDisplay({
  dataset,
  divClass,
  divStyle,
  spanClass,
  tooltipPlace = 'right',
}: {
  dataset: DatasetTerm
  divClass?: string
  divStyle?: CSSProperties
  spanClass?: string
  tooltipPlace?: TooltipPlacement
}): ReactNode {
  const { codesAndDescriptions, codeList } = processDataUseCodes(dataset)

  return (
    <div style={divStyle} className={divClass}>
      <span className={spanClass} data-tip={true} data-for={`dataset-data-use-${dataset.datasetId}`}>
        {codeList.join(', ')}
      </span>
      <ReactTooltip
        place={tooltipPlace}
        id={`dataset-data-use-${dataset.datasetId}`}
      >
        <ul>
          {codesAndDescriptions.map((translation, index) => {
            return (
              <li
                key={`${translation.code}_s_${index}`}
              >
                {translation.code}
                :
                {translation.description}
              </li>
            )
          })}
        </ul>
      </ReactTooltip>
    </div>
  )
}

/**
 * Primary codes first, then secondary alphabetically. Shared so every grid that shows data use
 * renders the same codes in the same order.
 *
 * Renders every primary a record carries: Consent rejects multi-primary writes, but legacy records
 * still hold them, and collapsing them would hide a shape a curator has to see.
 */
export const orderDataUseCodes = (dataset: HasDataUse): DataUseCode[] => {
  const terms = processDataUseCodes(dataset).codesAndDescriptions.filter(term => Boolean(term.shortCode))
  return [
    ...terms.filter(term => term.type === 'primary'),
    ...terms
      .filter(term => term.type === 'secondary')
      .sort((a, b) => a.shortCode.localeCompare(b.shortCode)),
  ]
}

// Codes alone are opaque; name the tier so a secondary condition isn't read as a primary use
export const dataUseTooltip = ({ code, description, type }: DataUseCode): string => {
  const tier = type === 'primary' ? 'Primary' : 'Secondary'
  return description ? `${tier} — ${code}: ${description}` : `${tier} — ${code}`
}
