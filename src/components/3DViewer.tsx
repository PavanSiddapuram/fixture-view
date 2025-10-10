import React, { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { ProcessedFile } from "@/modules/FileImport/types";
import TransformControlsUI from './TransformControlsUI';
import ThreeDScene from './3DScene';
import * as THREE from 'three';

interface ThreeDViewerProps {
  currentFile: ProcessedFile | null;
  isProcessing: boolean;
  onComponentPlaced?: (component: any, position: any) => void;
  transformEnabled?: boolean;
  onTransformToggle?: (enabled: boolean) => void;
}

const ThreeDViewer: React.FC<ThreeDViewerProps> = ({
  currentFile,
  isProcessing,
  onComponentPlaced,
  transformEnabled: externalTransformEnabled = false,
  onTransformToggle
}) => {
  // Internal transform state - can be overridden by external prop
  const [internalTransformEnabled, setInternalTransformEnabled] = useState(false);
  const [currentTransformMode, setCurrentTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');

  const transformEnabled = externalTransformEnabled !== undefined ? externalTransformEnabled : internalTransformEnabled;

  const handleTransformToggle = (enabled: boolean) => {
    if (externalTransformEnabled !== undefined && onTransformToggle) {
      // External control - notify parent
      console.log('Using external control, notifying parent');
      onTransformToggle(enabled);
    } else {
      // Internal control
      console.log('Using internal control, setting state to:', enabled);
      setInternalTransformEnabled(enabled);
    }

    if (enabled) {
      setCurrentTransformMode('translate');
    }
  };

  const [modelTransform, setModelTransform] = useState<{
    position: THREE.Vector3;
    rotation: THREE.Euler;
    scale: THREE.Vector3;
  }>({
    position: new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Euler(0, 0, 0),
    scale: new THREE.Vector3(1, 1, 1)
  });

  // Listen for external transform toggle events from header button
  const handleToggleTransform = useCallback(() => {
    console.log('Transform toggle event received in 3DViewer');
    handleTransformToggle(!transformEnabled);
  }, [transformEnabled]);

  React.useEffect(() => {
    window.addEventListener('toggle-transform-mode', handleToggleTransform);
    return () => window.removeEventListener('toggle-transform-mode', handleToggleTransform);
  }, [handleToggleTransform]);

  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{
          position: [3.5, 3.5, 3.5], // Isometric view by default
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        shadows
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        }}
        style={{ background: 'white' }}
      >
        <ThreeDScene
          currentFile={currentFile}
          transformEnabled={transformEnabled}
          currentTransformMode={currentTransformMode}
          modelTransform={modelTransform}
          setModelTransform={setModelTransform}
        />
      </Canvas>

      {/* Transform Controls UI - Center top of canvas when transform is enabled */}
      <TransformControlsUI
        transformEnabled={transformEnabled}
        currentTransformMode={currentTransformMode}
        onModeChange={setCurrentTransformMode}
      />

      {/* Processing overlay */}
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

      {/* Empty state */}
      {!currentFile && !isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center tech-glass p-6 rounded-lg border border-border/50">
            <h3 className="font-tech font-semibold text-lg mb-2">3D Viewer</h3>
            <p className="text-sm text-muted-foreground font-tech">
              Upload a 3D model to start designing fixtures
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreeDViewer;
