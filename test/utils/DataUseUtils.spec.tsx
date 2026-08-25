import React from 'react'
import { describe, it, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { DatasetTerm } from 'src/types/model'
import { processDataUseCodes, createDataUseDisplay, orderDataUseCodes } from 'src/utils/DataUseUtils'

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

  // Legacy records still hold multi-primary shapes; rendering all of them is deliberate.
  describe('orderDataUseCodes retains legacy multi-primary shapes', () => {
    it('renders every primary a legacy record carries', () => {
      const dataset = {
        dataUse: {
          primary: [
            { code: 'HMB', description: 'Health, Medical and Biomedical Research' },
            { code: 'OTHER', description: 'Not for profit' },
          ],
          secondary: [],
        },
      }

      const terms = orderDataUseCodes(dataset)

      expect(terms.map(term => term.shortCode)).toStrictEqual(['HMB', 'OTH1'])
    })

    it('keeps every primary ahead of alphabetised secondaries', () => {
      const dataset = {
        dataUse: {
          primary: [
            { code: 'GRU', description: 'General Research Use' },
            { code: 'HMB', description: 'Health, Medical and Biomedical Research' },
          ],
          secondary: [
            { code: 'PUB', description: 'Publication Required' },
            { code: 'COL', description: 'Collaboration Required' },
          ],
        },
      }

      const terms = orderDataUseCodes(dataset)

      expect(terms.map(term => term.shortCode)).toStrictEqual(['GRU', 'HMB', 'COL', 'PUB'])
      expect(terms.filter(term => term.type === 'primary')).toHaveLength(2)
    })
  })
})
