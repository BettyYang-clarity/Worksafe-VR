# WorkSafe VR · Semiconductor Fab & Safety Simulator
**工安實境 VR · 半導體晶圓廠工安與製程模擬器**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-0.186-000000?logo=threedotjs)](https://threejs.org/)
[![SEMI S2](https://img.shields.io/badge/Standard-SEMI%20S2%20%2F%20OSHA%201910-10B981)](#)

An immersive, bilingual (`繁體中文` / `English`) 3D semiconductor cleanroom simulator built with **React 19**, **Three.js**, **Tailwind CSS v4**, and **Web Audio API**. Step into an ISO Class 1 300mm wafer fabrication environment where you must balance **high-throughput wafer yield (OEE)** against **strict life-safety compliance (SEMI S2, OSHA 1910.147 LOTO, NFPA 70E, NFPA 318)**.

---

## ✨ Key Features

### 1. 3D ISO Class 1 Cleanroom & 5-Bay CMOS Pipeline
- **Sequential 5-Station Interlock Flow**:
  1. **Bay 101 · Photolithography (`PHOTOLITHOGRAPHY`)**: 193nm DUV Immersion Scanner with UV-filtered yellow partition.
  2. **Bay 105 · Ion Implantation (`ION_IMPLANTATION`)**: 200kV Electrostatic Accelerator Column, 90° Analyzing Magnet, and SDS sub-atmospheric gas box.
  3. **Bay 102 · Plasma Etch & CVD (`ETCH_CVD`)**: Inductively Coupled Plasma (ICP) reactor with $\text{SiH}_4 / \text{Cl}_2$ manifolds.
  4. **Bay 103 · CMP & Acid Wet Bench (`CMP_WET_BENCH`)**: Rotating planarization pad, $\text{HF} / \text{H}_2\text{SO}_4$ acid baths, and ANSI Z358.1 emergency deluge shower.
  5. **Bay 104 · Thermal Diffusion Furnace (`DIFFUSION_FURNACE`)**: $1100^\circ\text{C}$ vertical quartz tube stacks with automated boat loader.
- **3 Camera Perspectives**:
  - `1` **VR First-Person Walk**: `WASD` movement + `Mouse Drag` $360^\circ$ look + direct 3D raycast clicking on red mushroom EMO buttons and holographic bay billboards.
  - `2` **Supervisor Isometric Overview**: Bird's-eye view of the entire 5-bay pipeline and ceiling OHT (Overhead Hoist Transport) FOUP track.
  - `3` **Bay Inspection Close-Up**: Focused camera on the currently selected or alerting tool.

### 2. Double-Edged Real-Time Process Tuning
- **Bottom-Docked Bay 101–105 Tuning Rack** & **SECS/GEM Diagnostic Tablet (`Tab`)**:
  - **RF Power ($\text{W}$)**: Boosts wafer throughput ($\text{Wafers/hr}$) and efficiency, but raises chamber temperature and risks $200\text{kV}$ arc-flash above $2100\text{W}$.
  - **Toxic Gas Flow ($\text{sccm}$)**: Improves film uniformity and yield $\%$, but spikes exhaust backpressure and **Scrubber Load $\%$** (triggers toxic gas backflow if $>100\%$).
  - **Chamber Vacuum ($\text{Torr}$)**: Ultra-high vacuum reduces particulate defects ($\text{PPM}$), while poor vacuum degrades yield.
  - **Wafer Bypass Routing**: Divert upstream FOUPs around halted or bottlenecked bays via ceiling OHT stockers.

### 3. Multi-Stage Industrial Safety Crisis Scenarios
All hazards use **Fisher-Yates shuffled protocol choices** and shuffled shift queues so every shift tests genuine comprehension rather than position memorization:
- **Level 1 · Mechanical / LOTO**:
  - `ROBOTIC_FOUP_PINCH` (Bay 101): OHT wafer carrier mechanical pinch $\rightarrow$ Rail EMO + OSHA 1910.147 Lockout/Tagout & manual brake release.
- **Level 2 · Chemical & Toxic Gas Leaks**:
  - `ARSINE_GAS_LEAK` (Bay 105): Lethal $\text{AsH}_3$ hydride leak ($1.8\text{ PPM}$ vs $0.005\text{ PPM}$ TLV) $\rightarrow$ Ion Source EMO & SDS solenoid cutoff + Burn-Box Scrubber $\text{N}_2$ purge + Upwind SCBA evacuation.
  - `HF_ACID_SPILL` (Bay 103): Pressurized $49\%$ Hydrofluoric Acid spray $\rightarrow$ Emergency deluge shower & strip contaminated suit + $2.5\%$ Calcium Gluconate antidote gel + Polypropylene neutralizing boom.
- **Level 3 · Fatal Crises**:
  - `SILANE_GAS_LEAK` (Bay 102): Pyrophoric $\text{SiH}_4$ spontaneous ignition $\rightarrow$ Immediate EMO & Gas Abort ($<3\text{s}$) + High-pressure ultra-pure $\text{N}_2$ sweep to thermal wet scrubber.
  - `ION_HV_ARC_XRAY` (Bay 105): $200\text{kV}$ electrostatic column arc flash & Bremsstrahlung X-ray leak $\rightarrow$ Main feeder breaker LOTO + Class 00 gloves & $10\text{kV}$ grounding discharge stick + Geiger-Müller radiation survey ($<0.2\ \mu\text{Sv/h}$).
  - `FURNACE_QUARTZ_BREACH` (Bay 104): $1100^\circ\text{C}$ Quartz Tube Thermal Runaway & $\text{H}_2/\text{O}_2$ Pyrogenic Ignition Risk $\rightarrow$ 13.56MHz/Heater Contactor Trip + Clean-Agent Novec 1230 / $\text{N}_2$ Curtain Flood + Controlled Thermal Cooldown Lockout.

### 4. 8D Root Cause Analysis (RCA) & One-Page Social Badge
- Tracks millisecond reaction times, OSHA monetary fines, decision timeline events, and remedial knowledge gaps.
- Generates a downloadable **1000×620 PNG Certification Badge** via HTML5 Canvas and one-click social post copy.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js** `>= 18` (or **Bun**)

### Installation & Run
```bash
# 1. Navigate to the project directory
cd Worksafe-VR

# 2. Install dependencies
npm install

# 3. Start the Vite development server (http://localhost:3000)
npm run dev
```

### Type-Checking & Production Build
```bash
# Run TypeScript compiler verification
npm run lint

# Build production bundle into dist/
npm run build

# Preview production build locally
npm run preview
```

---

## 🎮 Controls & Shortcuts

| Key / Input | Action |
| :--- | :--- |
| `W` `A` `S` `D` / `Arrow Keys` | Walk around the cleanroom floor (in VR First-Person view) |
| `Mouse Drag` | Look around $360^\circ$ (VR view) or pan floor (Supervisor view) |
| `Mouse Click (3D)` | Click 3D Red Mushroom **EMO Buttons**, **Holographic Bay Billboards**, or **Machines** |
| `1` / `2` / `3` | Switch camera: `1` VR First-Person · `2` Supervisor Isometric · `3` Bay Inspection |
| `Tab` | Open/Close Equipment Engineer **SECS/GEM Diagnostic Tablet** |
| `G` | Open/Close **Shift Supervisor Pipeline Dispatch Modal** |
| `H` | Collapse/Expand Bottom Parameter Tuning Rack |
| `Esc` | Pause simulation / Close active modal |
