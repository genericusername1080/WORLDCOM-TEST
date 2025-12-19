
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { EvidenceItem } from '../types';

interface ThreeDWorldProps {
  evidence: EvidenceItem[];
  onInteract: (id: string) => void;
  onHover: (item: EvidenceItem | null) => void;
  onToggleHUD: () => void;
  weather: 'clear' | 'cloudy' | 'rainy';
  timeOfDay: number;
}

const ThreeDWorld: React.FC<ThreeDWorldProps> = ({ evidence, onInteract, onHover, onToggleHUD, weather, timeOfDay }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const evidenceMeshes = useRef<{ [key: string]: THREE.Group }>({});
  
  // Environment Refs
  const rainRef = useRef<THREE.Points | null>(null);
  const cloudsRef = useRef<THREE.InstancedMesh | null>(null);
  const sunMeshRef = useRef<THREE.Mesh | null>(null);
  const moonMeshRef = useRef<THREE.Mesh | null>(null);
  const trafficLightsRef = useRef<THREE.Group[]>([]);
  const streetLampsRef = useRef<THREE.Group[]>([]);
  const lastHoveredId = useRef<string | null>(null);
  
  // Audio Refs
  const listenerRef = useRef<THREE.AudioListener | null>(null);
  const soundRefs = useRef<{
    rain?: THREE.Audio;
    wind?: THREE.Audio;
    city?: THREE.PositionalAudio;
  }>({});
  const audioContextResumed = useRef(false);
  
  // Cloud Data
  const cloudInfo = useRef<{ position: THREE.Vector3, speed: number, scale: number }[]>([]);

  // Intro State
  const [isIntro, setIsIntro] = useState(true);
  const introProgress = useRef(0);
  
  // Controls & Physics State
  const controlsRef = useRef({ forward: false, backward: false, left: false, right: false });
  const velocity = useRef(new THREE.Vector3());
  const targetRotation = useRef({ yaw: 0, pitch: 0 });
  const currentRotation = useRef({ yaw: 0, pitch: 0 });
  const clock = useRef(new THREE.Clock());
  
  // Animation State
  const baseHeight = 12;

  // --- AUDIO HELPERS ---
  const createWhiteNoiseBuffer = (ctx: AudioContext) => {
    const bufferSize = ctx.sampleRate * 2; // 2 seconds
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  };

  const playBirdChirp = (position: THREE.Vector3) => {
    if (!listenerRef.current) return;
    const ctx = listenerRef.current.context;
    
    // Create a temporary positional synth
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const panner = ctx.createPanner();
    
    // Panner settings for spatial 3D
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 10;
    panner.maxDistance = 100;
    panner.positionX.value = position.x;
    panner.positionY.value = position.y;
    panner.positionZ.value = position.z;

    // Bird Chirp Synthesis (Sine wave with quick frequency modulation)
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2000 + Math.random() * 1000, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
    
    // Envelope
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(panner);
    panner.connect(listenerRef.current.getInput()); // Connect to master listener

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
    
    // Cleanup is automatic by GC for audio nodes usually, but weak refs help.
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x1a1a2e, 0.015);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 150, 150);
    camera.lookAt(0, 0, 0);
    camera.rotation.order = 'YXZ';
    cameraRef.current = camera;

    // --- Audio Listener Setup ---
    const listener = new THREE.AudioListener();
    camera.add(listener);
    listenerRef.current = listener;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- Audio Objects Init (Procedural) ---
    // We defer buffer creation until we are sure context exists, 
    // but THREE.AudioListener creates one immediately.
    const audioCtx = listener.context;
    const noiseBuffer = createWhiteNoiseBuffer(audioCtx);

    // 1. Rain Sound (Global, filtered white noise)
    const rainSound = new THREE.Audio(listener);
    rainSound.setBuffer(noiseBuffer);
    rainSound.setLoop(true);
    rainSound.setVolume(0);
    // Lowpass filter to make it sound like rain
    const rainFilter = audioCtx.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.value = 800;
    rainSound.setFilter(rainFilter);
    scene.add(rainSound); // Add to scene just to keep track, though it's global
    soundRefs.current.rain = rainSound;

    // 2. Wind Sound (Global, filtered pink-ish noise)
    const windSound = new THREE.Audio(listener);
    windSound.setBuffer(noiseBuffer);
    windSound.setLoop(true);
    windSound.setVolume(0);
    const windFilter = audioCtx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 400;
    windSound.setFilter(windFilter);
    scene.add(windSound);
    soundRefs.current.wind = windSound;

    // 3. City Traffic (Positional, Low Rumble)
    const citySound = new THREE.PositionalAudio(listener);
    citySound.setBuffer(noiseBuffer);
    citySound.setLoop(true);
    citySound.setRefDistance(20);
    citySound.setMaxDistance(150);
    citySound.setVolume(0); // Starts 0
    const cityFilter = audioCtx.createBiquadFilter();
    cityFilter.type = 'lowpass';
    cityFilter.frequency.value = 150; // Deep rumble
    citySound.setFilter(cityFilter);
    
    // Attach city sound to a mesh in the center
    const citySoundMesh = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshBasicMaterial({visible: false}));
    citySoundMesh.position.set(0, 0, 0);
    citySoundMesh.add(citySound);
    scene.add(citySoundMesh);
    soundRefs.current.city = citySound;

    // --- Lighting Setup ---
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    hemiLight.position.set(0, 200, 0);
    hemiLight.name = "hemiLight";
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(50, 100, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.bias = -0.0001;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    const d = 100;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.name = "sunLight";
    scene.add(sunLight);

    // --- SKYBOX ELEMENTS ---
    
    // 1. Visual Sun
    const sunGeo = new THREE.SphereGeometry(15, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    scene.add(sunMesh);
    sunMeshRef.current = sunMesh;

    // 2. Visual Moon
    const moonGeo = new THREE.SphereGeometry(10, 32, 32);
    const moonMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.8 });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    scene.add(moonMesh);
    moonMeshRef.current = moonMesh;

    // 3. Volumetric Clouds (Instanced)
    const CLOUD_COUNT = 40;
    const cloudGeo = new THREE.BoxGeometry(1, 1, 1); // Base voxel shape
    const cloudMat = new THREE.MeshStandardMaterial({ 
      color: 0xffffff, 
      transparent: true, 
      opacity: 0.8, 
      roughness: 0.9 
    });
    const clouds = new THREE.InstancedMesh(cloudGeo, cloudMat, CLOUD_COUNT);
    clouds.name = "clouds";
    
    const dummy = new THREE.Object3D();
    const info: { position: THREE.Vector3, speed: number, scale: number }[] = [];
    
    for (let i = 0; i < CLOUD_COUNT; i++) {
        const x = (Math.random() - 0.5) * 400;
        const y = 80 + Math.random() * 40;
        const z = (Math.random() - 0.5) * 400;
        
        const sx = 20 + Math.random() * 30;
        const sy = 4 + Math.random() * 4;
        const sz = 15 + Math.random() * 20;

        dummy.position.set(x, y, z);
        dummy.scale.set(sx, sy, sz);
        dummy.updateMatrix();
        clouds.setMatrixAt(i, dummy.matrix);

        info.push({
            position: new THREE.Vector3(x, y, z),
            speed: 2 + Math.random() * 3, // Drift speed
            scale: 1 // Base scale tracker
        });
    }
    cloudInfo.current = info;
    scene.add(clouds);
    cloudsRef.current = clouds;


    // --- VOXEL ENGINE & WORLD GEN ---
    const VOXEL_SIZE = 4;
    const voxelGeo = new THREE.BoxGeometry(VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE);
    const voxelMat = new THREE.MeshStandardMaterial({ 
      roughness: 0.8, 
      metalness: 0.1,
    });
    
    const MAX_VOXELS = 80000;
    const voxelMesh = new THREE.InstancedMesh(voxelGeo, voxelMat, MAX_VOXELS);
    voxelMesh.castShadow = true;
    voxelMesh.receiveShadow = true;
    
    const dummyVoxel = new THREE.Object3D();
    const color = new THREE.Color();
    let instanceIdx = 0;

    const addVoxel = (x: number, y: number, z: number, hexColor: number, variation = 0.05) => {
      if (instanceIdx >= MAX_VOXELS) return;
      dummyVoxel.position.set(x * VOXEL_SIZE, y * VOXEL_SIZE + (VOXEL_SIZE/2), z * VOXEL_SIZE);
      dummyVoxel.updateMatrix();
      voxelMesh.setMatrixAt(instanceIdx, dummyVoxel.matrix);
      
      color.setHex(hexColor);
      if (variation > 0) {
        const v = (Math.random() - 0.5) * variation;
        color.r += v; color.g += v; color.b += v;
      }
      voxelMesh.setColorAt(instanceIdx, color);
      instanceIdx++;
    };

    // Terrain & Nature
    const WORLD_RAD = 45;
    for (let x = -WORLD_RAD; x <= WORLD_RAD; x++) {
      for (let z = -WORLD_RAD; z <= WORLD_RAD; z++) {
        const dist = Math.sqrt(x*x + z*z);
        const noise = Math.sin(x * 0.1) * Math.cos(z * 0.1);
        
        const isRoad = (Math.abs(x) < 4 || Math.abs(z) < 4 || Math.abs(x) === 20 || Math.abs(z) === 20) && dist < 35;
        const isBuildingZone = !isRoad && dist < 30;
        const isPark = !isRoad && !isBuildingZone && (Math.abs(x) > 10 && Math.abs(x) < 18 && Math.abs(z) > 10 && Math.abs(z) < 18);

        if (isRoad) {
           addVoxel(x, 0, z, 0x222224, 0.02);
           if (x === 0 && z % 2 === 0) addVoxel(x, 0.1, z, 0xffffff, 0); 
           if (z === 0 && x % 2 === 0) addVoxel(x, 0.1, z, 0xffffff, 0); 
        } else if (isBuildingZone) {
           addVoxel(x, 0, z, 0x555555, 0.05);
           // Add occasional bush near buildings
           if (Math.random() > 0.95) addVoxel(x, 1, z, 0x2d5a27, 0.1);
        } else {
           const grassColor = noise > 0.5 ? 0x2d5a27 : 0x3a7a30;
           addVoxel(x, 0, z, grassColor, 0.1);
           
           // Tree Generation
           let treeProb = 0.92;
           if (isPark) treeProb = 0.85; // Denser trees in park zones

           if (Math.random() > treeProb) {
             const treeH = 2 + Math.floor(Math.random() * 3);
             for(let th=1; th<=treeH; th++) addVoxel(x, th, z, 0x4a3c31); // Trunk
             for(let lx=-1; lx<=1; lx++) {
               for(let lz=-1; lz<=1; lz++) {
                 for(let ly=treeH; ly<=treeH+2; ly++) {
                   if(Math.abs(lx)+Math.abs(lz)+Math.abs(ly-treeH) < 3) {
                      addVoxel(x+lx, ly, z+lz, 0x1e4a18, 0.1); // Leaves
                   }
                 }
               }
             }
           }
        }
      }
    }

    // HQ
    const createHQ = () => {
       const bx = -6, bz = -6, w = 12, d = 12, h = 16;
       for (let x = bx; x < bx + w; x++) {
         for (let z = bz; z < bz + d; z++) {
           for (let y = 1; y <= h; y++) {
             const isCorner = (x === bx || x === bx + w - 1) && (z === bz || z === bz + d - 1);
             const isFrame = x === bx || x === bx + w - 1 || z === bz || z === bz + d - 1;
             
             if (isCorner) {
                addVoxel(x, y, z, 0x334155); 
             } else if (isFrame) {
                const isFrameBar = y % 4 === 0;
                addVoxel(x, y, z, isFrameBar ? 0x1e293b : 0x60a5fa, 0.05); 
             } else if (y === 1) {
                addVoxel(x, y, z, 0x0f172a);
             } else if (y === h) {
                addVoxel(x, y, z, 0x1e293b);
             }
           }
         }
       }
       for(let x=-2; x<=2; x++) for(let z=6; z<=8; z++) addVoxel(x, 4, z, 0x334155);
    };

    const createBuilding = (bx: number, bz: number, w: number, d: number, h: number, color: number) => {
       for (let x = bx; x < bx + w; x++) {
         for (let z = bz; z < bz + d; z++) {
            const actualH = (x === bx || x === bx+w-1 || z === bz || z === bz+d-1) ? h * 0.8 : h;
            for (let y = 1; y <= actualH; y++) {
               if (x === bx || x === bx + w - 1 || z === bz || z === bz + d - 1 || y > actualH - 1) {
                 const isWindow = y > 1 && y % 3 !== 0 && Math.random() > 0.3;
                 addVoxel(x, y, z, isWindow ? 0x1e293b : color);
               }
            }
         }
       }
    };

    createHQ();
    createBuilding(-22, -22, 10, 8, 10, 0x5c5c5c);
    createBuilding(14, -22, 8, 8, 12, 0x757575);
    createBuilding(-22, 14, 8, 8, 9, 0x6b6b6b);
    createBuilding(14, 14, 8, 8, 14, 0x4a4a4a);
    createBuilding(-28, -5, 6, 12, 18, 0x222222);
    createBuilding(22, -5, 6, 12, 16, 0x262626);

    voxelMesh.instanceMatrix.needsUpdate = true;
    if (voxelMesh.instanceColor) voxelMesh.instanceColor.needsUpdate = true;
    scene.add(voxelMesh);

    // Evidence Markers
    evidence.forEach(item => {
      const group = new THREE.Group();
      const markerGeo = new THREE.BoxGeometry(1.5, 2, 0.2);
      const markerMat = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        emissive: 0x00ff88, 
        emissiveIntensity: 0.2,
        roughness: 0.2
      });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      
      const glowGeo = new THREE.SphereGeometry(1.5, 16, 16);
      const glowMat = new THREE.MeshBasicMaterial({ 
          color: 0x00ff88, 
          transparent: true, 
          opacity: 0.1,
          wireframe: true
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      
      group.add(marker);
      group.add(glow);

      const light = new THREE.PointLight(0x00ff88, 2, 8);
      light.position.y = 0;
      group.add(light);

      group.userData = { marker, glow, originalY: item.position.y + 3 };
      group.position.set(item.position.x, item.position.y + 3, item.position.z);
      scene.add(group);
      evidenceMeshes.current[item.id] = group;
    });

    // Helper functions for Props
    const createTrafficLight = (x: number, z: number) => {
        const group = new THREE.Group();
        const pole = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8, 0.5), new THREE.MeshStandardMaterial({color: 0x111111}));
        pole.position.y = 4;
        group.add(pole);
        const box = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3, 1), new THREE.MeshStandardMaterial({color: 0x111111}));
        box.position.y = 8;
        group.add(box);
        const lights: THREE.Mesh[] = [];
        const pointLights: THREE.PointLight[] = [];
        [0xff0000, 0xffff00, 0x00ff00].forEach((c, i) => {
            const l = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.2), new THREE.MeshStandardMaterial({color: c, emissive: c, emissiveIntensity: 0}));
            l.position.set(0, 9 - i, 0.5);
            group.add(l);
            lights.push(l);
            const pl = new THREE.PointLight(c, 0, 5);
            pl.position.set(0, 9 - i, 1);
            group.add(pl);
            pointLights.push(pl);
        });
        group.position.set(x,0,z);
        group.userData = { lights, pointLights, timer: Math.random()*10, state: 0 };
        scene.add(group);
        trafficLightsRef.current.push(group);
    };

    const createStreetLamp = (x: number, z: number, rotation: number = 0) => {
        const group = new THREE.Group();
        const pole = new THREE.Mesh(new THREE.BoxGeometry(0.4, 10, 0.4), new THREE.MeshStandardMaterial({color: 0x222222}));
        pole.position.y = 5;
        group.add(pole);
        const arm = new THREE.Mesh(new THREE.BoxGeometry(2, 0.3, 0.4), new THREE.MeshStandardMaterial({color: 0x222222}));
        arm.position.set(0.8, 10, 0); // Arm points +X relative to group
        group.add(arm);
        const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.8), new THREE.MeshStandardMaterial({color: 0xffaa00, emissive: 0xffaa00, emissiveIntensity: 0}));
        bulb.position.set(1.5, 9.8, 0);
        group.add(bulb);
        const light = new THREE.SpotLight(0xffaa00, 0, 30, 0.8, 0.5, 1);
        light.position.set(1.5, 9.5, 0);
        light.target.position.set(1.5, 0, 0);
        group.add(light);
        group.add(light.target);
        
        group.position.set(x,0,z);
        group.rotation.y = rotation;
        group.userData = { bulb, light };
        scene.add(group);
        streetLampsRef.current.push(group);
    };

    const createBench = (x: number, z: number, rotation: number) => {
        const group = new THREE.Group();
        // Legs
        const legGeo = new THREE.BoxGeometry(0.2, 0.5, 0.8);
        const legMat = new THREE.MeshStandardMaterial({color: 0x1a1a1a});
        const l1 = new THREE.Mesh(legGeo, legMat); l1.position.set(-0.6, 0.25, 0);
        const l2 = new THREE.Mesh(legGeo, legMat); l2.position.set(0.6, 0.25, 0);
        
        // Seat
        const woodMat = new THREE.MeshStandardMaterial({color: 0x5c4033});
        const seatGeo = new THREE.BoxGeometry(1.6, 0.1, 0.8);
        const seat = new THREE.Mesh(seatGeo, woodMat); seat.position.set(0, 0.55, 0);
        
        // Back
        const backGeo = new THREE.BoxGeometry(1.6, 0.4, 0.1);
        const back = new THREE.Mesh(backGeo, woodMat); back.position.set(0, 0.85, -0.35);
        
        group.add(l1, l2, seat, back);
        group.position.set(x, 0, z);
        group.rotation.y = rotation;
        scene.add(group);
    };

    createTrafficLight(18, 18); createTrafficLight(-18, 18);
    createTrafficLight(18, -18); createTrafficLight(-18, -18);

    // Procedurally place lamps and benches along roads
    const roadWidth = 4;
    // Along Main X Axis Road (Z approx 0)
    for (let x = -40; x <= 40; x += 15) {
        if (Math.abs(x) < 8) continue; // Skip intersection center
        // Lamps
        // Side 1 (Z > 0 side). Road at Z=0. Lamp at Z=5. Arm should point -Z. Standard arm +X. Rotate +90deg (PI/2).
        createStreetLamp(x, roadWidth + 2, Math.PI / 2);
        // Side 2 (Z < 0 side). Lamp at Z=-5. Arm point +Z. Rotate -90deg (-PI/2).
        createStreetLamp(x, -roadWidth - 2, -Math.PI / 2);

        // Benches
        if (Math.random() > 0.4) createBench(x + 5, roadWidth + 3, 0); // Face +Z (away from road)
        if (Math.random() > 0.4) createBench(x + 5, -roadWidth - 3, Math.PI); // Face -Z
    }

    // Along Main Z Axis Road (X approx 0)
    for (let z = -40; z <= 40; z += 15) {
        if (Math.abs(z) < 8) continue;
        // Side 1 (X > 0 side). Road at X=0. Lamp at X=5. Arm point -X. Rotate PI.
        createStreetLamp(roadWidth + 2, z, Math.PI);
        // Side 2 (X < 0 side). Lamp at X=-5. Arm point +X. Rotate 0.
        createStreetLamp(-roadWidth - 2, z, 0);

        // Benches
        if (Math.random() > 0.4) createBench(roadWidth + 3, z + 5, -Math.PI/2);
        if (Math.random() > 0.4) createBench(-roadWidth - 3, z + 5, Math.PI/2);
    }
    
    // Along Ring Road (X=20, Z=20)
    // Just a few scattered lamps on the ring road
    createStreetLamp(20, 0, Math.PI); // East Gate
    createStreetLamp(-20, 0, 0); // West Gate
    createStreetLamp(0, 20, Math.PI/2); // South Gate
    createStreetLamp(0, -20, -Math.PI/2); // North Gate


    const rainCount = 15000;
    const rainGeo = new THREE.BufferGeometry();
    const rainPos = new Float32Array(rainCount * 3);
    for(let i=0; i<rainCount; i++) {
        rainPos[i*3] = (Math.random()-0.5)*300;
        rainPos[i*3+1] = Math.random()*150;
        rainPos[i*3+2] = (Math.random()-0.5)*300;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
    const rainMat = new THREE.PointsMaterial({color: 0xaaaaaa, size: 0.15, transparent: true, opacity: 0});
    const rain = new THREE.Points(rainGeo, rainMat);
    scene.add(rain);
    rainRef.current = rain;

    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(3000 * 3);
    for(let i=0; i<3000; i++) {
        starPos[i*3] = (Math.random()-0.5)*1000;
        starPos[i*3+1] = Math.random()*500 + 50;
        starPos[i*3+2] = (Math.random()-0.5)*1000;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({color: 0xffffff, size: 0.7, transparent: true, opacity: 0});
    const stars = new THREE.Points(starGeo, starMat);
    stars.name = "stars";
    scene.add(stars);

    // --- ANIMATION LOOP ---
    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.current.getDelta();
      const time = clock.current.getElapsedTime();

      // Intro
      if (introProgress.current < 1) {
          introProgress.current += delta * 0.4;
          const t = Math.min(1, introProgress.current);
          const ease = 1 - Math.pow(1 - t, 3);
          const startPos = new THREE.Vector3(0, 120, 120);
          const endPos = new THREE.Vector3(0, baseHeight, 60);
          camera.position.lerpVectors(startPos, endPos, ease);
          if (t < 0.9) camera.lookAt(0, 0, 0);
          if (t >= 1) {
              setIsIntro(false);
              targetRotation.current.yaw = 0;
              targetRotation.current.pitch = 0;
          }
          renderer.render(scene, camera);
          return;
      }

      // Proximity Check for UI Hover
      let nearestItem: EvidenceItem | null = null;
      let minDistance = 15;
      
      evidence.forEach(item => {
        if (!item.found) {
            const itemPos = new THREE.Vector3(item.position.x, item.position.y, item.position.z);
            const dist = camera.position.distanceTo(itemPos);
            if (dist < minDistance) {
                minDistance = dist;
                nearestItem = item;
            }
        }
      });

      if (nearestItem) {
          if (lastHoveredId.current !== (nearestItem as EvidenceItem).id) {
              lastHoveredId.current = (nearestItem as EvidenceItem).id;
              onHover(nearestItem);
          }
      } else {
          if (lastHoveredId.current !== null) {
              lastHoveredId.current = null;
              onHover(null);
          }
      }

      // Clouds Animation
      if (cloudsRef.current) {
          const dummy = new THREE.Object3D();
          const boundary = 300;
          
          cloudInfo.current.forEach((info, i) => {
              info.position.x += info.speed * delta;
              
              // Infinite Scroll Wrapping
              if (info.position.x > boundary) info.position.x = -boundary;

              dummy.position.copy(info.position);
              // Slight bobbing
              dummy.position.y += Math.sin(time * 0.2 + i) * 0.05;
              
              // Scale match
              dummy.scale.set(
                  20 + (i % 5) * 5,
                  4 + (i % 3),
                  15 + (i % 4) * 3
              );
              
              dummy.updateMatrix();
              cloudsRef.current!.setMatrixAt(i, dummy.matrix);
          });
          cloudsRef.current.instanceMatrix.needsUpdate = true;
      }

      // Evidence Markers
      Object.values(evidenceMeshes.current).forEach((mesh: THREE.Group) => {
          mesh.rotation.y += 0.01;
          mesh.position.y = mesh.userData.originalY + Math.sin(time * 1.5) * 0.5;
          if (mesh.userData.glow) {
              mesh.userData.glow.scale.setScalar(1 + Math.sin(time * 3) * 0.1);
              mesh.userData.glow.rotation.z -= 0.005;
          }
      });

      // Environment Animations
      trafficLightsRef.current.forEach(g => {
          g.userData.timer += delta;
          if(g.userData.timer > 5) { g.userData.timer = 0; g.userData.state = (g.userData.state+1)%3; }
          g.userData.lights.forEach((l: THREE.Mesh, i: number) => {
             const active = g.userData.state === i;
             (l.material as THREE.MeshStandardMaterial).emissiveIntensity = active ? 2 : 0;
             g.userData.pointLights[i].intensity = active ? 2 : 0;
          });
      });

      if (rainRef.current && (rainRef.current.material as THREE.PointsMaterial).opacity > 0) {
         const pos = rainRef.current.geometry.attributes.position.array as Float32Array;
         for(let i=0; i<rainCount; i++) {
             pos[i*3+1] -= 3.0;
             if(pos[i*3+1] < 0) pos[i*3+1] = 150;
         }
         rainRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // --- Generative Bird Audio Logic ---
      const normalizedTime = (timeOfDay + 24) % 24;
      const isDay = normalizedTime > 6 && normalizedTime < 18;
      
      if (isDay && weather === 'clear' && audioContextResumed.current) {
         // Randomly trigger bird chirps
         if (Math.random() < 0.01) { // roughly once every 1-2 seconds
            // Spawn sound near a tree zone (radius > 30)
            const angle = Math.random() * Math.PI * 2;
            const dist = 35 + Math.random() * 20;
            const pos = new THREE.Vector3(
                Math.cos(angle) * dist,
                5 + Math.random() * 5,
                Math.sin(angle) * dist
            );
            playBirdChirp(pos);
         }
      }

      // Movement
      const smoothFactor = 15.0 * delta;
      
      // ROTATION LOGIC (A/D now controls Yaw)
      const rotateSpeed = 2.0;
      if (controlsRef.current.left) targetRotation.current.yaw += rotateSpeed * delta;
      if (controlsRef.current.right) targetRotation.current.yaw -= rotateSpeed * delta;

      currentRotation.current.yaw = THREE.MathUtils.lerp(currentRotation.current.yaw, targetRotation.current.yaw, smoothFactor);
      currentRotation.current.pitch = THREE.MathUtils.lerp(currentRotation.current.pitch, targetRotation.current.pitch, smoothFactor);
      camera.rotation.set(currentRotation.current.pitch, currentRotation.current.yaw, 0);

      const moveSpeed = 60.0;
      const friction = 10.0;
      velocity.current.x -= velocity.current.x * friction * delta;
      velocity.current.z -= velocity.current.z * friction * delta;

      if (controlsRef.current.forward) velocity.current.z -= moveSpeed * delta;
      if (controlsRef.current.backward) velocity.current.z += moveSpeed * delta;
      // No longer applying A/D to velocity.x

      camera.translateX(velocity.current.x * delta);
      camera.translateZ(velocity.current.z * delta);

      const speed = new THREE.Vector2(velocity.current.x, velocity.current.z).length();
      if (speed > 0.5) {
         const bobY = Math.sin(time * 12) * 0.3 * Math.min(speed / 10, 1);
         const tiltTarget = -velocity.current.x * 0.05;
         camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, tiltTarget, 0.1);
         camera.position.y = baseHeight + bobY;
      } else {
         const breathY = Math.sin(time * 1.5) * 0.15;
         camera.position.y = THREE.MathUtils.lerp(camera.position.y, baseHeight + breathY, 0.05);
         camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, 0, 0.05);
      }

      camera.position.x = Math.max(-150, Math.min(150, camera.position.x));
      camera.position.z = Math.max(-150, Math.min(150, camera.position.z));

      renderer.render(scene, camera);
    };
    animate();

    // Inputs
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isIntro) return;
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
          if (dist < minDist) { minDist = dist; nearestId = item.id; }
        });
        if (nearestId) onInteract(nearestId);
      }
      if (e.code === 'Tab') { e.preventDefault(); onToggleHUD(); }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyW') controlsRef.current.forward = false;
      if (e.code === 'KeyS') controlsRef.current.backward = false;
      if (e.code === 'KeyA') controlsRef.current.left = false;
      if (e.code === 'KeyD') controlsRef.current.right = false;
    };
    
    // Removed handleMouseMove as requested

    const handleContainerClick = () => { 
        // Removed requestPointerLock as requested
        // Resume Audio Context on first interaction
        if (listenerRef.current && listenerRef.current.context.state === 'suspended') {
            listenerRef.current.context.resume().then(() => {
                audioContextResumed.current = true;
                // Start loops that were waiting
                if (soundRefs.current.rain && !soundRefs.current.rain.isPlaying) soundRefs.current.rain.play();
                if (soundRefs.current.wind && !soundRefs.current.wind.isPlaying) soundRefs.current.wind.play();
                if (soundRefs.current.city && !soundRefs.current.city.isPlaying) soundRefs.current.city.play();
            });
        } else {
             audioContextResumed.current = true;
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    // Removed mousemove listener
    containerRef.current.addEventListener('click', handleContainerClick);
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      // Removed mousemove listener removal
      if(containerRef.current) containerRef.current.removeEventListener('click', handleContainerClick);
      renderer.dispose();
      
      // Stop all sounds on unmount
      if (soundRefs.current.rain && soundRefs.current.rain.isPlaying) soundRefs.current.rain.stop();
      if (soundRefs.current.wind && soundRefs.current.wind.isPlaying) soundRefs.current.wind.stop();
      if (soundRefs.current.city && soundRefs.current.city.isPlaying) soundRefs.current.city.stop();
    };
  }, [evidence, onInteract, onToggleHUD, isIntro, onHover]);

  // Day/Night & Weather Update Loop
  useEffect(() => {
    // ... (Existing Day/Night code remains unchanged)
    if (!sceneRef.current || !rainRef.current) return;
    const scene = sceneRef.current;
    const sunLight = scene.getObjectByName("sunLight") as THREE.DirectionalLight;
    const hemiLight = scene.getObjectByName("hemiLight") as THREE.HemisphereLight;
    const stars = scene.getObjectByName("stars") as THREE.Points;
    const fog = scene.fog as THREE.FogExp2;

    const normalizedTime = (timeOfDay + 24) % 24;
    const cycle = normalizedTime / 24;
    const sunAngle = (cycle * Math.PI * 2) - (Math.PI / 2);

    const isDay = normalizedTime > 6 && normalizedTime < 18;
    const isSunrise = normalizedTime >= 5 && normalizedTime <= 7;
    const isSunset = normalizedTime >= 17 && normalizedTime <= 19;

    const nightColor = new THREE.Color(0x020205);
    const daySkyColor = new THREE.Color(0x87ceeb);
    const sunsetColor = new THREE.Color(0xfd5e53);
    const daySunColor = new THREE.Color(0xffffff);
    const sunsetSunColor = new THREE.Color(0xffaa00);

    let currentSkyColor = nightColor.clone();
    let sunIntensity = 0;
    
    if (isDay) {
        if (isSunrise) {
            const t = (normalizedTime - 5) / 2;
            currentSkyColor.lerpColors(nightColor, daySkyColor, t);
            sunLight.color.lerpColors(sunsetSunColor, daySunColor, t);
            sunIntensity = t;
        } else if (isSunset) {
            const t = (normalizedTime - 17) / 2;
            currentSkyColor.lerpColors(daySkyColor, sunsetColor, t);
            sunLight.color.lerpColors(daySunColor, sunsetSunColor, t);
            sunIntensity = 1 - t;
        } else {
            currentSkyColor = daySkyColor;
            sunLight.color = daySunColor;
            sunIntensity = 1;
        }
    } else {
        if (normalizedTime > 19 && normalizedTime < 21) {
             const t = (normalizedTime - 19) / 2;
             currentSkyColor.lerpColors(sunsetColor, nightColor, t);
        }
    }

    // Move Celestial Bodies
    const sunDist = 300;
    const sunPos = new THREE.Vector3(
        Math.cos(sunAngle) * sunDist, 
        Math.sin(sunAngle) * sunDist, 
        Math.sin(sunAngle * 0.5) * 50 // Slight off-axis tilt
    );

    if (sunMeshRef.current) {
        sunMeshRef.current.position.copy(sunPos);
        (sunMeshRef.current.material as THREE.MeshBasicMaterial).color.copy(sunLight.color);
        sunMeshRef.current.visible = weather !== 'rainy';
    }

    if (moonMeshRef.current) {
        // Moon is opposite to Sun
        moonMeshRef.current.position.copy(sunPos).negate();
    }

    // Weather Effects Visuals
    if (weather === 'rainy') {
        currentSkyColor.lerp(new THREE.Color(0x05050a), 0.8);
        sunIntensity *= 0.2;
    } else if (weather === 'cloudy') {
        currentSkyColor.lerp(new THREE.Color(0x555555), 0.6);
        sunIntensity *= 0.5;
    }

    // --- Audio Volume Updates ---
    if (soundRefs.current.rain) {
        // Ramp volume smoothly could be better, but direct set is fine for this loop freq
        const vol = weather === 'rainy' ? 0.6 : 0;
        soundRefs.current.rain.setVolume(vol);
    }
    
    if (soundRefs.current.wind) {
        let vol = 0.1; // Base wind
        if (weather === 'cloudy') vol = 0.3;
        if (weather === 'rainy') vol = 0.5;
        // Increase wind noise with height
        if (cameraRef.current) {
            const heightFactor = Math.min(1, Math.max(0, (cameraRef.current.position.y - 10) / 100));
            vol += heightFactor * 0.2;
        }
        soundRefs.current.wind.setVolume(vol);
        // Pitch shift wind slightly based on intensity?
        if (soundRefs.current.wind.isPlaying) {
             soundRefs.current.wind.setPlaybackRate(0.8 + vol * 0.5);
        }
    }

    if (soundRefs.current.city) {
        // City sounds quieter at night or in heavy rain
        let vol = 0.5;
        if (!isDay) vol = 0.2;
        if (weather === 'rainy') vol = 0.3; // Rain drowns out traffic
        soundRefs.current.city.setVolume(vol);
    }


    // Cloud Coloring
    if (cloudsRef.current) {
        const cloudMat = cloudsRef.current.material as THREE.MeshStandardMaterial;
        if (weather === 'rainy') {
            cloudMat.color.setHex(0x333333);
            cloudMat.opacity = 0.9;
        } else if (weather === 'cloudy') {
            cloudMat.color.setHex(0xaaaaaa);
            cloudMat.opacity = 0.8;
        } else {
            // Tint clouds based on time
            if (isSunset || isSunrise) {
                cloudMat.color.setHex(0xffccaa); // Orange/Pink tint
            } else if (isDay) {
                cloudMat.color.setHex(0xffffff); // White
            } else {
                cloudMat.color.setHex(0x111122); // Dark Blue/Grey at night
            }
            cloudMat.opacity = 0.6;
        }
    }

    scene.background = currentSkyColor;
    if (fog) {
        fog.color.copy(currentSkyColor);
        fog.density = weather === 'rainy' ? 0.02 : (weather === 'cloudy' ? 0.01 : 0.005);
    }

    if (sunLight) {
        sunLight.intensity = sunIntensity;
        sunLight.position.copy(sunPos);
        sunLight.castShadow = sunIntensity > 0.1 && weather !== 'rainy';
    }
    
    if (hemiLight) {
        hemiLight.color.copy(currentSkyColor);
        hemiLight.groundColor.setHex(0x1a1a1a); 
        hemiLight.intensity = 0.2 + (sunIntensity * 0.6);
    }

    if (stars) {
        (stars.material as THREE.PointsMaterial).opacity = Math.max(0, 1 - (sunIntensity * 2));
    }

    streetLampsRef.current.forEach(lamp => {
      const needsLight = !isDay || weather === 'rainy' || sunIntensity < 0.3;
      (lamp.userData.bulb.material as THREE.MeshStandardMaterial).emissiveIntensity = needsLight ? 2 : 0;
      lamp.userData.light.intensity = needsLight ? 40 : 0;
    });

    if (rainRef.current) {
        (rainRef.current.material as THREE.PointsMaterial).opacity = weather === 'rainy' ? 0.6 : 0;
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
