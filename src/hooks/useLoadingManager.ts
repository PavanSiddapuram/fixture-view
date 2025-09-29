import { useState, useCallback } from 'react';

export type LoadingType = 'file-processing' | 'cad-operation' | 'boolean-operation' | 'stl-editing' | 'export' | 'import' | 'kernel';

interface LoadingState {
  isLoading: boolean;
  type: LoadingType | null;
  message: string;
  progress: number;
  details: string;
  showCancel: boolean;
}

interface LoadingManagerReturn {
  loadingState: LoadingState;
  startLoading: (type: LoadingType, message?: string, showCancel?: boolean) => void;
  updateProgress: (progress: number, details?: string) => void;
  updateMessage: (message: string, details?: string) => void;
  stopLoading: () => void;
  setCancellable: (cancellable: boolean) => void;
}

export const useLoadingManager = (): LoadingManagerReturn => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    type: null,
    message: '',
    progress: 0,
    details: '',
    showCancel: false
  });

  const startLoading = useCallback((type: LoadingType, message = '', showCancel = false) => {
    setLoadingState({
      isLoading: true,
      type,
      message: message || getDefaultMessage(type),
      progress: 0,
      details: '',
      showCancel
    });
  }, []);

  const updateProgress = useCallback((progress: number, details = '') => {
    setLoadingState(prev => ({
      ...prev,
      progress: Math.min(Math.max(progress, 0), 100),
      details
    }));
  }, []);

  const updateMessage = useCallback((message: string, details = '') => {
    setLoadingState(prev => ({
      ...prev,
      message,
      details
    }));
  }, []);

  const stopLoading = useCallback(() => {
    setLoadingState({
      isLoading: false,
      type: null,
      message: '',
      progress: 0,
      details: '',
      showCancel: false
    });
  }, []);

  const setCancellable = useCallback((cancellable: boolean) => {
    setLoadingState(prev => ({
      ...prev,
      showCancel: cancellable
    }));
  }, []);

  return {
    loadingState,
    startLoading,
    updateProgress,
    updateMessage,
    stopLoading,
    setCancellable
  };
};

const getDefaultMessage = (type: LoadingType): string => {
  switch (type) {
    case 'file-processing':
      return 'Processing 3D model...';
    case 'cad-operation':
      return 'Executing CAD operation...';
    case 'boolean-operation':
      return 'Performing boolean operation...';
    case 'stl-editing':
      return 'Applying STL transformations...';
    case 'export':
      return 'Preparing export...';
    case 'import':
      return 'Loading model file...';
    case 'kernel':
      return 'Initializing CAD kernel...';
    default:
      return 'Processing...';
  }
};
