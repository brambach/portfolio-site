import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { CabinMaterials } from './cabin-materials';

function dialTexture(label: string, values: string[]) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#131714';
  context.fillRect(0, 0, 512, 512);
  context.translate(256, 256);
  for (let i = 0; i <= 40; i++) {
    const angle = (-225 + i * 6.75) * Math.PI / 180;
    const major = i % 5 === 0;
    context.strokeStyle = major ? '#e8e2cc' : '#929789';
    context.lineWidth = major ? 4 : 2;
    context.beginPath();
    context.moveTo(Math.cos(angle) * (major ? 180 : 190), Math.sin(angle) * (major ? 180 : 190));
    context.lineTo(Math.cos(angle) * 206, Math.sin(angle) * 206);
    context.stroke();
  }
  context.font = '30px Georgia';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  values.forEach((value, i) => {
    const angle = (-225 + i / (values.length - 1) * 270) * Math.PI / 180;
    context.fillStyle = '#e8e2cc';
    context.fillText(value, Math.cos(angle) * 145, Math.sin(angle) * 145);
  });
  context.font = '21px sans-serif';
  context.fillStyle = '#b3b3a1';
  context.fillText(label, 0, 74);
  context.fillStyle = '#313930';
  context.beginPath();context.arc(0, 0, 19, 0, Math.PI * 2);context.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function addCabinDetails(vehicle: THREE.Group, materials?: CabinMaterials) {
  const chrome = new THREE.MeshStandardMaterial({ color: '#b8b5a4', metalness: .88, roughness: .26 });
  const dark = materials?.dash ?? new THREE.MeshStandardMaterial({ color: '#141a16', roughness: .7 });
  const wood = materials?.wood ?? new THREE.MeshPhysicalMaterial({ color: '#59351c', roughness: .3, clearcoat: .8, clearcoatRoughness: .22 });
  addCabinShell(vehicle);
  const upholstery = materials?.leather ?? new THREE.MeshStandardMaterial({ color: '#87552f', roughness: .82 });
  for (const x of [-.35, .35]) {
    const cushion = new THREE.Mesh(new RoundedBoxGeometry(.48, .16, .55, 3, .05), upholstery);
    cushion.position.set(x, .64, -.03);
    const back = new THREE.Mesh(new RoundedBoxGeometry(.46, .52, .14, 3, .04), upholstery);
    back.position.set(x, .91, -.31);
    back.rotation.x = -.12;
    vehicle.add(cushion, back);
    for (const side of [-1, 1]) {
      const bolster = new THREE.Mesh(new RoundedBoxGeometry(.085, .22, .48, 3, .038), upholstery);
      bolster.position.set(x + side * .198, .69, -.025);
      const backBolster = new THREE.Mesh(new RoundedBoxGeometry(.08, .47, .18, 3, .035), upholstery);
      backBolster.position.set(x + side * .193, .91, -.267);
      backBolster.rotation.x = -.12;
      vehicle.add(bolster, backBolster);
    }
    const pipingMaterial = new THREE.MeshStandardMaterial({ color: '#563b28', roughness: .95 });
    for (let stripe = -3; stripe <= 3; stripe++) {
      const seam = new THREE.Mesh(new THREE.CylinderGeometry(.001, .001, .405, 5), pipingMaterial);
      seam.position.set(x + stripe * .043, .917, -.23);
      seam.rotation.x = -.12;
      const seatSeam = new THREE.Mesh(new THREE.CylinderGeometry(.001, .001, .43, 5), pipingMaterial);
      seatSeam.rotation.x = Math.PI / 2;
      seatSeam.position.set(x + stripe * .043, .721, -.024);
      vehicle.add(seam, seatSeam);
    }
  }
  const rearBench = new THREE.Mesh(new RoundedBoxGeometry(1.25, .18, .48, 3, .05), upholstery);
  rearBench.position.set(0, .637, -.77);
  vehicle.add(rearBench);
  const dashboard = new THREE.Mesh(new RoundedBoxGeometry(1.47, .2, .2, 3, .04), dark);
  dashboard.position.set(0, .99, .84);
  vehicle.add(dashboard);
  const passengerLining = new THREE.Mesh(new THREE.BoxGeometry(.05, .49, 1.3), upholstery);
  passengerLining.position.set(-.77, .75, .26);
  vehicle.add(passengerLining);
  const passengerArmrest = new THREE.Mesh(new RoundedBoxGeometry(.075, .065, .4, 3, .021), upholstery);
  passengerArmrest.position.set(-.717, .79, .15);
  const passengerHandle = new THREE.Mesh(new RoundedBoxGeometry(.018, .026, .076, 3, .008), chrome);
  passengerHandle.position.set(-.729, .885, .35);
  vehicle.add(passengerArmrest, passengerHandle);
  const shiftBoot = new THREE.Mesh(new THREE.ConeGeometry(.05, .07, 20, 4), dark);
  shiftBoot.position.set(0, .665, .4);
  const shiftLever = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, .14, 12), chrome);
  shiftLever.position.set(0, .74, .4);
  shiftLever.rotation.x = -.15;
  const shiftKnob = new THREE.Mesh(new THREE.SphereGeometry(.024, 24, 16), wood);
  shiftKnob.position.set(0, .809, .389);
  vehicle.add(shiftBoot, shiftLever, shiftKnob);
  const glovebox = new THREE.Mesh(new RoundedBoxGeometry(.52, .145, .08, 3, .014), upholstery);
  glovebox.position.set(-.405, .86, .818);
  const latch = new THREE.Mesh(new RoundedBoxGeometry(.055, .01, .007, 2, .004), chrome);
  latch.position.set(-.405, .878, .774);
  vehicle.add(glovebox, latch);
  const radio = new THREE.Mesh(new RoundedBoxGeometry(.21, .065, .033, 2, .009), new THREE.MeshStandardMaterial({ color: '#252925', roughness: .65 }));
  radio.position.set(-.054, .86, .792);
  vehicle.add(radio);
  const radioDisplay = new THREE.Mesh(new THREE.PlaneGeometry(.122, .021), new THREE.MeshStandardMaterial({ color: '#29372d', roughness: .33 }));
  radioDisplay.position.set(-.054, .865, .774);
  radioDisplay.rotation.y = Math.PI;
  vehicle.add(radioDisplay);
  for (const x of [-.14, .032]) {
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(.013, .013, .012, 24), dark);
    knob.rotation.x = Math.PI / 2;
    knob.position.set(x, .86, .769);
    vehicle.add(knob);
  }
  for (let i = 0; i < 14; i++) {
    const vent = new THREE.Mesh(new THREE.BoxGeometry(.012, .055, .006), dark);
    vent.position.set(-.6 + i * .013, 1.05, .733);
    vehicle.add(vent);
  }
  const wheel = new THREE.Group();
  wheel.name = 'Wood steering wheel';
  wheel.position.set(.337, 1.038, .52);
  wheel.rotation.x = .28;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.197, .014, 12, 96), wood);
  wheel.add(rim);
  for (const angle of [0, Math.PI, Math.PI * 1.5]) {
    const spoke = new THREE.Mesh(new RoundedBoxGeometry(.145, .029, .006, 2, .007), chrome);
    spoke.position.set(Math.cos(angle) * .11, Math.sin(angle) * .11, 0);
    spoke.rotation.z = angle;
    wheel.add(spoke);
    for (const distance of [.087, .119, .151]) {
      const hole = new THREE.Mesh(new THREE.CircleGeometry(.006, 12), dark);
      hole.position.set(Math.cos(angle) * distance, Math.sin(angle) * distance, -.004);
      hole.rotation.y = Math.PI;
      wheel.add(hole);
    }
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(.047, .043, .04, 40), dark);
  hub.rotation.x = Math.PI / 2;
  hub.position.z = -.019;
  wheel.add(hub);
  const hubTrim = new THREE.Mesh(new THREE.TorusGeometry(.041, .002, 8, 48), chrome);
  hubTrim.position.z = -.041;
  wheel.add(hubTrim);
  wheel.traverse(object => { if (object instanceof THREE.Mesh) object.castShadow = object.receiveShadow = true; });
  vehicle.add(wheel);

  const gauges: [string, string[], number, number][] = [
    ['fuel', ['0', '¼', '½', '¾', '1'], -.09, .057],
    ['oil', ['0', '2', '4', '6', '8'], .052, .067],
    ['rpm × 1000', ['0', '1', '2', '3', '4', '5', '6', '7', '8'], .215, .079],
    ['km/h', ['0', '40', '80', '120', '160', '200', '240'], .389, .074],
    ['bar', ['0', '1', '2', '3', '4', '5'], .546, .06],
  ];
  const needles=new Map<string,THREE.Group>();
  for (const [label, values, x, radius] of gauges) {
    const gauge = new THREE.Group();
    gauge.name = `${label} instrument`;
    gauge.position.set(x, 1.047, .712);
    gauge.rotation.y = Math.PI;
    gauge.rotation.x = -.16;
    const texture = dialTexture(label, values);
    const face = new THREE.Mesh(new THREE.CircleGeometry(radius, 64), new THREE.MeshStandardMaterial({ map: texture, emissiveMap: texture, emissive: '#e7d5ad', emissiveIntensity: .25, roughness: .65 }));
    const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, .0035, 8, 64), chrome);
    const hand=new THREE.Group();
    const needle=new THREE.Mesh(new THREE.BoxGeometry(.0018,radius*.75,.0007),new THREE.MeshBasicMaterial({color:'#c37543'}));needle.position.set(0,radius*.29,.001);hand.add(needle);hand.rotation.z=Math.PI*.75;needles.set(label,hand);
    gauge.add(face, rim, hand);
    vehicle.add(gauge);
  }
  return {update:(speed:number,steering:number,running:boolean, engineRpm?:number)=>{
    wheel.rotation.z=-steering*.5;
    needles.get('km/h')!.rotation.z=Math.PI*.75-speed*3.6/240*Math.PI*1.5;
    const gear=Math.max(1,Math.min(3,Math.floor(speed/5)+1));const rpm=engineRpm ?? (running?900+speed/gear*380:0);
    needles.get('rpm × 1000')!.rotation.z=Math.PI*.75-rpm/8000*Math.PI*1.5;
    needles.get('fuel')!.rotation.z=-Math.PI*.28;
    needles.get('oil')!.rotation.z=running?.1:Math.PI*.75;
  }};
}

export function addCabinShell(vehicle: THREE.Group) {
  const grain = new Uint8Array(64 * 64);
  for (let i = 0; i < grain.length; i++) grain[i] = 90 + ((i * 73 + (i % 64) * 31) % 120);
  const pile = new THREE.DataTexture(grain, 64, 64, THREE.RedFormat);
  pile.wrapS = pile.wrapT = THREE.RepeatWrapping;
  pile.repeat.set(36, 36);
  pile.magFilter = THREE.LinearFilter;
  pile.needsUpdate = true;
  const carpet = new THREE.MeshStandardMaterial({ color: '#1b1b18', roughness: 1, bumpMap: pile, bumpScale: .0006 });
  const tub = new THREE.Group();
  tub.name = 'Solid cabin floor and footwell';
  for (const [size, position] of [
    [[1.52, .1, 2.15], [0, .43, -.08]],
    [[1.5, .59, .1], [0, .68, .98]],
    [[1.48, .49, .1], [0, .64, -1.1]],
    [[.09, .12, 1.88], [.76, .51, -.08]],
    [[.09, .12, 1.88], [-.76, .51, -.08]],
    [[.16, .15, 1.56], [0, .565, -.03]],
  ] as [number[], number[]][]) {
    const surface = new THREE.Mesh(new RoundedBoxGeometry(...size as [number, number, number], 3, .022), carpet);
    surface.position.set(...position as [number, number, number]);
    surface.castShadow = surface.receiveShadow = true;
    tub.add(surface);
  }
  for (const x of [-.36, .36]) {
    const mat = new THREE.Mesh(new RoundedBoxGeometry(.46, .009, .6, 2, .003), carpet);
    mat.position.set(x, .486, .52);
    mat.receiveShadow = true;
    tub.add(mat);
  }
  vehicle.add(tub);
  return tub;
}
