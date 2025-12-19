
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { EvidenceItem } from '../types';

interface ThreeDWorldProps {
  evidence: EvidenceItem[];
  onInteract: (id: string) => void;
  onToggleHUD: () => void;
  weather: 'clear' | 'cloudy' | 'rainy';
  timeOfDay: number;
}

const ThreeDWorld: React.FC<ThreeDWorldProps> = ({ evidence, onInteract, onToggleHUD, weather, timeOfDay }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const evidenceMeshes = useRef<{ [key: string]: THREE.Group }>({});
  const rainRef = useRef<THREE.Points | null>(null);
  const trafficLightsRef = useRef<THREE.Group[]>([]);
  const streetLampsRef = useRef<THREE.Group[]>([]);
  
  // Controls & Physics State
  const controlsRef = useRef({ forward: false, backward: false, left: false, right: false });
  const velocity = useRef(new THREE.Vector3());
  const rotationRef = useRef({ yaw: 0, pitch: 0 });
  const clock = useRef(new THREE.Clock());
  
  // Animation State
  const idleTimer = useRef(0);
  const baseHeight = 12; // Adjusted for voxel scale

  useEffect(() => {
    if (!containerRef.current) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    scene.fog = new THREE.FogExp2(0x1a1a2e, 0.015); // Thicker fog for voxel atmosphere
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, baseHeight, 60);
    camera.rotation.order = 'YXZ';
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: false }); // False for crisp voxel look
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0x404060, 0.4);
    ambientLight.name = "ambientLight";
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(50, 100, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.name = "sunLight";
    scene.add(sunLight);

    // --- VOXEL ENGINE ---
    const VOXEL_SIZE = 4;
    const voxelGeo = new THREE.BoxGeometry(VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE);
    // Bevel effect for voxels via texture or simple geometry is expensive, keeping simple box
    const voxelMat = new THREE.MeshStandardMaterial({ 
      roughness: 0.8, 
      metalness: 0.1,
    });
    
    // We'll use one massive InstancedMesh for the static world
    const MAX_VOXELS = 20000;
    const voxelMesh = new THREE.InstancedMesh(voxelGeo, voxelMat, MAX_VOXELS);
    voxelMesh.castShadow = true;
    voxelMesh.receiveShadow = true;
    
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    let instanceIdx = 0;

    const addVoxel = (x: number, y: number, z: number, hexColor: number) => {
      if (instanceIdx >= MAX_VOXELS) return;
      dummy.position.set(x * VOXEL_SIZE, y * VOXEL_SIZE + (VOXEL_SIZE/2), z * VOXEL_SIZE);
      dummy.updateMatrix();
      voxelMesh.setMatrixAt(instanceIdx, dummy.matrix);
      color.setHex(hexColor);
      // Add slight variation to color for "texture"
      const variation = (Math.random() - 0.5) * 0.1;
      color.r += variation; color.g += variation; color.b += variation;
      voxelMesh.setColorAt(instanceIdx, color);
      instanceIdx++;
    };

    // 1. Generate Ground (Grid Pattern)
    const WORLD_RAD = 30; // Voxel units
    for (let x = -WORLD_RAD; x <= WORLD_RAD; x++) {
      for (let z = -WORLD_RAD; z <= WORLD_RAD; z++) {
        // Road pattern (Cross)
        const isRoad = Math.abs(x) < 3 || Math.abs(z) < 3 || Math.abs(x) === 15 || Math.abs(z) === 15;
        const groundColor = isRoad ? 0x111111 : 0x1a2a1a;
        addVoxel(x, 0, z, groundColor);
      }
    }

    // 2. Generate Buildings (Voxel Stacks)
    const createVoxelBuilding = (bx: number, bz: number, w: number, d: number, h: number, baseColor: number) => {
      for (let x = bx; x < bx + w; x++) {
        for (let z = bz; z < bz + d; z++) {
          // Only build walls or fill? Let's fill for simplicity in this view, or walls for optimization
          // Building solid blocks for cool look
          for (let y = 1; y <= h; y++) {
             // Simple window logic
             const isWindow = Math.random() > 0.8 && y > 1 && (x === bx || x === bx + w -1 || z === bz || z === bz + d - 1);
             const blockColor = isWindow ? 0xffffaa : baseColor;
             
             // Optimization: Only draw visible blocks (shell)
             if (y === h || x === bx || x === bx + w -1 || z === bz || z === bz + d - 1) {
                addVoxel(x, y, z, isWindow ? 0xffea00 : baseColor);
                // If window, add emission logic? (Hard with single material standard instancing without custom shader, so relying on color)
             }
          }
        }
      }
    };

    // HQ
    createVoxelBuilding(-4, -4, 8, 8, 12, 0x1a365d); // Center
    
    // Surrounding Buildings
    createVoxelBuilding(-18, -18, 6, 6, 8, 0x222222);
    createVoxelBuilding(12, -18, 6, 6, 10, 0x333333);
    createVoxelBuilding(-18, 12, 6, 6, 7, 0x2a2a2a);
    createVoxelBuilding(12, 12, 6, 6, 11, 0x1a1a1a);

    // Far Buildings (Silhouettes)
    createVoxelBuilding(-25, -5, 4, 10, 15, 0x050505);
    createVoxelBuilding(21, -5, 4, 10, 14, 0x050505);

    voxelMesh.instanceMatrix.needsUpdate = true;
    if (voxelMesh.instanceColor) voxelMesh.instanceColor.needsUpdate = true;
    scene.add(voxelMesh);


    // --- Evidence Markers ---
    evidence.forEach(item => {
      const group = new THREE.Group();
      // Voxel style marker
      const markerGeo = new THREE.BoxGeometry(2, 2, 2);
      const markerMat = new THREE.MeshStandardMaterial({ 
        color: 0x00ff88, 
        wireframe: true,
        emissive: 0x00ff88, 
        emissiveIntensity: 0.5 
      });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      
      // Floating inner voxel
      const innerGeo = new THREE.BoxGeometry(1, 1, 1);
      const innerMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const inner = new THREE.Mesh(innerGeo, innerMat);
      
      group.add(marker);
      group.add(inner);

      const light = new THREE.PointLight(0x00ff88, 1, 10);
      light.position.y = 2;
      group.add(light);

      group.userData = { inner }; // Ref for animation

      group.position.set(item.position.x, item.position.y + 2, item.position.z);
      scene.add(group);
      evidenceMeshes.current[item.id] = group;
    });

    // --- Traffic Lights (Voxelized) ---
    const createTrafficLight = (x: number, z: number) => {
      const group = new THREE.Group();
      
      const poleGeo = new THREE.BoxGeometry(1, 10, 1);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = 5;
      group.add(pole);

      const boxGeo = new THREE.BoxGeometry(2, 4, 2);
      const box = new THREE.Mesh(boxGeo, poleMat);
      box.position.y = 10;
      group.add(box);

      const lightColors = [0xff0000, 0xffff00, 0x00ff00];
      const lights: THREE.Mesh[] = [];
      const pointLights: THREE.PointLight[] = [];

      lightColors.forEach((color, i) => {
        // Square lights for voxel look
        const lightGeo = new THREE.BoxGeometry(1.2, 1, 0.5);
        const lightMat = new THREE.MeshStandardMaterial({ 
          color: color, 
          emissive: color, 
          emissiveIntensity: 0 
        });
        const light = new THREE.Mesh(lightGeo, lightMat);
        light.position.set(0, 11.2 - (i * 1.2), 1);
        box.add(light);
        lights.push(light);

        const pl = new THREE.PointLight(color, 0, 10);
        pl.position.set(0, 11.2 - (i * 1.2), 2);
        box.add(pl);
        pointLights.push(pl);
      });

      group.userData = { lights, pointLights, timer: Math.random() * 10, state: 0 };
      group.position.set(x, 0, z);
      scene.add(group);
      trafficLightsRef.current.push(group);
    };

    // --- Street Lamps (Voxelized) ---
    const createStreetLamp = (x: number, z: number) => {
      const group = new THREE.Group();
      
      const poleGeo = new THREE.BoxGeometry(0.5, 12, 0.5);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = 6;
      group.add(pole);

      const headGeo = new THREE.BoxGeometry(2, 0.5, 2);
      const headMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.set(1, 12, 0);
      group.add(head);

      const bulbGeo = new THREE.BoxGeometry(1, 0.2, 1);
      const bulbMat = new THREE.MeshStandardMaterial({ 
        color: 0xffffaa, 
        emissive: 0xffffaa, 
        emissiveIntensity: 0 
      });
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.set(1, 11.8, 0);
      group.add(bulb);

      const light = new THREE.PointLight(0xffffaa, 0, 40, 2);
      light.position.set(1, 10, 0);
      light.castShadow = true;
      group.add(light);

      group.userData = { bulb, light };
      group.position.set(x, 0, z);
      scene.add(group);
      streetLampsRef.current.push(group);
    };

    // Place lights at intersections and along roads
    createTrafficLight(20, 20);
    createTrafficLight(-20, 20);
    createTrafficLight(20, -20);
    createTrafficLight(-20, -20);

    createStreetLamp(0, 20);
    createStreetLamp(0, -20);
    createStreetLamp(20, 0);
    createStreetLamp(-20, 0);

    // --- Rain System ---
    const rainCount = 10000;
    const rainGeo = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
      rainPositions[i * 3] = (Math.random() - 0.5) * 400;
      rainPositions[i * 3 + 1] = Math.random() * 100;
      rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 400;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0xaaaaaa,
      size: 0.2, // Slightly larger for retro rain
      transparent: true,
      opacity: 0,
      sizeAttenuation: true
    });
    const rain = new THREE.Points(rainGeo, rainMat);
    scene.add(rain);
    rainRef.current = rain;

    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.current.getDelta();
      const time = clock.current.getElapsedTime();

      // Animate Evidence Markers
      Object.values(evidenceMeshes.current).forEach((mesh: THREE.Group) => {
        mesh.rotation.y += 0.02;
        mesh.position.y = 2 + Math.sin(time * 2) * 0.5;
        if (mesh.userData.inner) {
            mesh.userData.inner.rotation.x += 0.03;
            mesh.userData.inner.rotation.z -= 0.01;
        }
      });

      // Animate Traffic Lights
      trafficLightsRef.current.forEach(group => {
        group.userData.timer += delta;
        if (group.userData.timer > 5) {
          group.userData.timer = 0;
          group.userData.state = (group.userData.state + 1) % 3;
        }
        
        group.userData.lights.forEach((light: THREE.Mesh, i: number) => {
          const isActive = group.userData.state === i;
          (light.material as THREE.MeshStandardMaterial).emissiveIntensity = isActive ? 2 : 0;
          group.userData.pointLights[i].intensity = isActive ? 1 : 0;
        });
      });

      // Rain Animation
      if (rainRef.current && (rainRef.current.material as THREE.PointsMaterial).opacity > 0) {
        const positions = rainRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < rainCount; i++) {
          positions[i * 3 + 1] -= 2.0; 
          if (positions[i * 3 + 1] < 0) {
            positions[i * 3 + 1] = 100;
          }
        }
        rainRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // --- Camera & Player Movement ---
      camera.rotation.set(rotationRef.current.pitch, rotationRef.current.yaw, 0);

      const moveSpeed = 60.0;
      const friction = 10.0;
      velocity.current.x -= velocity.current.x * friction * delta;
      velocity.current.z -= velocity.current.z * friction * delta;

      if (controlsRef.current.forward) velocity.current.z -= moveSpeed * delta;
      if (controlsRef.current.backward) velocity.current.z += moveSpeed * delta;
      if (controlsRef.current.left) velocity.current.x -= moveSpeed * delta;
      if (controlsRef.current.right) velocity.current.x += moveSpeed * delta;

      camera.translateX(velocity.current.x * delta);
      camera.translateZ(velocity.current.z * delta);
      
      const isMoving = Math.abs(velocity.current.x) > 0.1 || Math.abs(velocity.current.z) > 0.1;

      // --- IDLE ANIMATIONS & HEAD BOB ---
      if (isMoving) {
        // Running Bob
        const bobSpeed = 12;
        const bobAmount = 0.3;
        camera.position.y = baseHeight + Math.sin(time * bobSpeed) * bobAmount;
        // Reset idle timer
        idleTimer.current = 0;
        // Tilt slightly into turn
        const tilt = velocity.current.x * 0.05;
        camera.rotation.z = -tilt * 0.1;
      } else {
        // Idle Animation (Breathing & Shifting Weight)
        idleTimer.current += delta;
        
        // Breathing (Y-axis) - Slow sine wave
        const breathFreq = 1.5; // Breaths per second approx
        const breathAmp = 0.15; // How much height changes
        const breathY = Math.sin(time * breathFreq) * breathAmp;

        // Weight Shifting (Z-axis rotation/roll) - Very slow, irregular sine
        const swayFreq = 0.5;
        const swayAmp = 0.005; // Very subtle tilt
        const swayZ = Math.sin(time * swayFreq) * swayAmp;
        
        // Smoothly interpolate to idle state
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, baseHeight + breathY, 0.05);
        camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, swayZ, 0.05);
      }

      const targetFOV = 75 + velocity.current.length() * 0.2;
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFOV, 0.1);
      camera.updateProjectionMatrix();

      // Boundaries
      camera.position.x = Math.max(-120, Math.min(120, camera.position.x));
      camera.position.z = Math.max(-120, Math.min(120, camera.position.z));

      renderer.render(scene, camera);
    };
    animate();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyW') controlsRef.current.forward = true;
      if (e.code === 'KeyS') controlsRef.current.backward = true;
      if (e.code === 'KeyA') controlsRef.current.left = true;
      if (e.code === 'KeyD') controlsRef.current.right = true;
      
      if (e.code === 'KeyE') {
        let nearestId: string | null = null;
        let minDist = 15;
        evidence.forEach(item => {
          if (item.found) return;
          const itemPos = new THREE.Vector3(item.position.x, item.position.y, item.position.z);
          const dist = camera.position.distanceTo(itemPos);
          if (dist < minDist) {
            minDist = dist;
            nearestId = item.id;
          }
        });
        if (nearestId) onInteract(nearestId);
      }
      if (e.code === 'Tab') {
        e.preventDefault();
        onToggleHUD();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyW') controlsRef.current.forward = false;
      if (e.code === 'KeyS') controlsRef.current.backward = false;
      if (e.code === 'KeyA') controlsRef.current.left = false;
      if (e.code === 'KeyD') controlsRef.current.right = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === renderer.domElement) {
        const sensitivity = 0.002;
        rotationRef.current.yaw -= e.movementX * sensitivity;
        rotationRef.current.pitch -= e.movementY * sensitivity;
        const limit = Math.PI / 2 - 0.1;
        rotationRef.current.pitch = Math.max(-limit, Math.min(limit, rotationRef.current.pitch));
      }
    };

    const handleContainerClick = () => {
      renderer.domElement.requestPointerLock();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    containerRef.current.addEventListener('click', handleContainerClick);
    
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      if (containerRef.current) {
        containerRef.current.removeEventListener('click', handleContainerClick);
      }
      renderer.dispose();
    };
  }, [evidence, onInteract, onToggleHUD]);

  // Handle Weather and Time Changes
  useEffect(() => {
    if (!sceneRef.current || !rainRef.current) return;
    const scene = sceneRef.current;
    const sunLight = scene.getObjectByName("sunLight") as THREE.DirectionalLight;
    const ambientLight = scene.getObjectByName("ambientLight") as THREE.AmbientLight;
    const fog = scene.fog as THREE.FogExp2;

    // Time of day effects
    const isNight = timeOfDay < 6 || timeOfDay > 18;
    
    // Update Street Lamps
    streetLampsRef.current.forEach(lamp => {
      const isActive = isNight || weather === 'rainy';
      (lamp.userData.bulb.material as THREE.MeshStandardMaterial).emissiveIntensity = isActive ? 2 : 0;
      lamp.userData.light.intensity = isActive ? 1.5 : 0;
    });

    // Scene Environment
    if (isNight) {
      scene.background = new THREE.Color(0x020205);
      if (sunLight) sunLight.intensity = 0.1;
      if (ambientLight) ambientLight.intensity = 0.1;
      if (fog) fog.color.setHex(0x020205);
    } else {
      let bg = 0x0a0a1a;
      let si = 1.0;
      let ai = 0.4;
      if (weather === 'rainy') {
        bg = 0x05050a;
        si = 0.25;
        ai = 0.2;
      } else if (weather === 'cloudy') {
        bg = 0x1a1a25;
        si = 0.5;
        ai = 0.3;
      }
      scene.background = new THREE.Color(bg);
      if (sunLight) {
        sunLight.intensity = si;
        // Move sun based on time
        const angle = (timeOfDay / 24) * Math.PI * 2;
        sunLight.position.set(Math.cos(angle) * 100, Math.sin(angle) * 100, 50);
      }
      if (ambientLight) ambientLight.intensity = ai;
      if (fog) fog.color.setHex(bg);
    }

    // Weather particles
    if (weather === 'rainy') {
      (rainRef.current.material as THREE.PointsMaterial).opacity = 0.6;
      if (fog) fog.density = 0.025;
    } else {
      (rainRef.current.material as THREE.PointsMaterial).opacity = 0;
      if (fog) fog.density = weather === 'cloudy' ? 0.015 : 0.008;
    }
  }, [weather, timeOfDay]);

  useEffect(() => {
    evidence.forEach(item => {
      const mesh = evidenceMeshes.current[item.id];
      if (mesh) mesh.visible = !item.found;
    });
  }, [evidence]);

  return <div ref={containerRef} className="w-full h-full cursor-crosshair" />;
};

export default ThreeDWorld;
