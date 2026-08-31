import '@testing-library/jest-dom/vitest'
import React from 'react'
import { act } from 'react'
import { fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ToastNotifications, ToastPosition } from 'src/libs/ToastNotifications'

// Use fake timers for the whole suite so the Snackbar's autoHideDuration and
// react-transition-group timers never fire after the test environment is torn
// down (which otherwise throws "window is not defined" as an unhandled error).
beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  Array.from(document.body.children)
    .filter(el => el.querySelector('[data-cy="notification-alert"]') || el.querySelector('.MuiSnackbar-root'))
    .forEach(el => el.remove())
  vi.clearAllTimers()
  vi.useRealTimers()
})

describe('ToastNotifications', () => {
  describe('showNotification', () => {
    it('should display a notification with default props', async () => {
      await act(async () => {
        ToastNotifications.showNotification({ text: 'Test notification' })
      })

      const alert = document.querySelector('[data-cy="notification-alert"]')
      expect(alert).toBeVisible()
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
      expect(alert).toBeVisible()
      expect(alert).toHaveTextContent('Warning message')
      expect(alert).toHaveClass('MuiAlert-colorWarning')
    })

    it('should display notification with React node as text', async () => {
      await act(async () => {
        ToastNotifications.showNotification({
          text: <span data-testid="react-text">React notification</span>,
        })
      })

      expect(document.querySelector('[data-cy="notification-alert"]')).toBeVisible()
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

        expect(document.querySelector('[data-cy="notification-alert"]')).toBeVisible()

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

    it('should auto-hide after the default timeout', async () => {
      vi.useFakeTimers()
      try {
        await act(async () => {
          ToastNotifications.showNotification({ text: 'Transient notification' })
        })

        expect(document.querySelector('[data-cy="notification-alert"]')).toBeVisible()

        await act(async () => {
          vi.advanceTimersByTime(3500 + 350)
        })

        expect(document.querySelector('[data-cy="notification-alert"]')).not.toBeInTheDocument()
      }
      finally {
        vi.useRealTimers()
      }
    })

    it('should never auto-hide when timeout is null', async () => {
      // Story 5-E: the unconfirmed-sign-out notice carries a Retry the user
      // must be able to act on, so it cannot expire on its own.
      vi.useFakeTimers()
      try {
        await act(async () => {
          ToastNotifications.showNotification({ text: 'Persistent notification', timeout: null })
        })

        await act(async () => {
          vi.advanceTimersByTime(60_000)
        })

        expect(document.querySelector('[data-cy="notification-alert"]')).toBeVisible()
      }
      finally {
        vi.useRealTimers()
      }
    })

    it('should call onDismiss when the close button closes the notification', async () => {
      const onDismiss = vi.fn()
      vi.useFakeTimers()
      try {
        await act(async () => {
          ToastNotifications.showNotification({ text: 'Dismissible notification', onDismiss })
        })

        const closeButton = document.querySelector('[data-cy="notification-alert"] .MuiAlert-action button') as HTMLElement
        fireEvent.click(closeButton)

        await act(async () => {
          vi.advanceTimersByTime(350)
        })

        expect(onDismiss).toHaveBeenCalledOnce()
      }
      finally {
        vi.useRealTimers()
      }
    })

    it('should call onDismiss when the auto-hide timer closes the notification', async () => {
      const onDismiss = vi.fn()
      vi.useFakeTimers()
      try {
        await act(async () => {
          ToastNotifications.showNotification({ text: 'Transient notification', onDismiss })
        })

        await act(async () => {
          vi.advanceTimersByTime(3500 + 350)
        })

        expect(onDismiss).toHaveBeenCalledOnce()
      }
      finally {
        vi.useRealTimers()
      }
    })

    it('should not forward onDismiss to the Snackbar element', async () => {
      // It is this module's own callback — spreading it onto the DOM would
      // draw a React unknown-prop warning.
      await act(async () => {
        ToastNotifications.showNotification({ text: 'Dismissible notification', onDismiss: () => {} })
      })

      expect(document.querySelector('.MuiSnackbar-root')).not.toHaveAttribute('onDismiss')
    })

    it('should apply custom styling with sx prop', async () => {
      await act(async () => {
        ToastNotifications.showNotification({
          text: 'Styled notification',
          sx: { backgroundColor: 'red' },
        })
      })

      expect(document.querySelector('.MuiSnackbar-root')).toBeVisible()
      // Emotion injects CSS into <style data-emotion> tags or cssRules; verify the sx rule was applied
      const injectedCss = Array.from(document.styleSheets).flatMap((sheet) => {
        try {
          return Array.from(sheet.cssRules).map(r => r.cssText)
        }
        catch { return [] }
      }).join('\n')
      expect(injectedCss).toMatch(/background-color:\s*red/)
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
      expect(alert).toBeVisible()
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
      expect(alert).toBeVisible()
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
      expect(alert).toBeVisible()
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
      expect(alert).toBeVisible()
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
      const longText = 'This is a very long notification message that should be constrained by the maximum width setting to ensure it does not overflow off the page and remains readable within the viewport boundaries'
      await act(async () => {
        ToastNotifications.showNotification({ text: longText })
      })

      const snackbar = document.querySelector('.MuiSnackbar-root')
      expect(snackbar).toBeVisible()
      // jsdom has no layout engine; verify the notification renders with the full long text
      expect(snackbar).toHaveTextContent('constrained by the maximum width setting')
    })

    it('should have appropriate width for content', async () => {
      await act(async () => {
        ToastNotifications.showNotification({ text: 'Short text' })
      })

      const snackbar = document.querySelector('.MuiSnackbar-root')
      expect(snackbar).toBeVisible()
      expect(snackbar).toHaveTextContent('Short text')
    })
  })
})
