import React, { CSSProperties, ReactNode } from 'react'
import { Tooltip as ReactTooltip } from 'react-tooltip'
import { DatasetTerm } from 'src/types/model'

interface DataUseCode {
  code: string
  description: string
}

interface ProcessedDataUseCodes {
  codesAndDescriptions: DataUseCode[]
  codeList: string[]
}

/**
 * Process data use codes from a dataset
 * @param {DatasetTerm} dataset - DatasetTerm object containing data use information
 * @returns {ProcessedDataUseCodes} - Object with processed data use information
 */
export function processDataUseCodes(dataset: DatasetTerm): ProcessedDataUseCodes {
  const codesAndDescriptions = dataset.dataUse?.primary
    ? dataset.dataUse.primary.map((dataUse) => {
        if (dataUse.code === 'OTHER') {
          return { code: `OTH1`, description: dataUse.description }
        }
        else if (dataUse.code === 'DS') {
          const disease = dataUse.description.substring(dataUse.description.indexOf(':') + 2)
          return { code: `${dataUse.code} (${disease})`, description: dataUse.description }
        }
        else {
          return { code: dataUse.code, description: dataUse.description }
        }
      })
    : []

  if (dataset.dataUse?.secondary) {
    dataset.dataUse.secondary.forEach((dataUse) => {
      if (dataUse.code === 'OTHER') {
        codesAndDescriptions.push({ code: `OTH2`, description: dataUse.description })
      }
      else {
        codesAndDescriptions.push({ code: dataUse.code, description: dataUse.description })
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
        effect="solid"
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
