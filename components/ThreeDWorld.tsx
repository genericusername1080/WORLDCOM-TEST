
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { EvidenceItem } from '../types';

interface ThreeDWorldProps {
  evidence: EvidenceItem[];
  onInteract: (id: string) => void;
  weather: 'clear' | 'cloudy' | 'rainy';
}

const ThreeDWorld: React.FC<ThreeDWorldProps> = ({ evidence, onInteract, weather }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const evidenceMeshes = useRef<{ [key: string]: THREE.Group }>({});
  const controlsRef = useRef({ forward: false, backward: false, left: false, right: false });

  useEffect(() => {
    if (!containerRef.current) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    scene.fog = new THREE.FogExp2(0x1a1a2e, 0.008);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 15, 60);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0x404060, 0.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(50, 100, 30);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // --- Ground ---
    const groundGeo = new THREE.PlaneGeometry(500, 500);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // --- Grid Streets ---
    const grid = new THREE.GridHelper(500, 20, 0x00ff88, 0x222222);
    grid.position.y = 0.01;
    scene.add(grid);

    // --- Simple Voxel Buildings ---
    const createBuilding = (x: number, z: number, h: number, w: number, color: number) => {
      const geo = new THREE.BoxGeometry(w, h, w);
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, h / 2, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
    };

    createBuilding(0, 0, 50, 30, 0x1a365d); // HQ
    createBuilding(-60, -60, 30, 20, 0x333333);
    createBuilding(60, -60, 40, 20, 0x333333);
    createBuilding(-60, 60, 25, 20, 0x333333);
    createBuilding(60, 60, 45, 20, 0x333333);

    // --- Evidence Markers ---
    evidence.forEach(item => {
      const group = new THREE.Group();
      const markerGeo = new THREE.BoxGeometry(2, 3, 0.2);
      const markerMat = new THREE.MeshStandardMaterial({ 
        color: 0x00ff88, 
        emissive: 0x00ff88, 
        emissiveIntensity: 0.5 
      });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      group.add(marker);

      const light = new THREE.PointLight(0x00ff88, 1, 10);
      light.position.y = 2;
      group.add(light);

      group.position.set(item.position.x, item.position.y, item.position.z);
      scene.add(group);
      evidenceMeshes.current[item.id] = group;
    });

    // --- Animation Loop ---
    const animate = () => {
      requestAnimationFrame(animate);

      // Spin evidence
      // FIX: Added explicit type annotation for the mesh parameter to fix 'unknown' type error.
      Object.values(evidenceMeshes.current).forEach((mesh: THREE.Group, idx: number) => {
        mesh.rotation.y += 0.02;
        mesh.position.y = 2 + Math.sin(Date.now() * 0.002 + idx) * 0.5;
      });

      // Simple Movement
      if (controlsRef.current.forward) camera.translateZ(-0.5);
      if (controlsRef.current.backward) camera.translateZ(0.5);
      if (controlsRef.current.left) camera.translateX(-0.5);
      if (controlsRef.current.right) camera.translateX(0.5);
      
      // Clamp position
      camera.position.y = 15;

      renderer.render(scene, camera);
    };
    animate();

    // --- Event Listeners ---
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyW') controlsRef.current.forward = true;
      if (e.code === 'KeyS') controlsRef.current.backward = true;
      if (e.code === 'KeyA') controlsRef.current.left = true;
      if (e.code === 'KeyD') controlsRef.current.right = true;
      if (e.code === 'KeyE') {
        // Simple proximity check for E key interaction
        evidence.forEach(item => {
          const dist = camera.position.distanceTo(new THREE.Vector3(item.position.x, 2, item.position.z));
          if (dist < 15) onInteract(item.id);
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyW') controlsRef.current.forward = false;
      if (e.code === 'KeyS') controlsRef.current.backward = false;
      if (e.code === 'KeyA') controlsRef.current.left = false;
      if (e.code === 'KeyD') controlsRef.current.right = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      renderer.dispose();
    };
  }, []);

  // Sync evidence visibility
  useEffect(() => {
    evidence.forEach(item => {
      const mesh = evidenceMeshes.current[item.id];
      if (mesh) mesh.visible = !item.found;
    });
  }, [evidence]);

  return <div ref={containerRef} className="w-full h-full cursor-crosshair" />;
};

export default ThreeDWorld;
