import React, { useRef, useState, useCallback, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls as DreiOrbitControls, Environment, Html } from '@react-three/drei';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import BasePlate from "./BasePlate";
import { ProcessedFile, ViewOrientation } from "@/modules/FileImport/types";
import ModelTransformControls from './ModelTransformControls';
import * as THREE from 'three';

interface ThreeDSceneProps {
  currentFile: ProcessedFile | null;
  transformEnabled: boolean;
  currentTransformMode: 'translate' | 'rotate' | 'scale';
  modelTransform: { position: THREE.Vector3; rotation: THREE.Euler; scale: THREE.Vector3 };
  setModelTransform: (transform: { position: THREE.Vector3; rotation: THREE.Euler; scale: THREE.Vector3 }) => void;
  onCycleTransformMode?: () => void;
}

const computeDominantUpQuaternion = (geometry: THREE.BufferGeometry) => {
  const positionAttribute = geometry.attributes.position;
  if (!positionAttribute) {
    return null;
  }

  const normalsMap = new Map<string, { normal: THREE.Vector3; area: number }>();
  const up = new THREE.Vector3(0, 1, 0);
  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  const vC = new THREE.Vector3();
  const cb = new THREE.Vector3();
  const ab = new THREE.Vector3();

  const accumulateNormal = (normal: THREE.Vector3, area: number) => {
    if (!Number.isFinite(area) || area <= 1e-6) {
      return;
    }

    const dir = normal.clone().normalize();
    if (!Number.isFinite(dir.x) || !Number.isFinite(dir.y) || !Number.isFinite(dir.z)) {
      return;
    }

    const key = `${Math.round(dir.x * 25)},${Math.round(dir.y * 25)},${Math.round(dir.z * 25)}`;
    const entry = normalsMap.get(key);
    if (entry) {
      entry.normal.addScaledVector(dir, area);
      entry.area += area;
    } else {
      normalsMap.set(key, { normal: dir.clone().multiplyScalar(area), area });
    }
  };

  const index = geometry.index;
  if (index) {
    for (let i = 0; i < index.count; i += 3) {
      const a = index.getX(i);
      const b = index.getX(i + 1);
      const c = index.getX(i + 2);

      vA.fromBufferAttribute(positionAttribute, a);
      vB.fromBufferAttribute(positionAttribute, b);
      vC.fromBufferAttribute(positionAttribute, c);

      cb.subVectors(vC, vB);
      ab.subVectors(vA, vB);
      const normal = cb.cross(ab);
      const area = normal.length() * 0.5;
      if (area > 0) {
        accumulateNormal(normal, area);
      }
    }
  } else {
    for (let i = 0; i < positionAttribute.count; i += 3) {
      vA.fromBufferAttribute(positionAttribute, i);
      vB.fromBufferAttribute(positionAttribute, i + 1);
      vC.fromBufferAttribute(positionAttribute, i + 2);

      cb.subVectors(vC, vB);
      ab.subVectors(vA, vB);
      const normal = cb.cross(ab);
      const area = normal.length() * 0.5;
      if (area > 0) {
        accumulateNormal(normal, area);
      }
    }
  }

  let bestEntry: { normal: THREE.Vector3; area: number } | null = null;
  normalsMap.forEach(entry => {
    if (!bestEntry || entry.area > bestEntry.area) {
      bestEntry = { normal: entry.normal.clone(), area: entry.area };
    }
  });

  if (!bestEntry) {
    return null;
  }

  const dominantNormal = bestEntry.normal.normalize();
  if (dominantNormal.lengthSq() < 1e-6) {
    return null;
  }

  if (dominantNormal.y < 0) {
    dominantNormal.negate();
  }

  if (dominantNormal.angleTo(up) < 1e-3) {
    return null;
  }

  const quaternion = new THREE.Quaternion().setFromUnitVectors(dominantNormal, up);
  return quaternion;
};

// Utility function for model colors
const modelColorPalette = [
  '#4ade80', // Green
  '#f97316', // Orange
  '#06b6d4', // Cyan
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#eab308', // Yellow
  '#ef4444', // Red
  '#22c55e', // Emerald
  '#3b82f6', // Blue
  '#f59e0b'  // Amber
];

function getModelColor(modelId: string, colorsMap: Map<string, string>): string {
  if (colorsMap.has(modelId)) {
    return colorsMap.get(modelId)!;
  }

  // Assign a new color from palette if not already assigned
  const availableColors = modelColorPalette.filter(color =>
    !Array.from(colorsMap.values()).includes(color)
  );

  if (availableColors.length === 0) {
    // If all colors used, cycle back to first color
    const assignedColors = Array.from(colorsMap.values());
    const firstUnusedColor = modelColorPalette.find(color => !assignedColors.includes(color)) || modelColorPalette[0];
    return firstUnusedColor;
  }

  const newColor = availableColors[0];
  return newColor;
}

const ORIENTATION_CONFIG: Record<ViewOrientation, { direction: THREE.Vector3; up: THREE.Vector3 }> = {
  front: { direction: new THREE.Vector3(0, 0, 1), up: new THREE.Vector3(0, 1, 0) },
  back: { direction: new THREE.Vector3(0, 0, -1), up: new THREE.Vector3(0, 1, 0) },
  left: { direction: new THREE.Vector3(-1, 0, 0), up: new THREE.Vector3(0, 1, 0) },
  right: { direction: new THREE.Vector3(1, 0, 0), up: new THREE.Vector3(0, 1, 0) },
  top: { direction: new THREE.Vector3(0, 1, 0), up: new THREE.Vector3(0, 0, -1) },
  bottom: { direction: new THREE.Vector3(0, -1, 0), up: new THREE.Vector3(0, 0, 1) },
  iso: { direction: new THREE.Vector3(1, 1, 1), up: new THREE.Vector3(0, 1, 0) },
};

const getProjectedSizeForOrientation = (bounds: BoundsSummary, orientation: ViewOrientation) => {
  const { size } = bounds;
  switch (orientation) {
    case 'front':
    case 'back':
      return { horizontal: size.x, vertical: size.y };
    case 'left':
    case 'right':
      return { horizontal: size.z, vertical: size.y };
    case 'top':
    case 'bottom':
      return { horizontal: size.x, vertical: size.z };
    case 'iso':
    default:
      const diagonal = Math.max(size.x, size.y, size.z);
      return { horizontal: diagonal, vertical: diagonal };
  }
};

// Center cross axes component (lies on ground plane)
function CenterCross({ length = 100, position = [0, -0.001, 0] }: { length?: number; position?: [number, number, number] }) {
  const positions = useMemo(() => new Float32Array([
    // X axis (red) along ground
    -length, 0, 0,   length, 0, 0,
    // Z axis (green) along ground depth
    0, 0, -length,   0, 0, length,
  ]), [length]);

  const colors = useMemo(() => new Float32Array([
    1, 0, 0,   1, 0, 0,  // Red for X
    0, 1, 0,   0, 1, 0,  // Green for Z (projected)
  ]), []);

  return (
    <group position={position} frustumCulled={false}>
      <lineSegments renderOrder={1000}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={colors.length / 3}
            array={colors}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial vertexColors depthWrite={false} linewidth={1} />
      </lineSegments>
    </group>
  );
}

interface BoundsSummary {
  min: THREE.Vector3;
  max: THREE.Vector3;
  center: THREE.Vector3;
  size: THREE.Vector3;
  radius: number;
  unitsScale?: number;
}

const getFootprintMetrics = (bounds: BoundsSummary | null) => {
  if (!bounds) {
    return {
      radius: 25,
      padding: 12,
      halfLength: 37,
    };
  }

  const unitsScale = bounds.unitsScale ?? 1;
  const sizeX = Math.max(bounds.size.x, 0) * unitsScale;
  const sizeZ = Math.max(bounds.size.z, 0) * unitsScale;
  const longestHalfEdge = Math.max(sizeX, sizeZ) * 0.5;
  const padding = Math.max(longestHalfEdge * 0.35, 5);
  const halfLength = Math.max(longestHalfEdge + padding, longestHalfEdge + 5, longestHalfEdge * 1.5, 36);

  return { radius: longestHalfEdge, padding, halfLength };
};

const computeCrossHalfLength = (bounds: BoundsSummary | null) => {
  return getFootprintMetrics(bounds).halfLength;
};

function lightenColor(hex: string, amount: number) {
  const normalized = hex.replace('#', '');
  const num = parseInt(normalized, 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function getComplementColor(hex: string) {
  const normalized = hex.replace('#', '');
  const num = parseInt(normalized, 16);
  const r = 255 - ((num >> 16) & 0xff);
  const g = 255 - ((num >> 8) & 0xff);
  const b = 255 - (num & 0xff);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function getHighlightColor(baseHex?: string) {
  if (!baseHex || !baseHex.startsWith('#') || (baseHex.length !== 7 && baseHex.length !== 4)) {
    return '#0ea5e9';
  }

  const normalized = baseHex.length === 4
    ? `#${baseHex[1]}${baseHex[1]}${baseHex[2]}${baseHex[2]}${baseHex[3]}${baseHex[3]}`
    : baseHex;
  const complement = getComplementColor(normalized);
  return lightenColor(complement, 30);
}

function TransformAnchor({
  bounds,
  transformEnabled,
  currentMode,
  onCycle,
  rotation,
  anchorColor = '#0ea5e9',
}: {
  bounds: BoundsSummary | null;
  transformEnabled: boolean;
  currentMode: 'translate' | 'rotate' | 'scale';
  onCycle?: () => void;
  rotation?: THREE.Euler;
  anchorColor?: string;
}) {
  const { gl } = useThree();
  const [hovered, setHovered] = useState(false);
  const position = bounds ? bounds.center.toArray() : [0, 0, 0];
  const longestEdge = bounds ? Math.max(bounds.size.x, bounds.size.y, bounds.size.z) : 1;
  const anchorRadius = Math.max(longestEdge * 0.02, 2.4);
  const degreeLabelOffset = Math.max(longestEdge * 0.35, anchorRadius * 4.2);
  const axisDotOffset = Math.max(longestEdge * 0.28, anchorRadius * 3.6);
  const axisColors = {
    x: '#ef4444',
    y: '#22c55e',
    z: '#3b82f6'
  } as const;
  const labelStyles = {
    x: {
      background: 'rgba(248, 113, 113, 0.28)',
      color: '#7f1d1d',
      border: '1px solid rgba(248, 113, 113, 0.35)'
    },
    y: {
      background: 'rgba(74, 222, 128, 0.28)',
      color: '#065f46',
      border: '1px solid rgba(74, 222, 128, 0.35)'
    },
    z: {
      background: 'rgba(96, 165, 250, 0.28)',
      color: '#1e3a8a',
      border: '1px solid rgba(96, 165, 250, 0.35)'
    }
  };

  const normalizeDegrees = useCallback((value: number) => {
    let deg = THREE.MathUtils.radToDeg(value);
    deg = ((deg + 180) % 360) - 180;
    return Math.round(deg);
  }, []);

  const rotationDegrees = useMemo(() => {
    if (!rotation) {
      return { x: 0, y: 0, z: 0 };
    }
    return {
      x: normalizeDegrees(rotation.x),
      y: normalizeDegrees(rotation.y),
      z: normalizeDegrees(rotation.z),
    };
  }, [rotation, normalizeDegrees]);

  const formatRotation = useCallback((value: number) => `${value >= 0 ? '+' : ''}${value}`, []);

  const handleClick = useCallback((event: any) => {
    event.stopPropagation();
    onCycle?.();
  }, [onCycle]);

  const handlePointerOver = useCallback(() => {
    setHovered(true);
    gl.domElement.style.cursor = 'pointer';
  }, [gl]);

  const handlePointerOut = useCallback(() => {
    setHovered(false);
    gl.domElement.style.cursor = 'auto';
  }, [gl]);

  if (!bounds) {
    return null;
  }

  return (
    <group position={position as [number, number, number]} frustumCulled={false} renderOrder={1500}>
      {(transformEnabled || currentMode === 'rotate') && (
        <group>
          {/* Axis dots for quick reference */}
          <mesh position={[axisDotOffset, 0, 0]}>
            <sphereGeometry args={[anchorRadius * 0.55, 24, 24]} />
            <meshBasicMaterial color={axisColors.x} depthWrite={false} transparent opacity={currentMode === 'rotate' ? 0.95 : 0.45} />
          </mesh>
          <mesh position={[0, axisDotOffset, 0]}>
            <sphereGeometry args={[anchorRadius * 0.55, 24, 24]} />
            <meshBasicMaterial color={axisColors.y} depthWrite={false} transparent opacity={currentMode === 'rotate' ? 0.95 : 0.45} />
          </mesh>
          <mesh position={[0, 0, axisDotOffset]}>
            <sphereGeometry args={[anchorRadius * 0.55, 24, 24]} />
            <meshBasicMaterial color={axisColors.z} depthWrite={false} transparent opacity={currentMode === 'rotate' ? 0.95 : 0.45} />
          </mesh>

          {currentMode === 'rotate' && (
            <>
              <Html
                position={[degreeLabelOffset, 0, 0]}
                style={{
                  background: labelStyles.x.background,
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  fontSize: '10px',
                  color: labelStyles.x.color,
                  pointerEvents: 'none',
                  border: labelStyles.x.border
                }}
              >
                X {formatRotation(rotationDegrees.x)}°
              </Html>
              <Html
                position={[0, degreeLabelOffset, 0]}
                style={{
                  background: labelStyles.y.background,
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  fontSize: '10px',
                  color: labelStyles.y.color,
                  pointerEvents: 'none',
                  border: labelStyles.y.border
                }}
              >
                Y {formatRotation(rotationDegrees.y)}°
              </Html>
              <Html
                position={[0, 0, degreeLabelOffset]}
                style={{
                  background: labelStyles.z.background,
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  fontSize: '10px',
                  color: labelStyles.z.color,
                  pointerEvents: 'none',
                  border: labelStyles.z.border
                }}
              >
                Z {formatRotation(rotationDegrees.z)}°
              </Html>
            </>
          )}
        </group>
      )}

      <mesh
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[anchorRadius, 32, 32]} />
        <meshBasicMaterial
          color={transformEnabled ? anchorColor : '#d4d4d8'}
          transparent
          opacity={hovered ? 0.6 : 0.32}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// Component for the main 3D model
function ModelMesh({ file, meshRef, dimensions, colorsMap, setColorsMap, onBoundsChange }: {
  file: ProcessedFile;
  meshRef?: React.RefObject<THREE.Mesh>;
  dimensions?: { x?: number; y?: number; z?: number };
  colorsMap?: Map<string, string>;
  setColorsMap?: React.Dispatch<React.SetStateAction<Map<string, string>>>;
  onBoundsChange?: (bounds: BoundsSummary) => void;
}) {
  const internalRef = useRef<THREE.Mesh>(null);
  const actualRef = meshRef || internalRef;
  const hasNormalizedRef = useRef(false);
  const unitScale = useMemo(() => {
    switch (file.metadata.units) {
      case 'cm':
        return 10;
      case 'inch':
        return 25.4;
      default:
        return 1;
    }
  }, [file.metadata.units]);

  // Get model color
  const modelId = file.metadata.name;
  const modelColor = getModelColor(modelId, colorsMap || new Map());

  // Assign color to model when it loads
  React.useEffect(() => {
    if (setColorsMap && colorsMap && !colorsMap.has(modelId)) {
      const newColor = getModelColor(modelId, colorsMap);
      setColorsMap(prev => new Map(prev.set(modelId, newColor)));
    }
  }, [modelId, setColorsMap, colorsMap]);

  // Update material color when model loads
  React.useEffect(() => {
    if (actualRef.current && actualRef.current.material && modelColor) {
      // Convert hex color to RGB values for Three.js
      const hex = modelColor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;

      if (actualRef.current.material instanceof THREE.MeshStandardMaterial) {
        actualRef.current.material.color.setRGB(r, g, b);
        actualRef.current.material.needsUpdate = true;
      } else if (actualRef.current.material instanceof THREE.MeshBasicMaterial) {
        actualRef.current.material.color.setRGB(r, g, b);
        actualRef.current.material.needsUpdate = true;
      }
    }
  }, [modelColor]);

  // Normalize model so it rests on the XY plane and report bounds to parent
  React.useEffect(() => {
    const mesh = actualRef.current;
    if (!mesh) {
      return;
    }

    const geometry = mesh.geometry as THREE.BufferGeometry;

    if (!hasNormalizedRef.current) {
      geometry.computeBoundingBox();
      const geoBox = geometry.boundingBox;
      if (geoBox) {
        const geoCenter = geoBox.getCenter(new THREE.Vector3());
        const bottom = geoBox.min.y;
        geometry.translate(-geoCenter.x, -bottom, -geoCenter.z);
        const dominantQuaternion = computeDominantUpQuaternion(geometry);
        if (dominantQuaternion) {
          geometry.applyQuaternion(dominantQuaternion);
          geometry.computeBoundingBox();
          const orientedBox = geometry.boundingBox;
          if (orientedBox) {
            const orientedCenter = orientedBox.getCenter(new THREE.Vector3());
            const orientedBottom = orientedBox.min.y;
            geometry.translate(-orientedCenter.x, -orientedBottom, -orientedCenter.z);
          }
        }
        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();
        if (geometry.attributes.position) {
          geometry.attributes.position.needsUpdate = true;
        }
      }

      mesh.position.set(0, 0, 0);
      mesh.rotation.set(0, 0, 0);
      mesh.scale.setScalar(unitScale);
      mesh.updateMatrixWorld(true, true);
      mesh.userData.normalized = true;
      hasNormalizedRef.current = true;
    }

    if (dimensions && (dimensions.x || dimensions.y || dimensions.z)) {
      const box = geometry.boundingBox ?? new THREE.Box3().setFromBufferAttribute(geometry.getAttribute('position'));
      const currentDimensions = box.getSize(new THREE.Vector3());
      const scaleX = dimensions.x ? (dimensions.x / unitScale) / (currentDimensions.x || 1) : mesh.scale.x;
      const scaleY = dimensions.y ? (dimensions.y / unitScale) / (currentDimensions.y || 1) : mesh.scale.y;
      const scaleZ = dimensions.z ? (dimensions.z / unitScale) / (currentDimensions.z || 1) : mesh.scale.z;
      mesh.scale.set(scaleX, scaleY, scaleZ);
      mesh.updateMatrixWorld(true, true);
    }

    const finalBox = new THREE.Box3().setFromObject(mesh);
    const sphere = finalBox.getBoundingSphere(new THREE.Sphere());
    const finalCenter = finalBox.getCenter(new THREE.Vector3());
    const finalSize = finalBox.getSize(new THREE.Vector3());

    onBoundsChange?.({
      min: finalBox.min.clone(),
      max: finalBox.max.clone(),
      center: finalCenter,
      size: finalSize,
      radius: sphere.radius,
      unitsScale: unitScale,
    });
  }, [file, dimensions, onBoundsChange, unitScale]);

  useFrame(() => {
    if (actualRef.current) {
      // Optional: Add subtle rotation for better visualization
      // actualRef.current.rotation.y += 0.001;
    }
  });

  return (
    <mesh ref={actualRef} geometry={file.mesh.geometry} material={file.mesh.material} />
  );
}

// Component for placed fixture elements
function FixtureComponent({
  component,
  position,
  onSelect
}: {
  component: any;
  position: THREE.Vector3;
  onSelect?: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  return (
    <mesh
      ref={meshRef}
      position={position}
      geometry={component.geometry}
      material={component.material}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={onSelect}
      scale={hovered ? 1.05 : 1}
    />
  );
}

// Main 3D Scene Component
const ThreeDScene: React.FC<ThreeDSceneProps> = ({
  currentFile,
  transformEnabled,
  currentTransformMode,
  modelTransform,
  setModelTransform,
  onCycleTransformMode
}) => {
  const { camera, size } = useThree();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const [placedComponents, setPlacedComponents] = useState<Array<{ component: any; position: THREE.Vector3; id: string }>>([]);
  const [selectedComponent, setSelectedComponent] = useState<any>(null);
  const [basePlate, setBasePlate] = useState<{
    type: 'rectangular' | 'circular' | 'convex-hull' | 'cylindrical' | 'v-block' | 'hexagonal' | 'perforated-panel' | 'metal-wooden-plate';
    width?: number;
    height?: number;
    depth?: number;
    radius?: number;
    position?: THREE.Vector3;
    material?: 'metal' | 'wood' | 'plastic';
    id?: string;
  } | null>(null);
  const modelMeshRef = useRef<THREE.Mesh>(null);
  const [modelDimensions, setModelDimensions] = useState<{ x?: number; y?: number; z?: number } | undefined>();
  const [orbitControlsEnabled, setOrbitControlsEnabled] = useState(true);
  const [modelColors, setModelColors] = useState<Map<string, string>>(new Map());
  const [modelBounds, setModelBounds] = useState<BoundsSummary | null>(null);
  const [currentOrientation, setCurrentOrientation] = useState<ViewOrientation>('iso');

  const updateCamera = useCallback((orientation: ViewOrientation, bounds: BoundsSummary | null) => {
    const orthoCam = camera as THREE.OrthographicCamera;
    const { direction, up } = ORIENTATION_CONFIG[orientation] || ORIENTATION_CONFIG.iso;
    const targetY = bounds ? bounds.center.y : 0;
    const target = new THREE.Vector3(0, targetY, 0);
    const normalizedDirection = direction.clone().normalize();

    const footprint = getFootprintMetrics(bounds);
    const footprintRadius = footprint.radius;
    const footprintPadding = footprint.padding;
    const crossHalfLength = footprint.halfLength;
    const radius = bounds?.radius ? Math.max(bounds.radius * (bounds.unitsScale ?? 1), footprintRadius) : footprintRadius;
    const crossSpan = crossHalfLength * 2;
    const horizontalSpan = bounds
      ? Math.max(bounds.size.x, bounds.size.z, crossSpan / (bounds.unitsScale ?? 1)) * (bounds.unitsScale ?? 1)
      : crossSpan;
    const verticalSpan = bounds ? bounds.size.y * (bounds.unitsScale ?? 1) : crossSpan * 0.6;
    const padding = bounds ? Math.max(footprintPadding, 5) : footprintPadding;

    const distance = bounds
      ? Math.max(
          radius * 3.0,
          crossSpan * 2.1,
          (horizontalSpan + padding * 2) * 1.05,
          (verticalSpan + padding * 2) * 1.15
        )
      : crossSpan * 2.1;

    const position = target.clone().add(normalizedDirection.multiplyScalar(distance));
    orthoCam.position.copy(position);
    orthoCam.up.copy(up.clone().normalize());
    orthoCam.lookAt(target);

    const dims = bounds ? getProjectedSizeForOrientation(bounds, orientation) : { horizontal: crossSpan, vertical: crossSpan };
    const spanHorizontal = Math.max(dims.horizontal * (bounds?.unitsScale ?? 1), crossSpan);
    const spanVertical = Math.max(dims.vertical * (bounds?.unitsScale ?? 1), verticalSpan);

    let halfWidth = spanHorizontal / 2 + padding;
    let halfHeight = spanVertical / 2 + Math.max(padding, 4);

    const aspect = size.width / size.height;
    if (halfWidth / halfHeight > aspect) {
      halfHeight = halfWidth / aspect;
    } else {
      halfWidth = halfHeight * aspect;
    }

    const framingScale = 1.22;
    halfWidth *= framingScale;
    halfHeight *= framingScale;

    orthoCam.left = -halfWidth;
    orthoCam.right = halfWidth;
    orthoCam.top = halfHeight;
    orthoCam.bottom = -halfHeight;
    orthoCam.near = 0.1;
    orthoCam.far = Math.max(distance * 4, 2000);
    orthoCam.zoom = 1;
    orthoCam.updateProjectionMatrix();

    if (controlsRef.current) {
      controlsRef.current.target.copy(target);
      controlsRef.current.update();
    }
  }, [camera, size.width, size.height]);

  React.useEffect(() => {
    updateCamera(currentOrientation, modelBounds);
  }, [currentOrientation, modelBounds, updateCamera]);

  React.useEffect(() => {
    if (!currentFile) {
      setModelBounds(null);
      setCurrentOrientation('iso');
    }
  }, [currentFile]);

  const centerCrossLength = React.useMemo(() => computeCrossHalfLength(modelBounds), [modelBounds]);

  // Handle mouse events for drag and drop (disabled for now)
  const handlePointerMove = useCallback((event: any) => {
    // Drag and drop functionality temporarily disabled
  }, []);

  const handlePointerUp = useCallback(() => {
    // Drag and drop functionality temporarily disabled
  }, []);

  // Listen for component selection from library
  React.useEffect(() => {
    const handleComponentSelect = (event: CustomEvent) => {
      const component = event.detail;
      setSelectedComponent(component);
    };
    window.addEventListener('component-selected', handleComponentSelect as EventListener);
    return () => window.removeEventListener('component-selected', handleComponentSelect as EventListener);
  }, [selectedComponent]);

  // Handle base plate creation events
  React.useEffect(() => {
    const handleCreateBaseplate = (e: CustomEvent) => {
      const { type, option, dimensions } = e.detail;
      console.log('Creating baseplate:', type, option, dimensions);

      // Generate unique ID for the base plate
      const basePlateId = `baseplate-${Date.now()}`;

      // Base plate dimensions - positioned under the model
      let basePlateConfig: typeof basePlate = {
        type: option as any,
        position: new THREE.Vector3(0, -dimensions.height / 2, 0), // Start at origin, will be adjusted
        material: dimensions.material || 'metal',
        depth: dimensions.height || 10,
        id: basePlateId
      };

      // Calculate proper baseplate position under the model
      if (modelMeshRef.current) {
        const modelBox = new THREE.Box3().setFromObject(modelMeshRef.current);
        const modelBottom = modelBox.min.y;
        basePlateConfig.position = new THREE.Vector3(0, modelBottom - dimensions.height / 2, 0);
      }

      // Set dimensions based on type and provided dimensions
      switch (option) {
        case 'rectangular':
        case 'metal-wooden-plate':
          basePlateConfig.width = Math.max(dimensions.width || 100, 50);
          basePlateConfig.height = Math.max(dimensions.length || 100, 50);
          break;

        case 'circular':
        case 'cylindrical':
          basePlateConfig.radius = Math.max(dimensions.radius || 50, 25);
          break;

        case 'hexagonal':
          basePlateConfig.width = Math.max(dimensions.width || 100, 50);
          basePlateConfig.height = Math.max(dimensions.height || 100, 50);
          break;

        case 'v-block':
          basePlateConfig.width = Math.max(dimensions.width || 100, 50);
          basePlateConfig.height = Math.max(dimensions.height || 50, 25);
          break;

        case 'convex-hull':
          basePlateConfig.width = Math.max(dimensions.width || 100, 50);
          basePlateConfig.height = Math.max(dimensions.length || 100, 50);
          // For convex hull, we'll need model geometry - handled in render
          break;

        case 'perforated-panel':
          basePlateConfig.width = Math.max(dimensions.width || 100, 50);
          basePlateConfig.height = Math.max(dimensions.length || 100, 50);
          break;
      }

      setBasePlate(basePlateConfig);
    };

    window.addEventListener('create-baseplate', handleCreateBaseplate as EventListener);
    return () => window.removeEventListener('create-baseplate', handleCreateBaseplate as EventListener);
  }, []);

  // Handle base plate deselection/cancellation
  React.useEffect(() => {
    const handleDeselectBaseplate = (e: CustomEvent) => {
      const { basePlateId } = e.detail;
      console.log('Deselecting baseplate:', basePlateId);

      if (basePlate && basePlate.id === basePlateId) {
        setBasePlate(null);
      }
    };

    const handleCancelBaseplate = () => {
      console.log('Cancelling baseplate selection');
      setBasePlate(null);
    };

    window.addEventListener('baseplate-deselected', handleDeselectBaseplate as EventListener);
    window.addEventListener('cancel-baseplate', handleCancelBaseplate as EventListener);

    return () => {
      window.removeEventListener('baseplate-deselected', handleDeselectBaseplate as EventListener);
      window.removeEventListener('cancel-baseplate', handleCancelBaseplate as EventListener);
    };
  }, [basePlate]);

  // Handle transform mode toggle events
  React.useEffect(() => {
    const handleToggleTransform = () => {
      // This will be handled by the parent component
    };

    window.addEventListener('toggle-transform-mode', handleToggleTransform as EventListener);
    return () => window.removeEventListener('toggle-transform-mode', handleToggleTransform as EventListener);
  }, []);

  // Handle orbit controls enable/disable for transform mode
  React.useEffect(() => {
    const handleOrbitControlsToggle = (e: CustomEvent) => {
      setOrbitControlsEnabled(!e.detail.disabled);
    };

    window.addEventListener('disable-orbit-controls', handleOrbitControlsToggle as EventListener);
    return () => window.removeEventListener('disable-orbit-controls', handleOrbitControlsToggle as EventListener);
  }, [setOrbitControlsEnabled]);

  // Handle view reset events
  React.useEffect(() => {
    const handleViewReset = (e: CustomEvent) => {
      if (currentFile && modelMeshRef.current) {
        // Reset camera to isometric view position based on model size and units
        setCurrentOrientation('iso');
        updateCamera('iso', modelBounds);
      } else {
        // Reset camera to default isometric position (no model loaded)
        setCurrentOrientation('iso');
        updateCamera('iso', null);
      }

      // Clear baseplate when resetting
      setBasePlate(null);
    };

    window.addEventListener('viewer-reset', handleViewReset as EventListener);
    return () => window.removeEventListener('viewer-reset', handleViewReset as EventListener);
  }, [camera, currentFile, updateCamera, modelBounds]);

  // Handle view orientation events
  React.useEffect(() => {
    const handleViewOrientation = (e: CustomEvent) => {
      const orientation = e.detail;

      if (currentFile && modelMeshRef.current) {
        // Set camera position based on orientation and model size/units
        setCurrentOrientation(orientation as ViewOrientation);
        updateCamera(orientation as ViewOrientation, modelBounds);
      } else {
        // Fallback to fixed positions when no model is loaded
        switch (orientation) {
          case 'front':
            updateCamera('front', null);
            break;
          case 'back':
            updateCamera('back', null);
            break;
          case 'left':
            updateCamera('left', null);
            break;
          case 'right':
            updateCamera('right', null);
            break;
          case 'top':
            updateCamera('top', null);
            break;
          case 'bottom':
            updateCamera('bottom', null);
            break;
          case 'iso':
            updateCamera('iso', null);
            break;
          default:
            console.warn('Unknown orientation:', orientation);
        }
      }
    };

    window.addEventListener('viewer-orientation', handleViewOrientation as EventListener);
    return () => window.removeEventListener('viewer-orientation', handleViewOrientation as EventListener);
  }, [camera, currentFile, updateCamera, modelBounds]);

  // Handle clear/reset events
  React.useEffect(() => {
    const handleClear = (e: CustomEvent) => {
      // Reset camera to default position (front view) looking at origin
      updateCamera('iso', null);

      // Clear all state including baseplate
      setPlacedComponents([]);
      setSelectedComponent(null);
      setBasePlate(null);
      setModelDimensions(undefined);
      setModelBounds(null);
    };

    window.addEventListener('viewer-clear', handleClear as EventListener);
    return () => window.removeEventListener('viewer-clear', handleClear as EventListener);
  }, [camera, setModelDimensions]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <directionalLight position={[-10, -10, -5]} intensity={0.4} />
      <pointLight position={[0, 10, 0]} intensity={0.3} />
      <pointLight position={[0, -10, 0]} intensity={0.3} />

      {/* Environment */}
      <Environment preset="warehouse" />

      {/* Center cross axes - sized based on model footprint */}
      <CenterCross length={centerCrossLength} />

      {/* Base plate */}
      {basePlate && (
        <BasePlate
          key={`baseplate-${basePlate.id}`}
          type={basePlate.type}
          width={basePlate.width}
          height={basePlate.height}
          depth={basePlate.depth}
          radius={basePlate.radius}
          position={basePlate.position}
          material={basePlate.material}
          modelGeometry={basePlate.type === 'convex-hull' && modelMeshRef.current?.geometry ? modelMeshRef.current.geometry : undefined}
          selected={false}
          onSelect={() => {
            // Dispatch event to select this base plate
            window.dispatchEvent(new CustomEvent('baseplate-selected', {
              detail: { basePlateId: basePlate.id }
            }));
          }}
        />
      )}

      {/* Main 3D model - show in both normal and transform modes */}
      {currentFile && (
        <group>
          <ModelMesh
            file={currentFile}
            meshRef={modelMeshRef}
            dimensions={modelDimensions}
            colorsMap={modelColors}
            setColorsMap={setModelColors}
            onBoundsChange={setModelBounds}
          />
          <TransformAnchor
            bounds={modelBounds}
            transformEnabled={transformEnabled}
            currentMode={currentTransformMode}
            onCycle={onCycleTransformMode}
            rotation={modelTransform.rotation}
            anchorColor={getHighlightColor(modelColors.get(currentFile.metadata.name))}
          />
        </group>
      )}

      {/* Transform controls - only when enabled and model is ready */}
      {currentFile && transformEnabled && (
        <ModelTransformControls
          model={currentFile.mesh}
          position={modelTransform.position}
          onTransform={setModelTransform}
          enabled={transformEnabled}
          snapToGrid={true}
          gridSize={5}
          modelRef={modelMeshRef}
          transformMode={currentTransformMode}
        />
      )}

      {/* Placed fixture components */}
      {placedComponents.map((item) => (
        <FixtureComponent
          key={item.id}
          component={item.component}
          position={item.position}
          onSelect={() => console.log('Component selected:', item.id)}
        />
      ))}

      {/* Event handlers */}
      <mesh
        position={[0, 0, 0]}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        visible={false}
      >
        <planeGeometry args={[1000, 1000]} />
      </mesh>

      {/* Orbit Controls - allow rotation in both modes for better control */}
      <DreiOrbitControls
        ref={(instance) => {
          controlsRef.current = instance as unknown as OrbitControlsImpl | null;
        }}
        enablePan={orbitControlsEnabled}
        enableZoom={orbitControlsEnabled}
        enableRotate={orbitControlsEnabled}
        minDistance={0.01}  // Allow unlimited zoom in
        maxDistance={Infinity}  // Allow unlimited zoom out
        dampingFactor={0.05}
        onChange={(event) => {
          if (event?.target?.object?.quaternion) {
            const q = event.target.object.quaternion;
            const arr: [number, number, number, number] = [q.x, q.y, q.z, q.w];
            window.dispatchEvent(new CustomEvent('viewer-camera-changed', { detail: { q: arr } }));
          }
        }}
      />

    </>
  );
};

export default ThreeDScene;
  