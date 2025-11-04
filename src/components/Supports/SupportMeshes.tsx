import React from 'react';
import * as THREE from 'three';
import { AnySupport } from './types';

interface SupportMeshProps {
  support: AnySupport;
  preview?: boolean;
}

const materialFor = (preview?: boolean) =>
  new THREE.MeshStandardMaterial({
    color: preview ? 0x3b82f6 : 0x6b7280,
    transparent: preview,
    opacity: preview ? 0.5 : 1,
    roughness: 0.6,
    metalness: 0.1
  });

const SupportMesh: React.FC<SupportMeshProps> = ({ support, preview }) => {
  const { type, height, center } = support as any;
  const rotY = (support as any).rotationZ ?? 0; // orientation for rectangular/custom
  const yCenter = height / 2; // base at y=0, center at height/2

  if (type === 'cylindrical') {
    const { radius } = support as any;
    return (
      <mesh position={[center.x, yCenter, center.y]} material={materialFor(preview)}>
        <cylinderGeometry args={[radius, radius, height, 48]} />
      </mesh>
    );
  }

  if (type === 'rectangular') {
    const { width, depth, cornerRadius = 0 } = support as any;
    if (cornerRadius <= 0) {
      return (
        <mesh position={[center.x, yCenter, center.y]} rotation={[0, rotY, 0]} material={materialFor(preview)}>
          <boxGeometry args={[width, height, depth]} />
        </mesh>
      );
    }
    // Approximate rounded corners by beveled box using BoxGeometry + small segments
    return (
      <mesh position={[center.x, yCenter, center.y]} rotation={[0, rotY, 0]} material={materialFor(preview)}>
        <boxGeometry args={[width, height, depth, 1, 1, 1]} />
      </mesh>
    );
  }

  if (type === 'conical') {
    const { baseRadius, topRadius } = support as any;
    return (
      <mesh position={[center.x, yCenter, center.y]} material={materialFor(preview)}>
        <cylinderGeometry args={[topRadius, baseRadius, height, 48]} />
      </mesh>
    );
  }

  if (type === 'custom') {
    const { polygon } = support as any;
    const shape = new THREE.Shape();
    if (polygon.length > 0) {
      shape.moveTo(polygon[0][0], polygon[0][1]);
      for (let i = 1; i < polygon.length; i++) shape.lineTo(polygon[i][0], polygon[i][1]);
      shape.closePath();
    }
    const geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
    geo.center();
    // Move so base is at y=0
    geo.translate(0, height / 2, 0);
    return (
      <mesh position={[center.x, 0, center.y]} rotation={[0, rotY, 0]} geometry={geo} material={materialFor(preview)} />
    );
  }

  return null;
};

export default SupportMesh;

