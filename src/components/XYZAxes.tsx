import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';

interface XYZAxesProps {
  className?: string;
}

const XYZAxes: React.FC<XYZAxesProps> = ({ className = '' }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const axesGroupRef = useRef<THREE.Group | null>(null);
  const [cameraQuaternion, setCameraQuaternion] = useState<[number, number, number, number]>([0, 0, 0, 1]);

  // Memoize textures to prevent recreation
  const textures = useMemo(() => {
    const labels = [
      { text: 'X', color: 0xff0000 },
      { text: 'Y', color: 0x00ff00 },
      { text: 'Z', color: 0x0000ff }
    ];

    return labels.map((label) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = 64;
      canvas.height = 64;

      context.fillStyle = `#${label.color.toString(16).padStart(6, '0')}`;
      context.font = 'bold 32px system-ui';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(label.text, 32, 32);

      const texture = new THREE.CanvasTexture(canvas);
      texture.generateMipmaps = false;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      return { texture, label };
    });
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setSize(80, 80);
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
    mountRef.current.appendChild(renderer.domElement);

    // Store references
    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;

    // Create axes
    const axesGroup = new THREE.Group();

    // X Axis (Red)
    const xGeometry = new THREE.CylinderGeometry(0.02, 0.02, 2, 8);
    const xMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const xAxis = new THREE.Mesh(xGeometry, xMaterial);
    xAxis.rotation.z = -Math.PI / 2;
    xAxis.position.x = 1;
    axesGroup.add(xAxis);

    // X Arrow
    const xArrowGeometry = new THREE.ConeGeometry(0.05, 0.2, 8);
    const xArrow = new THREE.Mesh(xArrowGeometry, xMaterial);
    xArrow.rotation.z = -Math.PI / 2;
    xArrow.position.x = 2.1;
    axesGroup.add(xArrow);

    // Y Axis (Green)
    const yGeometry = new THREE.CylinderGeometry(0.02, 0.02, 2, 8);
    const yMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const yAxis = new THREE.Mesh(yGeometry, yMaterial);
    yAxis.position.y = 1;
    axesGroup.add(yAxis);

    // Y Arrow
    const yArrowGeometry = new THREE.ConeGeometry(0.05, 0.2, 8);
    const yArrow = new THREE.Mesh(yArrowGeometry, yMaterial);
    yArrow.position.y = 2.1;
    axesGroup.add(yArrow);

    // Z Axis (Blue)
    const zGeometry = new THREE.CylinderGeometry(0.02, 0.02, 2, 8);
    const zMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const zAxis = new THREE.Mesh(zGeometry, zMaterial);
    zAxis.rotation.x = Math.PI / 2;
    zAxis.position.z = 1;
    axesGroup.add(zAxis);

    // Z Arrow
    const zArrowGeometry = new THREE.ConeGeometry(0.05, 0.2, 8);
    const zArrow = new THREE.Mesh(zArrowGeometry, zMaterial);
    zArrow.rotation.x = Math.PI / 2;
    zArrow.position.z = 2.1;
    axesGroup.add(zArrow);

    // Add labels using pre-created textures
    textures.forEach(({ texture, label }, index) => {
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true
      });
      const sprite = new THREE.Sprite(spriteMaterial);

      // Position labels
      if (index === 0) sprite.position.set(2.4, 0, 0);      // X
      else if (index === 1) sprite.position.set(0, 2.4, 0); // Y
      else sprite.position.set(0, 0, 2.4);                 // Z

      sprite.scale.set(0.4, 0.4, 1);
      axesGroup.add(sprite);
    });

    scene.add(axesGroup);
    axesGroupRef.current = axesGroup;

    // Listen for camera changes from main viewer
    const handleCameraChange = (e: CustomEvent) => {
      const { q } = e.detail;
      if (q && Array.isArray(q)) {
        setCameraQuaternion(q as [number, number, number, number]);
      }
    };

    // Animation loop with camera synchronization
    const animate = () => {
      requestAnimationFrame(animate);

      if (camera && cameraQuaternion) {
        // Apply camera rotation from main viewer
        camera.quaternion.set(cameraQuaternion[0], cameraQuaternion[1], cameraQuaternion[2], cameraQuaternion[3]);
        camera.quaternion.normalize();

        // Keep camera at fixed position relative to axes
        camera.position.set(3, 3, 3);
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
      }
    };
    animate();

    return () => {
      window.removeEventListener('viewer-camera-changed', handleCameraChange as EventListener);
      if (mountRef.current && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();

      // Dispose textures
      textures.forEach(({ texture }) => {
        texture.dispose();
      });
    };
  }, [cameraQuaternion, textures]);

  return (
    <div
      ref={mountRef}
      className={`xyz-axes ${className}`}
    />
  );
};

export default XYZAxes;