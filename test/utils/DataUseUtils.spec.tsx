import React from 'react'
import { describe, it, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { DatasetTerm } from 'src/types/model'
import { processDataUseCodes, createDataUseDisplay } from 'src/utils/DataUseUtils'

describe('DataUseUtils', () => {
  describe('processDataUseCodes', () => {
    it('should process secondary data use codes correctly', () => {
      const dataset: Partial<DatasetTerm> = {
        datasetId: 4,
        datasetName: 'Test Dataset with Secondary',
        dataUse: {
          primary: [
            { code: 'GRU', description: 'General Research Use' },
          ],
          secondary: [
            { code: 'NPU', description: 'Not for Profit Use Only' },
          ],
        },
      }

      const result = processDataUseCodes(dataset as DatasetTerm)

      expect(result.codesAndDescriptions).toHaveLength(2)
      expect(result.codesAndDescriptions[0].code).toBe('GRU')
      expect(result.codesAndDescriptions[1].code).toBe('NPU')

      expect(result.codeList).toHaveLength(2)
      expect(result.codeList).toEqual(['GRU', 'NPU'])
    })
  })

  describe('createDataUseDisplay', () => {
    it('should render data use display with correct codes', () => {
      const dataset: Partial<DatasetTerm> = {
        datasetId: 8,
        datasetName: 'Test Dataset for Display',
        dataUse: {
          primary: [
            { code: 'GRU', description: 'General Research Use' },
            { code: 'HMB', description: 'Health/Medical/Biomedical Research' },
          ],
          secondary: [],
        },
      }

      const { container } = render(createDataUseDisplay({ dataset: dataset as DatasetTerm }) as React.ReactElement)

      expect(screen.getByText('GRU, HMB')).toBeInTheDocument()
      expect(container.querySelector('[data-for="dataset-data-use-8"]')).toBeInTheDocument()
    })
  })
})
