import React, { useRef, useState, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, ContactShadows, Text, Line } from '@react-three/drei';
import { useDragDrop } from '@/hooks/useDragDrop';
import BasePlate from "./BasePlate";
import { ProcessedFile } from "@/modules/FileImport/types";
import ModelTransformControls from './ModelTransformControls';
import * as THREE from 'three';

interface R3FViewerProps {
  currentFile: ProcessedFile | null;
  isProcessing: boolean;
  onComponentPlaced?: (component: any, position: any) => void;
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
function ModelMesh({ file }: { file: ProcessedFile }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera, size } = useThree();

  // Center model at origin and fit to viewport
  React.useEffect(() => {
    if (meshRef.current && camera && size) {
      // Get the current bounding box and center
      const boundingBox = new THREE.Box3().setFromObject(meshRef.current);
      const currentCenter = boundingBox.getCenter(new THREE.Vector3());

      // Move model to origin (0,0,0)
      meshRef.current.position.sub(currentCenter);

      // Update bounding box after repositioning
      const newBoundingBox = new THREE.Box3().setFromObject(meshRef.current);
      const modelCenter = new THREE.Vector3(0, 0, 0); // Now at origin
      const dimensions = newBoundingBox.getSize(new THREE.Vector3());

      // Calculate the bounding sphere radius
      const maxDimension = Math.max(dimensions.x, dimensions.y, dimensions.z);
      const sphereRadius = maxDimension / 2;

      // Calculate optimal camera distance to fit model in viewport
      const viewportHeight = size.height;
      const viewportWidth = size.width;

      // Use vertical FOV to calculate distance
      const fovRadians = (camera.fov * Math.PI) / 180;
      const distance = sphereRadius / Math.sin(fovRadians / 2);

      // Position camera to look at origin where model is now centered
      const direction = new THREE.Vector3(0, 0, 1);
      camera.position.copy(direction.multiplyScalar(distance * 1.2));

      // Look at the origin (0,0,0)
      camera.lookAt(0, 0, 0);

      // Set appropriate near and far planes
      const nearPlane = Math.max(distance * 0.1, 0.1);
      const farPlane = distance * 10;
      camera.near = nearPlane;
      camera.far = farPlane;

      // Update camera matrices
      camera.updateProjectionMatrix();

      console.log('Model centered at origin:', {
        modelCenter: modelCenter,
        modelSize: maxDimension,
        cameraDistance: distance * 1.2,
        nearPlane,
        farPlane,
        viewportSize: { width: viewportWidth, height: viewportHeight }
      });
    }
  }, [file, camera, size]);

  useFrame(() => {
    if (meshRef.current) {
      // Optional: Add subtle rotation for better visualization
      // meshRef.current.rotation.y += 0.001;
    }
  });

  return (
    <mesh ref={meshRef} geometry={file.mesh.geometry} material={file.mesh.material} />
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

// Drag preview component
function DragPreview({ 
  component, 
  position, 
  isValid 
}: { 
  component: any; 
  position: THREE.Vector3; 
  isValid: boolean;
}) {
  const previewMaterial = React.useMemo(() => {
    const material = component.material.clone();
    material.transparent = true;
    material.opacity = 0.5;
    material.color.setHex(isValid ? 0x3b82f6 : 0xef4444); // Blue for valid, red for invalid
    return material;
  }, [component.material, isValid]);

  return (
    <mesh position={position} geometry={component.geometry} material={previewMaterial}>
      <meshBasicMaterial 
        color={isValid ? 0x3b82f6 : 0xef4444} 
        transparent 
        opacity={0.3} 
        wireframe 
      />
    </mesh>
  );
}

// Main scene component
function Scene({
  currentFile,
  onComponentPlaced
}: {
  currentFile: ProcessedFile | null;
  onComponentPlaced?: (component: any, position: THREE.Vector3) => void;
}) {
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
  const [transformEnabled, setTransformEnabled] = useState(false);
  const [modelTransform, setModelTransform] = useState<{
    position: THREE.Vector3;
    rotation: THREE.Euler;
    scale: THREE.Vector3;
  }>({
    position: new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Euler(0, 0, 0),
    scale: new THREE.Vector3(1, 1, 1)
  });

  // Temporarily disable drag and drop to fix the void return type issue
  // const { dragDropState, startDrag, updateDrag, endDrag } = useDragDrop();

  // Handle mouse events for drag and drop (disabled for now)
  const handlePointerMove = useCallback((event: any) => {
    // Drag and drop functionality temporarily disabled
    // if (dragDropState?.isDragging) {
    //   const mousePosition = new THREE.Vector2(
    //     (event.clientX / window.innerWidth) * 2 - 1,
    //     -(event.clientY / window.innerHeight) * 2 + 1
    //   );
    //   updateDrag(mousePosition, camera, scene);
    // }
  }, []);

  const handlePointerUp = useCallback(() => {
    // Drag and drop functionality temporarily disabled
    // if (dragDropState?.isDragging && dragDropState?.draggedComponent) {
    //   const finalPosition = endDrag();
    //   if (finalPosition && 'x' in finalPosition && 'y' in finalPosition && 'z' in finalPosition) {
    //     const newComponent = {
    //       component: dragDropState.draggedComponent,
    //       position: finalPosition,
    //       id: `component-${Date.now()}`
    //     };
    //     setPlacedComponents(prev => [...prev, newComponent]);
    //     onComponentPlaced?.(dragDropState.draggedComponent, finalPosition);
    //   }
    // }
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
      setTransformEnabled(prev => !prev);
    };

    window.addEventListener('toggle-transform-mode', handleToggleTransform as EventListener);
    return () => window.removeEventListener('toggle-transform-mode', handleToggleTransform as EventListener);
  }, []);

  // Handle view reset events
  React.useEffect(() => {
    const handleViewReset = (e: CustomEvent) => {
      // Reset camera to default position (front view) looking at origin
      camera.position.set(0, 0, 5);
      camera.lookAt(0, 0, 0);
      console.log('Camera reset to front view');
    };

    window.addEventListener('viewer-reset', handleViewReset as EventListener);
    return () => window.removeEventListener('viewer-reset', handleViewReset as EventListener);
  }, [camera]);
  React.useEffect(() => {
    const handleViewOrientation = (e: CustomEvent) => {
      const orientation = e.detail;
      console.log('Setting view orientation:', orientation);

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
      console.log('Clearing viewer state');

      // Reset camera to default position
      camera.position.set(0, 0, 5);
      camera.lookAt(0, 0, 0);

      // Clear all state
      setPlacedComponents([]);
      setSelectedComponent(null);
      setBasePlate(null);
      setTransformEnabled(false);
      setModelTransform({
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Euler(0, 0, 0),
        scale: new THREE.Vector3(1, 1, 1)
      });

      console.log('Viewer state cleared completely');
    };

    window.addEventListener('viewer-clear', handleClear as EventListener);
    return () => window.removeEventListener('viewer-clear', handleClear as EventListener);
  }, [camera]);

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

      {/* Center cross axes */}
      <CenterCross length={currentFile ? 50 : 100} />

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

      {/* Main 3D model - only when transform is disabled */}
      {currentFile && !transformEnabled && (
        <group>
          <ModelMesh file={currentFile} />
        </group>
      )}

      {/* Transform controls - only when enabled */}
      {currentFile && transformEnabled && (
        <ModelTransformControls
          model={currentFile.mesh}
          position={modelTransform.position}
          onTransform={setModelTransform}
          enabled={transformEnabled}
          snapToGrid={true}
          gridSize={5}
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

      {/* Drag preview - temporarily disabled */}
      {/* {dragDropState.isDragging && dragDropState.draggedComponent && dragDropState.snapPoint && (
        <DragPreview
          component={dragDropState.draggedComponent}
          position={dragDropState.snapPoint}
          isValid={true} // TODO: Implement collision detection
        />
      )} */}

      {/* Event handlers */}
      <mesh
        position={[0, 0, 0]}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        visible={false}
      >
        <planeGeometry args={[1000, 1000]} />
      </mesh>

      {/* Orbit Controls - only rotate when transform is disabled */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={!transformEnabled}
        minDistance={1}
        maxDistance={100}
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
}

const R3FViewer: React.FC<R3FViewerProps> = ({ 
  currentFile, 
  isProcessing, 
  onComponentPlaced 
}) => {
  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{
          position: [0, 0, 5],
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        shadows
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        }}
        style={{ background: 'white' }}
      >
        <Scene currentFile={currentFile} onComponentPlaced={onComponentPlaced} />
      </Canvas>

      {/* Processing overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-background/20 backdrop-blur-sm flex items-center justify-center">
          <div className="tech-glass p-6 rounded-lg border border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin-smooth" />
              <span className="font-tech text-sm">Processing 3D model...</span>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!currentFile && !isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center tech-glass p-6 rounded-lg border border-border/50">
            <h3 className="font-tech font-semibold text-lg mb-2">3D Viewer</h3>
            <p className="text-sm text-muted-foreground font-tech">
              Upload a 3D model to start designing fixtures
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default R3FViewer;
