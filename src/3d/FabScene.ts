import * as THREE from 'three';
import { CameraViewMode, EquippedPPE, SectorId, SectorState } from '../types/game';
import { ActionEffectType, ParticleEffectsManager } from './ParticleEffects';

// Pre-allocated math objects to ensure zero GC in animation loop
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _projVec = new THREE.Vector3();

export interface OffscreenIndicator {
  sectorId: SectorId;
  xPct: number;
  yPct: number;
  angleDeg: number;
  status: 'PRE_ALARM' | 'WARNING' | 'CRITICAL';
  distanceM: number;
}

export interface PlayerProximityReport {
  distances: Record<SectorId, number>;
  playerPos: { x: number; z: number };
  isAutoWalking: boolean;
  walkingTargetSector: SectorId | null;
  offscreenIndicators: OffscreenIndicator[];
}

export interface FabSceneOptions {
  container: HTMLElement;
  onSelectSector?: (sectorId: SectorId) => void;
  onHitEmo?: (sectorId: SectorId) => void;
  onProximityUpdate?: (report: PlayerProximityReport) => void;
}

interface PatrollingWorker {
  group: THREE.Group;
  waypoints: THREE.Vector3[];
  currentWaypointIndex: number;
  speed: number;
  pauseTimer: number;
  tabletGlow: THREE.Mesh;
}

interface AndonTower {
  redLamp: THREE.MeshBasicMaterial;
  amberLamp: THREE.MeshBasicMaterial;
  blueLamp: THREE.MeshBasicMaterial;
  greenLamp: THREE.MeshBasicMaterial;
}

export const BAY_OPERATOR_STAND_POSITIONS: Record<SectorId, THREE.Vector3> = {
  PHOTOLITHOGRAPHY: new THREE.Vector3(-11, 1.7, -6.2),
  ETCH_CVD: new THREE.Vector3(11, 1.7, -6.2),
  CMP_WET_BENCH: new THREE.Vector3(-11, 1.7, 3.4),
  DIFFUSION_FURNACE: new THREE.Vector3(11, 1.7, 3.4),
  ION_IMPLANTATION: new THREE.Vector3(0, 1.7, -7.0),
};

export const ON_SITE_DISTANCE_THRESHOLD_M = 5.5;

export class FabScene {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock: THREE.Clock;
  private isSoftwareGl: boolean;
  private frameId: number = 0;
  private isDestroyed: boolean = false;

  // Particle Effects
  private particleEffects: ParticleEffectsManager;

  // Camera & Player Position
  private viewMode: CameraViewMode = 'VR_FIRST_PERSON';
  private targetCameraPos = new THREE.Vector3(0, 1.7, 3.5);
  private targetCameraLookAt = new THREE.Vector3(0, 1.6, -8);
  private currentCameraLookAt = new THREE.Vector3(0, 1.6, -8);
  private vrPlayerPos = new THREE.Vector3(0, 1.7, 3.5);
  private vrPlayerYaw = 0;
  private vrPlayerPitch = 0;

  // Auto-Walk state
  private autoWalkTargetPos: THREE.Vector3 | null = null;
  private autoWalkLookAtPos: THREE.Vector3 | null = null;
  private autoWalkSector: SectorId | null = null;

  // 3D Player Engineer Avatar (visible in Whole Fab / Inspection views)
  private playerAvatarGroup: THREE.Group | null = null;
  private playerLeftLeg: THREE.Mesh | null = null;
  private playerRightLeg: THREE.Mesh | null = null;
  private playerLeftArm: THREE.Mesh | null = null;
  private playerRightArm: THREE.Mesh | null = null;
  private playerFloorRing: THREE.Mesh | null = null;
  private playerScbaGroup: THREE.Group | null = null;
  private playerAcidApronGroup: THREE.Group | null = null;
  private playerHvGlovesGroup: THREE.Group | null = null;
  private cameraShakeIntensity: number = 0;
  private hazardMitigationScale: number = 1.0;

  // Input state
  private keysHeld: Record<string, boolean> = {};
  private isDragging = false;
  private prevMouseX = 0;
  private prevMouseY = 0;
  private virtualJoystickVector = { x: 0, y: 0 };

  // Scene Objects
  private machineGroups: Map<SectorId, THREE.Group> = new Map();
  private machineBasePositions: Map<SectorId, THREE.Vector3> = new Map();
  private andonTowers: Map<SectorId, AndonTower> = new Map();
  private emoButtons: Map<SectorId, THREE.Mesh> = new Map();
  private hazardEffects: Map<SectorId, THREE.Group> = new Map();
  private specificCrisisMeshes: Map<string, THREE.Group> = new Map();
  private sectorStatesSnapshot: Record<SectorId, SectorState> | null = null;
  private ohtCarriers: THREE.Group[] = [];
  private patrollingWorkers: PatrollingWorker[] = [];
  private emergencyBeacons: THREE.PointLight[] = [];
  private plasmaChamberMesh: THREE.Mesh | null = null;
  private plasmaCoreLight: THREE.PointLight | null = null;
  private ionAcceleratorBeam: THREE.Mesh | null = null;
  private cmpPadMesh: THREE.Mesh | null = null;
  private furnaceTubes: THREE.Mesh[] = [];
  private bayBillboards: Map<
    SectorId,
    {
      mesh: THREE.Mesh;
      canvas: HTMLCanvasElement;
      ctx: CanvasRenderingContext2D;
      texture: THREE.CanvasTexture;
      baseY: number;
    }
  > = new Map();

  // Callbacks
  private onSelectSector?: (sectorId: SectorId) => void;
  private onHitEmo?: (sectorId: SectorId) => void;
  private onProximityUpdate?: (report: PlayerProximityReport) => void;
  private lastProximityEmitTime = 0;

  // Raycaster
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  // Active hazard state in 3D
  private activeHazardSector: SectorId | null = null;
  private activeHazardTypeId: string | null = null;
  private isHazardActive: boolean = false;
  private language: 'zh-TW' | 'en' = 'zh-TW';

  public setLanguage(lang: 'zh-TW' | 'en') {
    this.language = lang;
    if (this.sectorStatesSnapshot) {
      this.updateSectorStatus(this.sectorStatesSnapshot);
    }
  }

  constructor(options: FabSceneOptions) {
    this.container = options.container;
    this.onSelectSector = options.onSelectSector;
    this.onHitEmo = options.onHitEmo;
    this.onProximityUpdate = options.onProximityUpdate;
    this.clock = new THREE.Clock();

    // 1. Detect software WebGL
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Initialize Three.js Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.container.appendChild(this.renderer.domElement);

    // 3. Cleanroom Atmosphere & Bright Environment
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1e293b);
    this.scene.fog = new THREE.FogExp2(0x1e293b, 0.0075);

    this.particleEffects = new ParticleEffectsManager(this.scene);

    const aspect = this.container.clientWidth / this.container.clientHeight;
    const initialFov = aspect < 1.0 ? 82 : 65;
    this.camera = new THREE.PerspectiveCamera(initialFov, aspect, 0.1, 150);
    this.camera.position.set(0, 1.7, 3.5);
    this.targetCameraPos.set(0, 1.7, 3.5);
    this.vrPlayerPos.set(0, 1.7, 3.5);
    this.updateVrLookAt();

    // 4. Build Environment
    this.buildLighting();
    this.buildCleanroomArchitecture();
    this.buildVMBAndPipingNetwork();
    this.buildSectors();
    this.buildBayBillboards();
    this.buildOverheadWaferTrack();
    this.buildSafetyStations();
    this.buildPatrollingTechnicians();
    this.buildPlayerEngineerAvatar();

    // 5. Interaction & Loop
    this.bindEvents();
    this.startLoop();
  }

  private buildLighting() {
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xcfd8dc, 1.25);
    this.scene.add(hemiLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    this.scene.add(ambientLight);

    const mainFabLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainFabLight.position.set(8, 20, 12);
    mainFabLight.castShadow = !this.isSoftwareGl;
    if (mainFabLight.castShadow) {
      mainFabLight.shadow.mapSize.width = 1024;
      mainFabLight.shadow.mapSize.height = 1024;
      mainFabLight.shadow.camera.near = 0.5;
      mainFabLight.shadow.camera.far = 45;
      mainFabLight.shadow.bias = -0.0003;
    }
    this.scene.add(mainFabLight);

    const fillLight = new THREE.DirectionalLight(0xe2e8f0, 0.7);
    fillLight.position.set(-10, 15, -10);
    this.scene.add(fillLight);

    // Bay overhead lights (with warm yellow tint in Bay 101 Photolithography)
    const bayLights: { pos: THREE.Vector3; color: number; intensity: number }[] = [
      { pos: new THREE.Vector3(-11, 6.0, -10), color: 0xfef08a, intensity: 1.15 }, // Yellow room safe light
      { pos: new THREE.Vector3(0, 6.0, -11), color: 0xffffff, intensity: 0.95 },
      { pos: new THREE.Vector3(11, 6.0, -10), color: 0xffffff, intensity: 0.95 },
      { pos: new THREE.Vector3(-11, 6.0, 7), color: 0xffffff, intensity: 0.95 },
      { pos: new THREE.Vector3(11, 6.0, 7), color: 0xffffff, intensity: 0.95 },
    ];
    bayLights.forEach((b) => {
      const bayLight = new THREE.PointLight(b.color, b.intensity, 15);
      bayLight.position.copy(b.pos);
      this.scene.add(bayLight);
    });

    // Emergency Beacon Lights
    const beaconPositions = [
      new THREE.Vector3(-10, 5.8, -10),
      new THREE.Vector3(0, 5.8, -10),
      new THREE.Vector3(10, 5.8, -10),
      new THREE.Vector3(-10, 5.8, 7),
      new THREE.Vector3(10, 5.8, 7),
    ];
    beaconPositions.forEach((pos) => {
      const beaconLight = new THREE.PointLight(0xef4444, 0, 16);
      beaconLight.position.copy(pos);
      this.scene.add(beaconLight);
      this.emergencyBeacons.push(beaconLight);

      const beaconMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.2, 12),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      beaconMesh.position.copy(pos);
      this.scene.add(beaconMesh);
    });
  }

  private buildCleanroomArchitecture() {
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 512;
    floorCanvas.height = 512;
    const ctx = floorCanvas.getContext('2d')!;

    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, 512, 512);

    ctx.fillStyle = '#94a3b8';
    for (let x = 32; x < 512; x += 48) {
      for (let y = 32; y < 512; y += 48) {
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const floorTexture = new THREE.CanvasTexture(floorCanvas);
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(16, 16);
    floorTexture.colorSpace = THREE.SRGBColorSpace;
    floorTexture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();

    const floorGeo = new THREE.PlaneGeometry(44, 44);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.35,
      metalness: 0.2,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = !this.isSoftwareGl;
    this.scene.add(floorMesh);

    // Central Walkway Safety Lane Striping
    const aisleMat = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
    });
    const aisleNS = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 26), aisleMat);
    aisleNS.rotation.x = -Math.PI / 2;
    aisleNS.position.set(0, 0.015, -1);
    this.scene.add(aisleNS);

    const aisleEW = new THREE.Mesh(new THREE.PlaneGeometry(28, 3.2), aisleMat);
    aisleEW.rotation.x = -Math.PI / 2;
    aisleEW.position.set(0, 0.014, -1.5);
    this.scene.add(aisleEW);

    // Cleanroom Walls
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.25,
      metalness: 0.45,
    });

    const createWall = (w: number, h: number, x: number, y: number, z: number, ry: number) => {
      const geo = new THREE.BoxGeometry(w, h, 0.4);
      const mesh = new THREE.Mesh(geo, wallMat);
      mesh.position.set(x, y, z);
      mesh.rotation.y = ry;
      mesh.receiveShadow = !this.isSoftwareGl;
      this.scene.add(mesh);
    };

    createWall(44, 6.5, 0, 3.25, -21, 0);
    createWall(44, 6.5, -21, 3.25, 0, Math.PI / 2);
    createWall(44, 6.5, 21, 3.25, 0, -Math.PI / 2);

    // Yellow Photolithography UV Filtered Partition (Bay 101)
    const yellowGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xf59e0b,
      roughness: 0.1,
      metalness: 0.1,
      transmission: this.isSoftwareGl ? 0 : 0.85,
      transparent: true,
      opacity: this.isSoftwareGl ? 0.35 : 0.85,
      ior: 1.5,
    });
    const lithoPartition = new THREE.Mesh(new THREE.BoxGeometry(8, 5.5, 0.1), yellowGlassMat);
    lithoPartition.position.set(-6, 2.75, -10);
    lithoPartition.rotation.y = Math.PI / 2;
    this.scene.add(lithoPartition);

    // Ceiling Grid with HEPA FFU units
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.4,
      metalness: 0.3,
    });
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(44, 44), ceilingMat);
    ceiling.position.y = 6.4;
    ceiling.rotation.x = Math.PI / 2;
    this.scene.add(ceiling);

    for (let z = -16; z <= 16; z += 6) {
      const stripGeo = new THREE.BoxGeometry(34, 0.1, 0.4);
      const stripMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const strip = new THREE.Mesh(stripGeo, stripMat);
      strip.position.set(0, 6.35, z);
      this.scene.add(strip);
    }
  }

  private buildVMBAndPipingNetwork() {
    const pipeGroup = new THREE.Group();

    const vmbMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.9,
      roughness: 0.2,
    });
    const gaugeMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });

    const createVMB = (x: number, y: number, z: number, ry: number) => {
      const vmb = new THREE.Group();
      vmb.position.set(x, y, z);
      vmb.rotation.y = ry;

      const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 0.4), vmbMat);
      vmb.add(chassis);

      for (let g = 0; g < 4; g++) {
        const gauge = new THREE.Mesh(new THREE.CircleGeometry(0.1, 16), gaugeMat);
        gauge.position.set(-0.35 + (g % 2) * 0.7, 0.35 - Math.floor(g / 2) * 0.5, 0.21);
        vmb.add(gauge);
      }

      const valve = new THREE.Mesh(
        new THREE.TorusGeometry(0.12, 0.03, 8, 16),
        new THREE.MeshStandardMaterial({ color: 0xef4444 })
      );
      valve.position.set(0, -0.45, 0.22);
      vmb.add(valve);

      pipeGroup.add(vmb);
    };

    createVMB(-20.7, 2.8, -10, Math.PI / 2);
    createVMB(-20.7, 2.8, 6, Math.PI / 2);
    createVMB(20.7, 2.8, -10, -Math.PI / 2);
    createVMB(20.7, 2.8, 6, -Math.PI / 2);
    createVMB(-4, 2.8, -20.7, 0);

    const pipeColors = [
      { color: 0xeab308, y: 5.5 },
      { color: 0x22c55e, y: 5.3 },
      { color: 0x0ea5e9, y: 5.1 },
      { color: 0xf97316, y: 4.9 },
    ];

    pipeColors.forEach((p) => {
      const mat = new THREE.MeshStandardMaterial({
        color: p.color,
        metalness: 0.75,
        roughness: 0.25,
      });

      const pipeEW = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 38, 12), mat);
      pipeEW.rotation.z = Math.PI / 2;
      pipeEW.position.set(0, p.y, -16);
      pipeGroup.add(pipeEW);

      const pipeEW2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 38, 12), mat);
      pipeEW2.rotation.z = Math.PI / 2;
      pipeEW2.position.set(0, p.y, 14);
      pipeGroup.add(pipeEW2);

      [-11, 0, 11].forEach((dx) => {
        const dropPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 30, 12), mat);
        dropPipe.rotation.x = Math.PI / 2;
        dropPipe.position.set(dx, p.y, -1);
        pipeGroup.add(dropPipe);
      });
    });

    this.scene.add(pipeGroup);
  }

  private createAndonStackTower(parent: THREE.Group, sectorId: SectorId, pos: THREE.Vector3) {
    const tower = new THREE.Group();
    tower.position.copy(pos);

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.55, 10),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 })
    );
    pole.position.y = 0.25;
    tower.add(pole);

    const redLamp = new THREE.MeshBasicMaterial({ color: 0x450a0a });
    const amberLamp = new THREE.MeshBasicMaterial({ color: 0x451a03 });
    const blueLamp = new THREE.MeshBasicMaterial({ color: 0x0c4a6e });
    const greenLamp = new THREE.MeshBasicMaterial({ color: 0x22c55e });

    const lamps = [
      { mat: greenLamp, y: 0.58 },
      { mat: blueLamp, y: 0.71 },
      { mat: amberLamp, y: 0.84 },
      { mat: redLamp, y: 0.97 },
    ];

    lamps.forEach((l) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.11, 16), l.mat);
      m.position.y = l.y;
      tower.add(m);
    });

    parent.add(tower);
    this.andonTowers.set(sectorId, { redLamp, amberLamp, blueLamp, greenLamp });
  }

  private buildSectors() {
    const whiteEnclosureMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.6,
    });
    const silverSteelMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.15,
      metalness: 0.9,
    });
    const darkConsoleTrim = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.3,
      metalness: 0.7,
    });

    // ----------------------------------------------------
    // Bay 101: Photolithography (-11, 0, -10)
    // ----------------------------------------------------
    const lithoGroup = new THREE.Group();
    lithoGroup.position.set(-11, 0, -10);
    this.machineBasePositions.set('PHOTOLITHOGRAPHY', lithoGroup.position.clone());

    const lithoCabinet = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.8, 3.2), whiteEnclosureMat);
    lithoCabinet.position.y = 1.9;
    lithoCabinet.castShadow = !this.isSoftwareGl;
    lithoGroup.add(lithoCabinet);

    const opticTower = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 1.4, 24), silverSteelMat);
    opticTower.position.set(0, 4.3, 0);
    lithoGroup.add(opticTower);

    const lensMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 0.15, 24),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    lensMesh.position.set(0, 3.85, 0);
    lithoGroup.add(lensMesh);

    const loadPort = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 0.8), darkConsoleTrim);
    loadPort.position.set(0, 1.0, 1.8);
    lithoGroup.add(loadPort);

    const wafer = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.48, 0.02, 32),
      new THREE.MeshStandardMaterial({ color: 0x818cf8, roughness: 0.05, metalness: 0.98 })
    );
    wafer.position.set(0, 1.6, 1.8);
    lithoGroup.add(wafer);

    this.createAndonStackTower(lithoGroup, 'PHOTOLITHOGRAPHY', new THREE.Vector3(1.8, 3.8, 1.2));
    this.createEmoButton(lithoGroup, 'PHOTOLITHOGRAPHY', new THREE.Vector3(1.6, 1.3, 1.6));
    this.scene.add(lithoGroup);
    this.machineGroups.set('PHOTOLITHOGRAPHY', lithoGroup);

    // ----------------------------------------------------
    // Bay 105: Ion Implantation (0, 0, -11)
    // ----------------------------------------------------
    const ionGroup = new THREE.Group();
    ionGroup.position.set(0, 0, -11);
    this.machineBasePositions.set('ION_IMPLANTATION', ionGroup.position.clone());

    const ionBase = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.2, 3.6), whiteEnclosureMat);
    ionBase.position.y = 0.6;
    ionGroup.add(ionBase);

    const columnGroup = new THREE.Group();
    columnGroup.position.set(-1.0, 2.3, 0);

    for (let r = 0; r < 6; r++) {
      const ring = new THREE.Mesh(
        new THREE.CylinderGeometry(0.65, 0.65, 0.14, 24),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, metalness: 0.4 })
      );
      ring.position.y = r * 0.3;
      columnGroup.add(ring);

      const collar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.72, 0.72, 0.05, 24),
        new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.95, roughness: 0.15 })
      );
      collar.position.y = r * 0.3 + 0.12;
      columnGroup.add(collar);
    }
    ionGroup.add(columnGroup);

    const magnetYoke = new THREE.Mesh(
      new THREE.TorusGeometry(0.85, 0.22, 16, 24, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.9, roughness: 0.25 })
    );
    magnetYoke.position.set(0.2, 3.2, 0);
    magnetYoke.rotation.z = Math.PI;
    ionGroup.add(magnetYoke);

    const sourceBox = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 1.2), silverSteelMat);
    sourceBox.position.set(-1.0, 4.4, 0);
    ionGroup.add(sourceBox);

    const beamMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8 });
    const beamMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 16), beamMat);
    beamMesh.position.set(0.6, 2.4, 0);
    beamMesh.rotation.z = Math.PI / 2;
    ionGroup.add(beamMesh);
    this.ionAcceleratorBeam = beamMesh;

    const stickStand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 1.8, 12),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8 })
    );
    stickStand.position.set(1.9, 0.9, 1.2);
    ionGroup.add(stickStand);

    const stick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 1.4, 12),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 })
    );
    stick.position.set(1.9, 1.1, 1.25);
    ionGroup.add(stick);

    this.createAndonStackTower(ionGroup, 'ION_IMPLANTATION', new THREE.Vector3(1.8, 3.6, 1.2));
    this.createEmoButton(ionGroup, 'ION_IMPLANTATION', new THREE.Vector3(1.6, 1.3, 1.4));
    this.scene.add(ionGroup);
    this.machineGroups.set('ION_IMPLANTATION', ionGroup);

    // ----------------------------------------------------
    // Bay 102: Plasma Etch & CVD (11, 0, -10)
    // ----------------------------------------------------
    const etchGroup = new THREE.Group();
    etchGroup.position.set(11, 0, -10);
    this.machineBasePositions.set('ETCH_CVD', etchGroup.position.clone());

    const plinth = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.0, 3.6), whiteEnclosureMat);
    plinth.position.y = 0.5;
    etchGroup.add(plinth);

    const chamber = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 2.2, 32), silverSteelMat);
    chamber.position.y = 2.1;
    etchGroup.add(chamber);

    const windowRim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.06, 16, 32), darkConsoleTrim);
    windowRim.position.set(0, 2.1, 1.32);
    etchGroup.add(windowRim);

    const plasmaMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const plasmaSphere = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 24), plasmaMat);
    plasmaSphere.position.set(0, 2.1, 1.1);
    etchGroup.add(plasmaSphere);
    this.plasmaChamberMesh = plasmaSphere;

    const plasmaLight = new THREE.PointLight(0x06b6d4, 1.8, 6);
    plasmaLight.position.set(0, 2.1, 1.3);
    etchGroup.add(plasmaLight);
    this.plasmaCoreLight = plasmaLight;

    this.createAndonStackTower(etchGroup, 'ETCH_CVD', new THREE.Vector3(1.5, 3.2, 1.2));
    this.createEmoButton(etchGroup, 'ETCH_CVD', new THREE.Vector3(1.5, 1.3, 1.5));
    this.scene.add(etchGroup);
    this.machineGroups.set('ETCH_CVD', etchGroup);

    // ----------------------------------------------------
    // Bay 103: CMP & Acid Wet Bench (-11, 0, 7)
    // ----------------------------------------------------
    const cmpGroup = new THREE.Group();
    cmpGroup.position.set(-11, 0, 7);
    this.machineBasePositions.set('CMP_WET_BENCH', cmpGroup.position.clone());

    const cmpBase = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.1, 2.6), whiteEnclosureMat);
    cmpBase.position.y = 0.55;
    cmpGroup.add(cmpBase);

    const sashMat = new THREE.MeshPhysicalMaterial({
      color: 0x93c5fd,
      roughness: 0.05,
      metalness: 0.05,
      transmission: this.isSoftwareGl ? 0 : 0.9,
      transparent: true,
      opacity: this.isSoftwareGl ? 0.35 : 0.85,
    });
    const sash = new THREE.Mesh(new THREE.BoxGeometry(4.0, 1.6, 0.08), sashMat);
    sash.position.set(0, 1.9, 0.9);
    cmpGroup.add(sash);

    const cmpPad = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.7, 0.15, 32),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.6, metalness: 0.2 })
    );
    cmpPad.position.set(-0.9, 1.15, 0);
    cmpGroup.add(cmpPad);
    this.cmpPadMesh = cmpPad;

    const bathFluid = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.2, 1.4),
      new THREE.MeshStandardMaterial({
        color: 0x10b981,
        roughness: 0.1,
        metalness: 0.1,
        transparent: true,
        opacity: 0.7,
      })
    );
    bathFluid.position.set(1.0, 1.05, 0);
    cmpGroup.add(bathFluid);

    // Emergency Deluge Shower Station
    const showerGroup = new THREE.Group();
    showerGroup.position.set(3.0, 0, 0);

    const showerPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 3.4, 16),
      new THREE.MeshStandardMaterial({ color: 0x15803d, metalness: 0.5, roughness: 0.3 })
    );
    showerPost.position.y = 1.7;
    showerGroup.add(showerPost);

    const showerHead = new THREE.Mesh(
      new THREE.ConeGeometry(0.3, 0.2, 16),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.7, roughness: 0.2 })
    );
    showerHead.position.set(0.4, 3.3, 0);
    showerHead.rotation.z = Math.PI;
    showerGroup.add(showerHead);

    const eyewashBowl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.22, 0.18, 16),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.6, roughness: 0.2 })
    );
    eyewashBowl.position.set(0.3, 1.1, 0);
    showerGroup.add(eyewashBowl);
    cmpGroup.add(showerGroup);

    this.createAndonStackTower(cmpGroup, 'CMP_WET_BENCH', new THREE.Vector3(-1.8, 2.7, 0.9));
    this.createEmoButton(cmpGroup, 'CMP_WET_BENCH', new THREE.Vector3(1.8, 1.3, 1.2));
    this.scene.add(cmpGroup);
    this.machineGroups.set('CMP_WET_BENCH', cmpGroup);

    // ----------------------------------------------------
    // Bay 104: Thermal Diffusion Furnace (11, 0, 7)
    // ----------------------------------------------------
    const furnaceGroup = new THREE.Group();
    furnaceGroup.position.set(11, 0, 7);
    this.machineBasePositions.set('DIFFUSION_FURNACE', furnaceGroup.position.clone());

    const furnaceBase = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.2, 3.2), whiteEnclosureMat);
    furnaceBase.position.y = 0.6;
    furnaceGroup.add(furnaceBase);

    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      roughness: 0.2,
      metalness: 0.3,
      emissive: 0xea580c,
      emissiveIntensity: 0.45,
    });
    for (let row = 0; row < 3; row++) {
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 2.6, 24), tubeMat);
      tube.position.set(-0.85 + row * 0.85, 2.5, 0);
      furnaceGroup.add(tube);
      this.furnaceTubes.push(tube);
    }

    const boatLoader = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 0.8), silverSteelMat);
    boatLoader.position.set(0, 1.3, 1.1);
    furnaceGroup.add(boatLoader);

    this.createAndonStackTower(furnaceGroup, 'DIFFUSION_FURNACE', new THREE.Vector3(1.6, 3.8, 1.1));
    this.createEmoButton(furnaceGroup, 'DIFFUSION_FURNACE', new THREE.Vector3(1.6, 1.3, 1.4));
    this.scene.add(furnaceGroup);
    this.machineGroups.set('DIFFUSION_FURNACE', furnaceGroup);

    // Build all 6 rich 3D Crisis Dioramas
    this.setupRichHazardVisuals();
  }

  private createEmoButton(parent: THREE.Group, sectorId: SectorId, pos: THREE.Vector3) {
    const emoGroup = new THREE.Group();
    emoGroup.position.copy(pos);

    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.04, 24),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3, metalness: 0.2 })
    );
    ring.rotation.x = Math.PI / 2;
    emoGroup.add(ring);

    const mushroom = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.08, 0.08, 24),
      new THREE.MeshStandardMaterial({
        color: 0xef4444,
        roughness: 0.2,
        metalness: 0.4,
        emissive: 0x991b1b,
        emissiveIntensity: 0.3,
      })
    );
    mushroom.rotation.x = Math.PI / 2;
    mushroom.position.z = 0.06;
    mushroom.userData = { isEmo: true, sectorId };
    emoGroup.add(mushroom);

    parent.add(emoGroup);
    this.emoButtons.set(sectorId, mushroom);
  }

  // Build 3D Player Engineer Avatar so you can see yourself walking in Whole Fab View (2) & Inspect View (3)
  private buildPlayerEngineerAvatar() {
    const avatar = new THREE.Group();
    avatar.position.set(this.vrPlayerPos.x, 0, this.vrPlayerPos.z);

    // Glowing floor ring indicator ("YOU")
    const ringGeo = new THREE.RingGeometry(0.55, 0.72, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const floorRing = new THREE.Mesh(ringGeo, ringMat);
    floorRing.rotation.x = -Math.PI / 2;
    floorRing.position.y = 0.03;
    avatar.add(floorRing);
    this.playerFloorRing = floorRing;

    const suitMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.35,
      metalness: 0.25,
      emissive: 0x0284c7,
      emissiveIntensity: 0.2,
    });
    const whiteTrimMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.2,
    });

    // Legs
    const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.75, 12), whiteTrimMat);
    leftLeg.position.set(-0.13, 0.38, 0);
    avatar.add(leftLeg);
    this.playerLeftLeg = leftLeg;

    const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.75, 12), whiteTrimMat);
    rightLeg.position.set(0.13, 0.38, 0);
    avatar.add(rightLeg);
    this.playerRightLeg = rightLeg;

    // Torso
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.22, 0.75, 16), suitMat);
    torso.position.y = 1.1;
    avatar.add(torso);

    // Arms
    const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.6, 12), whiteTrimMat);
    leftArm.position.set(-0.32, 1.1, 0);
    avatar.add(leftArm);
    this.playerLeftArm = leftArm;

    const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.6, 12), whiteTrimMat);
    rightArm.position.set(0.32, 1.1, 0);
    avatar.add(rightArm);
    this.playerRightArm = rightArm;

    // Helmet & Visor
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), whiteTrimMat);
    helmet.position.y = 1.65;
    avatar.add(helmet);

    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.1, 0.12),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee })
    );
    visor.position.set(0, 1.65, -0.16);
    avatar.add(visor);

    // 1. 3D SCBA Gear (Yellow compressed air cylinder on back + full-face respirator mask)
    const scbaGroup = new THREE.Group();
    scbaGroup.visible = false;
    const airTank = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.52, 14),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.25, metalness: 0.5, emissive: 0xca8a04, emissiveIntensity: 0.3 })
    );
    airTank.position.set(0, 1.15, 0.28);
    scbaGroup.add(airTank);
    const scbaMask = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.1, 0.14, 12),
      new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 0.5 })
    );
    scbaMask.rotation.x = Math.PI / 2;
    scbaMask.position.set(0, 1.58, -0.24);
    scbaGroup.add(scbaMask);
    avatar.add(scbaGroup);
    this.playerScbaGroup = scbaGroup;

    // 2. 3D Acid Chemical Suit Apron & Splash Shield (Emerald / Lime High-Vis)
    const acidGroup = new THREE.Group();
    acidGroup.visible = false;
    const acidApron = new THREE.Mesh(
      new THREE.CylinderGeometry(0.27, 0.26, 0.82, 16),
      new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.35,
        roughness: 0.2,
      })
    );
    acidApron.position.y = 1.06;
    acidGroup.add(acidApron);
    avatar.add(acidGroup);
    this.playerAcidApronGroup = acidGroup;

    // 3. 3D Class-00 HV Insulating Dielectric Gloves (Bright Orange Gauntlets)
    const hvGlovesGroup = new THREE.Group();
    hvGlovesGroup.visible = false;
    const gloveMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xea580c,
      emissiveIntensity: 0.45,
      roughness: 0.3,
    });
    const leftGlove = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.085, 0.28, 12), gloveMat);
    leftGlove.position.set(-0.32, 0.88, 0);
    hvGlovesGroup.add(leftGlove);
    const rightGlove = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.085, 0.28, 12), gloveMat);
    rightGlove.position.set(0.32, 0.88, 0);
    hvGlovesGroup.add(rightGlove);
    avatar.add(hvGlovesGroup);
    this.playerHvGlovesGroup = hvGlovesGroup;

    avatar.visible = false; // Hidden in 1st-person view, shown in Whole Fab (2) & Inspect (3)
    this.scene.add(avatar);
    this.playerAvatarGroup = avatar;
  }

  public setEquippedPPE(ppe: EquippedPPE) {
    if (this.playerScbaGroup) this.playerScbaGroup.visible = ppe.scba;
    if (this.playerAcidApronGroup) this.playerAcidApronGroup.visible = ppe.acidSuit;
    if (this.playerHvGlovesGroup) this.playerHvGlovesGroup.visible = ppe.hvGloves;

    if (this.playerFloorRing) {
      const mat = this.playerFloorRing.material as THREE.MeshBasicMaterial;
      if (ppe.scba || ppe.acidSuit || ppe.hvGloves) {
        mat.color.setHex(0x10b981); // Protected emerald ring
      } else {
        mat.color.setHex(0x06b6d4);
      }
    }
  }

  /**
   * Builds 6 distinct, realistic 3D Crisis Dioramas so players can visually diagnose what is happening in 3D:
   * 1. ROBOTIC_FOUP_PINCH (Bay 101): Dropped OHT hoist + pinned technician struggling + servo sparks
   * 2. SILANE_GAS_LEAK (Bay 102): Roaring pyrophoric jet flames + rising dark smoke plumes
   * 3. HF_ACID_SPILL (Bay 103): Pressurized green acid pipe spray + bubbling floor pool + acid mist
   * 4. FURNACE_QUARTZ_BREACH (Bay 104): Jammed white-hot wafer boat + exposed glowing wafers + H2 flames
   * 5. ARSINE_GAS_LEAK (Bay 105): Billowing yellow-green toxic hydride clouds creeping from Source Head
   * 6. ION_HV_ARC_XRAY (Bay 105): Jagged 200kV blue lightning arcs + expanding magenta X-ray wave rings
   */
  private setupRichHazardVisuals() {
    const sectors: SectorId[] = [
      'PHOTOLITHOGRAPHY',
      'ION_IMPLANTATION',
      'ETCH_CVD',
      'CMP_WET_BENCH',
      'DIFFUSION_FURNACE',
    ];

    sectors.forEach((secId) => {
      const hazardGroup = new THREE.Group();
      hazardGroup.visible = false;

      // Perimeter hazard ring
      const beaconRing = new THREE.Mesh(
        new THREE.RingGeometry(2.6, 2.9, 32),
        new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide })
      );
      beaconRing.rotation.x = -Math.PI / 2;
      beaconRing.position.y = 0.04;
      hazardGroup.add(beaconRing);

      const localStrobe = new THREE.PointLight(0xef4444, 3.0, 11);
      localStrobe.position.set(0, 2.8, 1.5);
      hazardGroup.add(localStrobe);

      const machineGroup = this.machineGroups.get(secId);
      if (machineGroup) {
        machineGroup.add(hazardGroup);
      }
      this.hazardEffects.set(secId, hazardGroup);
    });

    // 1. Bay 101: ROBOTIC_FOUP_PINCH Diorama
    const pinchDiorama = new THREE.Group();
    pinchDiorama.visible = false;
    // Hoist cables + dropped FOUP clamping onto load port
    const cableMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
    const cableL = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 3.2, 8), cableMat);
    cableL.position.set(-0.25, 3.3, 1.8);
    pinchDiorama.add(cableL);
    const cableR = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 3.2, 8), cableMat);
    cableR.position.set(0.25, 3.3, 1.8);
    pinchDiorama.add(cableR);

    const jammedFoup = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.65, 0.65),
      new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x991b1b, emissiveIntensity: 0.6 })
    );
    jammedFoup.position.set(0, 1.65, 1.8);
    pinchDiorama.add(jammedFoup);

    // Pinned Technician at Load Port
    const pinnedTech = new THREE.Group();
    pinnedTech.position.set(-0.55, 0, 2.25);
    const victimSuit = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const vTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.9, 12), victimSuit);
    vTorso.position.y = 0.9;
    vTorso.rotation.z = -0.25;
    pinnedTech.add(vTorso);
    const vHead = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 12), victimSuit);
    vHead.position.set(0.1, 1.48, 0);
    pinnedTech.add(vHead);
    const vArm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.75, 10), victimSuit);
    vArm.position.set(0.35, 1.35, -0.35);
    vArm.rotation.z = Math.PI / 2.2;
    vArm.rotation.y = 0.5;
    pinnedTech.add(vArm);
    pinchDiorama.add(pinnedTech);
    this.machineGroups.get('PHOTOLITHOGRAPHY')?.add(pinchDiorama);
    this.specificCrisisMeshes.set('ROBOTIC_FOUP_PINCH', pinchDiorama);

    // 2. Bay 102: SILANE_GAS_LEAK Pyrophoric Fire Diorama
    const silaneDiorama = new THREE.Group();
    silaneDiorama.visible = false;
    for (let f = 0; f < 5; f++) {
      const flameCone = new THREE.Mesh(
        new THREE.ConeGeometry(0.32 - f * 0.04, 1.4 + f * 0.25, 14),
        new THREE.MeshBasicMaterial({
          color: f % 2 === 0 ? 0xf97316 : 0xfacc15,
          transparent: true,
          opacity: 0.85,
        })
      );
      flameCone.position.set((f - 2) * 0.18, 2.4 + f * 0.15, 1.35);
      silaneDiorama.add(flameCone);
    }
    for (let s = 0; s < 5; s++) {
      const smokeBall = new THREE.Mesh(
        new THREE.SphereGeometry(0.38 + s * 0.1, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.65 })
      );
      smokeBall.position.set((s - 2) * 0.25, 3.6 + s * 0.45, 1.3);
      silaneDiorama.add(smokeBall);
    }
    this.machineGroups.get('ETCH_CVD')?.add(silaneDiorama);
    this.specificCrisisMeshes.set('SILANE_GAS_LEAK', silaneDiorama);

    // 3. Bay 103: HF_ACID_SPILL Pressurized Acid Rupture Diorama
    const hfDiorama = new THREE.Group();
    hfDiorama.visible = false;
    const acidPool = new THREE.Mesh(
      new THREE.CircleGeometry(2.1, 32),
      new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.45,
        roughness: 0.1,
        transparent: true,
        opacity: 0.85,
      })
    );
    acidPool.rotation.x = -Math.PI / 2;
    acidPool.position.set(0.4, 0.035, 1.6);
    hfDiorama.add(acidPool);

    // Acid spray stream arc & bubbles
    for (let b = 0; b < 8; b++) {
      const bubble = new THREE.Mesh(
        new THREE.SphereGeometry(0.14 + (b % 3) * 0.06, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.75 })
      );
      bubble.position.set(-0.6 + b * 0.3, 0.25 + (b % 4) * 0.35, 1.4 + (b % 2) * 0.3);
      hfDiorama.add(bubble);
    }
    this.machineGroups.get('CMP_WET_BENCH')?.add(hfDiorama);
    this.specificCrisisMeshes.set('HF_ACID_SPILL', hfDiorama);

    // 4. Bay 104: FURNACE_QUARTZ_BREACH 1100°C White-Hot Quartz Jam Diorama
    const furnaceDiorama = new THREE.Group();
    furnaceDiorama.visible = false;
    const glowingBoat = new THREE.Group();
    glowingBoat.position.set(0, 1.75, 1.25);
    glowingBoat.rotation.z = 0.18; // Jammed & tilted mid-stroke
    for (let w = 0; w < 6; w++) {
      const hotWafer = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.45, 0.03, 24),
        new THREE.MeshBasicMaterial({ color: w % 2 === 0 ? 0xfef08a : 0xf97316 })
      );
      hotWafer.position.y = w * 0.12;
      glowingBoat.add(hotWafer);
    }
    furnaceDiorama.add(glowingBoat);

    const heatWaveRing = new THREE.Mesh(
      new THREE.RingGeometry(0.9, 1.9, 32),
      new THREE.MeshBasicMaterial({
        color: 0xf97316,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.55,
      })
    );
    heatWaveRing.rotation.x = -Math.PI / 2;
    heatWaveRing.position.set(0, 0.05, 1.25);
    furnaceDiorama.add(heatWaveRing);
    this.machineGroups.get('DIFFUSION_FURNACE')?.add(furnaceDiorama);
    this.specificCrisisMeshes.set('FURNACE_QUARTZ_BREACH', furnaceDiorama);

    // 5. Bay 105: ARSINE_GAS_LEAK Toxic Hydride Cloud Diorama
    const arsineDiorama = new THREE.Group();
    arsineDiorama.visible = false;
    for (let c = 0; c < 8; c++) {
      const cloud = new THREE.Mesh(
        new THREE.SphereGeometry(0.45 + (c % 3) * 0.18, 16, 16),
        new THREE.MeshBasicMaterial({
          color: c % 2 === 0 ? 0xa3e635 : 0xeab308,
          transparent: true,
          opacity: 0.45,
        })
      );
      const angle = (c / 8) * Math.PI * 2;
      cloud.position.set(-1.0 + Math.cos(angle) * 1.2, 1.2 + (c % 4) * 0.7, Math.sin(angle) * 1.2);
      arsineDiorama.add(cloud);
    }
    this.machineGroups.get('ION_IMPLANTATION')?.add(arsineDiorama);
    this.specificCrisisMeshes.set('ARSINE_GAS_LEAK', arsineDiorama);

    // 6. Bay 105: ION_HV_ARC_XRAY 200kV Lightning & X-Ray Wave Diorama
    const hvArcDiorama = new THREE.Group();
    hvArcDiorama.visible = false;
    for (let r = 0; r < 3; r++) {
      const xrayRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.9 + r * 0.55, 0.04, 12, 32),
        new THREE.MeshBasicMaterial({
          color: r % 2 === 0 ? 0x38bdf8 : 0xe879f9,
          transparent: true,
          opacity: 0.8,
        })
      );
      xrayRing.position.set(-1.0, 2.8, 0);
      xrayRing.rotation.x = Math.PI / 3;
      hvArcDiorama.add(xrayRing);
    }
    this.machineGroups.get('ION_IMPLANTATION')?.add(hvArcDiorama);
    this.specificCrisisMeshes.set('ION_HV_ARC_XRAY', hvArcDiorama);
  }

  private buildBayBillboards() {
    const bays: { id: SectorId; code: string; name: string; nameZh: string; pos: THREE.Vector3 }[] = [
      { id: 'PHOTOLITHOGRAPHY', code: 'BAY 101', name: 'DUV SCANNER', nameZh: '微影曝光機', pos: new THREE.Vector3(-11, 3.85, -7.2) },
      { id: 'ION_IMPLANTATION', code: 'BAY 105', name: 'ION IMPLANTER (200kV)', nameZh: '高能離子植入機', pos: new THREE.Vector3(0, 4.15, -8.5) },
      { id: 'ETCH_CVD', code: 'BAY 102', name: 'PLASMA ETCH / CVD', nameZh: '電漿乾蝕刻/CVD', pos: new THREE.Vector3(11, 3.85, -7.2) },
      { id: 'CMP_WET_BENCH', code: 'BAY 103', name: 'CMP & WET BENCH', nameZh: '化學研磨與酸槽', pos: new THREE.Vector3(-11, 3.4, 4.8) },
      { id: 'DIFFUSION_FURNACE', code: 'BAY 104', name: 'DIFFUSION FURNACE', nameZh: '高溫擴散氧化爐', pos: new THREE.Vector3(11, 3.9, 4.8) },
    ];

    bays.forEach((bay) => {
      const canvas = document.createElement('canvas');
      canvas.width = 576;
      canvas.height = 224;
      const ctx = canvas.getContext('2d')!;

      const isZh = this.language === 'zh-TW';
      const displayName = isZh ? `${bay.code} · ${bay.nameZh}` : `${bay.code} · ${bay.name}`;
      const sub = isZh ? 'RF 1200W | 運轉正常' : 'RF 1200W | NORMAL';
      this.renderBillboardCanvas(ctx, bay.code, displayName, 'OPTIMAL', sub);

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;

      const mat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.98,
        side: THREE.DoubleSide,
        depthTest: true,
        depthWrite: false,
      });

      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.4), mat);
      mesh.position.copy(bay.pos);
      mesh.renderOrder = 999;
      mesh.userData = { isBillboard: true, sectorId: bay.id };
      this.scene.add(mesh);

      this.bayBillboards.set(bay.id, {
        mesh,
        canvas,
        ctx,
        texture,
        baseY: bay.pos.y,
      });
    });
  }

  private renderBillboardCanvas(
    ctx: CanvasRenderingContext2D,
    code: string,
    name: string,
    status: SectorState['status'],
    subtext: string
  ) {
    ctx.clearRect(0, 0, 576, 224);

    const isZh = this.language === 'zh-TW';
    let statusColor = '#06b6d4';
    let statusBg = 'rgba(6, 182, 212, 0.25)';
    let statusText = isZh ? 'NORMAL 運轉中' : 'NORMAL OPERATING';
    if (status === 'PRE_ALARM' || status === 'WARNING') {
      statusColor = '#f59e0b';
      statusBg = 'rgba(245, 158, 11, 0.42)';
      statusText = status === 'PRE_ALARM'
        ? (isZh ? 'PRE-ALARM 預警' : 'PRE-ALARM ALERT')
        : (isZh ? 'CAUTION 警戒' : 'CAUTION WARNING');
    } else if (status === 'CRITICAL' || status === 'SHUTDOWN') {
      statusColor = '#ef4444';
      statusBg = 'rgba(239, 68, 68, 0.45)';
      statusText = status === 'SHUTDOWN'
        ? (isZh ? 'HALTED 停機' : 'HALTED SHUTDOWN')
        : (isZh ? 'CRISIS 事故處置' : 'CRISIS ACTIVE');
    }

    ctx.fillStyle = 'rgba(10, 15, 29, 0.92)';
    ctx.beginPath();
    ctx.roundRect(8, 8, 560, 208, 18);
    ctx.fill();

    ctx.strokeStyle = statusColor;
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.font = 'bold 26px "JetBrains Mono", monospace, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(code, 26, 48);

    ctx.fillStyle = statusBg;
    ctx.beginPath();
    ctx.roundRect(340, 18, 210, 38, 10);
    ctx.fill();
    ctx.strokeStyle = statusColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = statusColor;
    ctx.beginPath();
    ctx.arc(360, 37, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(statusText, 374, 43);

    ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(name, 26, 106);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(26, 134);
    ctx.lineTo(550, 134);
    ctx.stroke();

    ctx.font = 'bold 20px "JetBrains Mono", monospace, sans-serif';
    ctx.fillStyle = status === 'PRE_ALARM' ? '#fcd34d' : '#38bdf8';
    ctx.fillText(subtext, 26, 180);
  }

  public updateSectorStatus(sectors: Record<SectorId, SectorState>) {
    this.sectorStatesSnapshot = sectors;
    const isZh = this.language === 'zh-TW';

    const shortNamesEn: Record<SectorId, string> = {
      PHOTOLITHOGRAPHY: 'DUV SCANNER',
      ETCH_CVD: 'PLASMA ETCH / CVD',
      CMP_WET_BENCH: 'CMP & WET BENCH',
      DIFFUSION_FURNACE: 'DIFFUSION FURNACE',
      ION_IMPLANTATION: 'ION IMPLANTER (200kV)',
    };

    Object.values(sectors).forEach((sec) => {
      const b = this.bayBillboards.get(sec.id);
      if (!b) return;

      const shortName = isZh
        ? sec.nameZh.split('(')[0].replace(/第[1-5]區 · /, '').trim()
        : shortNamesEn[sec.id] || sec.name.split('(')[0].trim();

      const sub = sec.preAlarm
        ? isZh
          ? `⚠️ 預警倒數 ${sec.preAlarm.timeRemainingSec}s · 請前往機台維護`
          : `⚠️ Pre-Alarm ${sec.preAlarm.timeRemainingSec}s · Walk to Bay`
        : isZh
        ? `RF: ${sec.rfPowerWatts}W | 廢氣: ${Math.round(sec.scrubberLoadPct)}% | 效率: ${Math.round(sec.efficiency)}%`
        : `RF: ${sec.rfPowerWatts}W | Scrubber: ${Math.round(sec.scrubberLoadPct)}% | Eff: ${Math.round(sec.efficiency)}%`;

      const bayCode = sec.code.split('/')[0].trim();
      const displayName = `${bayCode} · ${shortName}`;
      this.renderBillboardCanvas(b.ctx, bayCode, displayName, sec.status, sub);
      b.texture.needsUpdate = true;
    });
  }

  private buildOverheadWaferTrack() {
    const trackCurve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(-11, 5.2, -10),
        new THREE.Vector3(0, 5.2, -11),
        new THREE.Vector3(11, 5.2, -10),
        new THREE.Vector3(11, 5.2, 0),
        new THREE.Vector3(11, 5.2, 7),
        new THREE.Vector3(0, 5.2, 7),
        new THREE.Vector3(-11, 5.2, 7),
        new THREE.Vector3(-11, 5.2, 0),
      ],
      true
    );

    const tubeGeo = new THREE.TubeGeometry(trackCurve, 64, 0.08, 8, true);
    const tubeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    const trackMesh = new THREE.Mesh(tubeGeo, tubeMat);
    this.scene.add(trackMesh);

    for (let i = 0; i < 4; i++) {
      const carrier = new THREE.Group();

      const carriage = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.35, 0.7),
        new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.25 })
      );
      carrier.add(carriage);

      const foup = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.55, 0.55),
        new THREE.MeshStandardMaterial({
          color: 0x334155,
          roughness: 0.1,
          metalness: 0.5,
          transparent: true,
          opacity: 0.85,
        })
      );
      foup.position.y = -0.45;
      carrier.add(foup);

      const led = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0x10b981 })
      );
      led.position.set(0, -0.45, 0.29);
      carrier.add(led);

      carrier.userData = {
        progress: (i * 0.25) % 1.0,
        speed: 0.035,
        curve: trackCurve,
      };

      this.scene.add(carrier);
      this.ohtCarriers.push(carrier);
    }
  }

  private buildPatrollingTechnicians() {
    const workerConfigs = [
      {
        waypoints: [
          new THREE.Vector3(-8, 0, -6),
          new THREE.Vector3(-4, 0, -8),
          new THREE.Vector3(0, 0, -7),
          new THREE.Vector3(-8, 0, -6),
        ],
        speed: 1.2,
      },
      {
        waypoints: [
          new THREE.Vector3(4, 0, -7),
          new THREE.Vector3(8, 0, -5),
          new THREE.Vector3(6, 0, 3),
          new THREE.Vector3(4, 0, -7),
        ],
        speed: 1.0,
      },
    ];

    workerConfigs.forEach((cfg) => {
      const tech = new THREE.Group();
      tech.position.copy(cfg.waypoints[0]);

      const suitMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.6,
        metalness: 0.1,
      });

      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.9, 16), suitMat);
      torso.position.y = 0.95;
      tech.add(torso);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), suitMat);
      head.position.y = 1.55;
      tech.add(head);

      const visor = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.08, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9, roughness: 0.1 })
      );
      visor.position.set(0, 1.55, 0.16);
      tech.add(visor);

      const tablet = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.02, 0.22),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 })
      );
      tablet.position.set(0, 1.15, 0.35);
      tablet.rotation.x = -Math.PI / 4;
      tech.add(tablet);

      const tabletScreen = new THREE.Mesh(
        new THREE.PlaneGeometry(0.28, 0.18),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
      );
      tabletScreen.position.set(0, 1.16, 0.35);
      tabletScreen.rotation.x = -Math.PI / 4;
      tech.add(tabletScreen);

      this.scene.add(tech);
      this.patrollingWorkers.push({
        group: tech,
        waypoints: cfg.waypoints,
        currentWaypointIndex: 0,
        speed: cfg.speed,
        pauseTimer: 0,
        tabletGlow: tabletScreen,
      });
    });
  }

  private buildSafetyStations() {
    const createTgmsPanel = (pos: THREE.Vector3) => {
      const group = new THREE.Group();
      group.position.copy(pos);

      const chassis = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 1.2, 0.15),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8, roughness: 0.3 })
      );
      group.add(chassis);

      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(0.6, 0.7),
        new THREE.MeshBasicMaterial({ color: 0x064e3b })
      );
      screen.position.set(0, 0.1, 0.08);
      group.add(screen);

      this.scene.add(group);
    };

    createTgmsPanel(new THREE.Vector3(-20.8, 2.5, -4));
    createTgmsPanel(new THREE.Vector3(20.8, 2.5, -4));
  }

  public triggerActionEffect(type: ActionEffectType, sectorId?: SectorId) {
    const targetSector = sectorId || this.activeHazardSector || 'CMP_WET_BENCH';
    const basePos = this.machineBasePositions.get(targetSector);
    const origin = basePos ? basePos.clone() : new THREE.Vector3(0, 0, 0);
    this.particleEffects.triggerEffect(type, origin);

    if (type === 'BACKFIRE_EXPLOSION') {
      this.cameraShakeIntensity = 0.28;
      this.hazardMitigationScale = Math.min(1.45, this.hazardMitigationScale + 0.3);
    }

    // Depress 3D EMO button momentarily
    const emoMesh = this.emoButtons.get(targetSector);
    if (emoMesh) {
      emoMesh.position.z = 0.02;
      setTimeout(() => {
        emoMesh.position.z = 0.06;
      }, 600);
    }
  }

  public setHazardMitigationProgress(scale: number) {
    this.hazardMitigationScale = Math.max(0.25, Math.min(1.45, scale));
  }

  public setHazardActive(sectorId: SectorId | null, active: boolean, typeId?: string) {
    this.activeHazardSector = sectorId;
    this.activeHazardTypeId = active ? typeId || null : null;
    this.isHazardActive = active;
    this.hazardMitigationScale = 1.0;

    this.hazardEffects.forEach((group, sec) => {
      group.visible = Boolean(active && sec === sectorId);
    });

    this.specificCrisisMeshes.forEach((diorama, key) => {
      diorama.visible = Boolean(active && key === typeId);
      diorama.scale.set(1, 1, 1);
    });

    if (active && sectorId) {
      const basePos = this.machineBasePositions.get(sectorId);
      if (basePos && this.viewMode === 'VR_FIRST_PERSON') {
        const dx = basePos.x - this.vrPlayerPos.x;
        const dz = basePos.z - this.vrPlayerPos.z;
        this.vrPlayerYaw = Math.atan2(dx, -dz);
        this.vrPlayerPitch = 0;
        this.updateVrLookAt();
      }
    }
  }

  public setCameraView(mode: CameraViewMode) {
    this.viewMode = mode;
    if (this.playerAvatarGroup) {
      this.playerAvatarGroup.visible = mode !== 'VR_FIRST_PERSON';
    }
    if (mode === 'SUPERVISOR_ISOMETRIC') {
      this.targetCameraPos.set(0, 22, 23);
      this.targetCameraLookAt.set(0, 1.2, -2);
    } else if (mode === 'INSPECTION') {
      const targetSec = this.activeHazardSector || 'ION_IMPLANTATION';
      const basePos = this.machineBasePositions.get(targetSec);
      if (basePos) {
        this.targetCameraPos.set(basePos.x + 3.2, 2.4, basePos.z + 4.2);
        this.targetCameraLookAt.set(basePos.x, 1.8, basePos.z);
      }
    } else {
      this.targetCameraPos.copy(this.vrPlayerPos);
      this.updateVrLookAt();
    }
  }

  public focusSector(sectorId: SectorId) {
    const basePos = this.machineBasePositions.get(sectorId);
    if (!basePos) return;

    if (this.viewMode === 'VR_FIRST_PERSON') {
      const dx = basePos.x - this.vrPlayerPos.x;
      const dz = basePos.z - this.vrPlayerPos.z;
      this.vrPlayerYaw = Math.atan2(dx, -dz);
      this.vrPlayerPitch = -0.04;
      this.updateVrLookAt();
    } else if (this.viewMode === 'INSPECTION') {
      this.targetCameraPos.set(basePos.x + 3.2, 2.4, basePos.z + 4.2);
      this.targetCameraLookAt.set(basePos.x, 1.8, basePos.z);
    }
  }

  /**
   * Sets the mobile virtual joystick input vector (-1 to 1 for x and y).
   */
  public setVirtualJoystick(vector: { x: number; y: number }) {
    this.virtualJoystickVector = vector;
  }

  /**
   * Smoothly walks the player engineer across the cleanroom floor to stand right in front of `sectorId` (< 4.0m).
   */
  public walkToSector(sectorId: SectorId) {
    const standPos = BAY_OPERATOR_STAND_POSITIONS[sectorId];
    const machinePos = this.machineBasePositions.get(sectorId);
    if (!standPos || !machinePos) return;

    this.autoWalkTargetPos = standPos.clone();
    this.autoWalkLookAtPos = machinePos.clone();
    this.autoWalkSector = sectorId;

    if (this.viewMode === 'INSPECTION') {
      this.targetCameraPos.set(machinePos.x + 3.2, 2.4, machinePos.z + 4.2);
      this.targetCameraLookAt.set(machinePos.x, 1.8, machinePos.z);
    }
  }

  private updateVrLookAt() {
    const cosPitch = Math.cos(this.vrPlayerPitch);
    const sinPitch = Math.sin(this.vrPlayerPitch);
    const sinYaw = Math.sin(this.vrPlayerYaw);
    const cosYaw = Math.cos(this.vrPlayerYaw);

    _vec3A.set(sinYaw * cosPitch, sinPitch, -cosYaw * cosPitch);
    this.targetCameraLookAt.copy(this.vrPlayerPos).add(_vec3A);
  }

  private bindEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    this.container.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseup', this.handleMouseUp);
    this.container.addEventListener('touchstart', this.handleTouchStart, { passive: true });
    window.addEventListener('touchmove', this.handleTouchMove, { passive: true });
    window.addEventListener('touchend', this.handleTouchEnd);
    window.addEventListener('touchcancel', this.handleTouchEnd);
    this.container.addEventListener('click', this.handleClick);
    window.addEventListener('resize', this.handleResize);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    this.keysHeld[e.key.toLowerCase()] = true;
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keysHeld[e.key.toLowerCase()] = false;
  };

  private handleBlur = () => {
    this.keysHeld = {};
    this.isDragging = false;
  };

  private handleMouseDown = (e: MouseEvent) => {
    this.isDragging = true;
    this.prevMouseX = e.clientX;
    this.prevMouseY = e.clientY;
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.isDragging) return;
    const dx = e.clientX - this.prevMouseX;
    const dy = e.clientY - this.prevMouseY;
    this.prevMouseX = e.clientX;
    this.prevMouseY = e.clientY;

    if (this.viewMode === 'VR_FIRST_PERSON') {
      this.vrPlayerYaw += dx * 0.0035;
      this.vrPlayerPitch -= dy * 0.003;
      this.vrPlayerPitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.vrPlayerPitch));
      this.updateVrLookAt();
    } else if (this.viewMode === 'SUPERVISOR_ISOMETRIC') {
      this.targetCameraPos.x -= dx * 0.03;
      this.targetCameraPos.z -= dy * 0.03;
    }
  };

  private handleMouseUp = () => {
    this.isDragging = false;
  };

  private handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      this.isDragging = true;
      this.prevMouseX = e.touches[0].clientX;
      this.prevMouseY = e.touches[0].clientY;
    }
  };

  private handleTouchMove = (e: TouchEvent) => {
    if (!this.isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - this.prevMouseX;
    const dy = e.touches[0].clientY - this.prevMouseY;
    this.prevMouseX = e.touches[0].clientX;
    this.prevMouseY = e.touches[0].clientY;

    if (this.viewMode === 'VR_FIRST_PERSON') {
      this.vrPlayerYaw += dx * 0.005;
      this.vrPlayerPitch -= dy * 0.004;
      this.vrPlayerPitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.vrPlayerPitch));
      this.updateVrLookAt();
    } else if (this.viewMode === 'SUPERVISOR_ISOMETRIC') {
      this.targetCameraPos.x -= dx * 0.035;
      this.targetCameraPos.z -= dy * 0.035;
    }
  };

  private handleTouchEnd = () => {
    this.isDragging = false;
  };

  private handleClick = (e: MouseEvent) => {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    for (const hit of intersects) {
      let obj: THREE.Object3D | null = hit.object;
      while (obj) {
        if (obj.userData?.isEmo) {
          const sec = obj.userData.sectorId as SectorId;
          this.onHitEmo?.(sec);
          return;
        }
        if (obj.userData?.isBillboard) {
          const sec = obj.userData.sectorId as SectorId;
          this.onSelectSector?.(sec);
          return;
        }
        obj = obj.parent;
      }
    }

    for (const [secId, grp] of this.machineGroups.entries()) {
      if (hitCheckGroup(intersects, grp)) {
        this.onSelectSector?.(secId);
        break;
      }
    }
  };

  private handleResize = () => {
    if (!this.container || this.isDestroyed) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    const aspect = w / h;
    this.camera.aspect = aspect;
    this.camera.fov = aspect < 1.0 ? 82 : 65;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private updateMovement(dt: number, elapsed: number) {
    const moveSpeed = 7.5 * dt;
    let movedManual = false;

    const wKey = this.keysHeld['w'] || this.keysHeld['arrowup'];
    const sKey = this.keysHeld['s'] || this.keysHeld['arrowdown'];
    const aKey = this.keysHeld['a'] || this.keysHeld['arrowleft'];
    const dKey = this.keysHeld['d'] || this.keysHeld['arrowright'];

    const joyX = this.virtualJoystickVector.x;
    const joyZ = this.virtualJoystickVector.y;
    const hasJoy = Math.abs(joyX) > 0.05 || Math.abs(joyZ) > 0.05;

    if (wKey || sKey || aKey || dKey || hasJoy) {
      // Cancel auto-walk if player takes manual control
      this.autoWalkTargetPos = null;
      this.autoWalkSector = null;

      if (this.viewMode === 'VR_FIRST_PERSON') {
        const forward = _vec3A.set(Math.sin(this.vrPlayerYaw), 0, -Math.cos(this.vrPlayerYaw)).normalize();
        const right = _vec3B.set(Math.cos(this.vrPlayerYaw), 0, Math.sin(this.vrPlayerYaw)).normalize();
        if (wKey) this.vrPlayerPos.addScaledVector(forward, moveSpeed);
        if (sKey) this.vrPlayerPos.addScaledVector(forward, -moveSpeed);
        if (aKey) this.vrPlayerPos.addScaledVector(right, -moveSpeed);
        if (dKey) this.vrPlayerPos.addScaledVector(right, moveSpeed);

        if (hasJoy) {
          this.vrPlayerPos.addScaledVector(forward, joyZ * moveSpeed);
          this.vrPlayerPos.addScaledVector(right, joyX * moveSpeed);
        }
      } else {
        // World-space WASD in Whole Fab View (2) & Inspect View (3)
        if (wKey) this.vrPlayerPos.z -= moveSpeed;
        if (sKey) this.vrPlayerPos.z += moveSpeed;
        if (aKey) this.vrPlayerPos.x -= moveSpeed;
        if (dKey) this.vrPlayerPos.x += moveSpeed;

        if (hasJoy) {
          this.vrPlayerPos.z -= joyZ * moveSpeed;
          this.vrPlayerPos.x += joyX * moveSpeed;
        }

        const dx = (dKey ? 1 : 0) - (aKey ? 1 : 0) + joyX;
        const dz = (sKey ? 1 : 0) - (wKey ? 1 : 0) - joyZ;
        if (dx !== 0 || dz !== 0) {
          this.vrPlayerYaw = Math.atan2(dx, -dz);
        }
      }
      movedManual = true;
    }

    let isWalkingNow = movedManual;

    // Process 1-Click Auto-Walk to Bay
    if (this.autoWalkTargetPos) {
      const toTarget = _vec3A.subVectors(this.autoWalkTargetPos, this.vrPlayerPos);
      toTarget.y = 0;
      const dist = toTarget.length();
      if (dist < 0.25) {
        this.vrPlayerPos.x = this.autoWalkTargetPos.x;
        this.vrPlayerPos.z = this.autoWalkTargetPos.z;
        if (this.autoWalkLookAtPos) {
          const ldx = this.autoWalkLookAtPos.x - this.vrPlayerPos.x;
          const ldz = this.autoWalkLookAtPos.z - this.vrPlayerPos.z;
          this.vrPlayerYaw = Math.atan2(ldx, -ldz);
          this.vrPlayerPitch = -0.05;
        }
        this.autoWalkTargetPos = null;
        this.autoWalkSector = null;
        if (this.viewMode === 'VR_FIRST_PERSON') {
          this.updateVrLookAt();
        }
      } else {
        toTarget.normalize();
        const step = Math.min(dist, 10.5 * dt);
        this.vrPlayerPos.x += toTarget.x * step;
        this.vrPlayerPos.z += toTarget.z * step;
        this.vrPlayerYaw = Math.atan2(toTarget.x, -toTarget.z);
        this.vrPlayerPitch = 0;
        isWalkingNow = true;
      }
    }

    this.vrPlayerPos.x = Math.max(-18.5, Math.min(18.5, this.vrPlayerPos.x));
    this.vrPlayerPos.z = Math.max(-18.5, Math.min(18.5, this.vrPlayerPos.z));
    this.vrPlayerPos.y = 1.7;

    if (this.viewMode === 'VR_FIRST_PERSON') {
      this.targetCameraPos.copy(this.vrPlayerPos);
      if (isWalkingNow) {
        // Subtle head bob while walking in cleanroom
        this.targetCameraPos.y = 1.7 + Math.sin(elapsed * 12) * 0.035;
        this.updateVrLookAt();
      }
    }

    // Update 3D Player Avatar position & limb animation
    if (this.playerAvatarGroup) {
      this.playerAvatarGroup.position.set(this.vrPlayerPos.x, 0, this.vrPlayerPos.z);
      this.playerAvatarGroup.rotation.y = -this.vrPlayerYaw;

      const swing = isWalkingNow ? Math.sin(elapsed * 14) * 0.45 : 0;
      if (this.playerLeftLeg) this.playerLeftLeg.rotation.x = swing;
      if (this.playerRightLeg) this.playerRightLeg.rotation.x = -swing;
      if (this.playerLeftArm) this.playerLeftArm.rotation.x = -swing * 0.7;
      if (this.playerRightArm) this.playerRightArm.rotation.x = swing * 0.7;
      if (this.playerFloorRing) {
        const ringPulse = 1.0 + Math.sin(elapsed * 5) * 0.08;
        this.playerFloorRing.scale.set(ringPulse, ringPulse, 1);
      }
    }
  }

  private emitProximityAndOffscreenReport(elapsed: number) {
    if (!this.onProximityUpdate || elapsed - this.lastProximityEmitTime < 0.12) return;
    this.lastProximityEmitTime = elapsed;

    const distances = {} as Record<SectorId, number>;
    const offscreenIndicators: OffscreenIndicator[] = [];

    this.machineBasePositions.forEach((basePos, secId) => {
      const dx = basePos.x - this.vrPlayerPos.x;
      const dz = basePos.z - this.vrPlayerPos.z;
      const dist = Math.round(Math.hypot(dx, dz) * 10) / 10;
      distances[secId] = dist;

      const secState = this.sectorStatesSnapshot?.[secId];
      if (
        secState &&
        (secState.status === 'PRE_ALARM' || secState.status === 'WARNING' || secState.status === 'CRITICAL')
      ) {
        _projVec.set(basePos.x, 2.8, basePos.z).project(this.camera);
        const isBehind = _projVec.z > 1.0;
        const isOutside =
          isBehind || _projVec.x < -0.92 || _projVec.x > 0.92 || _projVec.y < -0.88 || _projVec.y > 0.88;

        if (isOutside) {
          let nx = isBehind ? -_projVec.x : _projVec.x;
          let ny = isBehind ? -_projVec.y : _projVec.y;
          const angle = Math.atan2(-ny, nx);
          const clampedX = Math.max(-0.88, Math.min(0.88, Math.cos(angle) * 0.88));
          const clampedY = Math.max(-0.82, Math.min(0.82, Math.sin(angle) * 0.82));
          offscreenIndicators.push({
            sectorId: secId,
            xPct: (clampedX + 1) * 50,
            yPct: (clampedY + 1) * 50,
            angleDeg: (angle * 180) / Math.PI,
            status: secState.status,
            distanceM: dist,
          });
        }
      }
    });

    this.onProximityUpdate({
      distances,
      playerPos: { x: Math.round(this.vrPlayerPos.x * 10) / 10, z: Math.round(this.vrPlayerPos.z * 10) / 10 },
      isAutoWalking: Boolean(this.autoWalkTargetPos),
      walkingTargetSector: this.autoWalkSector,
      offscreenIndicators,
    });
  }

  private animateCrisisAndPreAlarms(elapsed: number, dt: number) {
    // 1. Update SEMI E10 4-Color Andon Stack Lights & Pre-Alarm Machine Shudder
    this.machineGroups.forEach((grp, secId) => {
      const basePos = this.machineBasePositions.get(secId);
      const andon = this.andonTowers.get(secId);
      const secState = this.sectorStatesSnapshot?.[secId];
      if (!basePos || !andon) return;

      const status = secState?.status || 'OPTIMAL';
      const blinkFast = Math.sin(elapsed * 16) > 0;
      const blinkAmber = Math.sin(elapsed * 9) > 0;

      andon.greenLamp.color.setHex(status === 'OPTIMAL' ? 0x22c55e : 0x052e16);
      andon.blueLamp.color.setHex(status === 'PRE_ALARM' ? 0x38bdf8 : 0x0c4a6e);
      andon.amberLamp.color.setHex(
        (status === 'PRE_ALARM' || status === 'WARNING') && blinkAmber ? 0xf59e0b : 0x451a03
      );
      andon.redLamp.color.setHex(
        (status === 'CRITICAL' || status === 'SHUTDOWN') && blinkFast ? 0xef4444 : 0x450a0a
      );

      // Subtle mechanical vibration during PRE_ALARM or CRITICAL
      if (status === 'PRE_ALARM') {
        grp.position.x = basePos.x + Math.sin(elapsed * 42) * 0.022;
        grp.position.z = basePos.z + Math.cos(elapsed * 38) * 0.022;
      } else if (status === 'CRITICAL') {
        grp.position.x = basePos.x + Math.sin(elapsed * 55) * 0.04;
        grp.position.z = basePos.z + Math.cos(elapsed * 50) * 0.04;
      } else {
        grp.position.copy(basePos);
      }
    });

    // 2. Animate Active 3D Crisis Dioramas (scaled by stage mitigation or backfire escalation)
    if (!this.isHazardActive || !this.activeHazardTypeId) return;
    const diorama = this.specificCrisisMeshes.get(this.activeHazardTypeId);
    if (!diorama) return;

    const currentScale = THREE.MathUtils.damp(diorama.scale.x, this.hazardMitigationScale, 5.0, dt);
    diorama.scale.set(currentScale, currentScale, currentScale);

    if (this.activeHazardTypeId === 'ROBOTIC_FOUP_PINCH') {
      const jammedFoup = diorama.children[2];
      const pinnedTech = diorama.children[3];
      if (jammedFoup) {
        jammedFoup.position.y = 1.65 + Math.sin(elapsed * 45) * 0.03;
      }
      if (pinnedTech) {
        pinnedTech.rotation.z = Math.sin(elapsed * 12) * 0.08;
      }
      if (Math.random() < dt * 2.5) {
        const bPos = this.machineBasePositions.get('PHOTOLITHOGRAPHY');
        if (bPos) this.particleEffects.triggerEffect('ARC_SPARKS', bPos);
      }
    } else if (this.activeHazardTypeId === 'SILANE_GAS_LEAK') {
      diorama.children.forEach((child, idx) => {
        if (idx < 5) {
          // Roaring flames
          const scale = 0.85 + Math.sin(elapsed * 22 + idx * 1.7) * 0.3;
          child.scale.set(scale, 0.9 + Math.cos(elapsed * 18 + idx) * 0.35, scale);
        } else {
          // Rising smoke balls
          child.position.y = 3.4 + ((elapsed * 1.4 + idx * 0.5) % 2.4);
          const s = 0.7 + ((elapsed * 0.8 + idx * 0.3) % 1.2);
          child.scale.set(s, s, s);
        }
      });
    } else if (this.activeHazardTypeId === 'HF_ACID_SPILL') {
      const pool = diorama.children[0];
      if (pool) {
        const pulse = 1.0 + Math.sin(elapsed * 4) * 0.08;
        pool.scale.set(pulse, pulse, 1);
      }
      for (let i = 1; i < diorama.children.length; i++) {
        const b = diorama.children[i];
        b.position.y = 0.15 + ((elapsed * 1.1 + i * 0.3) % 1.4);
      }
    } else if (this.activeHazardTypeId === 'FURNACE_QUARTZ_BREACH') {
      const boat = diorama.children[0];
      const ring = diorama.children[1];
      if (boat) {
        boat.position.y = 1.75 + Math.sin(elapsed * 30) * 0.02;
      }
      if (ring) {
        const wave = 1.0 + ((elapsed * 1.8) % 1.6);
        ring.scale.set(wave, wave, 1);
      }
    } else if (this.activeHazardTypeId === 'ARSINE_GAS_LEAK') {
      diorama.children.forEach((cloud, idx) => {
        const angle = (idx / 8) * Math.PI * 2 + elapsed * 0.7;
        const radius = 1.1 + Math.sin(elapsed * 1.5 + idx) * 0.6;
        cloud.position.x = -1.0 + Math.cos(angle) * radius;
        cloud.position.z = Math.sin(angle) * radius;
        cloud.position.y = 1.0 + Math.abs(Math.sin(elapsed * 1.2 + idx)) * 1.6;
      });
    } else if (this.activeHazardTypeId === 'ION_HV_ARC_XRAY') {
      diorama.children.forEach((ring, idx) => {
        const wave = 0.8 + ((elapsed * 2.2 + idx * 0.6) % 2.2);
        ring.scale.set(wave, wave, wave);
        ring.rotation.y = elapsed * 2.5 + idx;
      });
      if (Math.random() < dt * 3.5) {
        const bPos = this.machineBasePositions.get('ION_IMPLANTATION');
        if (bPos) this.particleEffects.triggerEffect('ARC_SPARKS', bPos);
      }
    }
  }

  private startLoop() {
    const tick = () => {
      if (this.isDestroyed) return;
      const rawDt = this.clock.getDelta();
      const dt = Math.min(rawDt, 0.05);
      const elapsed = this.clock.getElapsedTime();

      // 1. Process movement & auto-walk
      this.updateMovement(dt, elapsed);

      // 2. Emit proximity & offscreen alerts to React HUD
      this.emitProximityAndOffscreenReport(elapsed);

      // 3. Camera damping & backfire shake
      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, this.targetCameraPos.x, 8.5, dt);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, this.targetCameraPos.y, 8.5, dt);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, this.targetCameraPos.z, 8.5, dt);

      if (this.cameraShakeIntensity > 0.005) {
        this.camera.position.x += (Math.random() - 0.5) * this.cameraShakeIntensity;
        this.camera.position.y += (Math.random() - 0.5) * this.cameraShakeIntensity;
        this.cameraShakeIntensity = Math.max(0, this.cameraShakeIntensity - dt * 0.45);
      }

      this.currentCameraLookAt.x = THREE.MathUtils.damp(
        this.currentCameraLookAt.x,
        this.targetCameraLookAt.x,
        9.5,
        dt
      );
      this.currentCameraLookAt.y = THREE.MathUtils.damp(
        this.currentCameraLookAt.y,
        this.targetCameraLookAt.y,
        9.5,
        dt
      );
      this.currentCameraLookAt.z = THREE.MathUtils.damp(
        this.currentCameraLookAt.z,
        this.targetCameraLookAt.z,
        9.5,
        dt
      );
      this.camera.lookAt(this.currentCameraLookAt);

      // 4. Update active particles & crisis dioramas
      this.particleEffects.update(dt);
      this.animateCrisisAndPreAlarms(elapsed, dt);

      // 5. Animate OHT carriers along ceiling track
      this.ohtCarriers.forEach((carrier) => {
        const u = (carrier.userData.progress + carrier.userData.speed * dt) % 1.0;
        carrier.userData.progress = u;
        const curve = carrier.userData.curve as THREE.CatmullRomCurve3;
        const pt = curve.getPointAt(u);
        carrier.position.copy(pt);
      });

      // 6. Animate patrolling technicians
      this.patrollingWorkers.forEach((w) => {
        if (w.pauseTimer > 0) {
          w.pauseTimer -= dt;
          return;
        }
        const targetPt = w.waypoints[w.currentWaypointIndex];
        const dist = w.group.position.distanceTo(targetPt);
        if (dist < 0.2) {
          w.currentWaypointIndex = (w.currentWaypointIndex + 1) % w.waypoints.length;
          w.pauseTimer = 3.5;
        } else {
          const dir = _vec3A.subVectors(targetPt, w.group.position).normalize();
          w.group.position.addScaledVector(dir, w.speed * dt);
          w.group.rotation.y = Math.atan2(dir.x, dir.z);
        }
      });

      // 7. Animate machine internal components
      if (this.plasmaChamberMesh && this.plasmaCoreLight) {
        const pulse = 1.0 + Math.sin(elapsed * 6) * 0.2;
        this.plasmaChamberMesh.scale.set(pulse, pulse, pulse);
        this.plasmaCoreLight.intensity = 1.5 + Math.sin(elapsed * 12) * 0.5;
      }
      if (this.ionAcceleratorBeam) {
        this.ionAcceleratorBeam.scale.x = 1.0 + Math.sin(elapsed * 15) * 0.15;
      }
      if (this.cmpPadMesh) {
        this.cmpPadMesh.rotation.y += dt * 3.5;
      }
      this.furnaceTubes.forEach((tube, i) => {
        const mat = tube.material as THREE.MeshStandardMaterial;
        if (mat) {
          const isFurnaceCrisis =
            this.isHazardActive && this.activeHazardTypeId === 'FURNACE_QUARTZ_BREACH';
          mat.emissiveIntensity = isFurnaceCrisis
            ? 1.6 + Math.sin(elapsed * 16 + i) * 0.5
            : 0.35 + Math.sin(elapsed * 2.5 + i) * 0.15;
        }
      });

      // 8. Animate Floating Holographic Billboards
      this.bayBillboards.forEach((b, secId) => {
        const offset = secId.charCodeAt(0) % 5;
        b.mesh.position.y = b.baseY + Math.sin(elapsed * 2.0 + offset) * 0.05;
        b.mesh.quaternion.copy(this.camera.quaternion);
      });

      // 9. Emergency beacon strobes
      if (this.isHazardActive) {
        const strobe = Math.sin(elapsed * 14) > 0.1 ? 3.0 : 0.0;
        this.emergencyBeacons.forEach((b) => {
          b.intensity = strobe;
        });
      } else {
        this.emergencyBeacons.forEach((b) => (b.intensity = 0));
      }

      // 10. Render frame
      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.afterDraw(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.isDestroyed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 60);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  public destroy() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    this.container.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseup', this.handleMouseUp);
    this.container.removeEventListener('touchstart', this.handleTouchStart);
    window.removeEventListener('touchmove', this.handleTouchMove);
    window.removeEventListener('touchend', this.handleTouchEnd);
    window.removeEventListener('touchcancel', this.handleTouchEnd);
    this.container.removeEventListener('click', this.handleClick);
    window.removeEventListener('resize', this.handleResize);

    this.particleEffects.destroy();
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}

function hitCheckGroup(intersects: THREE.Intersection[], group: THREE.Group): boolean {
  for (const hit of intersects) {
    let curr: THREE.Object3D | null = hit.object;
    while (curr) {
      if (curr === group) return true;
      curr = curr.parent;
    }
  }
  return false;
}
