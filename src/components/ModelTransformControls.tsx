import React, { useRef, useState, useCallback, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { TransformControls, Html } from '@react-three/drei';
import * as THREE from 'three';

interface ModelTransformControlsProps {
  model: any;
  onTransform?: (transform: { position: THREE.Vector3; rotation: THREE.Euler; scale: THREE.Vector3 }) => void;
  snapToGrid?: boolean;
  gridSize?: number;
  enabled?: boolean;
  modelRef?: React.RefObject<THREE.Mesh>;
  transformMode?: 'translate' | 'rotate' | 'scale';
}

const ModelTransformControls: React.FC<ModelTransformControlsProps> = ({
  model,
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
  const [rotationSnapDeg, setRotationSnapDeg] = React.useState<number>(5);
  const rotationSnap = THREE.MathUtils.degToRad(rotationSnapDeg);
  const translationSnap = useMemo(() => (snapToGrid ? gridSize : undefined), [snapToGrid, gridSize]);
  const overlayRef = useRef<THREE.Group>(null);
  const [activeAxis, setActiveAxis] = React.useState<'X' | 'Y' | 'Z' | null>(null);
  

  // Keep overlay glued to gizmo/object orientation and position
  useFrame(() => {
    if (!overlayRef.current || !modelRef?.current || !transformRef.current) return;
    const group = overlayRef.current;
    // Glue overlay to TransformControls (same space as gizmo rings)
    group.position.copy(transformRef.current.position);
    group.quaternion.copy(transformRef.current.quaternion);
    group.updateMatrixWorld();

    // Update dot positions by current model size (mirrors Drei ring radius behavior)
    const bbox = new THREE.Box3().setFromObject(modelRef.current);
    const size = bbox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const radius = Math.max(maxDim * 0.6, 0.001);

    // Children: 0=xDot, 1=yDot, 2=zDot
    const xDot = group.children[0] as THREE.Object3D | undefined;
    const yDot = group.children[1] as THREE.Object3D | undefined;
    const zDot = group.children[2] as THREE.Object3D | undefined;
    if (xDot) xDot.position.set(0, 0, radius); // X-axis ring (YZ plane) -> dot at +Z
    if (yDot) yDot.position.set(radius, 0, 0); // Y-axis ring (XZ plane) -> dot at +X
    if (zDot) zDot.position.set(0, radius, 0); // Z-axis ring (XY plane) -> dot at +Y

    // Highlight active axis
    const axis = (transformRef.current && transformRef.current.axis) || null;
    setActiveAxis(axis);
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
        // Anchor gizmo at model origin
        transformRef.current.position.copy(modelRef.current.position);
        transformRef.current.updateMatrixWorld(true);
      } catch (error) {
        console.error('Error updating transform controls:', error);
      }
    }
  }, [modelRef?.current, enabled, transformMode, rotationSnap, translationSnap]);

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
  const gizmoSize = Math.max(1.0, Math.min(1.8, baseSize * distanceScale));

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
        rotationSnap={rotationSnap}
        translationSnap={translationSnap}
      />

      {/* Overlay dots glued to rings (visual only) */}
      {transformMode === 'rotate' && (
        <group ref={overlayRef} frustumCulled={false}>
          <mesh>
            <sphereGeometry args={[Math.max(0.02, maxDimension * 0.012)]} />
            <meshBasicMaterial color="#ef4444" transparent opacity={activeAxis==='X'?0.95:0.6} depthTest={false} depthWrite={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[Math.max(0.02, maxDimension * 0.012)]} />
            <meshBasicMaterial color="#22c55e" transparent opacity={activeAxis==='Y'?0.95:0.6} depthTest={false} depthWrite={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[Math.max(0.02, maxDimension * 0.012)]} />
            <meshBasicMaterial color="#3b82f6" transparent opacity={activeAxis==='Z'?0.95:0.6} depthTest={false} depthWrite={false} />
          </mesh>
        </group>
      )}

      {/* No debug marker */}
    </>
  );
};

export default ModelTransformControls;
