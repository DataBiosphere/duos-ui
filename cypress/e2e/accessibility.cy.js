describe('Accessibility Tests', function () {
  beforeEach(function () {
    // Set up any common configuration
    cy.viewport(1200, 800)
  })

  describe('Data Library Page', function () {
    beforeEach(function () {
      cy.visit(Cypress.env('baseUrl') + '/data_library')
    })

    it('has accessible search and filter form elements', function () {
      // Check search input accessibility
      cy.get('input[placeholder*="Search"]').should('have.attr', 'aria-label')
      cy.get('input[placeholder*="Search"]').then(($input) => {
        const ariaLabel = $input.attr('aria-label')
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        expect(ariaLabel).to.not.be.empty
        expect(ariaLabel).to.include('search')
      })

      // Check filter inputs have proper labels
      cy.get('input[placeholder*="minimum"]').should('have.attr', 'aria-label', 'Minimum participants')
      cy.get('input[placeholder*="maximum"]').should('have.attr', 'aria-label', 'Maximum participants')

      // Check action buttons have accessible names
      cy.get('button').contains('Clear Search').should('have.attr', 'aria-label').or('have.text')
      cy.get('button').contains('Clear Filters').should('have.attr', 'aria-label').or('have.text')
    })

    it('has accessible dataset table elements', function () {
      // Wait for datasets to load
      cy.get('[data-cy="dataset-table"]', { timeout: 10000 }).should('exist')

      // Check that dataset delete buttons have proper aria-labels without typos
      cy.get('button[aria-label*="Delete dataset"]').each(($button) => {
        const ariaLabel = $button.attr('aria-label')
        expect(ariaLabel).to.not.include('Delte') // Check for typo fix
        expect(ariaLabel).to.include('Delete dataset')
      })

      // Check table headers are properly marked up
      cy.get('table').should('exist')
      cy.get('th').should('exist').and('have.length.above', 0)

      // Check that data tables have proper ARIA labels or captions
      cy.get('table').should('have.attr', 'role').or('have.descendants', 'caption')
    })

    it('has accessible images with proper alt text', function () {
      cy.get('img').each(($img) => {
        cy.wrap($img).should('have.attr', 'alt')

        const altText = $img.attr('alt')
        const role = $img.attr('role')
        const src = $img.attr('src')

        // Check for decorative images
        if (altText === '' || role === 'presentation') {
          // This is acceptable for decorative images
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          expect(altText === '' || role === 'presentation').to.be.true
        }
        else {
          // Informative images should have meaningful alt text
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          expect(altText).to.not.be.empty
          expect(altText).to.not.match(/^(image|img|picture|photo|dataset icon)$/i)

          // GA4GH logo should have proper alt text
          if (src && src.includes('ga4gh')) {
            expect(altText).to.include('GA4GH')
          }
        }
      })
    })

    it('has accessible navigation elements', function () {
      // Check mobile navigation button
      cy.get('button[aria-label*="navigation"]').should('exist')
      cy.get('button[aria-label="Open navigation menu"]').should('exist')

      // Check main navigation
      cy.get('nav, [role="navigation"]').should('exist')

      // Check pagination controls if present
      cy.get('body').then(($body) => {
        if ($body.find('[aria-label*="pagination"], .pagination').length > 0) {
          cy.get('[aria-label*="pagination"], .pagination').should('exist')
          cy.get('button[aria-label*="page"], a[aria-label*="page"]').should('exist')
        }
      })
    })
  })

  describe('Profile Page Form Accessibility', function () {
    beforeEach(function () {
      // Note: This assumes authentication is handled elsewhere or mocked
      // Adjust the URL based on your routing structure
      cy.visit(Cypress.env('baseUrl') + '/profile')
    })

    it('has accessible form elements with proper labels', function () {
      // Check that FormField components have title attributes that create labels
      cy.get('input[id*="profileName"], input[id*="name"]').should('exist').then(($inputs) => {
        $inputs.each((_index, input) => {
          const $input = Cypress.$(input)
          const id = $input.attr('id')

          // Check if there's a corresponding label or aria-label
          const hasLabel = Cypress.$(`label[for="${id}"]`).length > 0
          const hasAriaLabel = $input.attr('aria-label')
          const hasAriaLabelledby = $input.attr('aria-labelledby')

          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          expect(hasLabel || hasAriaLabel || hasAriaLabelledby).to.be.true
        })
      })

      // Check email field accessibility
      cy.get('input[type="email"], input[id*="email"]').should('exist').then(($inputs) => {
        $inputs.each((_index, input) => {
          const $input = Cypress.$(input)
          const id = $input.attr('id')

          const hasLabel = Cypress.$(`label[for="${id}"]`).length > 0
          const hasAriaLabel = $input.attr('aria-label')
          const hasAriaLabelledby = $input.attr('aria-labelledby')

          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          expect(hasLabel || hasAriaLabel || hasAriaLabelledby).to.be.true
        })
      })

      // Check institution field accessibility
      cy.get('input[id*="institution"], select[id*="institution"]').should('exist').then(($inputs) => {
        $inputs.each((_index, input) => {
          const $input = Cypress.$(input)
          const id = $input.attr('id')

          const hasLabel = Cypress.$(`label[for="${id}"]`).length > 0
          const hasAriaLabel = $input.attr('aria-label')
          const hasAriaLabelledby = $input.attr('aria-labelledby')

          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          expect(hasLabel || hasAriaLabel || hasAriaLabelledby).to.be.true
        })
      })
    })

    it('has accessible form validation messages', function () {
      // Check that error messages are properly associated with form fields
      cy.get('.error-message, [role="alert"], .field-error').should('exist').then(($errors) => {
        $errors.each((_index, error) => {
          const $error = Cypress.$(error)
          const errorId = $error.attr('id')

          if (errorId) {
            // Check if any input references this error via aria-describedby
            cy.get(`input[aria-describedby*="${errorId}"], select[aria-describedby*="${errorId}"]`)
              .should('exist')
          }
        })
      })

      // Check required field indicators are accessible
      cy.get('input[required], select[required]').each(($input) => {
        const ariaRequired = $input.attr('aria-required')
        const required = $input.attr('required')

        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        expect(ariaRequired === 'true' || required !== undefined).to.be.true
      })
    })

    it('has accessible form submission and action buttons', function () {
      // Check submit buttons have accessible names
      cy.get('button[type="submit"], button').contains(/submit|save|update/i).should('exist').then(($buttons) => {
        $buttons.each((_index, button) => {
          const $button = Cypress.$(button)
          const buttonText = $button.text().trim()
          const ariaLabel = $button.attr('aria-label')

          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          expect(buttonText || ariaLabel).to.be.ok
          expect(buttonText || ariaLabel).to.not.match(/^(button|click|submit)$/i)
        })
      })

      // Check cancel/reset buttons are accessible
      cy.get('button').contains(/cancel|reset|clear/i).should('exist').then(($buttons) => {
        $buttons.each((_index, button) => {
          const $button = Cypress.$(button)
          const buttonText = $button.text().trim()
          const ariaLabel = $button.attr('aria-label')

          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          expect(buttonText || ariaLabel).to.be.ok
        })
      })
    })
  })

  describe('General Accessibility Standards', function () {
    const pagesToTest = [
      { name: 'Home', url: '/' },
      { name: 'Data Library', url: '/data_library' },
      { name: 'About', url: '/about' },
    ]

    pagesToTest.forEach((page) => {
      it(`${page.name} page meets basic accessibility requirements`, function () {
        cy.visit(Cypress.env('baseUrl') + page.url)

        // Check for proper heading hierarchy
        cy.get('h1').should('have.length.at.most', 1) // Only one h1 per page
        cy.get('h1, h2, h3, h4, h5, h6').should('exist')

        // Check that all interactive elements can receive focus
        cy.get('a, button, input, select, textarea, [tabindex]').each(($el) => {
          const tabindex = $el.attr('tabindex')
          if (tabindex !== '-1') {
            cy.wrap($el).should('be.visible').and('not.be.disabled')
          }
        })

        // Check for skip navigation links (common accessibility feature)
        cy.get('body').then(($body) => {
          const skipLinks = $body.find('a[href*="#"], .skip-link, [href="#main-content"]')
          if (skipLinks.length > 0) {
            cy.wrap(skipLinks.first()).should('exist')
          }
        })

        // Check that all form elements have labels or aria-label
        cy.get('input, select, textarea').each(($input) => {
          const id = $input.attr('id')
          const ariaLabel = $input.attr('aria-label')
          const ariaLabelledby = $input.attr('aria-labelledby')

          if (id) {
            const hasLabel = Cypress.$(`label[for="${id}"]`).length > 0
            const hasAccessibleName = hasLabel || ariaLabel || ariaLabelledby

            // Placeholder alone is not sufficient for accessibility
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            expect(hasAccessibleName).to.be.true
          }
          else {
            // Without an ID, the element must have aria-label or aria-labelledby
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            expect(ariaLabel || ariaLabelledby).to.be.ok
          }
        })
      })
    })
  })
})
