import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BasePlateProps {
  type: 'rectangular' | 'circular';
  width?: number;
  height?: number;
  depth?: number;
  radius?: number;
  position?: THREE.Vector3;
  material?: 'metal' | 'wood' | 'plastic';
  onSelect?: () => void;
  selected?: boolean;
}

const BasePlate: React.FC<BasePlateProps> = ({
  type,
  width = 100,
  height = 100,
  depth = 10,
  radius = 50,
  position = new THREE.Vector3(0, 0, 0),
  material = 'metal',
  onSelect,
  selected = false
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Material properties based on type
  const materialProps = useMemo(() => {
    switch (material) {
      case 'metal':
        return {
          color: 0x888888,
          metalness: 0.8,
          roughness: 0.2,
          emissive: 0x222222
        };
      case 'wood':
        return {
          color: 0x8B4513,
          metalness: 0.1,
          roughness: 0.8
        };
      case 'plastic':
        return {
          color: 0x333333,
          metalness: 0.0,
          roughness: 0.3
        };
      default:
        return {
          color: 0x888888,
          metalness: 0.5,
          roughness: 0.5
        };
    }
  }, [material]);

  // Create geometry based on type
  const geometry = useMemo(() => {
    if (type === 'circular') {
      return new THREE.CylinderGeometry(radius, radius, depth, 32);
    } else {
      return new THREE.BoxGeometry(width, depth, height);
    }
  }, [type, width, height, depth, radius]);

  // Update geometry when props change
  React.useEffect(() => {
    if (meshRef.current) {
      meshRef.current.geometry.dispose();
      if (type === 'circular') {
        meshRef.current.geometry = new THREE.CylinderGeometry(radius, radius, depth, 32);
      } else {
        meshRef.current.geometry = new THREE.BoxGeometry(width, depth, height);
      }
    }
  }, [type, width, height, depth, radius]);

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={onSelect}
      geometry={geometry}
      material={new THREE.MeshStandardMaterial(materialProps)}
      receiveShadow
      castShadow
    />
  );
};

export default BasePlate;
