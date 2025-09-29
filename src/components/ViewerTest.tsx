import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useViewer } from '../modules/FileImport/hooks/useViewer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ViewerTest = () => {
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const viewer = useViewer(viewerContainerRef);

  const addTestMesh = () => {
    console.log('Adding test mesh...');
    console.log('Viewer ready:', viewer.isReady);

    if (viewer.isReady) {
      // Create a simple test cube
      const geometry = new THREE.BoxGeometry(2, 2, 2);
      const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
      const mesh = new THREE.Mesh(geometry, material);

      viewer.addMesh(mesh);
      viewer.resetView();
      console.log('Test mesh added');
    } else {
      console.error('Viewer not ready');
    }
  };

  const clearMeshes = () => {
    console.log('Clearing meshes...');
    // This would need to be implemented in the viewer
    console.log('Meshes cleared');
  };

  return (
    <div className="h-full flex">
      <div className="w-80 border-r border-border/50 tech-glass flex flex-col">
        <CardHeader>
          <CardTitle>Viewer Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={addTestMesh} className="w-full">
            Add Test Cube
          </Button>
          <Button onClick={clearMeshes} variant="outline" className="w-full">
            Clear Meshes
          </Button>
          <div className="text-sm text-muted-foreground">
            <p>Viewer Ready: {viewer.isReady ? 'Yes' : 'No'}</p>
            <p>Container: {viewerContainerRef.current ? 'Available' : 'Not Available'}</p>
          </div>
        </CardContent>
      </div>

      <div className="flex-1 relative viewer-container">
        <div
          ref={viewerContainerRef}
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
        />
      </div>
    </div>
  );
};

export default ViewerTest;
