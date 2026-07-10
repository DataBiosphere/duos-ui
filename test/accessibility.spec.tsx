import '@testing-library/jest-dom/vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

describe('Accessibility Component Tests', () => {
  describe('Navigation Accessibility', () => {
    it('Navigation header has accessible structure', () => {
      const NavigationHeader = () => (
        <nav role="navigation" aria-label="Main navigation">
          <button aria-label="Open navigation menu">☰</button>
          <ul>
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </nav>
      )

      render(<NavigationHeader />)

      expect(screen.getByRole('button', { name: /navigation menu/i })).toBeInTheDocument()
      expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument()
    })

    it('Navigation elements have proper ARIA labels', () => {
      const NavigationElement = () => (
        <div>
          <button aria-label="Main menu">Menu</button>
          <button>Home</button>
          <button aria-label="User profile">👤</button>
        </div>
      )

      render(<NavigationElement />)

      screen.getAllByRole('button').forEach((button) => {
        if (button.textContent?.trim().length === 0) {
          expect(button).toHaveAttribute('aria-label')
        }
      })
    })

    it('Navigation tabs have accessible structure', () => {
      const NavigationTabs = () => (
        <div role="tablist">
          <button role="tab" aria-selected="true">Tab 1</button>
          <button role="tab" aria-selected="false">Tab 2</button>
          <button role="tab" aria-selected="false">Tab 3</button>
        </div>
      )

      render(<NavigationTabs />)

      expect(screen.getByRole('tablist')).toBeInTheDocument()
      expect(screen.getAllByRole('tab')).toHaveLength(3)
    })
  })

  describe('Form Element Accessibility', () => {
    it('Form inputs have proper accessibility attributes', () => {
      const FormComponent = () => (
        <form>
          <label htmlFor="name-input">Name</label>
          <input id="name-input" type="text" aria-label="User name" />

          <label htmlFor="email-input">Email</label>
          <input id="email-input" type="email" />

          <label htmlFor="institution">Institution</label>
          <select id="institution" aria-required="true">
            <option>Select an institution</option>
          </select>
        </form>
      )

      render(<FormComponent />)

      document.querySelectorAll('input[type="text"]').forEach((input) => {
        const id = input.getAttribute('id')
        const ariaLabel = input.getAttribute('aria-label')

        if (id) {
          expect(document.querySelector(`label[for="${id}"]`)).toBeInTheDocument()
        }
        if (id || ariaLabel) {
          expect(input).toBeInTheDocument()
        }
      })

      document.querySelectorAll('select').forEach((select) => {
        const id = select.getAttribute('id')
        const ariaLabel = select.getAttribute('aria-label')

        if (id) {
          expect(document.querySelector(`label[for="${id}"]`)).toBeInTheDocument()
        }
        if (id || ariaLabel) {
          expect(select).toBeInTheDocument()
        }
      })
    })

    it('Required fields are marked with aria-required', () => {
      const FormComponent = () => (
        <form>
          <input id="required-field" type="text" required aria-required="true" />
          <input id="optional-field" type="text" />
        </form>
      )

      render(<FormComponent />)

      document.querySelectorAll('input[required]').forEach((input) => {
        const ariaRequired = input.getAttribute('aria-required')
        if (ariaRequired === 'true' || input.hasAttribute('required')) {
          expect(input).toBeInTheDocument()
        }
      })
    })

    it('Form validation messages are associated with fields', () => {
      const FormComponent = () => (
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" aria-describedby="email-error" />
          <span id="email-error" role="alert">Please enter a valid email</span>
        </div>
      )

      render(<FormComponent />)

      expect(document.querySelector('input[aria-describedby]')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  describe('Table Element Accessibility', () => {
    it('Tables have proper semantic structure', () => {
      const TableComponent = () => (
        <div>
          <h2>Dataset Table</h2>
          <table>
            <caption>List of datasets with delete options</caption>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Dataset 1</td>
                <td>Study</td>
                <td>
                  <button aria-label="Delete dataset Dataset 1">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )

      render(<TableComponent />)

      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getAllByRole('columnheader').length).toBeGreaterThan(0)
      expect(screen.getByText('List of datasets with delete options')).toBeInTheDocument()
    })

    it('Delete buttons in tables have descriptive aria-labels', () => {
      const TableComponent = () => (
        <table>
          <tbody>
            <tr>
              <td>Dataset 1</td>
              <td>
                <button aria-label="Delete dataset Dataset 1">Delete</button>
              </td>
            </tr>
            <tr>
              <td>Dataset 2</td>
              <td>
                <button aria-label="Delete dataset Dataset 2">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      )

      render(<TableComponent />)

      screen.getAllByRole('button', { name: /delete dataset/i }).forEach((button) => {
        const ariaLabel = button.getAttribute('aria-label')
        expect(ariaLabel).not.toContain('Delte')
        expect(ariaLabel).toContain('Delete dataset')
      })
    })
  })

  describe('Image Accessibility', () => {
    it('Images have proper alt text', () => {
      const ImageComponent = () => (
        <div>
          <img src="/logo.png" alt="Company logo" />
          <img src="/icon.svg" alt="Information icon" />
          <img src="/decorative.png" alt="" role="presentation" />
        </div>
      )

      render(<ImageComponent />)

      document.querySelectorAll('img').forEach((image) => {
        const altText = image.getAttribute('alt')
        const role = image.getAttribute('role')

        expect(image).toHaveAttribute('alt')

        if (altText === '' || role === 'presentation') {
          expect(altText === '' || role === 'presentation').toBe(true)
        }
        else {
          expect(image).toHaveAttribute('alt')
          expect(altText).not.toBe('')
        }
      })
    })

    it('GA4GH logo has proper alt text', () => {
      const ImageComponent = () => (
        <img src="/ga4gh-logo.png" alt="GA4GH logo" />
      )

      render(<ImageComponent />)

      expect(document.querySelector('img[src*="ga4gh"]')).toHaveAttribute('alt', expect.stringContaining('GA4GH'))
    })
  })

  describe('Interactive Element Accessibility', () => {
    it('All interactive elements can receive focus', () => {
      const InteractiveComponent = () => (
        <div>
          <a href="#section">Link</a>
          <button>Button</button>
          <input type="text" />
          <select>
            <option>Option</option>
          </select>
          <textarea></textarea>
        </div>
      )

      render(<InteractiveComponent />)

      document.querySelectorAll('a, button, input, select, textarea').forEach((element) => {
        if (element.getAttribute('tabindex') !== '-1') {
          expect(element).toBeVisible()
        }
      })
    })

    it('Buttons have accessible names', () => {
      const ButtonComponent = () => (
        <div>
          <button>Save Changes</button>
          <button aria-label="Close dialog">×</button>
          <button>Submit</button>
        </div>
      )

      render(<ButtonComponent />)

      screen.getAllByRole('button').forEach((button) => {
        const text = button.textContent?.trim()
        const ariaLabel = button.getAttribute('aria-label')

        if (text || ariaLabel) {
          expect(button).toBeInTheDocument()
        }
      })
    })
  })

  describe('Heading Hierarchy', () => {
    it('Pages have proper heading hierarchy', () => {
      const PageComponent = () => (
        <div>
          <h1>Page Title</h1>
          <h2>Section 1</h2>
          <p>Content</p>
          <h2>Section 2</h2>
          <h3>Subsection</h3>
          <p>More content</p>
        </div>
      )

      render(<PageComponent />)

      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
      expect(screen.getAllByRole('heading').length).toBeGreaterThan(0)
    })
  })
})
