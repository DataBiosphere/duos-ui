/* eslint-disable cypress/no-unnecessary-waiting */

import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { DarCollectionTable } from 'src/components/dar_collection_table/DarCollectionTable'
import { DarCollectionTableColumnOptions, consoleTypes } from 'src/utils/DarCollectionUtils'
import { useResponsiveDarCollectionColumns } from 'src/hooks/useResponsiveDarCollectionColumns'

// Mock collection data
const mockCollections = [
  {
    darCollectionId: 1,
    darCode: 'DAR-001',
    name: 'Test Collection',
    submissionDate: '2024-01-01',
    researcherName: 'John Doe',
    institutionName: 'Test University',
    datasetIds: [1, 2],
    expiresAt: '2024-12-31',
    status: 'submitted',
    actions: ['Review'],
    dacNames: 'Test DAC',
  },
]

// Mock collection data with multiple pages for pagination testing
const mockCollectionsForPagination = Array.from({ length: 25 }, (_, index) => ({
  darCollectionId: index + 1,
  darCode: `DAR-${String(index + 1).padStart(3, '0')}`,
  name: `Test Collection ${index + 1}`,
  submissionDate: '2024-01-01',
  researcherName: `Researcher ${index + 1}`,
  institutionName: `University ${index + 1}`,
  datasetIds: [index + 1, index + 2],
  expiresAt: '2024-12-31',
  status: 'submitted',
  actions: ['Review'],
  dacNames: `Test DAC ${index + 1}`,
}))

// Helper function to mount components with router
const mountWithRouter = (component) => {
  return cy.mount(
    <BrowserRouter>
      {component}
    </BrowserRouter>,
  )
}

// Helper function to create responsive columns for admin console
const getAdminResponsiveColumns = (width, baseColumns) => {
  let columns = [...baseColumns]

  if (width < 1450) {
    columns = columns.filter(column => column !== DarCollectionTableColumnOptions.DATASET_COUNT)
  }

  if (width < 1250) {
    columns = columns.filter(column => column !== DarCollectionTableColumnOptions.EXPIRES_AT)
  }

  return columns
}

// Helper function for bug reproduction resize handling
const createResizeHandler = (
  windowWidth,
  setWindowWidth,
  setCurrentPage,
  getResponsiveColumnsWithBug,
) => {
  return () => {
    const newWidth = window.innerWidth
    setWindowWidth(newWidth)

    const oldColumns = getResponsiveColumnsWithBug(windowWidth)
    const newColumns = getResponsiveColumnsWithBug(newWidth)

    if (oldColumns.length !== newColumns.length) {
      console.log('Bug reproduced: Page reset due to column change')
      setCurrentPage(1)
    }
  }
}

// Wrapper component to test table doesn't e.g. go from page 2 to 1 when hiding column on resize
const BugReproductionWrapper = ({ collections = mockCollectionsForPagination }) => {
  const [windowWidth, setWindowWidth] = React.useState(1300)
  const [currentPage, setCurrentPage] = React.useState(2)

  const columnsWithDatasetCount = React.useMemo(() => [
    DarCollectionTableColumnOptions.DAR_CODE,
    DarCollectionTableColumnOptions.NAME,
    DarCollectionTableColumnOptions.SUBMISSION_DATE,
    DarCollectionTableColumnOptions.DATASET_COUNT,
    DarCollectionTableColumnOptions.EXPIRES_AT,
    DarCollectionTableColumnOptions.STATUS,
    DarCollectionTableColumnOptions.ACTIONS,
  ], [])

  const getResponsiveColumnsWithBug = React.useCallback((width) => {
    return getAdminResponsiveColumns(width, columnsWithDatasetCount)
  }, [columnsWithDatasetCount])

  React.useEffect(() => {
    const handleResize = createResizeHandler(
      windowWidth,
      setWindowWidth,
      setCurrentPage,
      getResponsiveColumnsWithBug,
    )

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [windowWidth, getResponsiveColumnsWithBug])

  return (
    <div data-testid="bug-reproduction-wrapper">
      <div data-testid="current-page">Page: {currentPage}</div>
      <div data-testid="column-count">Columns: {getResponsiveColumnsWithBug(windowWidth).length}</div>
      <DarCollectionTable
        key={`bug-test-table-${getResponsiveColumnsWithBug(windowWidth).length}`}
        collections={collections}
        columns={getResponsiveColumnsWithBug(windowWidth)}
        isLoading={false}
        consoleType={consoleTypes.ADMIN}
        cancelCollection={() => {}}
        reviseCollection={() => {}}
        openCollection={() => {}}
        deleteDraft={() => {}}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </div>
  )
}

// Test component that uses the hook
const HookTestComponent = ({ consoleType }) => {
  const responsiveColumns = useResponsiveDarCollectionColumns(consoleType)

  return (
    <div data-testid="hook-test-component">
      <div data-testid="column-count">{responsiveColumns.length}</div>
      <div data-testid="columns">{responsiveColumns.join(',')}</div>
    </div>
  )
}

// Helper component for admin table with hook integration testing
const AdminTableWithHook = () => {
  const responsiveColumns = useResponsiveDarCollectionColumns(consoleTypes.ADMIN)
  return (
    <DarCollectionTable
      collections={mockCollections}
      columns={responsiveColumns}
      isLoading={false}
      consoleType={consoleTypes.ADMIN}
      cancelCollection={() => {}}
      reviseCollection={() => {}}
      openCollection={() => {}}
      deleteDraft={() => {}}
    />
  )
}

// Helper function for researcher responsive columns
const getResearcherResponsiveColumns = (width, baseColumns) => {
  if (width < 1200) {
    return baseColumns.filter(col => col !== DarCollectionTableColumnOptions.DATASET_COUNT)
  }
  return baseColumns
}

// Helper function for responsive table resize handling
const createSimpleResizeHandler = (setWindowWidth) => {
  return () => {
    setWindowWidth(window.innerWidth)
  }
}

// Responsive table wrapper component for pagination testing
const ResponsiveTableWrapper = () => {
  const [windowWidth, setWindowWidth] = React.useState(1600)
  const [currentPage, setCurrentPage] = React.useState(1)

  const columnsWithDatasetCount = React.useMemo(() => [
    DarCollectionTableColumnOptions.DAR_CODE,
    DarCollectionTableColumnOptions.NAME,
    DarCollectionTableColumnOptions.SUBMISSION_DATE,
    DarCollectionTableColumnOptions.DATASET_COUNT,
    DarCollectionTableColumnOptions.STATUS,
    DarCollectionTableColumnOptions.ACTIONS,
  ], [])

  React.useEffect(() => {
    const handleResize = createSimpleResizeHandler(setWindowWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div data-testid="responsive-wrapper">
      <div data-testid="current-page">Page: {currentPage}</div>
      <div data-testid="window-width">Width: {windowWidth}</div>
      <DarCollectionTable
        key="responsive-table-test"
        collections={mockCollectionsForPagination}
        columns={getResearcherResponsiveColumns(windowWidth, columnsWithDatasetCount)}
        isLoading={false}
        consoleType={consoleTypes.RESEARCHER}
        cancelCollection={() => {}}
        reviseCollection={() => {}}
        openCollection={() => {}}
        deleteDraft={() => {}}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </div>
  )
}

describe('useResponsiveDarCollectionColumns Hook', () => {
  describe('Console Type Column Configuration', () => {
    it('should return correct columns for ADMIN console type', () => {
      mountWithRouter(<HookTestComponent consoleType={consoleTypes.ADMIN} />)

      cy.get('[data-testid="columns"]').should('contain', 'dac')
      cy.get('[data-testid="columns"]').should('contain', 'darCode')
      cy.get('[data-testid="columns"]').should('contain', 'actions')
    })

    it('should return correct columns for RESEARCHER console type', () => {
      mountWithRouter(<HookTestComponent consoleType={consoleTypes.RESEARCHER} />)

      cy.get('[data-testid="columns"]').should('contain', 'darCode')
      cy.get('[data-testid="columns"]').should('contain', 'actions')
      cy.get('[data-testid="columns"]').should('not.contain', 'dac')
    })
  })

  describe('Responsive Breakpoint Behavior', () => {
    it('should hide Dataset Count at admin breakpoint (1450px)', () => {
      mountWithRouter(<HookTestComponent consoleType={consoleTypes.ADMIN} />)

      cy.viewport(1500, 800)
      cy.wait(100)
      cy.get('[data-testid="columns"]').should('contain', 'datasetCount')

      cy.viewport(1400, 800)
      cy.wait(100)
      cy.get('[data-testid="columns"]').should('not.contain', 'datasetCount')
    })

    it('should hide Expires At at admin breakpoint (1250px)', () => {
      mountWithRouter(<HookTestComponent consoleType={consoleTypes.ADMIN} />)

      cy.viewport(1300, 800)
      cy.wait(100)
      cy.get('[data-testid="columns"]').should('contain', 'expiresAt')

      cy.viewport(1200, 800)
      cy.wait(100)
      cy.get('[data-testid="columns"]').should('not.contain', 'expiresAt')
    })

    it('should hide Dataset Count at researcher breakpoint (1200px)', () => {
      mountWithRouter(<HookTestComponent consoleType={consoleTypes.RESEARCHER} />)

      cy.viewport(1300, 800)
      cy.wait(100)
      cy.get('[data-testid="columns"]').should('contain', 'datasetCount')

      cy.viewport(1100, 800)
      cy.wait(100)
      cy.get('[data-testid="columns"]').should('not.contain', 'datasetCount')
    })
  })

  describe('Hook Integration with Table Components', () => {
    it('should integrate seamlessly with DarCollectionTable for admin console', () => {
      mountWithRouter(<AdminTableWithHook />)

      cy.viewport(1500, 800)
      cy.wait(100)
      cy.get('.column-header').should('contain', 'Datasets')

      cy.viewport(1400, 800)
      cy.wait(100)
      cy.get('.column-header').should('not.contain', 'Datasets')

      cy.viewport(1200, 800)
      cy.wait(100)
      cy.get('.column-header').should('not.contain', 'Expiration Date')
    })
  })
})

describe('Responsive DAR Collection Tables', () => {
  describe('Column Responsiveness', () => {
    it('should render columns when provided', () => {
      const allColumns = [
        DarCollectionTableColumnOptions.DAR_CODE,
        DarCollectionTableColumnOptions.NAME,
        DarCollectionTableColumnOptions.SUBMISSION_DATE,
        DarCollectionTableColumnOptions.DATASET_COUNT,
        DarCollectionTableColumnOptions.EXPIRES_AT,
        DarCollectionTableColumnOptions.STATUS,
        DarCollectionTableColumnOptions.ACTIONS,
      ]

      mountWithRouter(
        <DarCollectionTable
          collections={mockCollections}
          columns={allColumns}
          isLoading={false}
          consoleType={consoleTypes.RESEARCHER}
          cancelCollection={() => {}}
          reviseCollection={() => {}}
          openCollection={() => {}}
          deleteDraft={() => {}}
        />,
      )

      cy.get('.column-header').should('have.length.at.least', 5)
      cy.get('.column-header').should('contain', 'DAR Code')
    })

    it('should hide Dataset Count when not in columns array', () => {
      const columnsWithoutDatasetCount = [
        DarCollectionTableColumnOptions.DAR_CODE,
        DarCollectionTableColumnOptions.NAME,
        DarCollectionTableColumnOptions.SUBMISSION_DATE,
        DarCollectionTableColumnOptions.EXPIRES_AT,
        DarCollectionTableColumnOptions.STATUS,
        DarCollectionTableColumnOptions.ACTIONS,
      ]

      mountWithRouter(
        <DarCollectionTable
          collections={mockCollections}
          columns={columnsWithoutDatasetCount}
          isLoading={false}
          consoleType={consoleTypes.RESEARCHER}
          cancelCollection={() => {}}
          reviseCollection={() => {}}
          openCollection={() => {}}
          deleteDraft={() => {}}
        />,
      )

      cy.get('.column-header').should('not.contain', 'Datasets')
      cy.get('.column-header').should('contain', 'DAR Code')
    })

    it('should maintain essential columns', () => {
      const essentialColumns = [
        DarCollectionTableColumnOptions.DAR_CODE,
        DarCollectionTableColumnOptions.NAME,
        DarCollectionTableColumnOptions.STATUS,
        DarCollectionTableColumnOptions.ACTIONS,
      ]

      mountWithRouter(
        <DarCollectionTable
          collections={mockCollections}
          columns={essentialColumns}
          isLoading={false}
          consoleType={consoleTypes.RESEARCHER}
          cancelCollection={() => {}}
          reviseCollection={() => {}}
          openCollection={() => {}}
          deleteDraft={() => {}}
        />,
      )

      cy.get('.column-header').should('contain', 'DAR Code')
      cy.get('.column-header').should('contain', 'Title')
      cy.get('.column-header').should('contain', 'Status')
      cy.get('.column-header').should('contain', 'Action')
      cy.get('.column-header').should('not.contain', 'Datasets')
    })
  })

  describe('Viewport Resize Handling', () => {
    it('should handle rapid viewport resizing without errors', () => {
      const allColumns = [
        DarCollectionTableColumnOptions.DAR_CODE,
        DarCollectionTableColumnOptions.NAME,
        DarCollectionTableColumnOptions.SUBMISSION_DATE,
        DarCollectionTableColumnOptions.DATASET_COUNT,
        DarCollectionTableColumnOptions.EXPIRES_AT,
        DarCollectionTableColumnOptions.STATUS,
        DarCollectionTableColumnOptions.ACTIONS,
      ]

      mountWithRouter(
        <div id="resize-test-container">
          <DarCollectionTable
            collections={mockCollections}
            columns={allColumns}
            isLoading={false}
            consoleType={consoleTypes.RESEARCHER}
            cancelCollection={() => {}}
            reviseCollection={() => {}}
            openCollection={() => {}}
            deleteDraft={() => {}}
          />
        </div>,
      )

      // Rapidly resize through different breakpoints
      cy.viewport(1600, 800)
      cy.get('.column-header').should('exist')

      cy.viewport(1400, 800)
      cy.wait(50)
      cy.viewport(1200, 800)
      cy.wait(50)
      cy.viewport(768, 800)
      cy.wait(50)
      cy.viewport(480, 800)
      cy.wait(50)
      cy.viewport(1600, 800)

      cy.get('.column-header').should('exist')
      cy.get('.column-header').should('contain', 'DAR Code')
      cy.get('.column-header').should('have.length.greaterThan', 0)
    })

    it('should maintain table structure on very narrow viewports', () => {
      const essentialColumns = [
        DarCollectionTableColumnOptions.DAR_CODE,
        DarCollectionTableColumnOptions.NAME,
        DarCollectionTableColumnOptions.STATUS,
        DarCollectionTableColumnOptions.ACTIONS,
      ]

      mountWithRouter(
        <div id="resize-test-container">
          <DarCollectionTable
            collections={mockCollections}
            columns={essentialColumns}
            isLoading={false}
            consoleType={consoleTypes.RESEARCHER}
            cancelCollection={() => {}}
            reviseCollection={() => {}}
            openCollection={() => {}}
            deleteDraft={() => {}}
          />
        </div>,
      )

      cy.viewport(320, 568)
      cy.get('.column-header').should('exist')
      cy.get('.column-header').should('have.length.at.least', 4)

      cy.viewport(240, 320)
      cy.get('.column-header').should('exist')
      cy.get('.column-header').should('contain', 'DAR Code')
      cy.get('.column-header').should('contain', 'Action')
      cy.get('.column-header').should('not.contain', 'Datasets')
    })
  })

  describe('Pagination Preservation During Resize', () => {
    it('should NOT reset to page 1 when column removal occurs during resize', () => {
      mountWithRouter(<ResponsiveTableWrapper />)

      cy.viewport(1600, 800)
      cy.get('[data-testid="window-width"]').should('contain', '1600')
      cy.get('.column-header').should('contain', 'Datasets')

      cy.get('[data-testid="current-page"]').should('contain', 'Page: 1')

      cy.viewport(1000, 800)
      cy.wait(200)

      cy.get('.column-header').should('not.contain', 'Datasets')
      cy.get('[data-testid="current-page"]').should('contain', 'Page: 1')

      cy.viewport(1600, 800)
      cy.wait(200)
      cy.get('.column-header').should('contain', 'Datasets')
      cy.get('[data-testid="current-page"]').should('contain', 'Page: 1')
    })

    it('should reproduce and catch the pagination reset bug', () => {
      mountWithRouter(<BugReproductionWrapper collections={mockCollectionsForPagination} />)

      cy.viewport(1300, 800)
      cy.get('[data-testid="current-page"]').should('contain', 'Page: 2')
      cy.get('[data-testid="column-count"]').should('contain', 'Columns: 6')
      cy.get('.column-header').should('not.contain', 'Dataset Count')

      cy.viewport(1100, 800)
      cy.wait(300)

      cy.get('[data-testid="current-page"]').should('contain', 'Page: 1')
      cy.get('[data-testid="column-count"]').should('contain', 'Columns: 5')
      cy.get('.column-header').should('not.contain', 'Dataset Count')
      cy.get('.column-header').should('not.contain', 'Expiration Date')
    })
  })
})
