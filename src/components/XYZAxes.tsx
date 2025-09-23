import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface XYZAxesProps {
  className?: string;
}

const XYZAxes: React.FC<XYZAxesProps> = ({ className = '' }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(80, 80);
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

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

    // Add labels using canvas sprites
    const labels = [
      { text: 'X', position: new THREE.Vector3(2.4, 0, 0), color: 0xff0000 },
      { text: 'Y', position: new THREE.Vector3(0, 2.4, 0), color: 0x00ff00 },
      { text: 'Z', position: new THREE.Vector3(0, 0, 2.4), color: 0x0000ff }
    ];

    labels.forEach((label) => {
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
      const spriteMaterial = new THREE.SpriteMaterial({ 
        map: texture, 
        transparent: true
      });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.copy(label.position);
      sprite.scale.set(0.4, 0.4, 1);
      axesGroup.add(sprite);
    });

    scene.add(axesGroup);
    camera.position.set(3, 3, 3);
    camera.lookAt(0, 0, 0);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      mountRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      className={`xyz-axes ${className}`}
      style={{ width: '80px', height: '80px' }}
    />
  );
};

export default XYZAxes;