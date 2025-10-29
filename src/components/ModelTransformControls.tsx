import React, { useRef, useState, useCallback, useMemo } from 'react';
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
  const gizmoPositionRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const rotationSnap = THREE.MathUtils.degToRad(5);
  const translationSnap = useMemo(() => (snapToGrid ? gridSize : undefined), [snapToGrid, gridSize]);

  // Calculate optimal gizmo position on model surface
  const calculateOptimalGizmoPosition = useCallback((modelMesh: THREE.Mesh) => {
    if (!modelMesh) return new THREE.Vector3();

    const boundingBox = new THREE.Box3().setFromObject(modelMesh);
    const center = boundingBox.getCenter(new THREE.Vector3());
    const size = boundingBox.getSize(new THREE.Vector3());

    // Get camera direction to determine which face is most visible
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);

    // Find the face that's most facing the camera
    const faces = [
      { normal: new THREE.Vector3(1, 0, 0), offset: size.x / 2, axis: 'x' },
      { normal: new THREE.Vector3(-1, 0, 0), offset: -size.x / 2, axis: '-x' },
      { normal: new THREE.Vector3(0, 1, 0), offset: size.y / 2, axis: 'y' },
      { normal: new THREE.Vector3(0, -1, 0), offset: -size.y / 2, axis: '-y' },
      { normal: new THREE.Vector3(0, 0, 1), offset: size.z / 2, axis: 'z' },
      { normal: new THREE.Vector3(0, 0, -1), offset: -size.z / 2, axis: '-z' },
    ];

    // Score each face based on how much it faces the camera
    let bestFace = faces[0];
    let bestScore = -Infinity;

    faces.forEach(face => {
      const dot = face.normal.dot(cameraDirection);
      const score = dot; // Prefer faces that are more perpendicular to camera view

      if (score > bestScore) {
        bestScore = score;
        bestFace = face;
      }
    });

    // Position gizmo on the selected face
    const gizmoPosition = center.clone();
    switch (bestFace.axis) {
      case 'x':
        gizmoPosition.x += bestFace.offset;
        break;
      case '-x':
        gizmoPosition.x += bestFace.offset;
        break;
      case 'y':
        gizmoPosition.y += bestFace.offset;
        break;
      case '-y':
        gizmoPosition.y += bestFace.offset;
        break;
      case 'z':
        gizmoPosition.z += bestFace.offset;
        break;
      case '-z':
        gizmoPosition.z += bestFace.offset;
        break;
    }

    return gizmoPosition;
  }, [camera]);

  // Update gizmo position based on camera angle
  useFrame(() => {
    if (transformRef.current && modelRef?.current && enabled) {
      const optimalPosition = calculateOptimalGizmoPosition(modelRef.current);
      gizmoPositionRef.current.copy(optimalPosition);

      // Update transform controls position
      transformRef.current.position.copy(optimalPosition);
      transformRef.current.updateMatrixWorld(true);
    }
  });

  // Use frame loop to detect transform changes
  useFrame(() => {
    if (transformRef.current && onTransform && modelRef?.current) {
      const currentTransform = {
        position: modelRef.current.position.clone(),
        rotation: modelRef.current.rotation.clone(),
        scale: modelRef.current.scale.clone(),
      };

      const lastTransform = lastTransformRef.current;
      if (
        !lastTransform ||
        !currentTransform.position.equals(lastTransform.position) ||
        !currentTransform.rotation.equals(lastTransform.rotation) ||
        !currentTransform.scale.equals(lastTransform.scale)
      ) {
        lastTransformRef.current = {
          position: currentTransform.position.clone(),
          rotation: currentTransform.rotation.clone(),
          scale: currentTransform.scale.clone(),
        };

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
        transformRef.current.setRotationSnap(rotationSnap);
        if (translationSnap) {
          transformRef.current.setTranslationSnap(translationSnap);
        } else {
          transformRef.current.setTranslationSnap(undefined);
        }

        // Set initial position
        const initialPosition = calculateOptimalGizmoPosition(modelRef.current);
        gizmoPositionRef.current.copy(initialPosition);
        transformRef.current.position.copy(initialPosition);

        // Force update to ensure gizmos are visible
        transformRef.current.updateMatrixWorld(true);
      } catch (error) {
        console.error('Error updating transform controls:', error);
      }
    }
  }, [modelRef?.current, enabled, transformMode, calculateOptimalGizmoPosition]);

  // Early return if not enabled or no model ref
  if (!enabled || !modelRef?.current) {
    return null;
  }

  // Calculate appropriate gizmo size based on model dimensions and distance from camera
  const modelBoundingBox = new THREE.Box3().setFromObject(modelRef.current);
  const modelSize = modelBoundingBox.getSize(new THREE.Vector3());
  const maxDimension = Math.max(modelSize.x, modelSize.y, modelSize.z);

  // Calculate distance from camera to model center for size scaling
  const modelCenter = modelBoundingBox.getCenter(new THREE.Vector3());
  const cameraDistance = camera.position.distanceTo(modelCenter);

  // Dynamic size based on model dimensions and camera distance
  const baseSize = maxDimension * 0.15;
  const distanceScale = Math.max(0.5, Math.min(2.0, cameraDistance / 10)); // Scale based on distance
  const gizmoSize = Math.max(0.3, Math.min(1.5, baseSize * distanceScale));

  return (
    <>
      <TransformControls
        ref={transformRef}
        object={modelRef.current}
        mode={transformMode}
        onMouseDown={() => {
          gl.domElement.style.cursor = 'grabbing';
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
        size={gizmoSize}
        position={gizmoPositionRef.current}
        rotationSnap={rotationSnap}
        translationSnap={translationSnap}
      />

      {/* Optional: Add visual indicator for gizmo position */}
      {enabled && (
        <mesh position={gizmoPositionRef.current}>
          <sphereGeometry args={[0.02]} />
          <meshBasicMaterial color="red" />
        </mesh>
      )}
    </>
  );
};

export default ModelTransformControls;
