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
function ModelMesh({ file, meshRef, dimensions }: { file: ProcessedFile; meshRef?: React.RefObject<THREE.Mesh>; dimensions?: { x?: number; y?: number; z?: number } }) {
  const internalRef = useRef<THREE.Mesh>(null);
  const { camera, size } = useThree();
  const actualRef = meshRef || internalRef;

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

      // Calculate the bounding sphere radius
      const maxDimension = Math.max(finalDimensions.x, finalDimensions.y, finalDimensions.z);
      const sphereRadius = maxDimension / 2;

      // Calculate optimal camera distance to fit model in viewport
      const viewportHeight = size.height;
      const viewportWidth = size.width;

      // Use vertical FOV to calculate distance
      const fovRadians = ((camera as any).fov * Math.PI) / 180;
      const distance = sphereRadius / Math.sin(fovRadians / 2);

      // Position camera to look at origin where model is now centered
      const direction = new THREE.Vector3(0, 0, 1);
      camera.position.copy(direction.multiplyScalar(distance * 1.2));

      // Look at the origin (0,0,0)
      camera.lookAt(0, 0, 0);

      // Set appropriate near and far planes
      const nearPlane = Math.max(distance * 0.01, 0.1);
      const farPlane = distance * 100;
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
    type: 'rectangular' | 'circular';
    width?: number;
    height?: number;
    depth?: number;
    radius?: number;
    position?: THREE.Vector3;
    material?: 'metal' | 'wood' | 'plastic';
  } | null>(null);
  const modelMeshRef = useRef<THREE.Mesh>(null);
  const [modelDimensions, setModelDimensions] = useState<{ x?: number; y?: number; z?: number } | undefined>();
  const [orbitControlsEnabled, setOrbitControlsEnabled] = useState(true);

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

      // Base plate dimensions - centered at origin
      let basePlateConfig: typeof basePlate = {
        type: type as 'rectangular' | 'circular',
        position: new THREE.Vector3(0, -dimensions.height / 2, 0), // Centered at origin
        material: option as 'metal' | 'wood' | 'plastic',
        depth: dimensions.height
      };

      if (type === 'rectangular') {
        basePlateConfig.width = Math.max(dimensions.width || 100, 50);
        basePlateConfig.height = Math.max(dimensions.length || 100, 50);
      } else {
        basePlateConfig.radius = Math.max(dimensions.radius || 50, 25);
      }

      setBasePlate(basePlateConfig);
    };

    window.addEventListener('create-baseplate', handleCreateBaseplate as EventListener);
    return () => window.removeEventListener('create-baseplate', handleCreateBaseplate as EventListener);
  }, [selectedComponent]);

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
      // Calculate model bounds
      const boundingBox = new THREE.Box3().setFromObject(modelMeshRef.current);
      const modelSize = boundingBox.getSize(new THREE.Vector3());
      const maxDimension = Math.max(modelSize.x, modelSize.y, modelSize.z);

      // Calculate appropriate camera distance (1.5x the model size for comfortable viewing)
      const desiredDistance = maxDimension * 1.5;

      // Position camera to frame the model nicely
      const center = boundingBox.getCenter(new THREE.Vector3());
      const direction = new THREE.Vector3(0, 0, 1); // Front view direction

      // Position camera at a good distance from the model center
      const newPosition = center.clone().add(direction.multiplyScalar(desiredDistance));

      // Update camera position smoothly
      camera.position.copy(newPosition);
      camera.lookAt(center);
    }
  }, [currentFile, camera]);

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
      // Reset camera to default position (front view) looking at origin
      camera.position.set(0, 0, 5);
      camera.lookAt(0, 0, 0);
    };

    window.addEventListener('viewer-reset', handleViewReset as EventListener);
    return () => window.removeEventListener('viewer-reset', handleViewReset as EventListener);
  }, [camera]);

  // Handle view orientation events
  React.useEffect(() => {
    const handleViewOrientation = (e: CustomEvent) => {
      const orientation = e.detail;

      // Set camera position based on orientation
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
    };

    window.addEventListener('viewer-orientation', handleViewOrientation as EventListener);
    return () => window.removeEventListener('viewer-orientation', handleViewOrientation as EventListener);
  }, [camera]);

  // Handle clear/reset events
  React.useEffect(() => {
    const handleClear = (e: CustomEvent) => {
      // Reset camera to default position
      camera.position.set(0, 0, 5);
      camera.lookAt(0, 0, 0);

      // Clear all state
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

      {/* Grid - centered at origin */}
      <Grid
        position={[0, -0.01, 0]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#6f6f6f"
        sectionSize={10}
        sectionThickness={1}
        sectionColor="#9d4edd"
        fadeDistance={30}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={true}
      />

      {/* Contact shadows for better depth perception - centered at origin */}
      <ContactShadows
        position={[0, -0.01, 0]}
        opacity={0.4}
        scale={20}
        blur={1}
        far={10}
        resolution={256}
        color="#000000"
      />

      {/* Bottom-left XYZ axes */}
      <XYZAxes3D />

      {/* Center cross axes - larger for initial view, smaller when model is loaded */}
      <CenterCross length={currentFile ? 30 : 100} />

      {/* Base plate */}
      {basePlate && (
        <BasePlate
          type={basePlate.type}
          width={basePlate.width}
          height={basePlate.height}
          depth={basePlate.depth}
          radius={basePlate.radius}
          position={basePlate.position}
          material={basePlate.material}
        />
      )}

      {/* Main 3D model - show in both normal and transform modes */}
      {currentFile && (
        <group>
          <ModelMesh file={currentFile} meshRef={modelMeshRef} dimensions={modelDimensions} />
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
