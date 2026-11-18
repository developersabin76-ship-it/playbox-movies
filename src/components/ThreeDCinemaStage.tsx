import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { X, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

export type StageModelId = 'projector' | 'satellite' | 'trophy';
export type StageFinishId = 'cyan' | 'gold' | 'titanium';
export type CameraPresetId = 'hero' | 'closeup' | 'top' | 'side';

interface ThreeDCinemaStageProps {
  isOpen: boolean;
  initialModel?: StageModelId;
  onClose: () => void;
}

// Pre-allocated math helpers outside render loop (Zero GC)
const _scratchVec = new THREE.Vector3();
const _camGoalPos = new THREE.Vector3();
const _camGoalTarget = new THREE.Vector3();

const CAMERA_PRESETS: Record<CameraPresetId, { pos: [number, number, number]; target: [number, number, number] }> = {
  hero: { pos: [5.2, 3.2, 6.2], target: [0, 1.8, 0] },
  closeup: { pos: [2.4, 2.3, 3.0], target: [0, 2.0, 0] },
  top: { pos: [0.1, 7.6, 1.8], target: [0, 1.4, 0] },
  side: { pos: [6.8, 2.0, 0.2], target: [0, 1.8, 0] },
};

const FINISH_PALETTES: Record<
  StageFinishId,
  { label: string; primaryHex: number; secondaryHex: number; accentHex: number; swatch: string }
> = {
  cyan: {
    label: 'Obsidian Cyan',
    primaryHex: 0x162238,
    secondaryHex: 0x64748b,
    accentHex: 0x00e5ff,
    swatch: '#00e5ff',
  },
  gold: {
    label: 'Brushed Gold',
    primaryHex: 0xc89b3c,
    secondaryHex: 0x1e2430,
    accentHex: 0xfbbf24,
    swatch: '#fbbf24',
  },
  titanium: {
    label: 'Titanium Silver',
    primaryHex: 0x94a3b8,
    secondaryHex: 0x1e293b,
    accentHex: 0x38bdf8,
    swatch: '#94a3b8',
  },
};

function createStudioFloorTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#050b18';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle concentric rings + calibrated grid lines
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.14)';
  ctx.lineWidth = 1.5;
  for (let r = 40; r <= 240; r += 40) {
    ctx.beginPath();
    ctx.arc(256, 256, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 512; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 124);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.78)');
  grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.32)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function attachExplodeVector(obj: THREE.Object3D, x: number, y: number, z: number) {
  obj.userData.basePos = obj.position.clone();
  obj.userData.explodeOffset = new THREE.Vector3(x, y, z);
}

export const ThreeDCinemaStage: React.FC<ThreeDCinemaStageProps> = ({
  isOpen,
  initialModel = 'projector',
  onClose,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [activeModel, setActiveModel] = useState<StageModelId>(initialModel);
  const [activeFinish, setActiveFinish] = useState<StageFinishId>('cyan');
  const [explodeFactor, setExplodeFactor] = useState<number>(0);
  const [cameraPreset, setCameraPreset] = useState<CameraPresetId>('hero');
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);
  const [webglUnavailable, setWebglUnavailable] = useState<boolean>(false);

  const stateRef = useRef({
    activeModel: initialModel as StageModelId,
    activeFinish: 'cyan' as StageFinishId,
    explodeTarget: 0,
    explodeCurrent: 0,
    cameraTweenActive: false,
    presetKey: 'hero' as CameraPresetId,
  });

  useEffect(() => {
    setActiveModel(initialModel);
    stateRef.current.activeModel = initialModel;
  }, [initialModel]);

  useEffect(() => {
    stateRef.current.activeModel = activeModel;
  }, [activeModel]);

  useEffect(() => {
    stateRef.current.activeFinish = activeFinish;
  }, [activeFinish]);

  useEffect(() => {
    stateRef.current.explodeTarget = explodeFactor;
  }, [explodeFactor]);

  // Keyboard shortcuts: H toggles dock, Escape closes stage
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') {
        setIsDockCollapsed((prev) => !prev);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const container = mountRef.current;
    if (!container) return;

    // 1. Software WebGL probe
    const isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas').getContext('webgl2');
        if (!probe) return true;
        const ext = probe.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
        const gpu = String(probe.getParameter(param) || '');
        probe.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglUnavailable(true);
      return;
    }

    setWebglUnavailable(false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    const handleContextLost = (e: Event) => {
      e.preventDefault();
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);

    // 2. Scene, Environment & Horizon-Matched Fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030816);
    scene.fog = new THREE.FogExp2(0x030816, 0.028);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // 3. Camera & OrbitControls
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 120);
    camera.position.set(...CAMERA_PRESETS.hero.pos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...CAMERA_PRESETS.hero.target);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2.2;
    controls.maxDistance = 14;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.addEventListener('start', () => {
      stateRef.current.cameraTweenActive = false;
    });

    // 4. Studio 3-Point Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x0f172a, 0.75);
    hemiLight.position.set(0, 15, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1e0, 2.2);
    keyLight.position.set(6, 10, 6);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.camera.left = -6;
    keyLight.shadow.camera.right = 6;
    keyLight.shadow.camera.top = 6;
    keyLight.shadow.camera.bottom = -6;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.35);
    rimLight.position.set(-6, 5, -5);
    scene.add(rimLight);

    // 5. Studio Ground & Contact Shadow
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const floorTex = createStudioFloorTexture(maxAniso);
    const contactShadowTex = createContactShadowTexture();

    const floorGeo = new THREE.CircleGeometry(28, 64);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.72,
      metalness: 0.25,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    const shadowPlaneGeo = new THREE.PlaneGeometry(5.5, 5.5);
    const shadowPlaneMat = new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.58,
    });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.015;
    scene.add(shadowPlane);

    // 6. InstancedMesh Studio Turntable LED Nodes (28 repeated items)
    const ledCount = 28;
    const ledGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.03, 12);
    const ledMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x00e5ff,
      emissiveIntensity: 1.4,
      roughness: 0.2,
      metalness: 0.6,
    });
    const ledInstances = new THREE.InstancedMesh(ledGeo, ledMat, ledCount);
    const dummyMatrix = new THREE.Matrix4();
    for (let i = 0; i < ledCount; i++) {
      const angle = (i / ledCount) * Math.PI * 2;
      dummyMatrix.makeTranslation(Math.cos(angle) * 2.55, 0.025, Math.sin(angle) * 2.55);
      ledInstances.setMatrixAt(i, dummyMatrix);
    }
    ledInstances.instanceMatrix.needsUpdate = true;
    ledInstances.computeBoundingSphere();
    scene.add(ledInstances);

    // Shared Dynamic Materials updated by Finish Switcher
    const primaryMat = new THREE.MeshStandardMaterial({
      color: FINISH_PALETTES.cyan.primaryHex,
      roughness: 0.34,
      metalness: 0.78,
    });
    const secondaryMat = new THREE.MeshStandardMaterial({
      color: FINISH_PALETTES.cyan.secondaryHex,
      roughness: 0.68,
      metalness: 0.22,
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: FINISH_PALETTES.cyan.accentHex,
      emissive: FINISH_PALETTES.cyan.accentHex,
      emissiveIntensity: 0.55,
      roughness: 0.22,
      metalness: 0.85,
    });
    const opticalGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xe0f7ff,
      metalness: 0,
      roughness: 0.08,
      transmission: isSoftwareGl ? 0 : 0.88,
      transparent: true,
      opacity: isSoftwareGl ? 0.45 : 1,
      ior: 1.55,
      thickness: 0.6,
      clearcoat: 1.0,
    });

    // =========================================================================
    // COMPOSITE MODEL 1: CINEMA PROJECTOR RIG (9-PART PROCEDURAL GROUP)
    // =========================================================================
    const projectorGroup = new THREE.Group();

    // Part 1: Pedestal Plinth (grounded at y=0)
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.32, 0.28, 32), secondaryMat);
    plinth.position.set(0, 0.14, 0);
    plinth.castShadow = true;
    attachExplodeVector(plinth, 0, -0.3, 0);
    projectorGroup.add(plinth);

    // Part 2: Vertical Support Column
    const column = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 1.25, 24), primaryMat);
    column.position.set(0, 0.9, 0);
    column.castShadow = true;
    attachExplodeVector(column, 0, -0.1, 0);
    projectorGroup.add(column);

    // Part 3: Articulated Yoke Arm
    const yoke = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.16, 0.34), secondaryMat);
    yoke.position.set(0, 1.58, 0);
    yoke.castShadow = true;
    attachExplodeVector(yoke, 0, 0.15, 0);
    projectorGroup.add(yoke);

    // Part 4: Main Projector Housing (Beveled ExtrudeGeometry)
    const chassisShape = new THREE.Shape();
    chassisShape.moveTo(-0.85, -0.45);
    chassisShape.lineTo(0.85, -0.45);
    chassisShape.lineTo(0.95, 0.35);
    chassisShape.lineTo(-0.75, 0.45);
    chassisShape.closePath();
    const chassisGeo = new THREE.ExtrudeGeometry(chassisShape, {
      depth: 0.9,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.08,
      bevelSegments: 3,
    });
    chassisGeo.center();
    const chassis = new THREE.Mesh(chassisGeo, primaryMat);
    chassis.position.set(0, 2.08, 0);
    chassis.castShadow = true;
    attachExplodeVector(chassis, 0, 0.45, 0);
    projectorGroup.add(chassis);

    // Part 5: Optical Lens Barrel (LatheGeometry)
    const lensPoints = [
      new THREE.Vector2(0.01, 0),
      new THREE.Vector2(0.32, 0),
      new THREE.Vector2(0.36, 0.35),
      new THREE.Vector2(0.42, 0.72),
      new THREE.Vector2(0.38, 0.76),
    ];
    const barrelGeo = new THREE.LatheGeometry(lensPoints, 32);
    const barrel = new THREE.Mesh(barrelGeo, secondaryMat);
    barrel.rotation.z = -Math.PI / 2;
    barrel.position.set(0.92, 2.08, 0);
    barrel.castShadow = true;
    attachExplodeVector(barrel, 1.1, 0.45, 0);
    projectorGroup.add(barrel);

    // Part 6: Optical Front Lens Element (MeshPhysicalMaterial)
    const glassLens = new THREE.Mesh(new THREE.SphereGeometry(0.33, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.45), opticalGlassMat);
    glassLens.rotation.z = -Math.PI / 2;
    glassLens.position.set(1.52, 2.08, 0);
    attachExplodeVector(glassLens, 1.8, 0.45, 0);
    projectorGroup.add(glassLens);

    // Part 7 & 8: Twin Cinema Film Reels (Spoked Lathe + Rim)
    const buildFilmReel = () => {
      const reel = new THREE.Group();
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.18, 20), accentMat);
      hub.rotation.x = Math.PI / 2;
      const flangeA = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.045, 12, 36), primaryMat);
      flangeA.position.z = 0.08;
      const flangeB = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.045, 12, 36), primaryMat);
      flangeB.position.z = -0.08;
      reel.add(hub, flangeA, flangeB);
      for (let s = 0; s < 4; s++) {
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.06, 0.05), secondaryMat);
        spoke.rotation.z = (s * Math.PI) / 4;
        reel.add(spoke);
      }
      return reel;
    };

    const reelFront = buildFilmReel();
    reelFront.position.set(0.45, 3.15, 0);
    attachExplodeVector(reelFront, 0.35, 1.3, 0);
    projectorGroup.add(reelFront);

    const reelRear = buildFilmReel();
    reelRear.position.set(-0.78, 2.98, 0);
    attachExplodeVector(reelRear, -0.6, 1.15, 0);
    projectorGroup.add(reelRear);

    // Part 9: Celluloid Film Strip Loop (TubeGeometry)
    const stripCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.78, 3.55, 0),
      new THREE.Vector3(-0.15, 3.72, 0),
      new THREE.Vector3(0.45, 3.75, 0),
      new THREE.Vector3(0.55, 2.6, 0),
      new THREE.Vector3(-0.65, 2.48, 0),
    ]);
    const stripMesh = new THREE.Mesh(new THREE.TubeGeometry(stripCurve, 32, 0.025, 8, false), accentMat);
    attachExplodeVector(stripMesh, 0, 1.0, 0);
    projectorGroup.add(stripMesh);

    scene.add(projectorGroup);

    // =========================================================================
    // COMPOSITE MODEL 2: BROADCAST SATELLITE DISH (8-PART PROCEDURAL GROUP)
    // =========================================================================
    const satelliteGroup = new THREE.Group();

    const satBase = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.28, 0.25, 32), secondaryMat);
    satBase.position.set(0, 0.125, 0);
    satBase.castShadow = true;
    attachExplodeVector(satBase, 0, -0.25, 0);
    satelliteGroup.add(satBase);

    const satTurret = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.56, 0.72, 24), primaryMat);
    satTurret.position.set(0, 0.62, 0);
    satTurret.castShadow = true;
    attachExplodeVector(satTurret, 0, 0.1, 0);
    satelliteGroup.add(satTurret);

    const satGimbal = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.45, 0.5), secondaryMat);
    satGimbal.position.set(0, 1.18, 0);
    attachExplodeVector(satGimbal, 0, 0.45, 0);
    satelliteGroup.add(satGimbal);

    // Parabolic Dish Assembly (rotates together)
    const dishAssembly = new THREE.Group();
    dishAssembly.position.set(0, 1.85, 0);
    dishAssembly.rotation.x = -0.55;

    const dishPts = [];
    for (let i = 0; i <= 16; i++) {
      const r = (i / 16) * 1.48;
      const y = r * r * 0.26;
      dishPts.push(new THREE.Vector2(r, y));
    }
    const dishGeo = new THREE.LatheGeometry(dishPts, 40);
    const dishMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.35,
      metalness: 0.65,
      side: THREE.DoubleSide,
    });
    const dishMesh = new THREE.Mesh(dishGeo, dishMat);
    dishMesh.castShadow = true;
    attachExplodeVector(dishMesh, 0, 0.55, 0);
    dishAssembly.add(dishMesh);

    const rimRing = new THREE.Mesh(new THREE.TorusGeometry(1.48, 0.045, 12, 48), accentMat);
    rimRing.rotation.x = Math.PI / 2;
    rimRing.position.y = 1.48 * 1.48 * 0.26;
    attachExplodeVector(rimRing, 0, 0.9, 0);
    dishAssembly.add(rimRing);

    // Feedhorn Tripod Struts
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const strutCurve = new THREE.LineCurve3(
        new THREE.Vector3(Math.cos(a) * 1.32, 0.45, Math.sin(a) * 1.32),
        new THREE.Vector3(0, 1.42, 0)
      );
      const strut = new THREE.Mesh(new THREE.TubeGeometry(strutCurve, 8, 0.025, 8, false), primaryMat);
      attachExplodeVector(strut, Math.cos(a) * 0.4, 1.0, Math.sin(a) * 0.4);
      dishAssembly.add(strut);
    }

    const lnbHead = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.36, 20), accentMat);
    lnbHead.position.set(0, 1.46, 0);
    attachExplodeVector(lnbHead, 0, 1.55, 0);
    dishAssembly.add(lnbHead);

    satelliteGroup.add(dishAssembly);
    satelliteGroup.visible = false;
    scene.add(satelliteGroup);

    // =========================================================================
    // COMPOSITE MODEL 3: CHAMPIONSHIP FOOTBALL TROPHY (7-PART GROUP)
    // =========================================================================
    const trophyGroup = new THREE.Group();

    const trophyPlinth = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.12, 0.38, 8), secondaryMat);
    trophyPlinth.position.set(0, 0.19, 0);
    trophyPlinth.castShadow = true;
    attachExplodeVector(trophyPlinth, 0, -0.3, 0);
    trophyGroup.add(trophyPlinth);

    const trophyPlaque = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.2, 0.06), accentMat);
    trophyPlaque.position.set(0, 0.2, 0.98);
    attachExplodeVector(trophyPlaque, 0, -0.2, 0.65);
    trophyGroup.add(trophyPlaque);

    const cupPoints = [
      new THREE.Vector2(0.01, 0),
      new THREE.Vector2(0.56, 0),
      new THREE.Vector2(0.32, 0.25),
      new THREE.Vector2(0.22, 0.85),
      new THREE.Vector2(0.68, 1.45),
      new THREE.Vector2(0.84, 2.15),
      new THREE.Vector2(0.76, 2.2),
      new THREE.Vector2(0.56, 1.5),
      new THREE.Vector2(0.01, 1.35),
    ];
    const cupMesh = new THREE.Mesh(new THREE.LatheGeometry(cupPoints, 40), primaryMat);
    cupMesh.position.set(0, 0.4, 0);
    cupMesh.castShadow = true;
    attachExplodeVector(cupMesh, 0, 0.45, 0);
    trophyGroup.add(cupMesh);

    const buildHandle = (dir: number) => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(dir * 0.68, 2.38, 0),
        new THREE.Vector3(dir * 1.18, 2.28, 0),
        new THREE.Vector3(dir * 1.05, 1.68, 0),
        new THREE.Vector3(dir * 0.46, 1.48, 0),
      ]);
      const h = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.055, 10, false), accentMat);
      attachExplodeVector(h, dir * 0.85, 0.55, 0);
      return h;
    };
    trophyGroup.add(buildHandle(1), buildHandle(-1));

    const ballCrown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.46, 1), primaryMat);
    ballCrown.position.set(0, 2.86, 0);
    ballCrown.castShadow = true;
    attachExplodeVector(ballCrown, 0, 1.4, 0);
    trophyGroup.add(ballCrown);

    const ballHalo = new THREE.Mesh(new THREE.TorusGeometry(0.64, 0.03, 10, 36), accentMat);
    ballHalo.rotation.x = Math.PI / 3;
    ballHalo.position.set(0, 2.86, 0);
    attachExplodeVector(ballHalo, 0, 1.75, 0);
    trophyGroup.add(ballHalo);

    trophyGroup.visible = false;
    scene.add(trophyGroup);

    const modelMap: Record<StageModelId, THREE.Group> = {
      projector: projectorGroup,
      satellite: satelliteGroup,
      trophy: trophyGroup,
    };

    // 7. Resize Observer
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // 8. Paced 60fps Animation Loop with Software WebGL afterDraw Guard
    let frameId = 0;
    let isDisposed = false;
    let lastTime = performance.now();
    let elapsedTotal = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (isDisposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function applyExplode(group: THREE.Group, factor: number) {
      for (const child of group.children) {
        if (child.userData.basePos && child.userData.explodeOffset) {
          _scratchVec.copy(child.userData.basePos).addScaledVector(child.userData.explodeOffset, factor);
          child.position.copy(_scratchVec);
        }
        if (child instanceof THREE.Group) {
          applyExplode(child, factor);
        }
      }
    }

    let lastAppliedFinish: StageFinishId | null = null;

    function tick() {
      if (isDisposed) return;
      const now = performance.now();
      const delta = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      elapsedTotal += delta;

      const s = stateRef.current;

      // Update active model visibility
      for (const [k, grp] of Object.entries(modelMap)) {
        grp.visible = k === s.activeModel;
      }

      // Sync material finish palette
      if (lastAppliedFinish !== s.activeFinish) {
        const pal = FINISH_PALETTES[s.activeFinish];
        primaryMat.color.setHex(pal.primaryHex);
        secondaryMat.color.setHex(pal.secondaryHex);
        accentMat.color.setHex(pal.accentHex);
        accentMat.emissive.setHex(pal.accentHex);
        ledMat.color.setHex(pal.accentHex);
        ledMat.emissive.setHex(pal.accentHex);
        lastAppliedFinish = s.activeFinish;
      }

      // Smooth exponential damping for Exploded View
      s.explodeCurrent = THREE.MathUtils.damp(s.explodeCurrent, s.explodeTarget, 8, delta);
      applyExplode(modelMap[s.activeModel], s.explodeCurrent);

      // Gentle mechanical animation
      if (s.activeModel === 'projector') {
        reelFront.rotation.z -= delta * 1.4;
        reelRear.rotation.z -= delta * 1.4;
        projectorGroup.rotation.y = Math.sin(elapsedTotal * 0.25) * 0.18;
      } else if (s.activeModel === 'satellite') {
        satelliteGroup.rotation.y = Math.sin(elapsedTotal * 0.35) * 0.45;
      } else if (s.activeModel === 'trophy') {
        trophyGroup.rotation.y += delta * 0.45;
        ballCrown.rotation.y += delta * 0.8;
      }

      // Smooth damped camera preset transitions
      if (s.cameraTweenActive) {
        const preset = CAMERA_PRESETS[s.presetKey];
        _camGoalPos.set(preset.pos[0], preset.pos[1], preset.pos[2]);
        _camGoalTarget.set(preset.target[0], preset.target[1], preset.target[2]);
        const alpha = 1 - Math.exp(-6 * delta);
        camera.position.lerp(_camGoalPos, alpha);
        controls.target.lerp(_camGoalTarget, alpha);
        if (camera.position.distanceTo(_camGoalPos) < 0.03) {
          s.cameraTweenActive = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    frameId = requestAnimationFrame(tick);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      controls.dispose();
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      });
      floorTex.dispose();
      contactShadowTex.dispose();
      envTarget.dispose();
      renderer.dispose();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const selectPreset = (preset: CameraPresetId) => {
    setCameraPreset(preset);
    stateRef.current.presetKey = preset;
    stateRef.current.cameraTweenActive = true;
  };

  return (
    <div className="fixed inset-0 z-[70] w-screen h-screen bg-[#030816] text-white overflow-hidden select-none">
      {/* Isolated WebGL Mount Target */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Graceful WebGL Fallback */}
      {webglUnavailable && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#030816] p-6 text-center">
          <p className="text-lg font-bold text-white mb-2">3D Hardware Preview Unavailable</p>
          <p className="text-xs text-slate-400 max-w-md mb-4">
            WebGL rendering is disabled in this browser session. Return to the main streaming catalog to watch HD movies and Live TV.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer"
          >
            Return to Streaming
          </button>
        </div>
      )}

      {/* Minimal Top Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div
          className="px-4 py-2 rounded-xl border border-cyan-500/30 pointer-events-auto"
          style={{ backgroundColor: 'rgba(4, 10, 22, 0.9)' }}
        >
          <p className="text-xs font-bold text-cyan-300">LIONEL STREAM 3D STUDIO</p>
          <p className="text-[11px] text-slate-400">Drag to orbit · Scroll to zoom · Press H to toggle controls</p>
        </div>

        <button
          onClick={onClose}
          className="px-3.5 py-2 rounded-xl border border-cyan-500/40 text-xs font-bold text-white hover:text-cyan-300 flex items-center gap-1.5 cursor-pointer pointer-events-auto"
          style={{ backgroundColor: 'rgba(4, 10, 22, 0.92)' }}
          title="Close 3D Studio (Esc)"
        >
          <X className="w-4 h-4 text-cyan-400" />
          <span>Close 3D Stage</span>
        </button>
      </div>

      {/* Collapsible Unified Bottom Control Dock */}
      <div
        className="absolute left-1/2 -translate-x-1/2 z-20 transition-transform duration-300"
        style={{
          bottom: isDockCollapsed ? '-138px' : '16px',
          width: 'min(920px, 94vw)',
        }}
      >
        <div className="flex justify-center mb-1.5">
          <button
            onClick={() => setIsDockCollapsed((prev) => !prev)}
            className="px-3.5 py-1 rounded-t-xl border border-cyan-500/40 text-[11px] font-bold text-cyan-300 flex items-center gap-1 cursor-pointer"
            style={{ backgroundColor: 'rgba(4, 10, 22, 0.94)' }}
          >
            {isDockCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{isDockCollapsed ? 'Show Controls (H)' : 'Hide Controls (H)'}</span>
          </button>
        </div>

        <div
          className="p-3 sm:p-4 rounded-2xl border border-cyan-500/35 shadow-2xl flex flex-wrap items-center justify-between gap-3"
          style={{ backgroundColor: 'rgba(4, 10, 22, 0.92)' }}
        >
          {/* Model Selector */}
          <div className="flex items-center gap-1.5">
            {(
              [
                { id: 'projector', label: 'Cinema Projector' },
                { id: 'satellite', label: 'Live TV Dish' },
                { id: 'trophy', label: 'Sports Trophy' },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveModel(m.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  activeModel === m.id
                    ? 'bg-cyan-400 text-slate-950'
                    : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Exploded View Slider */}
          <div className="flex items-center gap-2 min-w-[170px]">
            <span className="text-[11px] font-semibold text-slate-300 whitespace-nowrap">Explode</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={explodeFactor}
              onChange={(e) => setExplodeFactor(Number(e.target.value))}
              className="w-24 accent-cyan-400 cursor-pointer"
              aria-label="Explode assembly slider"
            />
            <span className="text-[11px] font-mono text-cyan-300 tabular-nums w-8">
              {Math.round(explodeFactor * 100)}%
            </span>
          </div>

          {/* Finish Swatches */}
          <div className="flex items-center gap-1.5">
            {(Object.keys(FINISH_PALETTES) as StageFinishId[]).map((fid) => (
              <button
                key={fid}
                onClick={() => setActiveFinish(fid)}
                className={`w-7 h-7 rounded-lg border flex items-center justify-center cursor-pointer transition-transform ${
                  activeFinish === fid ? 'border-white scale-110' : 'border-slate-700 opacity-75 hover:opacity-100'
                }`}
                style={{ backgroundColor: FINISH_PALETTES[fid].swatch }}
                title={FINISH_PALETTES[fid].label}
              />
            ))}
          </div>

          {/* Camera Presets */}
          <div className="flex items-center gap-1">
            {(['hero', 'closeup', 'top', 'side'] as CameraPresetId[]).map((preset) => (
              <button
                key={preset}
                onClick={() => selectPreset(preset)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase cursor-pointer transition-colors ${
                  cameraPreset === preset
                    ? 'bg-sky-500 text-slate-950'
                    : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                {preset}
              </button>
            ))}
            <button
              onClick={() => {
                setExplodeFactor(0);
                selectPreset('hero');
              }}
              className="p-1.5 rounded-lg bg-slate-900 text-slate-300 hover:text-cyan-300 border border-slate-800 cursor-pointer"
              title="Reset view"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
