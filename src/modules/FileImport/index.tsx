import { useRef, useState, useCallback, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, RotateCcw, Box } from "lucide-react";
import FileDropzone from "./components/FileDropzone";
import { useFileProcessing } from "./hooks/useFileProcessing";
import { useViewer } from "./hooks/useViewer";
import { ProcessedFile } from "./types";

interface FileImportProps {
  onFileLoaded?: (fileData: ProcessedFile) => void;
}

const FileImport = ({ onFileLoaded }: FileImportProps) => {
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const [currentFile, setCurrentFile] = useState<ProcessedFile | null>(null);
  
  const { processFile, isProcessing, error, clearError } = useFileProcessing();
  const viewer = useViewer(viewerContainerRef);

  // Handle file selection
  const handleFileSelected = useCallback(async (file: File) => {
    try {
      clearError();
      const processedFile = await processFile(file);
      
      // Clear previous meshes
      if (currentFile) {
        viewer.removeMesh(currentFile.mesh);
      }
      
      // Add new mesh and fit view
      viewer.addMesh(processedFile.mesh);
      viewer.resetView();
      
      setCurrentFile(processedFile);
      onFileLoaded?.(processedFile);
      
    } catch (err) {
      console.error('File processing failed:', err);
    }
  }, [processFile, clearError, viewer, currentFile, onFileLoaded]);

  // Handle reset
  const handleReset = useCallback(() => {
    if (currentFile) {
      viewer.removeMesh(currentFile.mesh);
      setCurrentFile(null);
      clearError();
    }
  }, [currentFile, viewer, clearError]);

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
      {/* Left Panel - File Import */}
      <div className="w-80 border-r border-border/50 tech-glass flex flex-col">
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

      {/* Right Panel - 3D Viewer */}
      <div className="flex-1 relative viewer-container">
        <div 
          ref={viewerContainerRef} 
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
        />
        
        {/* Viewer Overlay Info */}
        {!hasContent && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center tech-glass p-6 rounded-lg border border-border/50">
              <Box className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
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
      </div>
    </div>
  );
};

export default FileImport;