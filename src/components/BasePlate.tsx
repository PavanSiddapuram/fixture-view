import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BasePlateProps {
  type: 'rectangular' | 'circular' | 'convex-hull' | 'cylindrical' | 'v-block' | 'hexagonal' | 'perforated-panel' | 'metal-wooden-plate';
  width?: number;
  height?: number;
  depth?: number;
  radius?: number;
  position?: THREE.Vector3;
  material?: 'metal' | 'wood' | 'plastic';
  onSelect?: () => void;
  selected?: boolean;
  modelGeometry?: THREE.BufferGeometry; // For convex hull around model
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
  selected = false,
  modelGeometry
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Material properties based on type
  const materialProps = useMemo(() => {
    switch (material) {
      case 'metal':
        return {
          color: selected ? 0x0066cc : 0x888888,
          metalness: 0.8,
          roughness: 0.2,
          emissive: selected ? 0x001133 : 0x222222
        };
      case 'wood':
        return {
          color: selected ? 0xcc6600 : 0x8B4513,
          metalness: 0.1,
          roughness: 0.8
        };
      case 'plastic':
        return {
          color: selected ? 0x66cc00 : 0x333333,
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
  }, [material, selected]);

  // Create geometry based on type
  const geometry = useMemo(() => {
    switch (type) {
      case 'circular':
      case 'cylindrical':
        return new THREE.CylinderGeometry(radius, radius, depth, 32);

      case 'hexagonal':
        // Create hexagonal prism geometry
        const hexShape = new THREE.Shape();
        const hexRadius = Math.min(width, height) / 2;
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          const x = hexRadius * Math.cos(angle);
          const y = hexRadius * Math.sin(angle);
          if (i === 0) hexShape.moveTo(x, y);
          else hexShape.lineTo(x, y);
        }
        const hexGeometry = new THREE.ExtrudeGeometry(hexShape, {
          depth: depth,
          bevelEnabled: false
        });
        return hexGeometry;

      case 'v-block':
        // Create V-shaped geometry for supporting round parts
        const vShape = new THREE.Shape();
        const vWidth = width;
        const vHeight = height;
        vShape.moveTo(-vWidth/2, 0);
        vShape.lineTo(0, -vHeight);
        vShape.lineTo(vWidth/2, 0);
        vShape.lineTo(-vWidth/2, 0);
        return new THREE.ExtrudeGeometry(vShape, {
          depth: depth,
          bevelEnabled: false
        });

      case 'convex-hull':
        if (modelGeometry && modelGeometry.attributes && modelGeometry.attributes.position) {
          try {
            // Since ConvexGeometry is not available, create a bounding box/sphere hull
            const positions = modelGeometry.attributes.position;
            const vertices = [];

            // Extract vertices from model geometry
            for (let i = 0; i < positions.count; i++) {
              const x = positions.getX(i);
              const y = positions.getY(i);
              const z = positions.getZ(i);
              vertices.push(new THREE.Vector3(x, y, z));
            }

            if (vertices.length > 0) {
              // Calculate bounding box
              const box = new THREE.Box3().setFromPoints(vertices);
              const size = box.getSize(new THREE.Vector3());
              const center = box.getCenter(new THREE.Vector3());

              // Create a rounded rectangular baseplate that encompasses the model
              const hullWidth = Math.max(size.x * 1.5, width || 100);
              const hullDepth = Math.max(size.z * 1.5, height || 100);

              // Create a rounded rectangle shape
              const hullShape = new THREE.Shape();
              const cornerRadius = Math.min(hullWidth, hullDepth) * 0.1; // Corner radius

              hullShape.moveTo(-hullWidth/2 + cornerRadius, -hullDepth/2);
              hullShape.lineTo(hullWidth/2 - cornerRadius, -hullDepth/2);
              hullShape.quadraticCurveTo(hullWidth/2, -hullDepth/2, hullWidth/2, -hullDepth/2 + cornerRadius);
              hullShape.lineTo(hullWidth/2, hullDepth/2 - cornerRadius);
              hullShape.quadraticCurveTo(hullWidth/2, hullDepth/2, hullWidth/2 - cornerRadius, hullDepth/2);
              hullShape.lineTo(-hullWidth/2 + cornerRadius, hullDepth/2);
              hullShape.quadraticCurveTo(-hullWidth/2, hullDepth/2, -hullWidth/2, hullDepth/2 - cornerRadius);
              hullShape.lineTo(-hullWidth/2, -hullDepth/2 + cornerRadius);
              hullShape.quadraticCurveTo(-hullWidth/2, -hullDepth/2, -hullWidth/2 + cornerRadius, -hullDepth/2);

              return new THREE.ExtrudeGeometry(hullShape, {
                depth: depth,
                bevelEnabled: false
              });
            }
          } catch (error) {
            console.warn('Error creating convex hull geometry, falling back to rectangular:', error);
          }
        }
        // Fallback to simple rounded rectangle if no model geometry or error
        const fallbackWidth = width || 100;
        const fallbackHeight = height || 100;
        const hullShape = new THREE.Shape();
        const cornerRadius = Math.min(fallbackWidth, fallbackHeight) * 0.1;

        hullShape.moveTo(-fallbackWidth/2 + cornerRadius, -fallbackHeight/2);
        hullShape.lineTo(fallbackWidth/2 - cornerRadius, -fallbackHeight/2);
        hullShape.quadraticCurveTo(fallbackWidth/2, -fallbackHeight/2, fallbackWidth/2, -fallbackHeight/2 + cornerRadius);
        hullShape.lineTo(fallbackWidth/2, fallbackHeight/2 - cornerRadius);
        hullShape.quadraticCurveTo(fallbackWidth/2, fallbackHeight/2, fallbackWidth/2 - cornerRadius, fallbackHeight/2);
        hullShape.lineTo(-fallbackWidth/2 + cornerRadius, fallbackHeight/2);
        hullShape.quadraticCurveTo(-fallbackWidth/2, fallbackHeight/2, -fallbackWidth/2, fallbackHeight/2 - cornerRadius);
        hullShape.lineTo(-fallbackWidth/2, -fallbackHeight/2 + cornerRadius);
        hullShape.quadraticCurveTo(-fallbackWidth/2, -fallbackHeight/2, -fallbackWidth/2 + cornerRadius, -fallbackHeight/2);

        return new THREE.ExtrudeGeometry(hullShape, {
          depth: depth,
          bevelEnabled: false
        });

      case 'perforated-panel':
        // Create perforated panel with hole pattern
        const panelGeometry = new THREE.BoxGeometry(width, depth, height);
        return panelGeometry;

      case 'metal-wooden-plate':
        // Simple rectangular plate
        return new THREE.BoxGeometry(width, depth, height);

      case 'rectangular':
      default:
        return new THREE.BoxGeometry(width, depth, height);
    }
  }, [type, width, height, depth, radius, modelGeometry]);

  // Update geometry when props change
  React.useEffect(() => {
    if (meshRef.current) {
      meshRef.current.geometry.dispose();
      meshRef.current.geometry = geometry;
    }
  }, [geometry]);

  // Add perforation holes for perforated panel type
  const perforationMeshes = useMemo(() => {
    if (type !== 'perforated-panel') return null;

    const meshes: JSX.Element[] = [];
    const holeSpacing = 10;
    const holeRadius = 1;
    const panelWidth = width;
    const panelHeight = height;

    for (let x = -panelWidth/2 + holeSpacing; x < panelWidth/2; x += holeSpacing) {
      for (let y = -panelHeight/2 + holeSpacing; y < panelHeight/2; y += holeSpacing) {
        meshes.push(
          <mesh key={`hole-${x}-${y}`} position={[x, depth/2 + 0.1, y]}>
            <cylinderGeometry args={[holeRadius, holeRadius, 0.5, 8]} />
            <meshBasicMaterial color={0x444444} />
          </mesh>
        );
      }
    }

    return meshes;
  }, [type, width, height, depth]);

  return (
    <group ref={groupRef} position={position}>
      <mesh
        ref={meshRef}
        onClick={onSelect}
        geometry={geometry}
        material={new THREE.MeshStandardMaterial(materialProps)}
        receiveShadow
        castShadow
      />

      {/* Add perforation holes for perforated panel */}
      {perforationMeshes && perforationMeshes.map((mesh, index) => (
        <React.Fragment key={index}>
          {mesh}
        </React.Fragment>
      ))}

      {/* Add visual indicators for different types */}
      {selected && (
        <mesh position={[0, depth/2 + 1, 0]}>
          <ringGeometry args={[radius * 0.8, radius * 0.9, 32]} />
          <meshBasicMaterial color={0x00ff00} transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
};

export default BasePlate;
