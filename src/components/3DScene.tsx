import React, { useRef, useState, useCallback, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, ContactShadows, Text, Line } from '@react-three/drei';
import BasePlate from "./BasePlate";
import { ProcessedFile } from "@/modules/FileImport/types";
import ModelTransformControls from './ModelTransformControls';
import * as THREE from 'three';

interface ThreeDSceneProps {
  currentFile: ProcessedFile | null;
  transformEnabled: boolean;
  currentTransformMode: 'translate' | 'rotate' | 'scale';
  modelTransform: { position: THREE.Vector3; rotation: THREE.Euler; scale: THREE.Vector3 };
  setModelTransform: (transform: { position: THREE.Vector3; rotation: THREE.Euler; scale: THREE.Vector3 }) => void;
}

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

// Integrated XYZ axes component within React Three Fiber
function XYZAxes3D() {
  const { camera, size } = useThree();
  const groupRef = useRef<any>(null);

  useFrame(() => {
    if (groupRef.current && camera && size) {
      // Fixed position in bottom-left corner using camera projection
      const distance = 2.5; // Distance from camera

      // Get camera direction and create offset vectors
      const cameraPos = camera.position.clone();
      const cameraDirection = new THREE.Vector3(0, 0, -1);
      camera.getWorldDirection(cameraDirection);

      // Create basis vectors for positioning
      const rightVector = new THREE.Vector3(1, 0, 0);
      const upVector = new THREE.Vector3(0, 1, 0);

      // Apply camera rotation to basis vectors
      rightVector.applyQuaternion(camera.quaternion);
      upVector.applyQuaternion(camera.quaternion);

      // Position in bottom-left corner with consistent offset
      const offsetRight = rightVector.multiplyScalar(-1.8);
      const offsetUp = upVector.multiplyScalar(-1.8);
      const offsetForward = cameraDirection.multiplyScalar(distance);

      groupRef.current.position.copy(cameraPos)
        .add(offsetForward)
        .add(offsetRight)
        .add(offsetUp);

      // Match camera rotation for proper orientation
      groupRef.current.quaternion.copy(camera.quaternion);
    }
  });

  return (
    <group ref={groupRef} scale={0.8}>
      {/* X Axis (Red) - Cylinder and Dot */}
      <mesh position={[0.3, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <cylinderGeometry args={[0.01, 0.01, 0.6, 6]} />
        <meshBasicMaterial color={0xff0000} />
      </mesh>
      {/* X Axis Dot */}
      <mesh position={[0.6, 0, 0]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshBasicMaterial color={0xff0000} />
      </mesh>

      {/* X Axis Line */}
      <Line points={[[0, 0, 0], [0.5, 0, 0]]} color={0xff0000} lineWidth={1.5} />

      {/* Y Axis (Green) - Cylinder and Dot */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.6, 6]} />
        <meshBasicMaterial color={0x00ff00} />
      </mesh>
      {/* Y Axis Dot */}
      <mesh position={[0, 0.6, 0]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshBasicMaterial color={0x00ff00} />
      </mesh>

      {/* Y Axis Line */}
      <Line points={[[0, 0, 0], [0, 0.5, 0]]} color={0x00ff00} lineWidth={1.5} />

      {/* Z Axis (Blue) - Cylinder and Dot */}
      <mesh position={[0, 0, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.6, 6]} />
        <meshBasicMaterial color={0x0000ff} />
      </mesh>
      {/* Z Axis Dot */}
      <mesh position={[0, 0, 0.6]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshBasicMaterial color={0x0000ff} />
      </mesh>

      {/* Z Axis Line */}
      <Line points={[[0, 0, 0], [0, 0, 0.5]]} color={0x0000ff} lineWidth={1.5} />

      {/* Labels */}
      <Text
        position={[0.8, 0, 0]}
        fontSize={0.1}
        color="#ff0000"
        anchorX="center"
        anchorY="middle"
      >
        X
      </Text>
      <Text
        position={[0, 0.8, 0]}
        fontSize={0.1}
        color="#00ff00"
        anchorX="center"
        anchorY="middle"
      >
        Y
      </Text>
      <Text
        position={[0, 0, 0.8]}
        fontSize={0.1}
        color="#0000ff"
        anchorX="center"
        anchorY="middle"
      >
        Z
      </Text>
    </group>
  );
}

// Center cross axes component
function CenterCross({ length = 100 }: { length?: number }) {
  const positions = useMemo(() => new Float32Array([
    // X axis (red)
    -length, 0, 0,   length, 0, 0,
    // Y axis (green)
    0, -length, 0,   0, length, 0,
  ]), [length]);

  const colors = useMemo(() => new Float32Array([
    1, 0, 0,   1, 0, 0,  // Red for X
    0, 1, 0,   0, 1, 0,  // Green for Y
  ]), []);

  return (
    <lineSegments>
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
      <lineBasicMaterial vertexColors />
    </lineSegments>
  );
}

// Component for the main 3D model
function ModelMesh({ file, meshRef, dimensions, colorsMap, setColorsMap }: { file: ProcessedFile; meshRef?: React.RefObject<THREE.Mesh>; dimensions?: { x?: number; y?: number; z?: number }; colorsMap?: Map<string, string>; setColorsMap?: React.Dispatch<React.SetStateAction<Map<string, string>>> }) {
  const internalRef = useRef<THREE.Mesh>(null);
  const { camera, size } = useThree();
  const actualRef = meshRef || internalRef;

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

  // Center model at origin and fit to viewport
  React.useEffect(() => {
    if (actualRef.current && camera && size) {
      // Get the current bounding box and center
      const boundingBox = new THREE.Box3().setFromObject(actualRef.current);
      const currentCenter = boundingBox.getCenter(new THREE.Vector3());

      // Move model to origin (0,0,0)
      actualRef.current.position.sub(currentCenter);

      // If specific dimensions are provided, align the model accordingly
      if (dimensions && (dimensions.x || dimensions.y || dimensions.z)) {
        const currentDimensions = boundingBox.getSize(new THREE.Vector3());
        const scaleX = dimensions.x ? dimensions.x / currentDimensions.x : 1;
        const scaleY = dimensions.y ? dimensions.y / currentDimensions.y : 1;
        const scaleZ = dimensions.z ? dimensions.z / currentDimensions.z : 1;
        actualRef.current.scale.set(scaleX, scaleY, scaleZ);
      }

      // Update bounding box after repositioning and scaling
      const newBoundingBox = new THREE.Box3().setFromObject(actualRef.current);
      const modelCenter = new THREE.Vector3(0, 0, 0); // Now at origin
      const finalDimensions = newBoundingBox.getSize(new THREE.Vector3());

      // Calculate the bounding sphere radius (no unit scaling needed here)
      const maxDimension = Math.max(finalDimensions.x, finalDimensions.y, finalDimensions.z);
      const sphereRadius = maxDimension / 2;

      // Calculate optimal camera distance to fit normalized model in viewport
      const viewportHeight = size.height;
      const viewportWidth = size.width;

      // Use vertical FOV to calculate distance
      const fovRadians = ((camera as any).fov * Math.PI) / 180;
      const distance = sphereRadius / Math.sin(fovRadians / 2);

      // Get model units for scaling grid and camera
      const modelUnits = file.metadata.units;
      const unitScale = modelUnits === 'mm' ? 1 : (modelUnits === 'cm' ? 10 : 25.4);

      // Scale camera distance based on units to ensure consistent model size
      const adjustedDistance = distance * unitScale;

      // Position camera to look at origin where model is now centered
      const direction = new THREE.Vector3(0, 0, 1);
      camera.position.copy(direction.multiplyScalar(adjustedDistance * 1.2));

      // Look at the origin (0,0,0)
      camera.lookAt(0, 0, 0);

      // Set appropriate near and far planes based on adjusted distance
      const nearPlane = Math.max(adjustedDistance * 0.01, 0.1);
      const farPlane = adjustedDistance * 100;
      camera.near = nearPlane;
      camera.far = farPlane;

      // Update camera matrices
      camera.updateProjectionMatrix();
    }
  }, [file, camera, size, actualRef, dimensions]);

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
  setModelTransform
}) => {
  const { camera, scene } = useThree();
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

  // Handle mouse events for drag and drop (disabled for now)
  const handlePointerMove = useCallback((event: any) => {
    // Drag and drop functionality temporarily disabled
  }, []);

  const handlePointerUp = useCallback(() => {
    // Drag and drop functionality temporarily disabled
  }, []);

  // Helper function to calculate optimal camera position for a model
  const calculateCameraPosition = useCallback((modelMesh: THREE.Mesh, orientation: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom' | 'iso' = 'front') => {
    if (!modelMesh) return new THREE.Vector3(0, 0, 5);

    const boundingBox = new THREE.Box3().setFromObject(modelMesh);
    const modelSize = boundingBox.getSize(new THREE.Vector3());
    const maxDimension = Math.max(modelSize.x, modelSize.y, modelSize.z);

    // Apply unit scaling for consistent display size across different units
    const modelUnits = currentFile?.metadata.units;
    const unitScale = modelUnits === 'mm' ? 1 : (modelUnits === 'cm' ? 10 : 25.4);
    const normalizedMaxDimension = maxDimension * unitScale;

    // Calculate appropriate camera distance (1.5x the normalized model size for comfortable viewing)
    const desiredDistance = normalizedMaxDimension * 1.5;

    const center = boundingBox.getCenter(new THREE.Vector3());

    switch (orientation) {
      case 'front':
        return center.clone().add(new THREE.Vector3(0, 0, desiredDistance));
      case 'back':
        return center.clone().add(new THREE.Vector3(0, 0, -desiredDistance));
      case 'left':
        return center.clone().add(new THREE.Vector3(-desiredDistance, 0, 0));
      case 'right':
        return center.clone().add(new THREE.Vector3(desiredDistance, 0, 0));
      case 'top':
        return center.clone().add(new THREE.Vector3(0, desiredDistance, 0));
      case 'bottom':
        return center.clone().add(new THREE.Vector3(0, -desiredDistance, 0));
      case 'iso':
        // Isometric view - 45 degrees from front and side
        return center.clone().add(new THREE.Vector3(desiredDistance * 0.7, desiredDistance * 0.7, desiredDistance * 0.7));
      default:
        return center.clone().add(new THREE.Vector3(0, 0, desiredDistance));
    }
  }, [currentFile]);

  // Helper function to determine optimal model orientation based on dimensions
  const getOptimalModelOrientation = useCallback((mesh: THREE.Mesh) => {
    const boundingBox = new THREE.Box3().setFromObject(mesh);
    const dimensions = boundingBox.getSize(new THREE.Vector3());

    // Find the face with the largest area (most stable base)
    const faces = [
      { axis: 'x', size: dimensions.x * dimensions.z, normal: new THREE.Vector3(0, 1, 0) }, // Bottom face (Y-up)
      { axis: 'y', size: dimensions.x * dimensions.y, normal: new THREE.Vector3(0, 0, 1) }, // Front face (Z-up)
      { axis: 'z', size: dimensions.y * dimensions.z, normal: new THREE.Vector3(1, 0, 0) }, // Side face (X-up)
    ];

    // Sort by area (largest first)
    faces.sort((a, b) => b.size - a.size);

    // Return the normal vector for the largest face (this should be pointing up)
    return faces[0].normal;
  }, []);

  // Helper function to orient model so largest face is down
  const orientModelForOptimalView = useCallback((mesh: THREE.Mesh) => {
    const optimalUp = getOptimalModelOrientation(mesh);

    // Create rotation matrix to align optimal face with Y-axis (up)
    const currentUp = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(optimalUp, currentUp);

    // Apply rotation to mesh
    mesh.quaternion.multiply(quaternion);

    // Update position after rotation (center at origin)
    const boundingBox = new THREE.Box3().setFromObject(mesh);
    const center = boundingBox.getCenter(new THREE.Vector3());
    mesh.position.sub(center);

    return mesh;
  }, [getOptimalModelOrientation]);

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

  // Auto-adjust camera when model loads
  React.useEffect(() => {
    if (currentFile && modelMeshRef.current) {
      const newPosition = calculateCameraPosition(modelMeshRef.current, 'iso');
      camera.position.copy(newPosition);
      camera.lookAt(modelMeshRef.current.position);
    }
  }, [currentFile, camera, calculateCameraPosition]);

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
        const newPosition = calculateCameraPosition(modelMeshRef.current, 'iso');
        camera.position.copy(newPosition);
        camera.lookAt(modelMeshRef.current.position);
      } else {
        // Reset camera to default isometric position (no model loaded)
        camera.position.set(3.5, 3.5, 3.5);
        camera.lookAt(0, 0, 0);
      }

      // Clear baseplate when resetting
      setBasePlate(null);
    };

    window.addEventListener('viewer-reset', handleViewReset as EventListener);
    return () => window.removeEventListener('viewer-reset', handleViewReset as EventListener);
  }, [camera, calculateCameraPosition, currentFile]);

  // Handle view orientation events
  React.useEffect(() => {
    const handleViewOrientation = (e: CustomEvent) => {
      const orientation = e.detail;

      if (currentFile && modelMeshRef.current) {
        // Set camera position based on orientation and model size/units
        const newPosition = calculateCameraPosition(modelMeshRef.current, orientation as any);
        camera.position.copy(newPosition);
        camera.lookAt(modelMeshRef.current.position);
      } else {
        // Fallback to fixed positions when no model is loaded
        switch (orientation) {
          case 'front':
            camera.position.set(0, 0, 5);
            camera.lookAt(0, 0, 0);
            break;
          case 'back':
            camera.position.set(0, 0, -5);
            camera.lookAt(0, 0, 0);
            break;
          case 'left':
            camera.position.set(-5, 0, 0);
            camera.lookAt(0, 0, 0);
            break;
          case 'right':
            camera.position.set(5, 0, 0);
            camera.lookAt(0, 0, 0);
            break;
          case 'top':
            camera.position.set(0, 5, 0);
            camera.lookAt(0, 0, 0);
            break;
          case 'bottom':
            camera.position.set(0, -5, 0);
            camera.lookAt(0, 0, 0);
            break;
          case 'iso':
            // Isometric view - 45 degrees from front and side
            camera.position.set(3.5, 3.5, 3.5);
            camera.lookAt(0, 0, 0);
            break;
          default:
            console.warn('Unknown orientation:', orientation);
        }
      }
    };

    window.addEventListener('viewer-orientation', handleViewOrientation as EventListener);
    return () => window.removeEventListener('viewer-orientation', handleViewOrientation as EventListener);
  }, [camera, calculateCameraPosition, currentFile]);

  // Handle clear/reset events
  React.useEffect(() => {
    const handleClear = (e: CustomEvent) => {
      // Reset camera to default position (front view) looking at origin
      camera.position.set(0, 0, 5);
      camera.lookAt(0, 0, 0);

      // Clear all state including baseplate
      setPlacedComponents([]);
      setSelectedComponent(null);
      setBasePlate(null);
      setModelDimensions(undefined);
    };

    window.addEventListener('viewer-clear', handleClear as EventListener);
    return () => window.removeEventListener('viewer-clear', handleClear as EventListener);
  }, [camera, setModelDimensions]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <directionalLight position={[-10, -10, -5]} intensity={0.5} castShadow />
      <pointLight position={[0, 10, 0]} intensity={0.3} />
      <pointLight position={[0, -10, 0]} intensity={0.3} />

      {/* Environment */}
      <Environment preset="warehouse" />

      {/* Grid - centered at origin, scaled based on model units */}
      <Grid
        position={[0, -0.01, 0]}
        cellSize={currentFile ? (currentFile.metadata.units === 'mm' ? 1 : (currentFile.metadata.units === 'cm' ? 10 : 25.4)) : 1}
        cellThickness={0.5}
        cellColor="#6f6f6f"
        sectionSize={currentFile ? (currentFile.metadata.units === 'mm' ? 10 : (currentFile.metadata.units === 'cm' ? 100 : 254)) : 10}
        sectionThickness={1}
        sectionColor="#9d4edd"
        fadeDistance={currentFile ? 300 : 30}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={true}
      />

      {/* Contact shadows for better depth perception - centered at origin */}
      <ContactShadows
        position={[0, -0.01, 0]}
        opacity={0.4}
        scale={currentFile ? (currentFile.metadata.units === 'mm' ? 20 : (currentFile.metadata.units === 'cm' ? 200 : 508)) : 20}
        blur={1}
        far={currentFile ? (currentFile.metadata.units === 'mm' ? 10 : (currentFile.metadata.units === 'cm' ? 100 : 254)) : 10}
        resolution={256}
        color="#000000"
      />

      {/* Bottom-left XYZ axes */}
      <XYZAxes3D />

      {/* Center cross axes - larger for initial view, smaller when model is loaded */}
      <CenterCross length={currentFile ? (currentFile.metadata.units === 'mm' ? 30 : (currentFile.metadata.units === 'cm' ? 300 : 762)) : 100} />

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
          <ModelMesh file={currentFile} meshRef={modelMeshRef} dimensions={modelDimensions} colorsMap={modelColors} setColorsMap={setModelColors} />
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
      <OrbitControls
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
