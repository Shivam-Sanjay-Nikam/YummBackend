import { notificationManager } from '../components/ui/Notification';

export const showToast = {
  success: (message: string, title?: string) => notificationManager.success(message, title),
  error: (message: string, title?: string) => notificationManager.error(message, title),
  warning: (message: string, title?: string) => notificationManager.warning(message, title),
  info: (message: string, title?: string) => notificationManager.info(message, title),
  loading: (message: string, title?: string) => notificationManager.loading(message, title),
};

// For backward compatibility
export const toast = {
  success: (message: string) => notificationManager.success(message),
  error: (message: string) => notificationManager.error(message),
  loading: (message: string, options?: { id?: string }) => {
    const id = notificationManager.loading(message);
    return { id };
  },
  dismiss: (id: string) => notificationManager.remove(id),
};

export default toast;
