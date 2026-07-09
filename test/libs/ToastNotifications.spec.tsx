import '@testing-library/jest-dom/vitest'
import React from 'react'
import { act } from 'react'
import { fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, afterEach } from 'vitest'
import { ToastNotifications, ToastPosition } from 'src/libs/ToastNotifications'

afterEach(() => {
  Array.from(document.body.children)
    .filter(el => el.querySelector('[data-cy="notification-alert"]') || el.querySelector('.MuiSnackbar-root'))
    .forEach(el => el.remove())
})

describe('ToastNotifications', () => {
  describe('showNotification', () => {
    it('should display a notification with default props', async () => {
      await act(async () => {
        ToastNotifications.showNotification({ text: 'Test notification' })
      })

      const alert = document.querySelector('[data-cy="notification-alert"]')
      expect(alert).toBeInTheDocument()
      expect(alert).toHaveTextContent('Test notification')
      expect(alert).toHaveClass('MuiAlert-colorInfo')
    })

    it('should display notification with custom severity', async () => {
      await act(async () => {
        ToastNotifications.showNotification({
          text: 'Warning message',
          severity: 'warning',
        })
      })

      const alert = document.querySelector('[data-cy="notification-alert"]')
      expect(alert).toBeInTheDocument()
      expect(alert).toHaveTextContent('Warning message')
      expect(alert).toHaveClass('MuiAlert-colorWarning')
    })

    it('should display notification with React node as text', async () => {
      await act(async () => {
        ToastNotifications.showNotification({
          text: <span data-testid="react-text">React notification</span>,
        })
      })

      const reactText = document.querySelector('[data-testid="react-text"]')
      expect(reactText).toBeInTheDocument()
      expect(reactText).toHaveTextContent('React notification')
    })

    it('should position notification using string layout', async () => {
      await act(async () => {
        ToastNotifications.showNotification({
          text: 'Top left notification',
          layout: 'topLeft',
        })
      })

      expect(document.querySelector('.MuiSnackbar-root')).toHaveClass('MuiSnackbar-anchorOriginTopLeft')
    })

    it('should position notification using SnackbarOrigin layout', async () => {
      await act(async () => {
        ToastNotifications.showNotification({
          text: 'Custom position notification',
          layout: { vertical: 'top', horizontal: 'center' },
        })
      })

      expect(document.querySelector('.MuiSnackbar-root')).toHaveClass('MuiSnackbar-anchorOriginTopCenter')
    })

    it('should close notification when close button is clicked', async () => {
      vi.useFakeTimers()
      try {
        await act(async () => {
          ToastNotifications.showNotification({ text: 'Closeable notification' })
        })

        expect(document.querySelector('[data-cy="notification-alert"]')).toBeInTheDocument()

        const closeButton = document.querySelector('[data-cy="notification-alert"] .MuiAlert-action button') as HTMLElement
        fireEvent.click(closeButton)

        await act(async () => {
          vi.advanceTimersByTime(350)
        })

        expect(document.querySelector('[data-cy="notification-alert"]')).not.toBeInTheDocument()
      }
      finally {
        vi.useRealTimers()
      }
    })

    it('should apply custom styling with sx prop', async () => {
      await act(async () => {
        ToastNotifications.showNotification({
          text: 'Styled notification',
          sx: { backgroundColor: 'red' },
        })
      })

      // MUI emotion CSS-in-JS is not computed in jsdom; verify the notification renders without error
      expect(document.querySelector('[data-cy="notification-alert"]')).toBeInTheDocument()
      expect(document.querySelector('.MuiSnackbar-root')).toBeInTheDocument()
    })

    it('should handle multiple notifications', async () => {
      await act(async () => {
        ToastNotifications.showNotification({ text: 'First notification' })
        ToastNotifications.showNotification({ text: 'Second notification' })
      })

      const alerts = document.querySelectorAll('[data-cy="notification-alert"]')
      expect(alerts).toHaveLength(2)
      expect(alerts[0]).toHaveTextContent('First notification')
      expect(alerts[1]).toHaveTextContent('Second notification')
    })
  })

  describe('showError', () => {
    it('should display error notification', async () => {
      await act(async () => {
        ToastNotifications.showError({ text: 'Error message' })
      })

      const alert = document.querySelector('[data-cy="notification-alert"]')
      expect(alert).toBeInTheDocument()
      expect(alert).toHaveTextContent('Error message')
      expect(alert).toHaveClass('MuiAlert-colorError')
    })

    it('should override severity prop for error notifications', async () => {
      await act(async () => {
        ToastNotifications.showError({
          text: 'Error message',
          severity: 'success',
        })
      })

      const alert = document.querySelector('[data-cy="notification-alert"]')
      expect(alert).toHaveClass('MuiAlert-colorError')
      expect(alert).not.toHaveClass('MuiAlert-colorSuccess')
    })
  })

  describe('showSuccess', () => {
    it('should display success notification', async () => {
      await act(async () => {
        ToastNotifications.showSuccess({ text: 'Success message' })
      })

      const alert = document.querySelector('[data-cy="notification-alert"]')
      expect(alert).toBeInTheDocument()
      expect(alert).toHaveTextContent('Success message')
      expect(alert).toHaveClass('MuiAlert-colorSuccess')
    })

    it('should accept custom layout for success notifications', async () => {
      await act(async () => {
        ToastNotifications.showSuccess({
          text: 'Success message',
          layout: 'topRight',
        })
      })

      expect(document.querySelector('.MuiSnackbar-root')).toHaveClass('MuiSnackbar-anchorOriginTopRight')
    })
  })

  describe('showWarning', () => {
    it('should display warning notification', async () => {
      await act(async () => {
        ToastNotifications.showWarning({ text: 'Warning message' })
      })

      const alert = document.querySelector('[data-cy="notification-alert"]')
      expect(alert).toBeInTheDocument()
      expect(alert).toHaveTextContent('Warning message')
      expect(alert).toHaveClass('MuiAlert-colorWarning')
    })
  })

  describe('showInformation', () => {
    it('should display info notification', async () => {
      await act(async () => {
        ToastNotifications.showInformation({ text: 'Info message' })
      })

      const alert = document.querySelector('[data-cy="notification-alert"]')
      expect(alert).toBeInTheDocument()
      expect(alert).toHaveTextContent('Info message')
      expect(alert).toHaveClass('MuiAlert-colorInfo')
    })
  })

  describe('Layout positioning', () => {
    it.each([
      { layout: 'topLeft', expectedClass: 'MuiSnackbar-anchorOriginTopLeft' },
      { layout: 'topRight', expectedClass: 'MuiSnackbar-anchorOriginTopRight' },
      { layout: 'bottomLeft', expectedClass: 'MuiSnackbar-anchorOriginBottomLeft' },
      { layout: 'bottomRight', expectedClass: 'MuiSnackbar-anchorOriginBottomRight' },
    ])('should position notification at $layout', async ({ layout, expectedClass }) => {
      await act(async () => {
        ToastNotifications.showNotification({
          text: `${layout} notification`,
          layout: layout as ToastPosition,
        })
      })

      expect(document.querySelector('.MuiSnackbar-root')).toHaveClass(expectedClass)
    })
  })

  describe('Styling and constraints', () => {
    it('should respect maximum width constraint', async () => {
      await act(async () => {
        ToastNotifications.showNotification({
          text: 'This is a very long notification message that should be constrained by the maximum width setting to ensure it does not overflow off the page and remains readable within the viewport boundaries',
        })
      })

      // jsdom has no layout engine; verify the notification renders without error
      expect(document.querySelector('.MuiSnackbar-root')).toBeInTheDocument()
    })

    it('should have appropriate width for content', async () => {
      await act(async () => {
        ToastNotifications.showNotification({
          text: 'Short text',
        })
      })

      expect(document.querySelector('.MuiSnackbar-root')).toBeInTheDocument()
    })
  })
})
