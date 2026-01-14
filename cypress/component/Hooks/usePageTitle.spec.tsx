import React from 'react'
import { usePageTitle } from 'src/hooks/usePageTitle'

// Test component that uses the hook
const TestComponent = ({ title, suffix }: { title: string, suffix?: string }) => {
  usePageTitle(title, suffix)
  return <div>Test Component</div>
}

describe('usePageTitle Hook', () => {
  const originalTitle = 'Original Title'

  beforeEach(() => {
    cy.document().then((doc) => {
      doc.title = originalTitle
    })
  })

  it('sets the document title with default DUOS suffix', () => {
    cy.mount(<TestComponent title="Test Page" />)
    cy.title().should('equal', 'Test Page | DUOS')
  })

  it('sets the document title with custom suffix', () => {
    cy.mount(<TestComponent title="Test Page" suffix="Custom" />)
    cy.title().should('equal', 'Test Page | Custom')
  })

  it('sets only suffix when pageTitle is empty', () => {
    cy.mount(<TestComponent title="" />)
    cy.title().should('equal', 'DUOS')
  })

  it('updates title when props change', () => {
    const TestWrapper = () => {
      const [title, setTitle] = React.useState('First Page')

      return (
        <div>
          <TestComponent title={title} />
          <button onClick={() => setTitle('Second Page')}>Change Title</button>
        </div>
      )
    }

    cy.mount(<TestWrapper />)
    cy.title().should('equal', 'First Page | DUOS')

    cy.contains('Change Title').click()
    cy.title().should('equal', 'Second Page | DUOS')
  })
})
