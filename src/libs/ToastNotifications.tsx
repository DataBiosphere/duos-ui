import React from 'react';
import { createRoot } from 'react-dom/client';
import { AlertColor, Alert, Snackbar, SnackbarOrigin } from '@mui/material';

type ToastPosition = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

interface NotificationRequiredProps extends NotificationProps {
  severity: AlertColor;
  text: string;
  timeout: number;
  layout: ToastPosition | SnackbarOrigin;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface NotificationProps {
  severity?: AlertColor;
  text: string;
  timeout?: number;
  layout?: ToastPosition | SnackbarOrigin;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

const defaultProps: NotificationRequiredProps = {
  severity: 'info',
  text: 'default',
  timeout: 3500,
  layout: {
    vertical: 'bottom',
    horizontal: 'right'
  }
};

const convertToSnackbarOrigin = (layout: ToastPosition | SnackbarOrigin): SnackbarOrigin => {
  if (typeof layout === 'string') {
    const positions: Record<ToastPosition, SnackbarOrigin> = {
      topLeft: { vertical: 'top', horizontal: 'left' },
      topRight: { vertical: 'top', horizontal: 'right' },
      bottomLeft: { vertical: 'bottom', horizontal: 'left' },
      bottomRight: { vertical: 'bottom', horizontal: 'right' }
    };
    return positions[layout];
  }
  return layout;
};

export const ToastNotifications = {
  showNotification: ({
    severity = defaultProps.severity,
    text = defaultProps.text,
    timeout = defaultProps.timeout,
    layout = defaultProps.layout,
    ...props
  }: NotificationProps): void => {
    const snackbarLayout = convertToSnackbarOrigin(layout);
    const notificationRoot = document.createElement('div');
    document.body.appendChild(notificationRoot);
    const root = createRoot(notificationRoot);

    const NotificationComponent = (): React.JSX.Element => {
      const [open, setOpen] = React.useState(true);

      const handleClose = (_event: React.SyntheticEvent | Event, reason?: string): void => {
        if (reason === 'clickaway') return;
        setOpen(false);
        setTimeout(() => {
          root.unmount();
          notificationRoot.remove();
        }, 300);
      };

      return (
        <Snackbar
          anchorOrigin={snackbarLayout}
          autoHideDuration={timeout}
          open={open}
          onClose={handleClose}
          // these transforms are required because the rule `html { font-size: 10px }` exists in bootstrap_replacement.css
          sx={{ transform: 'scale(1.5)', transformOrigin: `${snackbarLayout.vertical} ${snackbarLayout.horizontal}` }}
          {...props}
        >
          <Alert
            data-cy='notification-alert'
            onClose={handleClose}
            severity={severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {text}
          </Alert>
        </Snackbar>
      );
    };

    root.render(<NotificationComponent />);
  },
  showError: (props: NotificationProps): void => {
    return ToastNotifications.showNotification({
      ...props,
      severity: 'error',
    });
  },
  showSuccess: (props: NotificationProps): void => {
    return ToastNotifications.showNotification({
      ...props,
      severity: 'success',
    });
  },
  showWarning: (props: NotificationProps): void => {
    return ToastNotifications.showNotification({
      ...props,
      severity: 'warning',
    });
  },
  showInformation: (props: NotificationProps): void => {
    return ToastNotifications.showNotification({
      ...props,
      severity: 'info',
    });
  }
};
