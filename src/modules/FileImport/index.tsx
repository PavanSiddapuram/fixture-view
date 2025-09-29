import React, { useRef, useState, useCallback, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, RotateCcw, Box } from "lucide-react";
import FileDropzone from "./components/FileDropzone";
import { useFileProcessing } from "./hooks/useFileProcessing";
import { useViewer } from "./hooks/useViewer";
import UnitsDialog from "./components/UnitsDialog";
import LoadingOverlay from "@/components/loading/LoadingOverlay";
import { useLoadingManager } from "@/hooks/useLoadingManager";
import { ProcessedFile } from "./types";

interface FileImportProps {
  onFileLoaded: (file: ProcessedFile | null) => void;
  isInCollapsiblePanel?: boolean;
}

const FileImport: React.FC<FileImportProps> = ({ onFileLoaded, isInCollapsiblePanel = false }) => {
  const [currentFile, setCurrentFile] = useState<ProcessedFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUnitsDialogOpen, setIsUnitsDialogOpen] = useState(false);
  const [loadingState, setLoadingState] = useState<{
    isLoading: boolean;
    type?: 'file-processing' | 'model-loading';
    message?: string;
    progress?: number;
    details?: string;
  }>({ isLoading: false });

  const { startLoading, updateProgress, stopLoading } = useLoadingManager();
  const pendingFileRef = useRef<File | null>(null);
  const { processFile, isProcessing: fileProcessing, error: fileError, clearError } = useFileProcessing();

  // Remove viewer when in collapsible panel mode
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const viewer = isInCollapsiblePanel ? {
    isReady: false,
    addMesh: () => {},
    removeMesh: () => {},
    clearBaseplate: () => {},
    resetView: () => {}
  } : useViewer(viewerContainerRef);

  // Handle file selection
  const handleFileSelected = useCallback(async (file: File) => {
    console.log('File selected:', file.name);
    pendingFileRef.current = file;
    setIsUnitsDialogOpen(true);
  }, []);

  // Handle units selection
  const handleUnitsSelected = useCallback(async (units: string) => {
    if (!pendingFileRef.current) return;

    setIsUnitsDialogOpen(false);
    setIsProcessing(true);
    setError(null);

    try {
      const processedFile = await processFile(pendingFileRef.current, units);

      if (processedFile) {
        setCurrentFile(processedFile);
        onFileLoaded(processedFile);

        // Add mesh to viewer if not in collapsible panel
        if (!isInCollapsiblePanel && viewer.isReady) {
          viewer.addMesh(processedFile.mesh);
          viewer.resetView();
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process file';
      setError(errorMessage);
      console.error('Error processing file:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [processFile, onFileLoaded, isInCollapsiblePanel, viewer]);

  // Handle file reset
  const handleReset = useCallback(() => {
    setCurrentFile(null);
    setError(null);
    setIsProcessing(false);
    clearError();

    // Clear viewer if not in collapsible panel
    if (!isInCollapsiblePanel && viewer.isReady) {
      viewer.removeMesh();
      viewer.clearBaseplate();
      viewer.resetView();
    }

    onFileLoaded(null);
  }, [clearError, onFileLoaded, isInCollapsiblePanel, viewer]);

  // Listen for file picker events from app shell
  useEffect(() => {
    const handleFilePickerEvent = (e: CustomEvent) => {
      handleFileSelected(e.detail);
    };

    window.addEventListener('filepicker-selected', handleFilePickerEvent as EventListener);

    return () => {
      window.removeEventListener('filepicker-selected', handleFilePickerEvent as EventListener);
    };
  }, [handleFileSelected]);

  const hasContent = currentFile || isProcessing;

  return (
    <div className="h-full flex">
      {/* Left Panel - File Import UI (always shown when in collapsible panel) */}
      <div className={`${isInCollapsiblePanel ? 'w-full' : 'w-80'} border-r border-border/50 tech-glass flex flex-col`}>
        <div className="p-4 border-b border-border/50">
          <h2 className="font-tech font-semibold text-lg mb-1">File Import</h2>
          <p className="text-xs text-muted-foreground font-tech">
            Upload and view 3D models
          </p>
        </div>

        <div className="flex-1 p-4 space-y-4">
          {/* Error Display */}
          {error && (
            <Alert variant="destructive" className="font-tech">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          {/* File Upload */}
          <FileDropzone
            onFileSelected={handleFileSelected}
            isProcessing={isProcessing}
            className="min-h-[200px]"
          />

          {/* File Information */}
          {currentFile && (
            <Card className="tech-glass">
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-tech font-semibold text-sm flex items-center gap-2">
                    <Box className="w-4 h-4" />
                    File Details
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="tech-transition"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                </div>

                <div className="space-y-2 text-xs font-tech">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="truncate ml-2">{currentFile.metadata.name}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Triangles:</span>
                    <span>{currentFile.metadata.triangles.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size:</span>
                    <span>{(currentFile.metadata.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dimensions:</span>
                    <span className="text-right ml-2">
                      {currentFile.metadata.dimensions.x.toFixed(1)} × {' '}
                      {currentFile.metadata.dimensions.y.toFixed(1)} × {' '}
                      {currentFile.metadata.dimensions.z.toFixed(1)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Process time:</span>
                    <span>{currentFile.metadata.processingTime.toFixed(0)}ms</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Help Text */}
          {!hasContent && (
            <Card className="tech-glass">
              <div className="p-4 text-xs text-muted-foreground font-tech space-y-2">
                <p><strong>Getting Started:</strong></p>
                <ul className="space-y-1 ml-2 list-disc list-inside">
                  <li>Drag & drop STL files</li>
                  <li>Use mouse to orbit view</li>
                  <li>Scroll to zoom in/out</li>
                  <li>Try orientation presets in toolbar</li>
                </ul>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Right Panel - 3D Viewer (when not in collapsible panel) */}
      {!isInCollapsiblePanel && (
        <div className="flex-1 relative">
          <div
            ref={viewerContainerRef}
            className="absolute inset-0 w-full h-full"
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              position: 'relative'
            }}
          />

          {/* Debug info overlay */}
          <div className="absolute top-4 left-4 bg-black/50 text-white text-xs p-2 rounded z-50">
            <div>Viewer Ready: {viewer.isReady ? 'Yes' : 'No'}</div>
            <div>Container: {viewerContainerRef.current ? 'Available' : 'Not Available'}</div>
            <div>Processing: {isProcessing ? 'Yes' : 'No'}</div>
            <div>File: {currentFile?.metadata.name || 'None'}</div>
          </div>

          {/* Viewer Overlay Info */}
          {!hasContent && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center tech-glass p-6 rounded-lg border border-border/50">
                <h3 className="font-tech font-semibold text-lg mb-2">3D Viewer</h3>
                <p className="text-sm text-muted-foreground font-tech">
                  Upload a 3D model to start viewing
                </p>
              </div>
            </div>
          )}

          {/* Processing Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-background/20 backdrop-blur-sm flex items-center justify-center">
              <div className="tech-glass p-6 rounded-lg border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin-smooth" />
                  <span className="font-tech text-sm">Processing 3D model...</span>
                </div>
              </div>
            </div>
          )}

          {/* Loading Overlay */}
          <LoadingOverlay
            isOpen={loadingState.isLoading}
            type={loadingState.type || 'file-processing'}
            message={loadingState.message}
            progress={loadingState.progress}
            details={loadingState.details}
          />

          {/* Units Selection Dialog */}
          <UnitsDialog
            isOpen={isUnitsDialogOpen}
            onOpenChange={setIsUnitsDialogOpen}
            onUnitsSelect={handleUnitsSelected}
            fileName={pendingFileRef.current?.name || ''}
            fileSize={pendingFileRef.current ? `${(pendingFileRef.current.size / 1024 / 1024).toFixed(2)} MB` : ''}
          />
        </div>
      )}

      {/* Units Dialog (only when in collapsible panel) */}
      {isInCollapsiblePanel && (
        <UnitsDialog
          isOpen={isUnitsDialogOpen}
          onOpenChange={setIsUnitsDialogOpen}
          onUnitsSelect={handleUnitsSelected}
          fileName={pendingFileRef.current?.name || ''}
          fileSize={pendingFileRef.current ? `${(pendingFileRef.current.size / 1024 / 1024).toFixed(2)} MB` : ''}
        />
      )}
    </div>
  );
};

export default FileImport;
