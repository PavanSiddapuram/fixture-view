import React, { useRef, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { TransformControls, Html } from '@react-three/drei';
import * as THREE from 'three';

interface ModelTransformControlsProps {
  model: any;
  position: THREE.Vector3;
  onTransform?: (transform: { position: THREE.Vector3; rotation: THREE.Euler; scale: THREE.Vector3 }) => void;
  snapToGrid?: boolean;
  gridSize?: number;
  enabled?: boolean;
}

const ModelTransformControls: React.FC<ModelTransformControlsProps> = ({
  model,
  position,
  onTransform,
  snapToGrid = true,
  gridSize = 5,
  enabled = true
}) => {
  const transformRef = useRef<any>(null);
  const { camera, gl } = useThree();
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
  const lastTransformRef = useRef<{ position: THREE.Vector3; rotation: THREE.Euler; scale: THREE.Vector3 } | null>(null);

  // Use frame loop to detect transform changes
  useFrame(() => {
    if (transformRef.current && onTransform && model) {
      const transformControls = transformRef.current;
      const currentTransform = {
        position: transformControls.position.clone(),
        rotation: transformControls.rotation.clone(),
        scale: transformControls.scale.clone()
      };

      // Only call onTransform if transform has actually changed
      const lastTransform = lastTransformRef.current;
      if (!lastTransform ||
          !currentTransform.position.equals(lastTransform.position) ||
          !currentTransform.rotation.equals(lastTransform.rotation) ||
          !currentTransform.scale.equals(lastTransform.scale)) {

        lastTransformRef.current = currentTransform;

        // Apply transform to the model
        model.position.copy(currentTransform.position);
        model.rotation.copy(currentTransform.rotation);
        model.scale.copy(currentTransform.scale);

        onTransform(currentTransform);
      }
    }
  });

  // Handle mode changes
  const handleModeChange = useCallback((mode: 'translate' | 'rotate' | 'scale') => {
    setTransformMode(mode);
  }, []);

  return (
    <>
      {enabled && (
        <TransformControls
          ref={transformRef}
          position={position}
          mode={transformMode}
          onMouseDown={() => {
            gl.domElement.style.cursor = 'grab';
          }}
          onMouseUp={() => {
            gl.domElement.style.cursor = 'auto';
          }}
          showX
          showY
          showZ
          size={1}
        >
          {/* Render the model inside TransformControls as a child */}
          <mesh
            position={[0, 0, 0]}
            geometry={model.geometry}
            material={model.material}
          />
        </TransformControls>
      )}

      {/* Transform Mode Controls */}
      <Html position={[position.x, position.y + 2, position.z]}>
        <div className="flex gap-1 bg-black/80 text-white text-xs p-2 rounded">
          <button
            className={`px-2 py-1 rounded ${transformMode === 'translate' ? 'bg-blue-500' : 'bg-gray-600'}`}
            onClick={() => handleModeChange('translate')}
          >
            Move
          </button>
          <button
            className={`px-2 py-1 rounded ${transformMode === 'rotate' ? 'bg-blue-500' : 'bg-gray-600'}`}
            onClick={() => handleModeChange('rotate')}
          >
            Rotate
          </button>
          <button
            className={`px-2 py-1 rounded ${transformMode === 'scale' ? 'bg-blue-500' : 'bg-gray-600'}`}
            onClick={() => handleModeChange('scale')}
          >
            Scale
          </button>
        </div>
      </Html>
    </>
  );
};

export default ModelTransformControls;
