import React from 'react'
import { createRoot } from 'react-dom/client'
import { AlertColor, Alert, Snackbar, SnackbarOrigin, ThemeProvider } from '@mui/material'
import { muiThemeFix } from 'src/libs/muiThemeFix'

export type ToastPosition = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'

interface NotificationRequiredProps extends NotificationProps {
  severity: AlertColor
  text: string
  /** null disables auto-hide. */
  timeout: number | null
  layout: ToastPosition | SnackbarOrigin
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

interface NotificationProps {
  severity?: AlertColor
  text: string | React.ReactNode
  /** Milliseconds before auto-hide; null keeps the toast open. */
  timeout?: number | null
  layout?: ToastPosition | SnackbarOrigin
  /** Called when the toast closes, excluding clickaway events. */
  onDismiss?: () => void
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

const defaultProps: NotificationRequiredProps = {
  severity: 'info',
  text: 'default',
  timeout: 3500,
  layout: {
    vertical: 'bottom',
    horizontal: 'right',
  },
}

const convertToSnackbarOrigin = (layout: ToastPosition | SnackbarOrigin): SnackbarOrigin => {
  if (typeof layout === 'string') {
    const positions: Record<ToastPosition, SnackbarOrigin> = {
      topLeft: { vertical: 'top', horizontal: 'left' },
      topRight: { vertical: 'top', horizontal: 'right' },
      bottomLeft: { vertical: 'bottom', horizontal: 'left' },
      bottomRight: { vertical: 'bottom', horizontal: 'right' },
    }
    return positions[layout]
  }
  return layout
}

// Each notification owns a React root that only goes away once it is dismissed or auto-hides,
// so callers that outlive their notifications need a way to take them down.
const activeNotifications = new Set<() => void>()

export const dismissAllNotifications = (): void => {
  for (const teardown of activeNotifications) teardown()
}

export const ToastNotifications = {
  showNotification: ({
    severity = defaultProps.severity,
    text = defaultProps.text,
    timeout = defaultProps.timeout,
    layout = defaultProps.layout,
    onDismiss,
    ...props
  }: NotificationProps): void => {
    const snackbarLayout = convertToSnackbarOrigin(layout)
    const notificationRoot = document.createElement('div')
    document.body.appendChild(notificationRoot)
    const root = createRoot(notificationRoot)

    // Dismissing all notifications can beat the exit animation's timer to it, so leaving
    // the set is what makes a notification torn down, and doing it twice is a no-op.
    let exitTimeout: ReturnType<typeof setTimeout> | undefined
    const teardown = () => {
      if (!activeNotifications.delete(teardown)) return
      clearTimeout(exitTimeout)
      root.unmount()
      notificationRoot.remove()
    }
    activeNotifications.add(teardown)

    const NotificationComponent = (): React.JSX.Element => {
      const [open, setOpen] = React.useState(true)

      const handleClose = (_event: React.SyntheticEvent | Event, reason?: string): void => {
        if (reason === 'clickaway') return
        setOpen(false)
        onDismiss?.()
        exitTimeout = setTimeout(teardown, 300)
      }

      return (
        <ThemeProvider theme={muiThemeFix}>
          <Snackbar
            anchorOrigin={snackbarLayout}
            autoHideDuration={timeout}
            open={open}
            onClose={handleClose}
            {...props}
          >
            <Alert
              data-cy="notification-alert"
              onClose={handleClose}
              severity={severity}
              variant="filled"
              sx={{ width: '100%' }}
            >
              {text}
            </Alert>
          </Snackbar>
        </ThemeProvider>
      )
    }

    root.render(<NotificationComponent />)
  },
  showError: (props: NotificationProps): void => {
    return ToastNotifications.showNotification({
      ...props,
      severity: 'error',
    })
  },
  showSuccess: (props: NotificationProps): void => {
    return ToastNotifications.showNotification({
      ...props,
      severity: 'success',
    })
  },
  showWarning: (props: NotificationProps): void => {
    return ToastNotifications.showNotification({
      ...props,
      severity: 'warning',
    })
  },
  showInformation: (props: NotificationProps): void => {
    return ToastNotifications.showNotification({
      ...props,
      severity: 'info',
    })
  },
}
