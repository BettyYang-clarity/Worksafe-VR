import * as THREE from 'three';
import { CameraViewMode, SectorId, SectorState } from '../types/game';
import { ActionEffectType, ParticleEffectsManager } from './ParticleEffects';

// Pre-allocated math objects to ensure zero GC in animation loop
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();

export interface FabSceneOptions {
  container: HTMLElement;
  onSelectSector?: (sectorId: SectorId) => void;
  onHitEmo?: (sectorId: SectorId) => void;
}

interface PatrollingWorker {
  group: THREE.Group;
  waypoints: THREE.Vector3[];
  currentWaypointIndex: number;
  speed: number;
  pauseTimer: number;
  tabletGlow: THREE.Mesh;
}

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

  // Camera & Interaction
  private viewMode: CameraViewMode = 'VR_FIRST_PERSON';
  private targetCameraPos = new THREE.Vector3(0, 1.7, 10);
  private targetCameraLookAt = new THREE.Vector3(0, 1.4, 0);
  private currentCameraLookAt = new THREE.Vector3(0, 1.4, 0);
  private vrPlayerPos = new THREE.Vector3(0, 1.7, 10);
  private vrPlayerYaw = 0;
  private vrPlayerPitch = 0;

  // Input state
  private keysHeld: Record<string, boolean> = {};
  private isDragging = false;
  private prevMouseX = 0;
  private prevMouseY = 0;

  // Scene Objects
  private machineGroups: Map<SectorId, THREE.Group> = new Map();
  private emoButtons: Map<SectorId, THREE.Mesh> = new Map();
  private hazardEffects: Map<SectorId, THREE.Group> = new Map();
  private ohtCarriers: THREE.Group[] = [];
  private patrollingWorkers: PatrollingWorker[] = [];
  private emergencyBeacons: THREE.PointLight[] = [];
  private plasmaChamberMesh: THREE.Mesh | null = null;
  private plasmaCoreLight: THREE.PointLight | null = null;
  private ionAcceleratorBeam: THREE.Mesh | null = null;
  private cmpPadMesh: THREE.Mesh | null = null;
  private furnaceTubes: THREE.Mesh[] = [];
  private bayBillboards: Map<SectorId, {
    mesh: THREE.Mesh;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    texture: THREE.CanvasTexture;
    baseY: number;
  }> = new Map();

  // Callbacks
  private onSelectSector?: (sectorId: SectorId) => void;
  private onHitEmo?: (sectorId: SectorId) => void;

  // Raycaster
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  // Active hazard state in 3D
  private activeHazardSector: SectorId | null = null;
  private isHazardActive: boolean = false;

  constructor(options: FabSceneOptions) {
    this.container = options.container;
    this.onSelectSector = options.onSelectSector;
    this.onHitEmo = options.onHitEmo;
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
    this.renderer.toneMappingExposure = 1.25; // Bright cleanroom exposure
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.container.appendChild(this.renderer.domElement);

    // 3. Cleanroom Atmosphere & Bright Environment
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1e293b); // Light cleanroom background
    this.scene.fog = new THREE.FogExp2(0x1e293b, 0.008); // High visibility soft cleanroom fog

    this.particleEffects = new ParticleEffectsManager(this.scene);

    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 150);
    this.camera.position.set(0, 1.7, 10);
    this.targetCameraPos.set(0, 1.7, 10);
    this.vrPlayerPos.set(0, 1.7, 10);
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

    // 5. Interaction & Loop
    this.bindEvents();
    this.startLoop();
  }

  // Bright, realistic 5500K Cleanroom Laminar Lighting
  private buildLighting() {
    // Hemispheric ambient bounce (sky white, ground soft silver reflection)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xcfd8dc, 1.2);
    this.scene.add(hemiLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    this.scene.add(ambientLight);

    // Primary cleanroom directional key light
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

    // Secondary fill light for soft shadows
    const fillLight = new THREE.DirectionalLight(0xe2e8f0, 0.7);
    fillLight.position.set(-10, 15, -10);
    this.scene.add(fillLight);

    // Ceiling laminar light panels (illuminating each bay from above)
    const bayLightPositions = [
      new THREE.Vector3(-11, 6.0, -10),
      new THREE.Vector3(0, 6.0, -11),
      new THREE.Vector3(11, 6.0, -10),
      new THREE.Vector3(-11, 6.0, 7),
      new THREE.Vector3(11, 6.0, 7),
    ];
    bayLightPositions.forEach((pos) => {
      const bayLight = new THREE.PointLight(0xffffff, 0.9, 14);
      bayLight.position.copy(pos);
      this.scene.add(bayLight);
    });

    // Emergency Beacon Lights (normally off, strobe on hazard)
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
    // 1. Pristine Raised Perforated Cleanroom Floor (Bright off-white antistatic tiles)
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 512;
    floorCanvas.height = 512;
    const ctx = floorCanvas.getContext('2d')!;

    // Cleanroom light grey/silver tile base
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, 512, 512);

    // Precise grid lines between 600x600mm cleanroom floor tiles
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, 512, 512);

    // Suction perforations for laminar air recirculation
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

    // 2. High-Tech Cleanroom Sandwich Wall Panels (Clean off-white / light silver)
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

    createWall(44, 6.5, 0, 3.25, -21, 0); // Back wall
    createWall(44, 6.5, -21, 3.25, 0, Math.PI / 2); // Left wall
    createWall(44, 6.5, 21, 3.25, 0, -Math.PI / 2); // Right wall

    // Yellow Photolithography UV Filtered Partition
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

    // Cleanroom Ceiling Grid with HEPA Filter units
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.4,
      metalness: 0.3,
    });
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(44, 44), ceilingMat);
    ceiling.position.y = 6.4;
    ceiling.rotation.x = Math.PI / 2;
    this.scene.add(ceiling);

    // Ceiling recessed laminar light strips (cool white)
    for (let z = -16; z <= 16; z += 6) {
      const stripGeo = new THREE.BoxGeometry(34, 0.1, 0.4);
      const stripMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const strip = new THREE.Mesh(stripGeo, stripMat);
      strip.position.set(0, 6.35, z);
      this.scene.add(strip);
    }
  }

  // Realistic VMB (Valve Manifold Boxes) and color-coded utility pipe network
  private buildVMBAndPipingNetwork() {
    const pipeGroup = new THREE.Group();

    // Wall-mounted Valve Manifold Boxes (VMB) in clean brushed stainless steel
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

      // Chassis
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 0.4), vmbMat);
      vmb.add(chassis);

      // Digital Pressure / Flow Gauges
      for (let g = 0; g < 4; g++) {
        const gauge = new THREE.Mesh(new THREE.CircleGeometry(0.1, 16), gaugeMat);
        gauge.position.set(-0.35 + (g % 2) * 0.7, 0.35 - Math.floor(g / 2) * 0.5, 0.21);
        vmb.add(gauge);
      }

      // Emergency Manual Shut-Off Valve handle
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

    // Clean utility piping network along ceiling
    const pipeColors = [
      { color: 0xeab308, y: 5.5, label: 'TOXIC_GAS' },
      { color: 0x22c55e, y: 5.3, label: 'N2_PURGE' },
      { color: 0x0ea5e9, y: 5.1, label: 'UPW_WATER' },
      { color: 0xf97316, y: 4.9, label: 'EXHAUST' },
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

      const dropPositions = [-11, 0, 11];
      dropPositions.forEach((dx) => {
        const dropPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 30, 12), mat);
        dropPipe.rotation.x = Math.PI / 2;
        dropPipe.position.set(dx, p.y, -1);
        pipeGroup.add(dropPipe);
      });
    });

    this.scene.add(pipeGroup);
  }

  // All 5 cleanroom machines built in pristine cleanroom white & brushed stainless steel
  private buildSectors() {
    // Shared crisp cleanroom materials
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
    // Sector 1: Photolithography (ASML DUV Scanner) - Top-Left (-11, 0, -10)
    // ----------------------------------------------------
    const lithoGroup = new THREE.Group();
    lithoGroup.position.set(-11, 0, -10);

    // Scanner main cabinet in pristine white
    const lithoCabinet = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.8, 3.2), whiteEnclosureMat);
    lithoCabinet.position.y = 1.9;
    lithoCabinet.castShadow = !this.isSoftwareGl;
    lithoGroup.add(lithoCabinet);

    // Optical projection tower in brushed stainless steel
    const opticTower = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 1.4, 24), silverSteelMat);
    opticTower.position.set(0, 4.3, 0);
    lithoGroup.add(opticTower);

    // UV laser lens emitter
    const uvLensMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const lensMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.15, 24), uvLensMat);
    lensMesh.position.set(0, 3.85, 0);
    lithoGroup.add(lensMesh);

    // Load port docking bay
    const loadPort = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 0.8), darkConsoleTrim);
    loadPort.position.set(0, 1.0, 1.8);
    lithoGroup.add(loadPort);

    // 300mm Silicon Wafer on chuck
    const waferMat = new THREE.MeshStandardMaterial({ color: 0x818cf8, roughness: 0.05, metalness: 0.98 });
    const wafer = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.02, 32), waferMat);
    wafer.position.set(0, 1.6, 1.8);
    lithoGroup.add(wafer);

    // Machine Bay Floor Stanchion Marking (clean, non-neon boundary line)
    const lithoLine = new THREE.Mesh(
      new THREE.RingGeometry(2.6, 2.75, 32),
      new THREE.MeshBasicMaterial({ color: 0x94a3b8, side: THREE.DoubleSide })
    );
    lithoLine.rotation.x = -Math.PI / 2;
    lithoLine.position.y = 0.02;
    lithoGroup.add(lithoLine);

    this.createEmoButton(lithoGroup, 'PHOTOLITHOGRAPHY', new THREE.Vector3(1.6, 1.3, 1.6));
    this.scene.add(lithoGroup);
    this.machineGroups.set('PHOTOLITHOGRAPHY', lithoGroup);

    // ----------------------------------------------------
    // Sector 5 (Bay 105): Ion Implantation - Center-Back (0, 0, -11)
    // ----------------------------------------------------
    const ionGroup = new THREE.Group();
    ionGroup.position.set(0, 0, -11);

    // Main vacuum enclosure base in clean white powder-coat
    const ionBase = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.2, 3.6), whiteEnclosureMat);
    ionBase.position.y = 0.6;
    ionGroup.add(ionBase);

    // 200kV High-Voltage Electrostatic Acceleration Column (Ceramic rings & chrome collars)
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

    // 90-Degree Mass Analysis Deflection Electromagnet
    const magnetYoke = new THREE.Mesh(
      new THREE.TorusGeometry(0.85, 0.22, 16, 24, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.9, roughness: 0.25 })
    );
    magnetYoke.position.set(0.2, 3.2, 0);
    magnetYoke.rotation.z = Math.PI;
    ionGroup.add(magnetYoke);

    // Ion Source Chamber Box with SDS gas cabinet in clean brushed steel
    const sourceBox = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 1.2), silverSteelMat);
    sourceBox.position.set(-1.0, 4.4, 0);
    ionGroup.add(sourceBox);

    // Hazard Symbol / Warning Sign on Source Box
    const warnPlate = new THREE.Mesh(
      new THREE.PlaneGeometry(0.35, 0.35),
      new THREE.MeshBasicMaterial({ color: 0xeab308 })
    );
    warnPlate.position.set(-1.0, 4.5, 0.62);
    ionGroup.add(warnPlate);

    // Glowing Ion Beam path
    const beamMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8 });
    const beamMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 16), beamMat);
    beamMesh.position.set(0.6, 2.4, 0);
    beamMesh.rotation.z = Math.PI / 2;
    ionGroup.add(beamMesh);
    this.ionAcceleratorBeam = beamMesh;

    // Grounding Discharge Stick Rack on Stanchion
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

    // Floor Caution Line (Subtle)
    const ionLine = new THREE.Mesh(
      new THREE.RingGeometry(2.7, 2.85, 32),
      new THREE.MeshBasicMaterial({ color: 0x94a3b8, side: THREE.DoubleSide })
    );
    ionLine.rotation.x = -Math.PI / 2;
    ionLine.position.y = 0.02;
    ionGroup.add(ionLine);

    this.createEmoButton(ionGroup, 'ION_IMPLANTATION', new THREE.Vector3(1.6, 1.3, 1.4));
    this.scene.add(ionGroup);
    this.machineGroups.set('ION_IMPLANTATION', ionGroup);

    // ----------------------------------------------------
    // Sector 2: Plasma Etch & CVD Bay - Top-Right (11, 0, -10)
    // ----------------------------------------------------
    const etchGroup = new THREE.Group();
    etchGroup.position.set(11, 0, -10);

    // Base vacuum plinth in clean white
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.0, 3.6), whiteEnclosureMat);
    plinth.position.y = 0.5;
    etchGroup.add(plinth);

    // Reaction Chamber in brilliant polished stainless steel
    const chamber = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 2.2, 32), silverSteelMat);
    chamber.position.y = 2.1;
    etchGroup.add(chamber);

    // Viewport window
    const windowRim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.06, 16, 32), darkConsoleTrim);
    windowRim.position.set(0, 2.1, 1.32);
    etchGroup.add(windowRim);

    // Glowing Plasma Core
    const plasmaMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const plasmaSphere = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 24), plasmaMat);
    plasmaSphere.position.set(0, 2.1, 1.1);
    etchGroup.add(plasmaSphere);
    this.plasmaChamberMesh = plasmaSphere;

    const plasmaLight = new THREE.PointLight(0x06b6d4, 1.8, 6);
    plasmaLight.position.set(0, 2.1, 1.3);
    etchGroup.add(plasmaLight);
    this.plasmaCoreLight = plasmaLight;

    // Feed pipes in stainless steel
    for (let i = -1; i <= 1; i++) {
      const pMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 12), silverSteelMat);
      pMesh.position.set(i * 0.45, 3.6, -0.6);
      etchGroup.add(pMesh);
    }

    this.createEmoButton(etchGroup, 'ETCH_CVD', new THREE.Vector3(1.5, 1.3, 1.5));
    this.scene.add(etchGroup);
    this.machineGroups.set('ETCH_CVD', etchGroup);

    // ----------------------------------------------------
    // Sector 3: CMP & Wet Bench - Bottom-Left (-11, 0, 7)
    // ----------------------------------------------------
    const cmpGroup = new THREE.Group();
    cmpGroup.position.set(-11, 0, 7);

    // Wet bench in chemical-resistant pure white polypropylene
    const cmpBase = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.1, 2.6), whiteEnclosureMat);
    cmpBase.position.y = 0.55;
    cmpGroup.add(cmpBase);

    // Clear acid splash sash
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

    // Rotating CMP Polishing Head & Pad
    const cmpPad = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.7, 0.15, 32),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.6, metalness: 0.2 })
    );
    cmpPad.position.set(-0.9, 1.15, 0);
    cmpGroup.add(cmpPad);
    this.cmpPadMesh = cmpPad;

    // Acid Wash Bath (HF / H2SO4)
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

    // Emergency Eye Wash & Deluge Shower Station
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

    this.createEmoButton(cmpGroup, 'CMP_WET_BENCH', new THREE.Vector3(1.8, 1.3, 1.2));
    this.scene.add(cmpGroup);
    this.machineGroups.set('CMP_WET_BENCH', cmpGroup);

    // ----------------------------------------------------
    // Sector 4: Thermal Diffusion Furnace - Bottom-Right (11, 0, 7)
    // ----------------------------------------------------
    const furnaceGroup = new THREE.Group();
    furnaceGroup.position.set(11, 0, 7);

    // Furnace enclosure base in pristine white
    const furnaceBase = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.2, 3.2), whiteEnclosureMat);
    furnaceBase.position.y = 0.6;
    furnaceGroup.add(furnaceBase);

    // High-temperature Quartz Diffusion Tube Stacks with internal orange glow
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      roughness: 0.2,
      metalness: 0.3,
      emissive: 0xea580c,
      emissiveIntensity: 0.45,
    });
    for (let row = 0; row < 3; row++) {
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 2.6, 24), tubeMat);
      tube.rotation.x = Math.PI / 2;
      tube.position.set(-0.8 + row * 0.8, 2.0, 0);
      furnaceGroup.add(tube);
      this.furnaceTubes.push(tube);
    }

    const boatLoader = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 0.8), silverSteelMat);
    boatLoader.position.set(0, 1.3, 1.1);
    furnaceGroup.add(boatLoader);

    this.createEmoButton(furnaceGroup, 'DIFFUSION_FURNACE', new THREE.Vector3(1.6, 1.3, 1.4));
    this.scene.add(furnaceGroup);
    this.machineGroups.set('DIFFUSION_FURNACE', furnaceGroup);

    // Setup hazard visual placeholders for all 5 sectors
    this.setupHazardVisualPlaceholders();
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

  // 3D Floating Holographic Billboards for each machine bay
  private buildBayBillboards() {
    const bays: { id: SectorId; code: string; name: string; pos: THREE.Vector3 }[] = [
      { id: 'PHOTOLITHOGRAPHY', code: 'BAY 101', name: 'DUV SCANNER', pos: new THREE.Vector3(-11, 4.6, -10) },
      { id: 'ION_IMPLANTATION', code: 'BAY 105', name: 'ION IMPLANTER (200kV)', pos: new THREE.Vector3(0, 5.0, -11) },
      { id: 'ETCH_CVD', code: 'BAY 102', name: 'PLASMA ETCH / CVD', pos: new THREE.Vector3(11, 4.6, -10) },
      { id: 'CMP_WET_BENCH', code: 'BAY 103', name: 'CMP & WET BENCH', pos: new THREE.Vector3(-11, 4.2, 7) },
      { id: 'DIFFUSION_FURNACE', code: 'BAY 104', name: 'DIFFUSION FURNACE', pos: new THREE.Vector3(11, 4.2, 7) },
    ];

    bays.forEach((bay) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 192;
      const ctx = canvas.getContext('2d')!;

      this.renderBillboardCanvas(ctx, bay.code, bay.name, 'OPTIMAL', 'RF 1200W | NORMAL');

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;

      const mat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.12), mat);
      mesh.position.copy(bay.pos);
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
    status: 'OPTIMAL' | 'WARNING' | 'CRITICAL' | 'SHUTDOWN',
    subtext: string
  ) {
    ctx.clearRect(0, 0, 512, 192);

    // Glowing border color based on status
    let statusColor = '#06b6d4'; // Cyan for optimal
    let statusBg = 'rgba(6, 182, 212, 0.15)';
    let statusText = 'NORMAL';
    if (status === 'WARNING') {
      statusColor = '#f59e0b'; // Amber
      statusBg = 'rgba(245, 158, 11, 0.2)';
      statusText = 'CAUTION';
    } else if (status === 'CRITICAL' || status === 'SHUTDOWN') {
      statusColor = '#ef4444'; // Red
      statusBg = 'rgba(239, 68, 68, 0.25)';
      statusText = status === 'SHUTDOWN' ? 'HALTED' : 'ALERT';
    }

    // Glass panel background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.beginPath();
    ctx.roundRect(8, 8, 496, 176, 16);
    ctx.fill();

    // Border glow
    ctx.strokeStyle = statusColor;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Top Header: Bay Code & Status Badge
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(code, 26, 44);

    // Status Badge background
    ctx.fillStyle = statusBg;
    ctx.beginPath();
    ctx.roundRect(340, 22, 140, 30, 8);
    ctx.fill();
    ctx.strokeStyle = statusColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Status LED dot & text
    ctx.fillStyle = statusColor;
    ctx.beginPath();
    ctx.arc(358, 37, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(statusText, 372, 42);

    // Main Equipment Name
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(name, 26, 96);

    // Divider Line
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(26, 118);
    ctx.lineTo(486, 118);
    ctx.stroke();

    // Subtext metrics (e.g. dynamic RF / Scrubber / Eff)
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(subtext, 26, 154);
  }

  public updateSectorStatus(sectors: Record<SectorId, SectorState>) {
    Object.values(sectors).forEach((sec) => {
      const b = this.bayBillboards.get(sec.id);
      if (!b) return;

      const sub = `RF: ${sec.rfPowerWatts}W | Scrubber: ${Math.round(sec.scrubberLoadPct)}% | Eff: ${Math.round(sec.efficiency)}%`;
      this.renderBillboardCanvas(b.ctx, sec.code, sec.name, sec.status, sub);
      b.texture.needsUpdate = true;
    });
  }

  // Ceiling Overhead Hoist Transport (OHT) track
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

  // Patrolling Cleanroom Technicians with tablets
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

  private setupHazardVisualPlaceholders() {
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

      const beaconRing = new THREE.Mesh(
        new THREE.RingGeometry(2.4, 2.65, 32),
        new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide })
      );
      beaconRing.rotation.x = -Math.PI / 2;
      beaconRing.position.y = 0.04;
      hazardGroup.add(beaconRing);

      const puddle = new THREE.Mesh(
        new THREE.CircleGeometry(1.6, 24),
        new THREE.MeshStandardMaterial({
          color: 0x22c55e,
          roughness: 0.1,
          metalness: 0.2,
          transparent: true,
          opacity: 0.8,
        })
      );
      puddle.rotation.x = -Math.PI / 2;
      puddle.position.y = 0.03;
      hazardGroup.add(puddle);

      const localStrobe = new THREE.PointLight(0xef4444, 2.5, 9);
      localStrobe.position.set(0, 2.5, 0);
      hazardGroup.add(localStrobe);

      const machineGroup = this.machineGroups.get(secId);
      if (machineGroup) {
        machineGroup.add(hazardGroup);
      }
      this.hazardEffects.set(secId, hazardGroup);
    });
  }

  public triggerActionEffect(type: ActionEffectType, sectorId?: SectorId) {
    const targetSector = sectorId || this.activeHazardSector || 'CMP_WET_BENCH';
    const group = this.machineGroups.get(targetSector);
    const origin = group ? group.position.clone() : new THREE.Vector3(0, 0, 0);
    this.particleEffects.triggerEffect(type, origin);
  }

  public setHazardActive(sectorId: SectorId | null, active: boolean, typeId?: string) {
    this.activeHazardSector = sectorId;
    this.isHazardActive = active;

    this.hazardEffects.forEach((group, sec) => {
      if (active && sec === sectorId) {
        group.visible = true;
        const puddleMesh = group.children[1] as THREE.Mesh;
        if (puddleMesh && puddleMesh.material) {
          const mat = puddleMesh.material as THREE.MeshStandardMaterial;
          if (typeId === 'HF_ACID_SPILL') {
            mat.color.setHex(0x10b981);
          } else if (typeId === 'SILANE_GAS_LEAK') {
            mat.color.setHex(0xf97316);
          } else if (typeId === 'ARSINE_GAS_LEAK') {
            mat.color.setHex(0xeab308);
          } else if (typeId === 'ION_HV_ARC_XRAY') {
            mat.color.setHex(0x06b6d4);
          } else {
            mat.color.setHex(0xef4444);
          }
        }
      } else {
        group.visible = false;
      }
    });

    if (active && sectorId && this.viewMode === 'VR_FIRST_PERSON') {
      const machineGroup = this.machineGroups.get(sectorId);
      if (machineGroup) {
        this.targetCameraLookAt.copy(machineGroup.position);
        this.targetCameraLookAt.y = 1.6;
      }
    }
  }

  public setCameraView(mode: CameraViewMode) {
    this.viewMode = mode;
    if (mode === 'SUPERVISOR_ISOMETRIC') {
      this.targetCameraPos.set(0, 22, 23);
      this.targetCameraLookAt.set(0, 1.2, -2);
    } else if (mode === 'INSPECTION') {
      const targetSec = this.activeHazardSector || 'ION_IMPLANTATION';
      const grp = this.machineGroups.get(targetSec);
      if (grp) {
        this.targetCameraPos.set(grp.position.x + 3.2, 2.4, grp.position.z + 4.2);
        this.targetCameraLookAt.set(grp.position.x, 1.8, grp.position.z);
      }
    } else {
      this.targetCameraPos.copy(this.vrPlayerPos);
      this.updateVrLookAt();
    }
  }

  public focusSector(sectorId: SectorId) {
    const grp = this.machineGroups.get(sectorId);
    if (!grp) return;

    if (this.viewMode === 'VR_FIRST_PERSON') {
      this.targetCameraLookAt.copy(grp.position);
      this.targetCameraLookAt.y = 1.6;
    } else if (this.viewMode === 'INSPECTION') {
      this.targetCameraPos.set(grp.position.x + 3.2, 2.4, grp.position.z + 4.2);
      this.targetCameraLookAt.set(grp.position.x, 1.8, grp.position.z);
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
    this.container.addEventListener('click', this.handleClick);
    window.addEventListener('resize', this.handleResize);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
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
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private updateMovement(dt: number) {
    if (this.viewMode !== 'VR_FIRST_PERSON') return;

    const moveSpeed = 6.0 * dt;
    const forward = _vec3A.set(Math.sin(this.vrPlayerYaw), 0, -Math.cos(this.vrPlayerYaw)).normalize();
    const right = _vec3B.set(Math.cos(this.vrPlayerYaw), 0, Math.sin(this.vrPlayerYaw)).normalize();

    let moved = false;
    if (this.keysHeld['w'] || this.keysHeld['arrowup']) {
      this.vrPlayerPos.addScaledVector(forward, moveSpeed);
      moved = true;
    }
    if (this.keysHeld['s'] || this.keysHeld['arrowdown']) {
      this.vrPlayerPos.addScaledVector(forward, -moveSpeed);
      moved = true;
    }
    if (this.keysHeld['a'] || this.keysHeld['arrowleft']) {
      this.vrPlayerPos.addScaledVector(right, -moveSpeed);
      moved = true;
    }
    if (this.keysHeld['d'] || this.keysHeld['arrowright']) {
      this.vrPlayerPos.addScaledVector(right, moveSpeed);
      moved = true;
    }

    this.vrPlayerPos.x = Math.max(-19, Math.min(19, this.vrPlayerPos.x));
    this.vrPlayerPos.z = Math.max(-19, Math.min(19, this.vrPlayerPos.z));
    this.vrPlayerPos.y = 1.7;

    this.targetCameraPos.copy(this.vrPlayerPos);
    if (moved) {
      this.updateVrLookAt();
    }
  }

  private startLoop() {
    const tick = () => {
      if (this.isDestroyed) return;
      const rawDt = this.clock.getDelta();
      const dt = Math.min(rawDt, 0.05);
      const elapsed = this.clock.getElapsedTime();

      // 1. Process movement
      this.updateMovement(dt);

      // 2. Camera damping
      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, this.targetCameraPos.x, 8.0, dt);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, this.targetCameraPos.y, 8.0, dt);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, this.targetCameraPos.z, 8.0, dt);

      this.currentCameraLookAt.x = THREE.MathUtils.damp(this.currentCameraLookAt.x, this.targetCameraLookAt.x, 9.0, dt);
      this.currentCameraLookAt.y = THREE.MathUtils.damp(this.currentCameraLookAt.y, this.targetCameraLookAt.y, 9.0, dt);
      this.currentCameraLookAt.z = THREE.MathUtils.damp(this.currentCameraLookAt.z, this.targetCameraLookAt.z, 9.0, dt);
      this.camera.lookAt(this.currentCameraLookAt);

      // 3. Update active particles
      this.particleEffects.update(dt);

      // 4. Animate OHT carriers along ceiling track
      this.ohtCarriers.forEach((carrier) => {
        const u = (carrier.userData.progress + carrier.userData.speed * dt) % 1.0;
        carrier.userData.progress = u;
        const curve = carrier.userData.curve as THREE.CatmullRomCurve3;
        const pt = curve.getPointAt(u);
        carrier.position.copy(pt);
      });

      // 5. Animate patrolling technicians
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

      // 6. Animate plasma core
      if (this.plasmaChamberMesh && this.plasmaCoreLight) {
        const pulse = 1.0 + Math.sin(elapsed * 6) * 0.2;
        this.plasmaChamberMesh.scale.set(pulse, pulse, pulse);
        this.plasmaCoreLight.intensity = 1.5 + Math.sin(elapsed * 12) * 0.5;
      }

      // 7. Animate ion accelerator beam
      if (this.ionAcceleratorBeam) {
        this.ionAcceleratorBeam.scale.x = 1.0 + Math.sin(elapsed * 15) * 0.15;
      }

      // 8. Animate CMP rotating pad
      if (this.cmpPadMesh) {
        this.cmpPadMesh.rotation.y += dt * 3.5;
      }

      // 9. Animate Quartz Furnace Tubes thermal warmth
      this.furnaceTubes.forEach((tube, i) => {
        const mat = tube.material as THREE.MeshStandardMaterial;
        if (mat) {
          mat.emissiveIntensity = 0.35 + Math.sin(elapsed * 2.5 + i) * 0.15;
        }
      });

      // 10. Animate Floating Holographic Billboards (gentle hover and billboard facing camera)
      this.bayBillboards.forEach((b, secId) => {
        const offset = secId.charCodeAt(0) % 5;
        b.mesh.position.y = b.baseY + Math.sin(elapsed * 2.0 + offset) * 0.05;
        b.mesh.quaternion.copy(this.camera.quaternion);
      });

      // 11. Emergency beacon strobes
      if (this.isHazardActive) {
        const strobe = Math.sin(elapsed * 14) > 0.1 ? 3.0 : 0.0;
        this.emergencyBeacons.forEach((b) => {
          b.intensity = strobe;
        });
      } else {
        this.emergencyBeacons.forEach((b) => (b.intensity = 0));
      }

      // 12. Render frame
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
