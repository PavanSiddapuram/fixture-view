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
  modelRef?: React.RefObject<THREE.Mesh>;
  transformMode?: 'translate' | 'rotate' | 'scale';
}

const ModelTransformControls: React.FC<ModelTransformControlsProps> = ({
  model,
  position,
  onTransform,
  snapToGrid = true,
  gridSize = 5,
  enabled = true,
  modelRef,
  transformMode = 'translate'
}) => {
  const transformRef = useRef<any>(null);
  const { camera, gl } = useThree();
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
          !currentTransform.position.equals(lastTransform?.position) ||
          !currentTransform.rotation.equals(lastTransform?.rotation) ||
          !currentTransform.scale.equals(lastTransform?.scale)) {

        lastTransformRef.current = currentTransform;

        // Apply transform to the model
        model.position.copy(currentTransform.position);
        model.rotation.copy(currentTransform.rotation);
        model.scale.copy(currentTransform.scale);

        onTransform(currentTransform);
      }
    }
  });

  // Handle model ref changes and mode updates
  React.useEffect(() => {
    if (transformRef.current && enabled && modelRef?.current) {
      try {
        // Detach first to avoid conflicts
        if (transformRef.current.object) {
          transformRef.current.detach();
        }

        transformRef.current.setMode(transformMode);
        transformRef.current.attach(modelRef.current);

        // Force update to ensure gizmos are visible
        transformRef.current.updateMatrixWorld(true);
      } catch (error) {
        console.error('Error updating transform controls:', error);
      }
    }
  }, [modelRef?.current, enabled, transformMode]);

  // Early return if not enabled or no model ref
  if (!enabled || !modelRef?.current) {
    return null;
  }

  // Calculate appropriate gizmo size based on model dimensions
  const modelBoundingBox = new THREE.Box3().setFromObject(modelRef.current);
  const modelSize = modelBoundingBox.getSize(new THREE.Vector3());
  const maxDimension = Math.max(modelSize.x, modelSize.y, modelSize.z);
  const gizmoSize = Math.max(0.3, Math.min(1.0, maxDimension * 0.15)); // Scale between 0.3 and 1.0

  // Get model center for proper gizmo positioning
  const modelCenter = modelBoundingBox.getCenter(new THREE.Vector3());

  return (
    <>
      <TransformControls
        ref={transformRef}
        object={modelRef.current}
        mode={transformMode}
        onMouseDown={() => {
          gl.domElement.style.cursor = 'grab';
          // Disable orbit controls when transform controls are active
          window.dispatchEvent(new CustomEvent('disable-orbit-controls', { detail: { disabled: true } }));
        }}
        onMouseUp={() => {
          gl.domElement.style.cursor = 'auto';
          // Re-enable orbit controls when transform controls are released
          window.dispatchEvent(new CustomEvent('disable-orbit-controls', { detail: { disabled: false } }));
        }}
        onChange={() => {
          // Update model transform state when controls change
          if (transformRef.current && onTransform && model) {
            const currentTransform = {
              position: transformRef.current.position.clone(),
              rotation: transformRef.current.rotation.clone(),
              scale: transformRef.current.scale.clone()
            };
            onTransform(currentTransform);
          }
        }}
        showX
        showY
        showZ
        size={gizmoSize}  // Dynamic size based on model dimensions
        position={modelCenter}  // Position at model center for better visibility
      />

    </>
  );
};

export default ModelTransformControls;
