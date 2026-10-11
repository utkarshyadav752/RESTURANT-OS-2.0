import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const SpatialBackground3D: React.FC<{ opacity?: number }> = ({ opacity = 0.45 }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 30, 60);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    // 3D Isometric Grid Plane
    const gridSize = 120;
    const gridDivisions = 30;
    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0xf59e0b, 0x1e293b);
    gridHelper.position.y = -10;
    scene.add(gridHelper);

    // Floating 3D Risk / Geometry Nodes
    const particleCount = 70;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const amber = new THREE.Color(0xf59e0b);
    const emerald = new THREE.Color(0x10b981);
    const blue = new THREE.Color(0x3b82f6);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = Math.random() * 35 - 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;

      const chosenColor = i % 3 === 0 ? amber : i % 3 === 1 ? emerald : blue;
      colors[i * 3] = chosenColor.r;
      colors[i * 3 + 1] = chosenColor.g;
      colors[i * 3 + 2] = chosenColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Subtle ambient cubes representing operational risk units
    const cubesGroup = new THREE.Group();
    const cubeGeo = new THREE.BoxGeometry(2, 2, 2);
    const cubeWireGeo = new THREE.EdgesGeometry(cubeGeo);

    for (let i = 0; i < 8; i++) {
      const lineMat = new THREE.LineBasicMaterial({
        color: i % 2 === 0 ? 0xf59e0b : 0x06b6d4,
        transparent: true,
        opacity: 0.35,
      });
      const wire = new THREE.LineSegments(cubeWireGeo, lineMat);
      wire.position.set(
        (Math.random() - 0.5) * 80,
        Math.random() * 20,
        (Math.random() - 0.5) * 60
      );
      cubesGroup.add(wire);
    }
    scene.add(cubesGroup);

    let animationId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Gentle rotation
      gridHelper.rotation.y = elapsedTime * 0.02;
      particles.rotation.y = -elapsedTime * 0.015;
      cubesGroup.rotation.y = elapsedTime * 0.03;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      cubeGeo.dispose();
      cubeWireGeo.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ opacity }}
    />
  );
};
