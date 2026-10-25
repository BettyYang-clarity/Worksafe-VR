import * as THREE from 'three';

export type ActionEffectType = 'DELUGE_SHOWER' | 'N2_PURGE' | 'ARC_SPARKS' | 'SMOKE_SMOTHER';

interface ActiveSystem {
  type: ActionEffectType;
  points: THREE.Points;
  positions: Float32Array;
  velocities: Float32Array;
  lifetimes: Float32Array;
  maxLifetimes: Float32Array;
  aliveCount: number;
  maxCount: number;
  origin: THREE.Vector3;
  duration: number; // Duration of emission in seconds
  elapsed: number;
}

export class ParticleEffectsManager {
  private scene: THREE.Scene;
  private activeSystems: ActiveSystem[] = [];
  private arcLines: THREE.LineSegments[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * Triggers a specific action effect at the specified position.
   */
  public triggerEffect(type: ActionEffectType, origin: THREE.Vector3) {
    switch (type) {
      case 'DELUGE_SHOWER':
        this.createDelugeShower(origin);
        break;
      case 'N2_PURGE':
        this.createN2Purge(origin);
        break;
      case 'ARC_SPARKS':
        this.createArcSparks(origin);
        break;
      case 'SMOKE_SMOTHER':
        this.createSmokeSmother(origin);
        break;
    }
  }

  // 1. Deluge Emergency Shower: Cascading water streams and floor splash
  private createDelugeShower(origin: THREE.Vector3) {
    const maxCount = 450;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(maxCount * 3);
    const velocities = new Float32Array(maxCount * 3);
    const lifetimes = new Float32Array(maxCount);
    const maxLifetimes = new Float32Array(maxCount);

    const showerHeadPos = origin.clone().add(new THREE.Vector3(0, 3.2, 0));

    for (let i = 0; i < maxCount; i++) {
      const i3 = i * 3;
      // Start near shower head with slight cone spread
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.35;
      positions[i3] = showerHeadPos.x + Math.cos(angle) * radius;
      positions[i3 + 1] = showerHeadPos.y - Math.random() * 0.4;
      positions[i3 + 2] = showerHeadPos.z + Math.sin(angle) * radius;

      velocities[i3] = (Math.random() - 0.5) * 0.8;
      velocities[i3 + 1] = -7.5 - Math.random() * 3.0; // High speed downward
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.8;

      lifetimes[i] = Math.random() * 0.3; // Stagger spawn
      maxLifetimes[i] = 0.65;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.12,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    this.scene.add(points);

    this.activeSystems.push({
      type: 'DELUGE_SHOWER',
      points,
      positions,
      velocities,
      lifetimes,
      maxLifetimes,
      aliveCount: maxCount,
      maxCount,
      origin: showerHeadPos,
      duration: 3.5, // 3.5 second deluge
      elapsed: 0,
    });
  }

  // 2. High Pressure N2 Purge Jet: Directed high-speed conical white gas
  private createN2Purge(origin: THREE.Vector3) {
    const maxCount = 400;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(maxCount * 3);
    const velocities = new Float32Array(maxCount * 3);
    const lifetimes = new Float32Array(maxCount);
    const maxLifetimes = new Float32Array(maxCount);

    const nozzlePos = origin.clone().add(new THREE.Vector3(0, 1.8, 0.8));

    for (let i = 0; i < maxCount; i++) {
      const i3 = i * 3;
      positions[i3] = nozzlePos.x;
      positions[i3 + 1] = nozzlePos.y;
      positions[i3 + 2] = nozzlePos.z;

      // Cone expanding forward and slightly upward
      const theta = (Math.random() - 0.5) * 0.6;
      const phi = (Math.random() - 0.5) * 0.6;
      const speed = 4.0 + Math.random() * 5.0;

      velocities[i3] = Math.sin(theta) * speed;
      velocities[i3 + 1] = Math.sin(phi) * speed + 0.8;
      velocities[i3 + 2] = -Math.cos(theta) * speed;

      lifetimes[i] = Math.random() * 0.25;
      maxLifetimes[i] = 0.8;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xe0f2fe,
      size: 0.22,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    this.scene.add(points);

    this.activeSystems.push({
      type: 'N2_PURGE',
      points,
      positions,
      velocities,
      lifetimes,
      maxLifetimes,
      aliveCount: maxCount,
      maxCount,
      origin: nozzlePos,
      duration: 2.8,
      elapsed: 0,
    });
  }

  // 3. 200kV High Voltage Arc Sparks & Flash
  private createArcSparks(origin: THREE.Vector3) {
    const maxCount = 300;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(maxCount * 3);
    const velocities = new Float32Array(maxCount * 3);
    const lifetimes = new Float32Array(maxCount);
    const maxLifetimes = new Float32Array(maxCount);

    const arcPos = origin.clone().add(new THREE.Vector3(0, 2.2, 0));

    for (let i = 0; i < maxCount; i++) {
      const i3 = i * 3;
      positions[i3] = arcPos.x;
      positions[i3 + 1] = arcPos.y;
      positions[i3 + 2] = arcPos.z;

      // Omnidirectional violent spark explosion
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 3.0 + Math.random() * 8.0;

      velocities[i3] = Math.sin(phi) * Math.cos(theta) * speed;
      velocities[i3 + 1] = Math.sin(phi) * Math.sin(theta) * speed + 2.0;
      velocities[i3 + 2] = Math.cos(phi) * speed;

      lifetimes[i] = 0;
      maxLifetimes[i] = 0.35 + Math.random() * 0.35;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x67e8f9,
      size: 0.15,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    this.scene.add(points);

    // Also create 3-4 jagged lightning arc segments
    const lineSegmentsGeo = new THREE.BufferGeometry();
    const linePositions = new Float32Array(24 * 3); // 12 line segments
    let pt = arcPos.clone();
    for (let j = 0; j < 12; j++) {
      const idx = j * 6;
      linePositions[idx] = pt.x;
      linePositions[idx + 1] = pt.y;
      linePositions[idx + 2] = pt.z;

      const nextPt = pt.clone().add(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.9,
          (Math.random() - 0.5) * 0.9,
          (Math.random() - 0.5) * 0.9
        )
      );
      linePositions[idx + 3] = nextPt.x;
      linePositions[idx + 4] = nextPt.y;
      linePositions[idx + 5] = nextPt.z;
      pt = nextPt;
    }
    lineSegmentsGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 });
    const arcLines = new THREE.LineSegments(lineSegmentsGeo, lineMat);
    this.scene.add(arcLines);
    this.arcLines.push(arcLines);

    this.activeSystems.push({
      type: 'ARC_SPARKS',
      points,
      positions,
      velocities,
      lifetimes,
      maxLifetimes,
      aliveCount: maxCount,
      maxCount,
      origin: arcPos,
      duration: 1.5,
      elapsed: 0,
    });
  }

  // 4. Clean-Agent Smoke Smothering (Novec 1230 / CO2 blanket)
  private createSmokeSmother(origin: THREE.Vector3) {
    const maxCount = 280;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(maxCount * 3);
    const velocities = new Float32Array(maxCount * 3);
    const lifetimes = new Float32Array(maxCount);
    const maxLifetimes = new Float32Array(maxCount);

    const smotherPos = origin.clone().add(new THREE.Vector3(0, 1.2, 0));

    for (let i = 0; i < maxCount; i++) {
      const i3 = i * 3;
      positions[i3] = smotherPos.x + (Math.random() - 0.5) * 0.8;
      positions[i3 + 1] = smotherPos.y + (Math.random() - 0.5) * 0.4;
      positions[i3 + 2] = smotherPos.z + (Math.random() - 0.5) * 0.8;

      // Heavy cold aerosol expanding outward along floor
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.8 + Math.random() * 1.6;
      velocities[i3] = Math.cos(angle) * speed;
      velocities[i3 + 1] = (Math.random() - 0.3) * 0.5; // Stays close to machine/ground
      velocities[i3 + 2] = Math.sin(angle) * speed;

      lifetimes[i] = Math.random() * 0.4;
      maxLifetimes[i] = 1.4;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xf1f5f9,
      size: 0.35,
      transparent: true,
      opacity: 0.6,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    this.scene.add(points);

    this.activeSystems.push({
      type: 'SMOKE_SMOTHER',
      points,
      positions,
      velocities,
      lifetimes,
      maxLifetimes,
      aliveCount: maxCount,
      maxCount,
      origin: smotherPos,
      duration: 3.0,
      elapsed: 0,
    });
  }

  /**
   * Updates all active particle systems every frame.
   */
  public update(dt: number) {
    // 1. Update particle systems
    for (let sIdx = this.activeSystems.length - 1; sIdx >= 0; sIdx--) {
      const sys = this.activeSystems[sIdx];
      sys.elapsed += dt;

      const isEmitting = sys.elapsed < sys.duration;
      let activeParticles = 0;

      const posAttr = sys.points.geometry.getAttribute('position') as THREE.BufferAttribute;

      for (let i = 0; i < sys.maxCount; i++) {
        const i3 = i * 3;
        sys.lifetimes[i] += dt;

        if (sys.lifetimes[i] > sys.maxLifetimes[i]) {
          if (isEmitting) {
            // Respawn particle at origin
            sys.lifetimes[i] = 0;
            if (sys.type === 'DELUGE_SHOWER') {
              const angle = Math.random() * Math.PI * 2;
              const radius = Math.random() * 0.35;
              sys.positions[i3] = sys.origin.x + Math.cos(angle) * radius;
              sys.positions[i3 + 1] = sys.origin.y;
              sys.positions[i3 + 2] = sys.origin.z + Math.sin(angle) * radius;
              sys.velocities[i3] = (Math.random() - 0.5) * 0.8;
              sys.velocities[i3 + 1] = -7.5 - Math.random() * 3.0;
              sys.velocities[i3 + 2] = (Math.random() - 0.5) * 0.8;
            } else if (sys.type === 'N2_PURGE') {
              sys.positions[i3] = sys.origin.x;
              sys.positions[i3 + 1] = sys.origin.y;
              sys.positions[i3 + 2] = sys.origin.z;
              const theta = (Math.random() - 0.5) * 0.6;
              const phi = (Math.random() - 0.5) * 0.6;
              const speed = 4.0 + Math.random() * 5.0;
              sys.velocities[i3] = Math.sin(theta) * speed;
              sys.velocities[i3 + 1] = Math.sin(phi) * speed + 0.8;
              sys.velocities[i3 + 2] = -Math.cos(theta) * speed;
            } else if (sys.type === 'ARC_SPARKS') {
              sys.positions[i3] = sys.origin.x;
              sys.positions[i3 + 1] = sys.origin.y;
              sys.positions[i3 + 2] = sys.origin.z;
              const theta = Math.random() * Math.PI * 2;
              const phi = Math.acos(2 * Math.random() - 1);
              const speed = 3.0 + Math.random() * 8.0;
              sys.velocities[i3] = Math.sin(phi) * Math.cos(theta) * speed;
              sys.velocities[i3 + 1] = Math.sin(phi) * Math.sin(theta) * speed + 2.0;
              sys.velocities[i3 + 2] = Math.cos(phi) * speed;
            } else if (sys.type === 'SMOKE_SMOTHER') {
              sys.positions[i3] = sys.origin.x + (Math.random() - 0.5) * 0.8;
              sys.positions[i3 + 1] = sys.origin.y + (Math.random() - 0.5) * 0.4;
              sys.positions[i3 + 2] = sys.origin.z + (Math.random() - 0.5) * 0.8;
              const angle = Math.random() * Math.PI * 2;
              const speed = 0.8 + Math.random() * 1.6;
              sys.velocities[i3] = Math.cos(angle) * speed;
              sys.velocities[i3 + 1] = (Math.random() - 0.3) * 0.5;
              sys.velocities[i3 + 2] = Math.sin(angle) * speed;
            }
          } else {
            // Dead and done emitting
            sys.positions[i3 + 1] = -999; // Move out of view
            continue;
          }
        }

        activeParticles++;

        // Apply velocities & physics
        if (sys.type === 'DELUGE_SHOWER') {
          sys.velocities[i3 + 1] -= 9.8 * dt; // Gravity
          if (sys.positions[i3 + 1] <= 0.05) {
            // Floor splash
            sys.positions[i3 + 1] = 0.05;
            sys.velocities[i3 + 1] = 0.4 + Math.random() * 0.8;
            sys.velocities[i3] *= 1.5;
            sys.velocities[i3 + 2] *= 1.5;
          }
        } else if (sys.type === 'ARC_SPARKS') {
          sys.velocities[i3 + 1] -= 8.0 * dt; // Spark gravity
        } else if (sys.type === 'SMOKE_SMOTHER') {
          sys.velocities[i3] *= 0.94; // Air resistance
          sys.velocities[i3 + 2] *= 0.94;
          sys.velocities[i3 + 1] += 0.2 * dt; // Slight buoyancy
        }

        sys.positions[i3] += sys.velocities[i3] * dt;
        sys.positions[i3 + 1] += sys.velocities[i3 + 1] * dt;
        sys.positions[i3 + 2] += sys.velocities[i3 + 2] * dt;
      }

      posAttr.needsUpdate = true;

      // Clean up finished systems
      if (!isEmitting && activeParticles === 0) {
        this.scene.remove(sys.points);
        sys.points.geometry.dispose();
        (sys.points.material as THREE.Material).dispose();
        this.activeSystems.splice(sIdx, 1);
      }
    }

    // 2. Clean up temporary arc lines after ~0.25s
    if (this.arcLines.length > 0) {
      for (let j = this.arcLines.length - 1; j >= 0; j--) {
        const line = this.arcLines[j];
        if (Math.random() < 0.25) {
          this.scene.remove(line);
          line.geometry.dispose();
          (line.material as THREE.Material).dispose();
          this.arcLines.splice(j, 1);
        }
      }
    }
  }

  public destroy() {
    this.activeSystems.forEach((sys) => {
      this.scene.remove(sys.points);
      sys.points.geometry.dispose();
      (sys.points.material as THREE.Material).dispose();
    });
    this.activeSystems = [];

    this.arcLines.forEach((l) => {
      this.scene.remove(l);
      l.geometry.dispose();
      (l.material as THREE.Material).dispose();
    });
    this.arcLines = [];
  }
}
