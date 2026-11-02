import * as THREE from 'three';
import type { Component3D } from '../../types/workbench';

// ============================================================================
// Phase 1 3D Model Generation: Breadboards & Prototyping Meshes with Instancing
// ============================================================================

/**
 * Helper to build an instanced hole matrix on a breadboard in 1 single draw call
 */
function createInstancedBreadboardHoles(
  rows: number,
  colsA: number,
  colsB: number,
  xPitch: number,
  yPitch: number,
  xOffset: number,
  hasPowerRails: boolean
): THREE.InstancedMesh {
  const holeCount = rows * (colsA + colsB) + (hasPowerRails ? rows * 4 : 0);
  const holeGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.05, 8);
  const holeMat = new THREE.MeshBasicMaterial({ color: 0x09090b }); // Dark metallic socket interior
  const instancedMesh = new THREE.InstancedMesh(holeGeo, holeMat, holeCount);

  const dummy = new THREE.Object3D();
  let instanceIdx = 0;

  // 1. Column groups (Side A: cols a-e, Side B: cols f-j)
  for (let r = 0; r < rows; r++) {
    const x = xOffset + r * xPitch;

    // Side A (z from -0.6 to -0.2)
    for (let c = 0; c < colsA; c++) {
      dummy.position.set(x, 0.09, -0.25 - (4 - c) * yPitch);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(instanceIdx++, dummy.matrix);
    }

    // Side B (z from 0.2 to 0.6)
    for (let c = 0; c < colsB; c++) {
      dummy.position.set(x, 0.09, 0.25 + c * yPitch);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(instanceIdx++, dummy.matrix);
    }
  }

  // 2. Power Rails (Top +/- and Bottom +/-)
  if (hasPowerRails) {
    for (let r = 0; r < rows; r++) {
      const x = xOffset + r * xPitch;

      // Top Pos & Neg
      dummy.position.set(x, 0.09, -0.9);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(instanceIdx++, dummy.matrix);

      dummy.position.set(x, 0.09, -0.75);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(instanceIdx++, dummy.matrix);

      // Bottom Pos & Neg
      dummy.position.set(x, 0.09, 0.75);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(instanceIdx++, dummy.matrix);

      dummy.position.set(x, 0.09, 0.9);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(instanceIdx++, dummy.matrix);
    }
  }

  instancedMesh.instanceMatrix.needsUpdate = true;
  instancedMesh.receiveShadow = true;
  return instancedMesh;
}

export function buildPrototypingMesh(
  component: Component3D,
  _baseMaterial: THREE.Material,
  _darkMaterial: THREE.Material,
  _metalMaterial: THREE.Material,
  _whiteMaterial: THREE.Material
): THREE.Group {
  const group = new THREE.Group();
  group.name = component.id;

  const redRailMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
  const blueRailMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3 });
  const copperMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.8 });
  const trenchMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8 });

  switch (component.type) {
    // 1. Full-Size Solderless Breadboard (830 Tie Points)
    case 'breadboard_full': {
      // Main White ABS Enclosure body
      const bodyGeo = new THREE.BoxGeometry(3.6, 0.18, 2.0);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      // Center Divider Trench (Indentation separating Side A from Side B)
      const trenchGeo = new THREE.BoxGeometry(3.5, 0.06, 0.15);
      const trench = new THREE.Mesh(trenchGeo, trenchMat);
      trench.position.set(0, 0.07, 0);
      group.add(trench);

      // Power rail colored stripes (Red + and Blue - along top and bottom)
      const railGeo = new THREE.BoxGeometry(3.4, 0.02, 0.04);

      // Top Red (+) and Blue (-)
      const rTop = new THREE.Mesh(railGeo, redRailMat);
      rTop.position.set(0, 0.095, -0.96);
      group.add(rTop);
      const bTop = new THREE.Mesh(railGeo, blueRailMat);
      bTop.position.set(0, 0.095, -0.69);
      group.add(bTop);

      // Bottom Red (+) and Blue (-)
      const rBot = new THREE.Mesh(railGeo, redRailMat);
      rBot.position.set(0, 0.095, 0.69);
      group.add(rBot);
      const bBot = new THREE.Mesh(railGeo, blueRailMat);
      bBot.position.set(0, 0.095, 0.96);
      group.add(bBot);

      // 830 instanced hole sockets in 1 single draw call!
      const holes = createInstancedBreadboardHoles(63, 5, 5, 0.05, 0.09, -1.55, true);
      group.add(holes);
      break;
    }

    // 2. Half-Size Breadboard (400 Tie Points)
    case 'breadboard_half': {
      const bodyGeo = new THREE.BoxGeometry(2.4, 0.18, 2.0);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      // Center Trench
      const trenchGeo = new THREE.BoxGeometry(2.3, 0.06, 0.15);
      const trench = new THREE.Mesh(trenchGeo, trenchMat);
      trench.position.set(0, 0.07, 0);
      group.add(trench);

      // Rails
      const railGeo = new THREE.BoxGeometry(2.2, 0.02, 0.04);
      const rTop = new THREE.Mesh(railGeo, redRailMat);
      rTop.position.set(0, 0.095, -0.96);
      group.add(rTop);
      const bTop = new THREE.Mesh(railGeo, blueRailMat);
      bTop.position.set(0, 0.095, -0.69);
      group.add(bTop);

      const rBot = new THREE.Mesh(railGeo, redRailMat);
      rBot.position.set(0, 0.095, 0.69);
      group.add(rBot);
      const bBot = new THREE.Mesh(railGeo, blueRailMat);
      bBot.position.set(0, 0.095, 0.96);
      group.add(bBot);

      // 400 instanced hole sockets
      const holes = createInstancedBreadboardHoles(30, 5, 5, 0.075, 0.09, -1.1, true);
      group.add(holes);
      break;
    }

    // 3. Mini Breadboard (170 Tie Points)
    case 'breadboard_mini': {
      const bodyGeo = new THREE.BoxGeometry(1.6, 0.16, 1.4);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.4 }); // Sky blue body
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.castShadow = true;
      group.add(body);

      // Center Divider Trench
      const trench = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 0.12), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
      trench.position.set(0, 0.06, 0);
      group.add(trench);

      // 170 instanced holes (17 rows x 10 cols, no rails)
      const holes = createInstancedBreadboardHoles(17, 5, 5, 0.09, 0.09, -0.72, false);
      group.add(holes);
      break;
    }

    // 4. Perfboard (Universal Dot Solder Matrix)
    case 'perfboard': {
      // Brown phenolic / tan FR4 board
      const boardGeo = new THREE.BoxGeometry(2.4, 0.06, 1.8);
      const boardMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.7 });
      const board = new THREE.Mesh(boardGeo, boardMat);
      board.castShadow = true;
      group.add(board);

      // Plated copper through-hole solder pads (Instanced mesh 20x15)
      const padCount = 20 * 15;
      const padGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.07, 12);
      const padMesh = new THREE.InstancedMesh(padGeo, copperMat, padCount);
      const dummy = new THREE.Object3D();
      let idx = 0;
      for (let r = 0; r < 20; r++) {
        for (let c = 0; c < 15; c++) {
          dummy.position.set(-1.0 + r * 0.105, 0.03, -0.75 + c * 0.105);
          dummy.updateMatrix();
          padMesh.setMatrixAt(idx++, dummy.matrix);
        }
      }
      padMesh.instanceMatrix.needsUpdate = true;
      group.add(padMesh);
      break;
    }

    // 5. Stripboard (Veroboard with Parallel Copper Tracks)
    case 'stripboard': {
      const boardGeo = new THREE.BoxGeometry(2.5, 0.06, 1.8);
      const boardMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.6 });
      const board = new THREE.Mesh(boardGeo, boardMat);
      board.castShadow = true;
      group.add(board);

      // Parallel copper strips running length of board
      const trackCount = 12;
      const trackGeo = new THREE.BoxGeometry(2.35, 0.015, 0.07);
      for (let t = 0; t < trackCount; t++) {
        const track = new THREE.Mesh(trackGeo, copperMat);
        track.position.set(0, 0.035, -0.75 + t * 0.135);
        group.add(track);
      }

      // Hole matrix along tracks
      const holeInst = createInstancedBreadboardHoles(18, 6, 6, 0.12, 0.135, -1.0, false);
      group.add(holeInst);
      break;
    }

    // 6. Double-Sided FR4 Prototype PCB
    case 'pcb_prototype': {
      const boardGeo = new THREE.BoxGeometry(2.4, 0.06, 1.8);
      const boardMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.5 }); // Dark solder-mask green
      const board = new THREE.Mesh(boardGeo, boardMat);
      board.castShadow = true;
      group.add(board);

      // Silver perimeter power traces
      const traceMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.8, roughness: 0.2 });
      const busGeo = new THREE.BoxGeometry(2.2, 0.015, 0.06);
      const bus1 = new THREE.Mesh(busGeo, traceMat);
      bus1.position.set(0, 0.035, -0.8);
      group.add(bus1);
      const bus2 = new THREE.Mesh(busGeo, traceMat);
      bus2.position.set(0, 0.035, 0.8);
      group.add(bus2);

      // IC footprint central pad groups
      const icPadGeo = new THREE.BoxGeometry(1.6, 0.015, 0.8);
      const icPad = new THREE.Mesh(icPadGeo, traceMat);
      icPad.position.set(0, 0.035, 0);
      group.add(icPad);
      break;
    }
  }

  return group;
}
