import React, { useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { ProcessedFile, FileMetadata } from '@/modules/FileImport/types';
import ComponentLibraryPanel from '@/components/ComponentLibraryPanel';
import { FixtureComponent } from '@/lib/fixtureComponents';
import { useViewer } from '@/modules/FileImport/hooks/useViewer';

interface FixtureDesignerProps {
  currentFile?: ProcessedFile | null;
  onFileLoaded?: (fileData: ProcessedFile) => void;
}

interface PlacedComponent {
  id: string;
  component: FixtureComponent;
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
}

const FixtureDesigner: React.FC<FixtureDesignerProps> = ({ currentFile, onFileLoaded }) => {
  const [placedComponents, setPlacedComponents] = useState<PlacedComponent[]>([]);
  const [isDragMode, setIsDragMode] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<FixtureComponent | null>(null);
  const [hoveredComponent, setHoveredComponent] = useState<PlacedComponent | null>(null);

  const sceneRef = useRef<THREE.Scene>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const viewerContainerRef = useRef<HTMLDivElement>(null);

  // Use the same viewer hook as FileImport
  const viewer = useViewer(viewerContainerRef);

  // Add the current file to the viewer when it changes
  React.useEffect(() => {
    if (currentFile && viewer.isReady) {
      viewer.addMesh(currentFile.mesh);
      viewer.resetView();
    }
  }, [currentFile, viewer]);

  // Handle component selection from library
  const handleComponentSelect = useCallback((component: FixtureComponent) => {
    setSelectedComponent(component);
    setIsDragMode(true);
  }, []);

  // Handle component drag from library
  const handleComponentDrag = useCallback((component: FixtureComponent) => {
    setSelectedComponent(component);
  }, []);

  // Handle mouse movement for drag placement
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragMode || !selectedComponent) return;

    const rect = event.target as HTMLElement;
    if (!rect.getBoundingClientRect) return;

    mouseRef.current.x = ((event.clientX - rect.getBoundingClientRect().left) / rect.offsetWidth) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.getBoundingClientRect().top) / rect.offsetHeight) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, new THREE.Camera());
    // TODO: Implement raycasting to find intersection point on baseplate
  }, [isDragMode, selectedComponent]);

  // Handle mouse click for component placement
  const handleMouseClick = useCallback((event: MouseEvent) => {
    if (!isDragMode || !selectedComponent) return;

    // TODO: Get intersection point with baseplate
    const intersectionPoint = new THREE.Vector3(0, 0, 0); // Placeholder

    // Create new mesh from component
    const mesh = new THREE.Mesh(selectedComponent.geometry, selectedComponent.material.clone());
    mesh.position.copy(intersectionPoint);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const placedComponent: PlacedComponent = {
      id: `${selectedComponent.id}-${Date.now()}`,
      component: selectedComponent,
      mesh,
      position: intersectionPoint.clone(),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(1, 1, 1)
    };

    setPlacedComponents(prev => [...prev, placedComponent]);
    setIsDragMode(false);
    setSelectedComponent(null);
  }, [isDragMode, selectedComponent]);

  // Handle component deletion
  const handleDeleteComponent = useCallback((componentId: string) => {
    setPlacedComponents(prev => prev.filter(c => c.id !== componentId));
  }, []);

  // Handle component selection for editing
  const handleComponentClick = useCallback((component: PlacedComponent) => {
    setHoveredComponent(component);
  }, []);

  return (
    <div className="h-full flex">
      {/* Left Panel - Component Library */}
      <ComponentLibraryPanel
        onComponentSelect={handleComponentSelect}
        onComponentDrag={handleComponentDrag}
        className="border-r border-border/50"
      />

      {/* Main 3D Viewport */}
      <div className="flex-1 relative">
        {/* 3D Viewer Container */}
        <div
          ref={viewerContainerRef}
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
        />

        {/* Viewer Overlay Info */}
        {!currentFile && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center tech-glass p-6 rounded-lg border border-border/50">
              <div className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <h3 className="font-tech font-semibold text-lg mb-2">Fixture Designer</h3>
              <p className="text-sm text-muted-foreground font-tech">
                Upload a 3D model to start designing
              </p>
            </div>
          </div>
        )}

        {/* Status indicators */}
        {isDragMode && selectedComponent && (
          <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm">
            Placing: {selectedComponent.name}
          </div>
        )}

        {hoveredComponent && (
          <div className="absolute top-4 right-4 bg-slate-800 text-white px-3 py-2 rounded-lg text-sm">
            {hoveredComponent.component.name}
          </div>
        )}
      </div>

      {/* Right Panel - Properties */}
      <div className="w-80 border-l border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-4">Properties</h3>

          {hoveredComponent ? (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-2">{hoveredComponent.component.name}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Position:</span>
                    <span>
                      {hoveredComponent.position.x.toFixed(1)}, {' '}
                      {hoveredComponent.position.y.toFixed(1)}, {' '}
                      {hoveredComponent.position.z.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rotation:</span>
                    <span>
                      {hoveredComponent.rotation.x.toFixed(1)}, {' '}
                      {hoveredComponent.rotation.y.toFixed(1)}, {' '}
                      {hoveredComponent.rotation.z.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Scale:</span>
                    <span>
                      {hoveredComponent.scale.x.toFixed(2)}, {' '}
                      {hoveredComponent.scale.y.toFixed(2)}, {' '}
                      {hoveredComponent.scale.z.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h5 className="font-medium text-sm mb-2">Parameters</h5>
                <div className="space-y-2 text-sm">
                  {Object.entries(hoveredComponent.component.parameters || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground">{key}:</span>
                      <span>{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleDeleteComponent(hoveredComponent.id)}
                className="w-full px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
              >
                Delete Component
              </button>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              <p>Select a component to view properties</p>
              {placedComponents.length === 0 && (
                <p className="mt-2">No components placed yet</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FixtureDesigner;
