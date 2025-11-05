import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BasePlateProps {
  type: 'rectangular' | 'convex-hull' | 'perforated-panel' | 'metal-wooden-plate';
  width?: number;
  height?: number;
  depth?: number;
  radius?: number;
  position?: THREE.Vector3;
  material?: 'metal' | 'wood' | 'plastic';
  onSelect?: () => void;
  selected?: boolean;
  modelGeometry?: THREE.BufferGeometry; // For convex hull around model
  oversizeXY?: number; // extra margin on XZ for convex hull
  pitch?: number; // perforated panel hole spacing
  holeDiameter?: number; // perforated panel hole diameter
  onPointerDown?: (e: any) => void;
  onPointerMove?: (e: any) => void;
  onPointerUp?: (e: any) => void;
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
  modelGeometry,
  oversizeXY = 10,
  pitch = 20,
  holeDiameter = 6
  , onPointerDown, onPointerMove, onPointerUp
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Material properties based on type (with transparency for perforated panels)
  const materialProps = useMemo(() => {
    let base: any;
    switch (material) {
      case 'metal':
        base = {
          color: selected ? 0x0066cc : 0x888888,
          metalness: 0.8,
          roughness: 0.2,
          emissive: selected ? 0x001133 : 0x222222
        };
        break;
      case 'wood':
        base = {
          color: selected ? 0xcc6600 : 0x8B4513,
          metalness: 0.1,
          roughness: 0.8
        };
        break;
      case 'plastic':
        base = {
          color: selected ? 0x66cc00 : 0x333333,
          metalness: 0.0,
          roughness: 0.3
        };
        break;
      default:
        base = {
          color: 0x888888,
          metalness: 0.5,
          roughness: 0.5
        };
    }
    if (type === 'perforated-panel') {
      base = {
        ...base,
        transparent: true,
        opacity: 0.35,
      };
    }
    return base;
  }, [material, selected, type]);

  // Create geometry based on type
  const geometry = useMemo(() => {
    switch (type) {
      case 'convex-hull':
        if (modelGeometry && modelGeometry.attributes && modelGeometry.attributes.position) {
          try {
            // Build a 2D convex hull of the XZ projection for precise footprint
            const positions = modelGeometry.attributes.position as THREE.BufferAttribute;
            const points2D: Array<{x:number; z:number}> = [];
            const dedupe = new Set<string>();
            const sampleStep = Math.max(1, Math.floor(positions.count / 5000));
            for (let i = 0; i < positions.count; i += sampleStep) {
              const x = positions.getX(i);
              const z = positions.getZ(i);
              const key = `${Math.round(x*100)}:${Math.round(z*100)}`;
              if (!dedupe.has(key)) { dedupe.add(key); points2D.push({x, z}); }
            }

            if (points2D.length >= 3) {
              // Monotone chain convex hull in 2D
              const sorted = points2D.slice().sort((a,b)=> a.x===b.x ? a.z-b.z : a.x-b.x);
              const cross = (o:any,a:any,b:any)=> (a.x-o.x)*(b.z-o.z) - (a.z-o.z)*(b.x-o.x);
              const lower:any[]=[]; for (const p of sorted){ while(lower.length>=2 && cross(lower[lower.length-2], lower[lower.length-1], p) <= 0) lower.pop(); lower.push(p);} 
              const upper:any[]=[]; for (let i=sorted.length-1;i>=0;i--){ const p=sorted[i]; while(upper.length>=2 && cross(upper[upper.length-2], upper[upper.length-1], p) <= 0) upper.pop(); upper.push(p);} 
              const hull = lower.slice(0, lower.length-1).concat(upper.slice(0, upper.length-1));

              // Inflate by oversizeXY
              const cx = hull.reduce((s,p)=>s+p.x,0)/hull.length;
              const cz = hull.reduce((s,p)=>s+p.z,0)/hull.length;
              const margin = (typeof oversizeXY === 'number' ? oversizeXY : 10);
              const inflated = hull.map(p=>{
                const dx = p.x - cx; const dz = p.z - cz;
                const len = Math.hypot(dx,dz) || 1;
                return { x: p.x + (dx/len)*margin, z: p.z + (dz/len)*margin };
              });

              // Create shape from hull polygon
              const shape = new THREE.Shape();
              // Center shape about centroid so geometry is centered at origin
              shape.moveTo(inflated[0].x - cx, inflated[0].z - cz);
              for (let i=1;i<inflated.length;i++){ shape.lineTo(inflated[i].x - cx, inflated[i].z - cz); }
              shape.closePath();

              const g = new THREE.ExtrudeGeometry(shape, { depth: depth, bevelEnabled: false });
              // Center along extrusion axis and align thickness to Y
              g.translate(0, 0, -depth / 2);
              g.rotateX(-Math.PI / 2);
              g.computeBoundingBox();
              g.computeVertexNormals();
              return g;
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

        const g = new THREE.ExtrudeGeometry(hullShape, {
          depth: depth,
          bevelEnabled: false
        });
        g.translate(0, 0, -depth / 2);
        g.rotateX(-Math.PI / 2);
        g.computeBoundingBox();
        g.computeVertexNormals();
        return g;

      case 'perforated-panel':
        // Rounded rectangle with slight bevel for soft edges
        {
          const cornerRadius = Math.min(width, height) * 0.08;
          const shape = new THREE.Shape();
          const hw = width / 2;
          const hh = height / 2;
          const r = Math.min(cornerRadius, hw, hh);
          shape.moveTo(-hw + r, -hh);
          shape.lineTo(hw - r, -hh);
          shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
          shape.lineTo(hw, hh - r);
          shape.quadraticCurveTo(hw, hh, hw - r, hh);
          shape.lineTo(-hw + r, hh);
          shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
          shape.lineTo(-hw, -hh + r);
          shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);

          const g = new THREE.ExtrudeGeometry(shape, {
            depth: depth,
            bevelEnabled: true,
            bevelThickness: Math.min(0.6, depth * 0.15),
            bevelSize: Math.min(0.8, r * 0.25),
            bevelSegments: 2,
          });
          g.translate(0, 0, -depth / 2);
          g.rotateX(-Math.PI / 2);
          g.computeBoundingBox();
          g.computeVertexNormals();
          return g;
        }

      case 'metal-wooden-plate':
        {
          const cornerRadius = Math.min(width, height) * 0.06;
          const shape = new THREE.Shape();
          const hw = width / 2;
          const hh = height / 2;
          const r = Math.min(cornerRadius, hw, hh);
          shape.moveTo(-hw + r, -hh);
          shape.lineTo(hw - r, -hh);
          shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
          shape.lineTo(hw, hh - r);
          shape.quadraticCurveTo(hw, hh, hw - r, hh);
          shape.lineTo(-hw + r, hh);
          shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
          shape.lineTo(-hw, -hh + r);
          shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);

          const g = new THREE.ExtrudeGeometry(shape, {
            depth: depth,
            bevelEnabled: true,
            bevelThickness: Math.min(0.6, depth * 0.15),
            bevelSize: Math.min(0.8, r * 0.2),
            bevelSegments: 2,
          });
          g.translate(0, 0, -depth / 2);
          g.rotateX(-Math.PI / 2);
          g.computeBoundingBox();
          g.computeVertexNormals();
          return g;
        }

      case 'rectangular':
      default:
        {
          const cornerRadius = Math.min(width, height) * 0.08;
          const shape = new THREE.Shape();
          const hw = width / 2;
          const hh = height / 2;
          const r = Math.min(cornerRadius, hw, hh);
          shape.moveTo(-hw + r, -hh);
          shape.lineTo(hw - r, -hh);
          shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
          shape.lineTo(hw, hh - r);
          shape.quadraticCurveTo(hw, hh, hw - r, hh);
          shape.lineTo(-hw + r, hh);
          shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
          shape.lineTo(-hw, -hh + r);
          shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);

          const g = new THREE.ExtrudeGeometry(shape, {
            depth: depth,
            bevelEnabled: true,
            bevelThickness: Math.min(0.6, depth * 0.15),
            bevelSize: Math.min(0.8, r * 0.25),
            bevelSegments: 2,
          });
          g.translate(0, 0, -depth / 2);
          g.rotateX(-Math.PI / 2);
          g.computeBoundingBox();
          g.computeVertexNormals();
          return g;
        }
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
    const holeSpacing = typeof pitch === 'number' ? pitch : 20;
    const holeRadius = (typeof holeDiameter === 'number' ? holeDiameter : 6) / 2;
    const panelWidth = width;
    const panelHeight = height;

    for (let x = -panelWidth/2 + holeSpacing; x < panelWidth/2; x += holeSpacing) {
      for (let y = -panelHeight/2 + holeSpacing; y < panelHeight/2; y += holeSpacing) {
        meshes.push(
          <mesh key={`hole-${x}-${y}`} position={[x, depth/2 + 0.1, y]}>
            <cylinderGeometry args={[holeRadius, holeRadius, 0.5, 12]} />
            <meshBasicMaterial color={0x444444} />
          </mesh>
        );
      }
    }

    return meshes;
  }, [type, width, height, depth, pitch, holeDiameter]);

  return (
    <group ref={groupRef} position={position}>
      <mesh
        ref={meshRef}
        onClick={onSelect}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
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



