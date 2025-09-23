import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

interface ViewCubeProps {
  onViewChange: (orientation: string) => void;
  className?: string;
}

const ViewCube: React.FC<ViewCubeProps> = ({ onViewChange, className = '' }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const cubeRef = useRef<THREE.Group>();
  const [hoveredFace, setHoveredFace] = useState<string | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(100, 100);
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    // Cube setup
    const cubeGroup = new THREE.Group();
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    
    // Face materials with labels
    const materials = [
      new THREE.MeshBasicMaterial({ color: 0x4a90e2, transparent: true, opacity: 0.8 }), // Right
      new THREE.MeshBasicMaterial({ color: 0x4a90e2, transparent: true, opacity: 0.8 }), // Left
      new THREE.MeshBasicMaterial({ color: 0x50c878, transparent: true, opacity: 0.8 }), // Top
      new THREE.MeshBasicMaterial({ color: 0x50c878, transparent: true, opacity: 0.8 }), // Bottom
      new THREE.MeshBasicMaterial({ color: 0xe25440, transparent: true, opacity: 0.8 }), // Front
      new THREE.MeshBasicMaterial({ color: 0xe25440, transparent: true, opacity: 0.8 })  // Back
    ];

    const cube = new THREE.Mesh(geometry, materials);
    cubeGroup.add(cube);

    // Add wireframe
    const wireframe = new THREE.WireframeGeometry(geometry);
    const line = new THREE.LineSegments(wireframe, new THREE.LineBasicMaterial({ color: 0x000000, opacity: 0.3, transparent: true }));
    cubeGroup.add(line);

    // Add face labels using canvas sprites
    const labelTexts = ['R', 'L', 'T', 'B', 'F', 'K']; // Right, Left, Top, Bottom, Front, Back
    const labelPositions = [
      new THREE.Vector3(0.51, 0, 0),    // Right
      new THREE.Vector3(-0.51, 0, 0),   // Left  
      new THREE.Vector3(0, 0.51, 0),    // Top
      new THREE.Vector3(0, -0.51, 0),   // Bottom
      new THREE.Vector3(0, 0, 0.51),    // Front
      new THREE.Vector3(0, 0, -0.51)    // Back
    ];
    
    labelTexts.forEach((text, index) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = 64;
      canvas.height = 64;
      
      context.fillStyle = 'white';
      context.font = 'bold 32px system-ui';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, 32, 32);
      
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ 
        map: texture, 
        transparent: true,
        opacity: 0.9
      });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.copy(labelPositions[index]);
      sprite.scale.set(0.3, 0.3, 1);
      cubeGroup.add(sprite);
    });

    scene.add(cubeGroup);
    camera.position.set(2, 2, 2);
    camera.lookAt(0, 0, 0);

    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;
    cubeRef.current = cubeGroup;

    // Raycaster for mouse interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const deltaMove = {
          x: event.clientX - previousMousePosition.x,
          y: event.clientY - previousMousePosition.y
        };
        cubeGroup.rotation.y += deltaMove.x * 0.01;
        cubeGroup.rotation.x += deltaMove.y * 0.01;
      } else {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(cube);

        if (intersects.length > 0) {
          const faceIndex = intersects[0].face?.materialIndex;
          const faceNames = ['right', 'left', 'top', 'bottom', 'front', 'back'];
          setHoveredFace(faceNames[faceIndex || 0]);
          renderer.domElement.style.cursor = 'pointer';
        } else {
          setHoveredFace(null);
          renderer.domElement.style.cursor = 'default';
        }
      }

      previousMousePosition = { x: event.clientX, y: event.clientY };
    };

    const handleMouseDown = (event: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: event.clientX, y: event.clientY };
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleClick = (event: MouseEvent) => {
      if (isDragging) return; // Don't handle click if we were dragging
      
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(cube);

      if (intersects.length > 0) {
        const faceIndex = intersects[0].face?.materialIndex;
        const faceNames = ['right', 'left', 'top', 'bottom', 'front', 'back'];
        onViewChange(faceNames[faceIndex || 0]);
      }
    };

    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('click', handleClick);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('click', handleClick);
      mountRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [onViewChange]);

  // Update cube colors based on hover
  useEffect(() => {
    if (!cubeRef.current) return;
    
    const cube = cubeRef.current.children[0] as THREE.Mesh;
    const materials = cube.material as THREE.MeshBasicMaterial[];
    
    materials.forEach((material, index) => {
      const faceNames = ['right', 'left', 'top', 'bottom', 'front', 'back'];
      if (hoveredFace === faceNames[index]) {
        material.opacity = 1;
      } else {
        material.opacity = 0.8;
      }
    });
  }, [hoveredFace]);

  return (
    <div 
      ref={mountRef} 
      className={`view-cube ${className}`}
      style={{ width: '100px', height: '100px' }}
    />
  );
};

export default ViewCube;