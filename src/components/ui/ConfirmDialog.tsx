import React from 'react';
import { AlertTriangle, CheckCircle, XCircle, Info, HelpCircle } from 'lucide-react';
import { Button } from './Button';

export type ConfirmType = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: ConfirmType;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'warning',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <XCircle className="w-12 h-12 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-12 h-12 text-yellow-500" />;
      case 'info':
        return <Info className="w-12 h-12 text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-12 h-12 text-green-500" />;
      default:
        return <HelpCircle className="w-12 h-12 text-gray-500" />;
    }
  };

  const getConfirmButtonColor = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
      default:
        return 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500';
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
        <div className="p-6">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          
          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            {title}
          </h3>
          
          {/* Message */}
          <p className="text-sm text-gray-600 text-center mb-6 leading-relaxed">
            {message}
          </p>
          
          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 h-11 text-base font-medium"
            >
              {cancelText}
            </Button>
            <Button
              onClick={onConfirm}
              loading={loading}
              disabled={loading}
              className={`flex-1 h-11 text-base font-medium text-white ${getConfirmButtonColor()}`}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Confirmation Manager
interface ConfirmState {
  id: string;
  title: string;
  message: string;
  type?: ConfirmType;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

class ConfirmManager {
  private confirmState: ConfirmState | null = null;
  private listeners: ((state: ConfirmState | null) => void)[] = [];

  subscribe(listener: (state: ConfirmState | null) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.confirmState));
  }

  confirm(options: {
    title: string;
    message: string;
    type?: ConfirmType;
    confirmText?: string;
    cancelText?: string;
  }): Promise<boolean> {
    return new Promise((resolve) => {
      const id = Math.random().toString(36).substr(2, 9);
      
      this.confirmState = {
        id,
        ...options,
        onConfirm: () => {
          this.confirmState = null;
          this.notify();
          resolve(true);
        },
        onCancel: () => {
          this.confirmState = null;
          this.notify();
          resolve(false);
        }
      };
      
      this.notify();
    });
  }
}

export const confirmManager = new ConfirmManager();

// Confirmation Container Component
export const ConfirmContainer: React.FC = () => {
  const [confirmState, setConfirmState] = React.useState<ConfirmState | null>(null);

  React.useEffect(() => {
    const unsubscribe = confirmManager.subscribe(setConfirmState);
    return unsubscribe;
  }, []);

  if (!confirmState) return null;

  return (
    <ConfirmDialog
      isOpen={true}
      onClose={confirmState.onCancel}
      onConfirm={confirmState.onConfirm}
      title={confirmState.title}
      message={confirmState.message}
      type={confirmState.type}
      confirmText={confirmState.confirmText}
      cancelText={confirmState.cancelText}
    />
  );
};
