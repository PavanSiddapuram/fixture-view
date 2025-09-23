import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ViewerConfig, ViewOrientation, ViewerHandle, DEFAULT_VIEWER_CONFIG } from '../types';

// Create viewer axes that will be positioned in bottom-left and rotate with camera
function createViewerAxes(): THREE.Group {
  const axesGroup = new THREE.Group();
  
  // X Axis (Red)
  const xGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.8, 8);
  const xMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const xAxis = new THREE.Mesh(xGeometry, xMaterial);
  xAxis.rotation.z = -Math.PI / 2;
  xAxis.position.x = 0.4;
  axesGroup.add(xAxis);

  // X Arrow
  const xArrowGeometry = new THREE.ConeGeometry(0.02, 0.08, 8);
  const xArrow = new THREE.Mesh(xArrowGeometry, xMaterial);
  xArrow.rotation.z = -Math.PI / 2;
  xArrow.position.x = 0.84;
  axesGroup.add(xArrow);

  // Y Axis (Green)
  const yGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.8, 8);
  const yMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const yAxis = new THREE.Mesh(yGeometry, yMaterial);
  yAxis.position.y = 0.4;
  axesGroup.add(yAxis);

  // Y Arrow
  const yArrowGeometry = new THREE.ConeGeometry(0.02, 0.08, 8);
  const yArrow = new THREE.Mesh(yArrowGeometry, yMaterial);
  yArrow.position.y = 0.84;
  axesGroup.add(yArrow);

  // Z Axis (Blue)
  const zGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.8, 8);
  const zMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
  const zAxis = new THREE.Mesh(zGeometry, zMaterial);
  zAxis.rotation.x = Math.PI / 2;
  zAxis.position.z = 0.4;
  axesGroup.add(zAxis);

  // Z Arrow
  const zArrowGeometry = new THREE.ConeGeometry(0.02, 0.08, 8);
  const zArrow = new THREE.Mesh(zArrowGeometry, zMaterial);
  zArrow.rotation.x = Math.PI / 2;
  zArrow.position.z = 0.84;
  axesGroup.add(zArrow);

  // Add labels
  const labels = [
    { text: 'X', position: new THREE.Vector3(1, 0, 0), color: 0xff0000 },
    { text: 'Y', position: new THREE.Vector3(0, 1, 0), color: 0x00ff00 },
    { text: 'Z', position: new THREE.Vector3(0, 0, 1), color: 0x0000ff }
  ];

  labels.forEach((label) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 32;
    canvas.height = 32;
    
    context.fillStyle = `#${label.color.toString(16).padStart(6, '0')}`;
    context.font = 'bold 24px system-ui';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(label.text, 16, 16);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ 
      map: texture, 
      transparent: true
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.copy(label.position);
    sprite.scale.set(0.15, 0.15, 1);
    axesGroup.add(sprite);
  });

  return axesGroup;
}

// Update viewer axes position and orientation based on camera
function updateViewerAxes(axesGroup: THREE.Group, camera: THREE.PerspectiveCamera) {
  // Position in bottom-left corner of the view
  const position = new THREE.Vector3();
  camera.getWorldPosition(position);
  
  // Get camera direction
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  
  // Position axes relative to camera (bottom-left corner)
  const rightVector = new THREE.Vector3();
  const upVector = new THREE.Vector3();
  
  rightVector.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
  upVector.setFromMatrixColumn(camera.matrixWorld, 1).normalize();
  
  // Calculate position for bottom-left corner
  const distance = 2; // Distance from camera
  const offsetRight = rightVector.clone().multiplyScalar(-1.5);
  const offsetUp = upVector.clone().multiplyScalar(-1.2);
  const offsetForward = direction.clone().multiplyScalar(distance);
  
  axesGroup.position.copy(position)
    .add(offsetForward)
    .add(offsetRight)
    .add(offsetUp);
  
  // Keep axes oriented with world coordinates (don't rotate with camera)
  axesGroup.rotation.set(0, 0, 0);
}

interface UseViewerReturn extends ViewerHandle {
  isReady: boolean;
}

export function useViewer(
  containerRef: React.RefObject<HTMLDivElement | null>,
  config: ViewerConfig = DEFAULT_VIEWER_CONFIG
): UseViewerReturn {
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshesRef = useRef<THREE.Mesh[]>([]);
  const animationIdRef = useRef<number | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const axesHelperRef = useRef<THREE.AxesHelper | null>(null);
  const viewerAxesRef = useRef<THREE.Group | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize Three.js scene
  const initializeScene = useCallback(() => {
    if (!containerRef.current || isInitializedRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(config.backgroundColor);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, rect.width / rect.height, 0.1, 1000);
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: config.antialias,
      alpha: true 
    });
    renderer.setSize(rect.width, rect.height);
    renderer.setPixelRatio(config.pixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    rendererRef.current = renderer;

    // Controls
    if (config.enableOrbitControls) {
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 1;
      controls.maxDistance = 100;
      controls.enablePan = true;
      controls.enableZoom = true;
      controlsRef.current = controls;
    }

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.3);
    scene.add(hemisphereLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    scene.add(directionalLight);

    // Grid helper
    if (config.showGrid) {
      const gridHelper = new THREE.GridHelper(config.gridSize, config.gridSize);
      gridHelper.material.color.setHex(0x333333);
      gridHelper.material.opacity = 0.5;
      gridHelper.material.transparent = true;
      scene.add(gridHelper);
      gridHelperRef.current = gridHelper;
    }

    // Custom viewer axes (bottom-left corner)
    const viewerAxes = createViewerAxes();
    scene.add(viewerAxes);
    viewerAxesRef.current = viewerAxes;

    // Standard axes helper (optional, can be disabled)
    if (config.showAxes) {
      const axesHelper = new THREE.AxesHelper(2);
      scene.add(axesHelper);
      axesHelperRef.current = axesHelper;
    }

    // Add to container
    container.appendChild(renderer.domElement);

    // Start render loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // Update viewer axes to match camera orientation
      if (viewerAxesRef.current && cameraRef.current) {
        updateViewerAxes(viewerAxesRef.current, cameraRef.current);
      }
      
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      
      const newRect = containerRef.current.getBoundingClientRect();
      camera.aspect = newRect.width / newRect.height;
      camera.updateProjectionMatrix();
      renderer.setSize(newRect.width, newRect.height);
    };

    window.addEventListener('resize', handleResize);
    isInitializedRef.current = true;

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      isInitializedRef.current = false;
    };
  }, [containerRef, config]);

  // Initialize when container is available
  useEffect(() => {
    if (containerRef.current) {
      return initializeScene();
    }
  }, [initializeScene]);

  // Event listeners for app shell communication
  useEffect(() => {
    const handleReset = () => resetView();
    const handleOrientation = (e: CustomEvent) => setOrientation(e.detail);

    window.addEventListener('viewer-reset', handleReset);
    window.addEventListener('viewer-orientation', handleOrientation as EventListener);

    return () => {
      window.removeEventListener('viewer-reset', handleReset);
      window.removeEventListener('viewer-orientation', handleOrientation as EventListener);
    };
  }, []);

  const addMesh = useCallback((mesh: THREE.Mesh) => {
    if (!sceneRef.current) return;

    sceneRef.current.add(mesh);
    meshesRef.current.push(mesh);
  }, []);

  const removeMesh = useCallback((mesh: THREE.Mesh) => {
    if (!sceneRef.current) return;

    sceneRef.current.remove(mesh);
    const index = meshesRef.current.indexOf(mesh);
    if (index > -1) {
      meshesRef.current.splice(index, 1);
    }
  }, []);

  const computeBoundingSphere = useCallback((): THREE.Sphere | null => {
    if (meshesRef.current.length === 0) return null;

    const box = new THREE.Box3();
    meshesRef.current.forEach(mesh => {
      box.expandByObject(mesh);
    });

    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);
    return sphere;
  }, []);

  const fitToView = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;

    const boundingSphere = computeBoundingSphere();
    if (!boundingSphere) return;

    const camera = cameraRef.current;
    const controls = controlsRef.current;

    // Calculate distance to fit the object in view
    const fov = camera.fov * (Math.PI / 180);
    const distance = Math.abs(boundingSphere.radius / Math.sin(fov / 2)) * 1.2;

    // Position camera
    const direction = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
    camera.position.copy(boundingSphere.center).add(direction.multiplyScalar(distance));
    
    controls.target.copy(boundingSphere.center);
    controls.minDistance = distance * 0.1;
    controls.maxDistance = distance * 10;
    controls.update();
  }, [computeBoundingSphere]);

  const resetView = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;

    const boundingSphere = computeBoundingSphere();
    if (boundingSphere) {
      // Center models at origin and fit to view
      meshesRef.current.forEach(mesh => {
        mesh.position.sub(boundingSphere.center);
        mesh.position.y += boundingSphere.radius; // Sit on ground
      });
      
      // Reset camera position
      cameraRef.current.position.set(5, 5, 5);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
      
      fitToView();
    } else {
      // Default view when no meshes
      cameraRef.current.position.set(5, 5, 5);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [computeBoundingSphere, fitToView]);

  const setOrientation = useCallback((orientation: ViewOrientation) => {
    if (!cameraRef.current || !controlsRef.current) return;

    const boundingSphere = computeBoundingSphere();
    const center = boundingSphere?.center || new THREE.Vector3(0, 0, 0);
    const radius = boundingSphere?.radius || 5;
    const distance = radius * 3;

    const camera = cameraRef.current;
    const controls = controlsRef.current;

    let position: THREE.Vector3;

    switch (orientation) {
      case 'front':
        position = new THREE.Vector3(0, 0, distance);
        break;
      case 'back':
        position = new THREE.Vector3(0, 0, -distance);
        break;
      case 'left':
        position = new THREE.Vector3(-distance, 0, 0);
        break;
      case 'right':
        position = new THREE.Vector3(distance, 0, 0);
        break;
      case 'top':
        position = new THREE.Vector3(0, distance, 0);
        break;
      case 'bottom':
        position = new THREE.Vector3(0, -distance, 0);
        break;
      case 'iso':
      default:
        position = new THREE.Vector3(distance * 0.7, distance * 0.7, distance * 0.7);
        break;
    }

    position.add(center);
    camera.position.copy(position);
    controls.target.copy(center);
    controls.update();
  }, [computeBoundingSphere]);

  const dispose = useCallback(() => {
    // Clean up meshes
    meshesRef.current.forEach(mesh => {
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });
    meshesRef.current = [];

    // Clean up Three.js objects
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }
    if (rendererRef.current) {
      rendererRef.current.dispose();
    }
    if (controlsRef.current) {
      controlsRef.current.dispose();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => dispose();
  }, [dispose]);

  return {
    addMesh,
    removeMesh,
    resetView,
    setOrientation,
    fitToView,
    dispose,
    isReady: isInitializedRef.current,
  };
}