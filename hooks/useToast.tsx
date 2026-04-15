// Toast Hook
import { useState, useCallback } from 'react';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'info',
    visible: false,
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, visible: true });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const showSuccess = useCallback((message: string) => showToast(message, 'success'), [showToast]);

  const showError = useCallback((message: string) => showToast(message, 'error'), [showToast]);

  const showInfo = useCallback((message: string) => showToast(message, 'info'), [showToast]);

  return {
    toast,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showInfo,
  };
};
