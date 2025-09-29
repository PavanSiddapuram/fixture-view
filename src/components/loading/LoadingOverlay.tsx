import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import LoadingIndicator from "./LoadingIndicator";

interface LoadingOverlayProps {
  isOpen: boolean;
  type: 'file-processing' | 'cad-operation' | 'boolean-operation' | 'stl-editing' | 'export' | 'import' | 'kernel';
  message?: string;
  progress?: number;
  details?: string;
  onCancel?: () => void;
  showCancel?: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isOpen,
  type,
  message,
  progress,
  details,
  onCancel,
  showCancel = false
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md border-0 bg-transparent shadow-none">
        <DialogHeader>
          <DialogTitle className="sr-only">Loading</DialogTitle>
          <DialogDescription className="sr-only">
            Processing operation in progress
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center">
          <LoadingIndicator
            type={type}
            message={message}
            progress={progress}
            details={details}
          />
        </div>

        {showCancel && onCancel && (
          <div className="flex justify-center mt-4">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LoadingOverlay;
