import React, { useRef, useEffect } from 'react';
import { useViewer } from '@/modules/FileImport/hooks/useViewer';
import { ProcessedFile } from '@/modules/FileImport/types';

interface Viewer3DProps {
  currentFile: ProcessedFile | null;
  isProcessing: boolean;
}

const Viewer3D: React.FC<Viewer3DProps> = ({ currentFile, isProcessing }) => {
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const viewer = useViewer(viewerContainerRef);

  // Add mesh when file is loaded
  useEffect(() => {
    if (currentFile && viewer.isReady && viewerContainerRef.current) {
      // The viewer will handle adding the mesh internally
      console.log('File loaded in viewer:', currentFile.metadata.name);
    }
  }, [currentFile, viewer.isReady]);

  return (
    <div className="flex-1 relative viewer-container">
      <div
        ref={viewerContainerRef}
        className="absolute inset-0 w-full h-full"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          position: 'relative'
        }}
      />

      {/* Debug info overlay removed for clean UI */}

      {/* Viewer Overlay Info */}
      {!currentFile && !isProcessing && (
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
    </div>
  );
};

export default Viewer3D;
