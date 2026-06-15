import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, afterEach } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { useResponsiveDarCollectionColumns } from 'src/hooks/useResponsiveDarCollectionColumns'
import { DarCollectionTableColumnOptions, consoleTypes } from 'src/utils/DarCollectionUtils'

interface HookTestComponentProps {
  consoleType: string
}

const HookTestComponent = ({ consoleType }: HookTestComponentProps) => {
  const columns = useResponsiveDarCollectionColumns(consoleType)

  return (
    <div>
      <div data-testid="column-count">{columns.length}</div>
      <div data-testid="columns">{columns.join(',')}</div>
    </div>
  )
}

describe('useResponsiveDarCollectionColumns', () => {
  const originalInnerWidth = window.innerWidth

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    })
  })

  const setViewportWidth = (width: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    })
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
  }

  it('returns admin columns including DAC on wide viewports', () => {
    setViewportWidth(1600)

    render(<HookTestComponent consoleType={consoleTypes.ADMIN} />)

    const columnsEl = screen.getByTestId('columns')
    expect(columnsEl).toHaveTextContent(DarCollectionTableColumnOptions.DAC)
    expect(columnsEl).toHaveTextContent(DarCollectionTableColumnOptions.DATASET_COUNT)
    expect(columnsEl).toHaveTextContent(DarCollectionTableColumnOptions.EXPIRES_AT)
  })

  it('returns researcher columns without DAC and respects narrow viewport defaults', () => {
    setViewportWidth(900)

    render(<HookTestComponent consoleType={consoleTypes.RESEARCHER} />)

    const columnsEl = screen.getByTestId('columns')
    expect(columnsEl).not.toHaveTextContent(DarCollectionTableColumnOptions.DAC)
    expect(columnsEl).not.toHaveTextContent(DarCollectionTableColumnOptions.DATASET_COUNT)
    expect(columnsEl).not.toHaveTextContent(DarCollectionTableColumnOptions.EXPIRES_AT)
  })

  it('updates returned columns when crossing researcher breakpoints on resize', () => {
    setViewportWidth(1600)

    render(<HookTestComponent consoleType={consoleTypes.RESEARCHER} />)

    let columnsEl = screen.getByTestId('columns')
    expect(columnsEl).toHaveTextContent(DarCollectionTableColumnOptions.DATASET_COUNT)
    expect(columnsEl).toHaveTextContent(DarCollectionTableColumnOptions.EXPIRES_AT)

    setViewportWidth(1100)
    columnsEl = screen.getByTestId('columns')
    expect(columnsEl).not.toHaveTextContent(DarCollectionTableColumnOptions.DATASET_COUNT)
    expect(columnsEl).toHaveTextContent(DarCollectionTableColumnOptions.EXPIRES_AT)

    setViewportWidth(900)
    columnsEl = screen.getByTestId('columns')
    expect(columnsEl).not.toHaveTextContent(DarCollectionTableColumnOptions.EXPIRES_AT)
  })
})
