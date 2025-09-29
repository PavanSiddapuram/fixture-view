import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const SimpleViewerTest = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    console.log('SimpleViewerTest: Initializing...');

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);

    // Create camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 5, 5);

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    containerRef.current.appendChild(renderer.domElement);
    console.log('SimpleViewerTest: Renderer added to container');

    // Create a simple cube
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const cube = new THREE.Mesh(geometry, material);

    scene.add(cube);
    console.log('SimpleViewerTest: Cube added to scene');

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      renderer.render(scene, camera);
    };
    animate();

    console.log('SimpleViewerTest: Animation started');

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="h-full flex">
      <div className="w-80 border-r border-border/50 tech-glass flex flex-col p-4">
        <h2 className="font-tech font-semibold text-lg mb-4">Simple Viewer Test</h2>
        <p className="text-sm text-muted-foreground">
          This is a basic Three.js test to verify WebGL is working.
        </p>
      </div>

      <div className="flex-1 relative">
        <div
          ref={containerRef}
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
        />
      </div>
    </div>
  );
};

export default SimpleViewerTest;
